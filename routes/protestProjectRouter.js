import express from "express";
import db from "../database.js";

import create from "../controllers/protest_project/create.js";
import getProtests from "../controllers/protest_project/getProtests.js";

const router = express.Router();

router.options("/", (req, res) => {
    res.set("Allow", "GET,POST,OPTIONS");
    res.sendStatus(204);
});

router.get("/", (req, res) => {
    db.query("SELECT * FROM protest_projects", (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});

router.post("/", create);
router.get("/:id", getProtests);

export default router;