import express, { Request, Response } from "express";
import cors from "cors";
import encryptionRoutes from "../routes/encryptionRoutes";
import decryptionRoutes from "../routes/decryptionRoutes";
import fetchRoutes from "../routes/fetchUserUploadedFiles";
import testRoutes from "../routes/testingRoutes";

const app = express();

app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use("/api/encrypt", encryptionRoutes);
app.use("/api/decrypt", decryptionRoutes);
app.use("/api/fetch", fetchRoutes);
app.use("/api/test", testRoutes);

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
