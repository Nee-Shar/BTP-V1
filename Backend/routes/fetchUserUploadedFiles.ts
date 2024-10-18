import express from "express";
import { fetchUserFiles } from "../controllers/fetchFiles"; // Import the controller

const router = express.Router();

// Fetch files route
router.get("/files/:userId", fetchUserFiles);

export default router;

