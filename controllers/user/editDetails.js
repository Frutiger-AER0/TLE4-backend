import db from "../../database.js";
import { encryptPath } from "../../utils/crypto.js";
import fs from "fs";
import path from "path";

export default async function editUserDetails(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
        return res.status(400).json({
            error: "User ID is required",
        });
    }

    try {
        const pool = db.promise();
        const connection = await pool.getConnection();

        try {
            // Handle image upload if present
            let pfpImgToken = null;
            if (req.file) {
                const publicUrlPath = `/images/profile/${req.file.filename}`;
                try {
                    pfpImgToken = encryptPath(publicUrlPath);
                } catch (e) {
                    try {
                        await fs.promises.unlink(req.file.path);
                    } catch (_) {}
                    connection.release();
                    return res.status(500).json({ error: "Image encryption failed" });
                }

                // Get old image token to delete the old file
                const [oldData] = await connection.query(
                    `SELECT profile_pfp FROM user_data WHERE user_id = ?`,
                    [id]
                );

                if (oldData.length > 0 && oldData[0].profile_pfp) {
                    try {
                        const oldFilePath = decryptPath(oldData[0].profile_pfp);
                        const oldFilename = path.basename(oldFilePath);
                        const uploadDir = path.join(process.cwd(), "public", "images", "profile");
                        const oldAbs = path.join(uploadDir, oldFilename);
                        await fs.promises.unlink(oldAbs);
                    } catch (e) {
                        console.error("Could not delete old image:", e);
                    }
                }

                updateData.profile_pfp = pfpImgToken;
            }

            if (Object.keys(updateData).length === 0) {
                connection.release();
                return res.status(400).json({
                    error: "At least one field is required",
                });
            }

            // Build dynamic update query
            const updateFields = [];
            const updateValues = [];

            for (const [key, value] of Object.entries(updateData)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }

            updateValues.push(id);

            const [result] = await connection.query(
                `UPDATE user_data SET ${updateFields.join(", ")} WHERE user_id = ?`,
                updateValues
            );

            connection.release();

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "User details not found" });
            }

            res.json({ message: "User details updated successfully" });
        } catch (innerError) {
            connection.release();
            return res.status(500).json({ error: innerError.message });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}