import db from "../../database.js";

export default async function create(req, res) {
    const {name, card_description, card_img,} = req.body;

    if (!name || !card_description) {
        return res.status(400).json({
            error: "name and description are required",
        });
    }

    try {
        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [checkResults] = await connection.query(
                `SELECT id FROM projects WHERE name = ? LIMIT 1`,
                [name]
            );
            if (checkResults.length > 0) {
                await connection.release();
                return res.status(409).json({ error: "Project already exists" });
            }

            const [insertResult] = await connection.query(
                `INSERT INTO projects(name, card_description, card_img, created_at) VALUES (?, ?, ?, NOW())`,
                [name, card_description, card_img]
            );

            const projectId = insertResult.insertId;

            await connection.commit();
            connection.release();

            return res.status(201).json({
                message: "Project created",
                id: projectId,
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