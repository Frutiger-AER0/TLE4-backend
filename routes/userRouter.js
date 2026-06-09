import express from "express";
import db from "../database.js";

import create from "../controllers/user/create.js";
import getUser from "../controllers/user/get.js";
import getUserDetails from "../controllers/user/getDetails.js";
import editUser from "../controllers/user/edit.js";
import editUserDetails from "../controllers/user/editDetails.js";
import deleteUser from "../controllers/user/delete.js";

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

router.get("/:id", getUser);
router.get("/:id/details", getUserDetails);
router.put("/:id", editUser);
router.put("/:id/details", editUserDetails);
router.delete("/:id", deleteUser);
router.post("/", create);

export default router;