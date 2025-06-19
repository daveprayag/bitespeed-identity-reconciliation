import express from "express";
import handleIdentify from "../controllers/identify.controller";

const router = express.Router();

router.post("/", handleIdentify);

export default router;
