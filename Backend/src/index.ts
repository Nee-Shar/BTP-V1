import express, { Request, Response } from "express";
import crypto from "crypto";
import multer from "multer";
import cors from "cors";

const app = express();
const upload = multer(); // Handling file uploads with multer
const algorithm = "aes-256-gcm";

app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
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
// app.post("/decrypt", upload.none(), (req: Request, res: Response) => {
//   const { key, iv, encryptedFile } = req.body; // Directly retrieve the base64-encoded encrypted file
//   if (!encryptedFile || !key || !iv) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   try {
//     const keyBuffer = Buffer.from(key, "hex"); // Convert key to buffer
//     const ivBuffer = Buffer.from(iv, "base64"); // Convert IV to buffer

//     // Convert encryptedFile from base64 back to its original binary form
//     const encryptedBuffer = Buffer.from(encryptedFile, "base64");

//     // Extract the last 16 bytes as the authentication tag
//     const authTag = encryptedBuffer.slice(-16);

//     // Extract the encrypted content without the authentication tag
//     const encryptedContent = encryptedBuffer.slice(0, -16);

//     // Initialize the decipher with AES-GCM and the IV
//     const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
//     decipher.setAuthTag(authTag); // Set the authentication tag

//     // Decrypt the content
//     const decrypted = Buffer.concat([
//       decipher.update(encryptedContent),
//       decipher.final(),
//     ]);

//     // Send the decrypted data as a base64 string or plain text depending on its original content
//     res.send(decrypted.toString("utf8")); // Assuming you're expecting plain text
//   } catch (error) {
//     console.error("Decryption error:", error);
//     res.status(500).json({ error: "Decryption failed" });
//   }
// });

app.post("/decrypt", upload.none(), (req: Request, res: Response) => {
  const { key, iv, encryptedFile } = req.body;

  if (!encryptedFile || !key || !iv) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const keyBuffer = Buffer.from(key, "hex");
    const ivBuffer = Buffer.from(iv, "base64");

    // Convert encryptedFile from base64 back to its binary form
    const encryptedBuffer = Buffer.from(encryptedFile, "base64");

    // Extract the last 16 bytes as the authentication tag
    const authTag = encryptedBuffer.slice(-16);
    const encryptedContent = encryptedBuffer.slice(0, -16);

    // Initialize the decipher with AES-GCM and IV
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTag);

    // Decrypt the binary content
    const decrypted = Buffer.concat([
      decipher.update(encryptedContent),
      decipher.final(),
    ]);

    // Set response headers to indicate binary content
    res.setHeader("Content-Type", "image/jpeg");
    res.send(decrypted); // Send binary data
  } catch (error) {
    console.error("Decryption error:", error);
    res.status(500).json({ error: "Decryption failed" });
  }
});


// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
