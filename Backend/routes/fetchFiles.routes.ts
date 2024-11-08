import express from "express";
import { fetchUserFiles,fetchRequestedFiles,sendFileRequest,fetchRequestReceivedFiles,approveOrRejectFileRequest } from "../controllers/fetchFiles.controller"; // Import the controller

const router = express.Router();

// Fetch files route
router.get("/files/:userId", fetchUserFiles);
router.get("/requestedFiles/:userId", fetchRequestedFiles);
router.get("/receivedRequestedFiles/:userId", fetchRequestReceivedFiles);
router.post("/requestFile", sendFileRequest);
router.post("/acceptOrRejectFileRequest", approveOrRejectFileRequest);

export default router;

