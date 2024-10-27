import express, { Request, Response } from "express";
import {
  uploadImageToPublic,
  fetchPublicFiles,
  viewImageFile,
  viewTextFile,
} from "../controllers/publicFilesController";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.post("/uploadPublicImage", upload.single("image"), uploadImageToPublic);
router.get("/fetchPublicFiles", fetchPublicFiles);
router.post("/viewImageFile", upload.none(), viewImageFile);
router.post("/viewTextFile", upload.none(), viewTextFile);

export default router;
