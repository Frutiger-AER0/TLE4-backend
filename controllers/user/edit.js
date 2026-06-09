import bcrypt from "bcrypt";
import db from "../../database.js";

export default async function editUser(req, res) {
    const { id } = req.params;
    const { username, email, password, is_admin } = req.body;

    if (!id) {
        return res.status(400).json({
            error: "User ID is required",
        });
    }

    // At least one field must be provided
    if (!username && !email && !password && is_admin === undefined) {
        return res.status(400).json({
            error: "At least one field (username, email, or is_admin) is required",
        });
    }

    try {
        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            // Check if username or email already exists (excluding current user)
            if (username || email) {
                const [checkResults] = await connection.query(
                    `SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ? LIMIT 1`,
                    [username || null, email || null, id]
                );
                if (checkResults.length > 0) {
                    connection.release();
                    return res.status(409).json({ error: "Username or email already exists" });
                }
            }

            // Build dynamic update query
            const updateFields = [];
            const updateValues = [];

            if (username) {
                updateFields.push("username = ?");
                updateValues.push(username);
            }
            if (email) {
                updateFields.push("email = ?");
                updateValues.push(email);
            }
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateFields.push("password = ?");
                updateValues.push(hashedPassword);
            }
            if (is_admin !== undefined) {
                updateFields.push("is_admin = ?");
                updateValues.push(is_admin);
            }

            updateValues.push(id);

            const [result] = await connection.query(
                `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
                updateValues
            );

            connection.release();

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json({ message: "User updated successfully" });
        } catch (innerError) {
            connection.release();
            return res.status(500).json({ error: innerError.message });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}