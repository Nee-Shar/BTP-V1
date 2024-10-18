import express, { Request, Response } from "express";
import { encryptImage, encryptText } from "../controllers/encryptionController";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.post("/encryptImage", upload.single("image"), encryptImage);
router.post("/encryptText", upload.single("textFile"), encryptText);

export default router;
