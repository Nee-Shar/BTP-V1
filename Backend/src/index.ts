import express, { Request, Response } from "express";
import crypto from "crypto";
import multer from "multer";
import cors from "cors";
import { supabase } from "./supabaseclient";

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
app.post(
  "/encrypt",
  upload.single("image"),
  async (req: Request, res: Response) => {
    const id = req.body.id; // Extract user ID from the request body

    if (!req.file) {
      return res.status(400).send("No image file uploaded");
    }

    try {
      // Step 1: Fetch key and IV from Supabase
      const { data: userData, error } = await supabase
        .from("Users") // Your table name
        .select("Encryption_Key, IV")
        .eq("id", id) 
        .single(); // Fetch single row

      if (error || !userData) {
        console.error("Error fetching encryption key and IV:", error);
        return res.status(400).send("Error fetching encryption key and IV");
      }

      const { Encryption_Key, IV } = userData;
      console.log("Encryption key and IV fetched successfully", userData);
      // Step 2: Use the fetched key and IV for encryption
      const cipher = crypto.createCipheriv(
        algorithm,
        Buffer.from(Encryption_Key, "hex"),
        Buffer.from(IV, "base64")
      );
      const encrypted = Buffer.concat([
        cipher.update(req.file.buffer),
        cipher.final(),
        cipher.getAuthTag(), // Add authentication tag
      ]);

      // Return the encrypted data and IV as JSON
      res.json({
        encrypted: encrypted.toString("base64"),
        iv: IV,
        key:Encryption_Key 
      });
    } catch (error) {
      console.error("Encryption error:", error);
      res.status(500).json({ error: "Encryption failed" });
    }
  }
);



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


//Test Route 
app.get("/hello", (req: Request, res: Response) => {
  res.send("Hello from the server");
});



// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

