import express from "express";
import db from "../database.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { decryptPath } from "../utils/crypto.js";

import create from "../controllers/protest/create.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "public", "images", "protests");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // make filename unique, keep original ext
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBase = Date.now() + "-" + Math.random().toString(36).slice(2, 10);
        cb(null, `${safeBase}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // only accept images
    if (/^image\/(jpeg|png|gif|webp|bmp)$/.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

router.options("/", (req, res) => {
    res.set("Allow", "GET,POST,OPTIONS");
    res.sendStatus(204);
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM protests", (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});

router.get("/image/:token", (req, res) => {
    const token = req.params.token;
    let filePath;
    try {
        filePath = decryptPath(token); // returns something like "/images/protests/abc.png"
    } catch (e) {
        return res.status(400).json({ error: "Invalid token" });
    }
    // convert URL path to absolute filesystem path
    const abs = path.join(process.cwd(), "public", filePath.replace(/^\/images\//, ""));
    res.sendFile(abs, (err) => {
        if (err) {
            res.status(404).json({ error: "Image not found" });
        }
    });
});

router.post("/", upload.single("card_img"), create);

export default router;