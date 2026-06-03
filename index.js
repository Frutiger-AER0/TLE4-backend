import dotenv from "dotenv";
import express from "express";
import loginRouter from "./routes/loginRouter.js";
import userRouter from "./routes/userRouter.js";

dotenv.config();

try {
    const app = express();

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        next();
    });

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");

        if (req.method === "OPTIONS") {
            return res.sendStatus(204);
        }
        next();
    });

    //Middelware to support application/JSON content-type
    app.use(express.json());
    //Middelware to support application/x-www-form-urlencoded content-type
    app.use(express.urlencoded({ extended: true }));

    app.use("/login", loginRouter);
    app.use("/users", userRouter)

    app.listen(8000, () => console.log('Server running on port 8000'));
} catch (e) {
    console.log(e);
}