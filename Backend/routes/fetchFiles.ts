import express from "express";
import { fetchUserFiles,fetchRequestedFiles,sendFileRequest,fetchRequestReceivedFiles } from "../controllers/fetchFiles"; // Import the controller

const router = express.Router();

// Fetch files route
router.get("/files/:userId", fetchUserFiles);
router.get("/requestedFiles/:userId", fetchRequestedFiles);
router.get("/receivedRequestedFiles/:userId", fetchRequestReceivedFiles);
router.post("/requestFile", sendFileRequest);

export default router;

