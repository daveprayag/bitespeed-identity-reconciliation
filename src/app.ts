import express from "express";
import cors from "cors";
import identifyRouter from "./routes/identify.route";
import dotenv from "dotenv";
import { identifyRateLimiter } from "./middleware/ratelimiter";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/identify", identifyRateLimiter, identifyRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
