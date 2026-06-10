import db from "../../database.js";
import { encryptPath } from "../../utils/crypto.js";
import fs from "fs";

export default async function create(req, res) {
    const {name, description, location, predicted_members, link, start_time, latitude, longitude} = req.body;

    if (!name || !description || !location || !start_time) {
        return res.status(400).json({
            error: "name, description, location and starting time are required",
        });
    }

    // determine card_img token
    let cardImgToken = null;
    if (req.file) {
        // public URL path that clients use (served by express.static at /images)
        // Use forward slashes for URLs
        const publicUrlPath = `/images/protests/${req.file.filename}`;
        try {
            cardImgToken = encryptPath(publicUrlPath);
        } catch (e) {
            // cleanup file if encryption fails
            try { await fs.promises.unlink(req.file.path); } catch (_) {}
            return res.status(500).json({ error: "Image encryption failed" });
        }
    } else if (req.body.card_img) {
        // if client supplied a card_img string in body (not file), optionally use that
        // assume it's already an encrypted token or a URL — here we accept the body value
        cardImgToken = req.body.card_img;
    }

    try {
        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [checkResults] = await connection.query(
                `SELECT id FROM protests WHERE name = ? AND location = ? LIMIT 1`,
                [name, location]
            );
            if (checkResults.length > 0) {
                await connection.release();
                return res.status(409).json({ error: "Protest already exists" });
            }

            const [insertResult] = await connection.query(
                `INSERT INTO protests(name, description, location, predicted_members, card_img, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
                [name, description, location, predicted_members, cardImgToken, latitude, longitude]
            );

            const protestId = insertResult.insertId;

            await connection.query(
                `INSERT INTO protest_details (protest_id, link, start_time, created_at) VALUES (?, ?, STR_TO_DATE(?, '%Y-%m-%dT%H:%i:%s.%fZ'), NOW())`,
                [protestId, link, start_time]
            );

            await connection.commit();
            connection.release();

            return res.status(201).json({
                message: "Protest created",
                id: protestId,
            });
        } catch (innerError) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
            connection.release();
            return res.status(500).json({ error: innerError.message });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}