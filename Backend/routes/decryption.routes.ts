import express, { Request, Response } from "express";
import { decryptImage, decryptText } from "../controllers/decryption.controller";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.post("/decryptImage", upload.none(), decryptImage);
router.post("/decryptText", upload.none(), decryptText);

export default router;
