import dotenv from "dotenv";
import express from "express";

dotenv.config();

try {
    const app = express();

    app.listen(8000, () => console.log('Server running on port 8000'));
} catch (e) {
    console.log(e);
}