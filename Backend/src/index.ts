import express, { Request, Response } from "express";
import crypto from "crypto";
import multer from "multer"; // Middleware for handling multipart/form-data (e.g., file uploads).
import cors from "cors";

const app = express();
const upload = multer();
const algorithm = "aes-256-gcm"; // Harsh here we may try diff algo in future for now its aes-256-gcm

app.use(
  cors({
    origin: "http://localhost:5173", //  frontend URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Encryption route
app.post("/encrypt", upload.single("image"), (req: Request, res: Response) => {
  const key = req.body.key;

  if (!req.file) {
    return res.status(400).send("No image file uploaded");
  }

  const iv = crypto.randomBytes(16); // 16 bytes IV for AES-GCM , Harsh iv is random bytes of 16 bytes necceary for AES-GCM(implementaion of aes in js)

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([
    cipher.update(req.file.buffer),
    cipher.final(),
    cipher.getAuthTag(), // here a 16 byte authentication tag is added to the end of the encrypted image to ensure integrity
  ]);
  // this is some boiler plate code for encryption so not sure exactly what it does but it is necessary for encryption

  res.json({
    encrypted: encrypted.toString("base64"), // encrypted image may be stored as .txt file with string on pinata
    iv: iv.toString("base64"), // iv may be stored as .txt file tip::maybe we can add iv to end of encrypted image string no decison as of yet
  });
});

// Decryption route
app.post("/decrypt", express.json(), (req: Request, res: Response) => {
  const { encryptedData, key, iv } = req.body;
  console.log(key, iv);
  if (!encryptedData || !key || !iv) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const encryptedBuffer = Buffer.from(encryptedData, "base64");
    const ivBuffer = Buffer.from(iv, "base64");

    // Extract the authentication tag from the encrypted data
    const authTag = encryptedBuffer.slice(-16); // Last 16 bytes are the authentication tag
    const encryptedBufferWithoutTag = encryptedBuffer.slice(0, -16);

    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(key, "hex"),
      ivBuffer
    );

    decipher.setAuthTag(authTag); // Set the authentication tag

    const decrypted = Buffer.concat([
      decipher.update(encryptedBufferWithoutTag),
      decipher.final(),
    ]);

    res.json({ image: decrypted.toString("base64") });
  } catch (error) {
    console.error("Decryption error:", error);
    res.status(500).json({ error: "Decryption failed" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
