import express, { Request, Response } from "express";
import cors from "cors";
import encryptionRoutes from "../routes/encryption.routes";
import decryptionRoutes from "../routes/decryption.routes";
import fetchRoutes from "../routes/fetchFiles.routes";
import testRoutes from "../routes/testing.routes";
import publicRoutes from "../routes/public.routes";
import analyticsRoutes from "../routes/analytics.routes";
const app = express();

app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/encrypt", encryptionRoutes);
app.use("/api/decrypt", decryptionRoutes);
app.use("/api/fetch", fetchRoutes);
app.use("/api/test", testRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/analytics", analyticsRoutes);

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
