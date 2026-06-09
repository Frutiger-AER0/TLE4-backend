import db from "../../database.js";

export default async function create(req, res) {
    const {protest_id, project_id,} = req.body;

    if (!protest_id || !project_id) {
        return res.status(400).json({
            error: "protest and project are required",
        });
    }

    try {
        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [checkResults] = await connection.query(
                `SELECT id FROM protest_projects WHERE protest_id = ? AND project_id = ? LIMIT 1`,
                [protest_id, project_id],
            );
            if (checkResults.length > 0) {
                await connection.release();
                return res.status(409).json({ error: "Project already exists" });
            }

            const [insertResult] = await connection.query(
                `INSERT INTO protest_projects(protest_id, project_id) VALUES (?, ?)`,
                [protest_id, project_id]
            );

            const protestProjectId = insertResult.insertId;

            await connection.commit();
            connection.release();

            return res.status(201).json({
                message: "Project created",
                id: protestProjectId,
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