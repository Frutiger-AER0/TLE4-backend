import express from "express";

import create from "../controllers/user/create.js";

const router = express.Router();

router.options("/", (req, res) => {
    res.set("Allow", "GET,POST,OPTIONS");
    res.sendStatus(204);
});

router.post("/", create);

export default router;