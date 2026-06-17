import db from "../../database.js";
import { encryptPath } from "../../utils/crypto.js";
import fs from "fs";

export default async function create(req, res) {
    const {user_id, file} = req.body;

    if (!user_id || !file) {
        return res.status(400).json({
            error: "user_id, and file are required",
        });
    }

    // determine card_img token
    let finishedImgToken = null;
    if (req.file) {
        // public URL path that clients use (served by express.static at /images)
        // Use forward slashes for URLs
        const publicUrlPath = `/images/finished_projects/${req.file.filename}`;
        try {
            finishedImgToken = encryptPath(publicUrlPath);
        } catch (e) {
            // cleanup file if encryption fails
            try { await fs.promises.unlink(req.file.path); } catch (_) {}
            return res.status(500).json({ error: "Image encryption failed" });
        }
    } else if (req.body.file) {
        // if client supplied a card_img string in body (not file), optionally use that
        // assume it's already an encrypted token or a URL — here we accept the body value
        finishedImgToken = req.body.file;
    }

    try {
        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [checkResults] = await connection.query(
                `SELECT id FROM finished_projects WHERE user_id = ? AND file = ? LIMIT 1`,
                [user_id, file]
            );
            if (checkResults.length > 0) {
                await connection.release();
                return res.status(409).json({ error: "Finished Project already exists" });
            }

            await connection.query(
                `INSERT INTO finished_projects(user_id, file, created_at) VALUES (?, ?, NOW())`,
                [user_id, file]
            );

            await connection.commit();
            connection.release();

            return res.status(201).json({
                message: "Finished Project created"
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