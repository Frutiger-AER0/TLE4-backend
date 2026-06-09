import db from "../../database.js";

export default async function editUserDetails(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
        return res.status(400).json({
            error: "User ID is required",
        });
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
            error: "At least one field is required",
        });
    }

    try {
        const pool = db.promise();

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(updateData)) {
            updateFields.push(`${key} = ?`);
            updateValues.push(value);
        }

        updateValues.push(id);

        const [result] = await pool.query(
            `UPDATE user_data SET ${updateFields.join(", ")} WHERE user_id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User details not found" });
        }

        res.json({ message: "User details updated successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}