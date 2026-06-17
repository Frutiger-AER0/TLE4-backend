import express from "express";
import db from "../database.js";
import multer from "multer";
import path from "path";
import fs from "fs";

import create from "../controllers/user/create.js";
import getUser from "../controllers/user/get.js";
import getUserDetails from "../controllers/user/getDetails.js";
import editUser from "../controllers/user/edit.js";
import editUserDetails from "../controllers/user/editDetails.js";
import deleteUser from "../controllers/user/delete.js";
import {decryptPath} from "../utils/crypto.js";

const router = express.Router();

// Multer setup for profile images
const uploadDir = path.join(process.cwd(), "public", "images", "profile");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBase = Date.now() + "-" + Math.random().toString(36).slice(2, 10);
        cb(null, `${safeBase}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp|bmp)$/.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.options("/", (req, res) => {
    res.set("Allow", "GET,POST,PUT,OPTIONS");
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