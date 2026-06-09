import db from "../../database.js";

export default async function deleteUser(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            error: "User ID is required",
        });
    }

    try {
        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Delete from user_data first (foreign key constraint)
            await connection.query(
                `DELETE FROM user_data WHERE user_id = ?`,
                [id]
            );

            // Delete from users
            const [result] = await connection.query(
                `DELETE FROM users WHERE id = ?`,
                [id]
            );

            await connection.commit();
            connection.release();

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json({ message: "User deleted successfully" });
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