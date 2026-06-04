import express from "express";
import db from "../database.js";

import create from "../controllers/protest/create.js";

const router = express.Router();

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

router.post("/", create);

export default router;