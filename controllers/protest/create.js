import db from "../../database.js";

export default async function create(req, res) {
    const {name, description, location, predicted_members, link, start_time,} = req.body;

    if (!name || !description || !location || !start_time) {
        return res.status(400).json({
            error: "name, description, location and starting time are required",
        });
    }

    try {
        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [checkResults] = await connection.query(
                `SELECT id FROM protests WHERE name = ? OR location = ? LIMIT 1`,
                [name, location]
            );
            if (checkResults.length > 0) {
                await connection.release();
                return res.status(409).json({ error: "Protest already exists" });
            }

            const [insertResult] = await connection.query(
                `INSERT INTO protests(name, description, location, predicted_members, created_at) VALUES (?, ?, ?, ?, NOW())`,
                [name, description, location, predicted_members]
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