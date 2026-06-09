import express from "express";
import db from "../database.js";

import create from "../controllers/user/create.js";
import getUser from "../controllers/user/get.js";
import getUserDetails from "../controllers/user/getDetails.js";
import editUser from "../controllers/user/edit.js";
import editUserDetails from "../controllers/user/editDetails.js";
import deleteUser from "../controllers/user/delete.js";
import {decryptPath} from "../utils/crypto.js";
import path from "path";

const router = express.Router();

router.options("/", (req, res) => {
    res.set("Allow", "GET,POST,OPTIONS");
    res.sendStatus(204);
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});

router.get("/image/:token", (req, res) => {
    const token = req.params.token;
    let filePath;
    try {
        filePath = decryptPath(token);
    } catch (e) {
        return res.status(400).json({ error: "Invalid token" });
    }

    // Extract just the filename from the decrypted path
    const filename = path.basename(filePath);
    const abs = path.join(uploadDir, filename);

    res.sendFile(abs, (err) => {
        if (err) {
            console.error(`File not found at: ${abs}`);
            res.status(404).json({ error: "Image not found" });
        }
    });
});

router.get("/:id", getUser);
router.get("/:id/details", getUserDetails);
router.put("/:id", editUser);
router.put("/:id/details", editUserDetails);
router.delete("/:id", deleteUser);
router.post("/", create);

export default router;