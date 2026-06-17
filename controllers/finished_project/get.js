import db from "../../database.js";

export default async function getFinishedProject(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            error: "Finished Project ID is required",
        });
    }

    try {
        const pool = db.promise();
        const [results] = await pool.query(
            `SELECT * FROM finished_projects WHERE id = ?`,
            [id]
        );

        if (results.length === 0) {
            return res.status(404).json({
                error: "Project not found",
            });
        }

        res.json(results[0]);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}