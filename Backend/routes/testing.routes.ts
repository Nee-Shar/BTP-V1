import express from "express";
import { sayHello } from "../controllers/test.controller"
const router = express.Router();

// Test route
router.get("/hello", sayHello);

export default router;
