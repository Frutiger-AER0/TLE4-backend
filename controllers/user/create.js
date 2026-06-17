import bcrypt from "bcrypt";
import db from "../../database.js";
import {encryptPath} from "../../utils/crypto.js";
import fs from "fs";

export default async function create(req, res) {
    const {username, email, password, is_admin = 0,} = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            error: "username, email and password are required",
        });
    }

    let pfpImgToken = null;
    if (req.file) {
        const publicUrlPath = `/images/profile/${req.file.filename}`;
        try {
            pfpImgToken = encryptPath(publicUrlPath);
        } catch (e) {
            try { await fs.promises.unlink(req.file.path); } catch (_) {}
            return res.status(500).json({ error: "Image encryption failed" });
        }
    } else if (req.body.card_img) {
        pfpImgToken = req.body.profile_img;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [checkResults] = await connection.query(
                `SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1`,
                [username, email]
            );
            if (checkResults.length > 0) {
                await connection.release();
                return res.status(409).json({ error: "Username or email already exists" });
            }

            const [insertResult] = await connection.query(
                `INSERT INTO users(email, username, password, is_admin, created_at) VALUES (?, ?, ?, ?, NOW())`,
                [email, username, hashedPassword, is_admin]
            );

            const userId = insertResult.insertId;

            await connection.query(
                `INSERT INTO user_data (user_id, profile_img, created_at) VALUES (?, ?, NOW())`,
                [userId, pfpImgToken]
            );

            await connection.commit();
            connection.release();

            return res.status(201).json({
                message: "User created",
                id: userId,
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