import express, { Request, Response } from "express";
import crypto, { ECDH } from "crypto";
import multer from "multer";
import cors from "cors";
import { supabase } from "./supabaseclient";
import axios from "axios";

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
  "/encryptImage",
  upload.single("image"),
  async (req: Request, res: Response) => {
    // Extract user ID from the request body
    const id = req.body.id;
    const productName = req.body.productName;

    // check file exists
    if (!req.file) {
      return res.status(400).send("No image file uploaded");
    }

    try {
      // Step 1: Fetch key and IV from Supabase using user id
      const { data: userData, error } = await supabase
        .from("User2") // Your table name
        .select("Encryption_Key, IV")
        .eq("id", id)
        .single(); // Fetch single row

      if (error) {
        console.error("Error fetching encryption key and IV:", error);
        return res.status(400).send("Error fetching encryption key and IV");
      }
      if (!userData) {
        console.error("Error fetching user details", error);
        return res
          .status(400)
          .send("Error fetching user details, user must register first");
      }

      const { Encryption_Key, IV } = userData;

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

      // Step 3: Upload the encrypted file to ipfs using pinata and retrieve CID
      const encryptedText = encrypted.toString("base64");
      const pinataFormData = new FormData();
      pinataFormData.append(
        "file",
        new Blob([encryptedText], { type: "text/plain" })
      ); // Encrypted file as a Blob
      pinataFormData.append(
        "pinataMetadata",
        JSON.stringify({ name: productName })
      );
      pinataFormData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      try {
        // Upload response from posting data on Pinata
        const upload = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          pinataFormData,
          {
            headers: {
              Authorization: `Bearer ${process.env.VITE_JWT}`,
            },
          }
        );

        // Step 4: Insert the CID into the "File Access Table" after a successful upload
        const cid = upload.data.IpfsHash;
        //console.log(upload.data);
        const fileSize = upload.data.PinSize;
        const dateOfUpload = upload.data.Timestamp;
        const dateOnly = upload.data.Timestamp.split("T")[0]; // Extract 'YYYY-MM-DD'
        const fileType = "image";
        //console.log({ id, cid, productName, fileSize, dateOnly, fileType });

        const { error: insertError } = await supabase
          .from("File_Acess_Table")
          .insert([
            {
              id: id,
              CID: cid,
              fileName: productName,
              fileSize: fileSize,
              dateOfUpload: dateOnly,
              fileType: fileType,
            },
          ]); // Insert the CID with a fixed id of 1

        if (insertError) {
          console.log("Error inserting data into Supabase:", insertError);
        } else {
          console.log("Product added successfully!");
          res
            .status(200)
            .json({ message: "File uploaded and encrypted successfully!" });
        }

        //Step 5 : Add the encryption key and IV to the "CID and ENCRYPTION KEY" table
        const { error: insertError2 } = await supabase
          .from("CID and ENCRYPTION KEY")
          .insert([{ cid: cid, Encryption_Key: Encryption_Key, IV: IV }]); // Insert the CID with a fixed id of 1

        if (insertError2) {
          console.log("Error inserting data into Supabase:", insertError2);
        }
      } catch (error) {
        console.log("Error uploading file:", error);
      }
    } catch (error) {
      console.error("Encryption error:", error);
      res.status(500).json({ error: "Encryption failed" });
    }
  }
);

app.post(
  "/encryptText",
  upload.single("textFile"),
  async (req: Request, res: Response) => {
    const id = req.body.id;
    const textFileName = req.body.fileName;

    if (!req.file) {
      return res.status(400).send("No text file uploaded.");
    }

    try {
      // Fetch encryption key and IV from Supabase
      const { data: userData, error } = await supabase
        .from("User2")
        .select("Encryption_Key, IV")
        .eq("id", id)
        .single();

      if (error || !userData) {
        console.error("Error fetching encryption details:", error);
        return res.status(400).send("Error fetching encryption details.");
      }

      const { Encryption_Key, IV } = userData;

      // Encrypt the file using the fetched key and IV
      const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(Encryption_Key, "hex"), // Encryption key in hex
        Buffer.from(IV, "base64") // IV in base64
      );

      // Encrypt the file
      const encryptedBuffer = Buffer.concat([
        cipher.update(req.file.buffer),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag(); // Get the authentication tag
      const finalEncryptedBuffer = Buffer.concat([encryptedBuffer, authTag]);

      // Upload the encrypted file to IPFS (Pinata)
      const pinataFormData = new FormData();
      pinataFormData.append(
        "file",
        new Blob([finalEncryptedBuffer], { type: "text/plain" }) // Upload encrypted buffer
      );
      pinataFormData.append(
        "pinataMetadata",
        JSON.stringify({ name: textFileName })
      );
      pinataFormData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      try {
        // Upload to Pinata
        const upload = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          pinataFormData,
          {
            headers: {
              Authorization: `Bearer ${process.env.VITE_JWT}`,
            },
          }
        );

        const cid = upload.data.IpfsHash;

        //console.log(upload.data);
        const fileSize = upload.data.PinSize;
        const dateOfUpload = upload.data.Timestamp;
        const dateOnly = upload.data.Timestamp.split("T")[0]; // Extract 'YYYY-MM-DD'
        const fileType = "text";
       // console.log({ id, cid, textFileName, fileSize, dateOnly, fileType });

        // Insert CID and file details into Supabase
        await supabase
          .from("File_Acess_Table")
          .insert([
            {
              id: id,
              CID: cid,
              fileName: textFileName,
              fileSize: fileSize,
              dateOfUpload: dateOnly,
              fileType: fileType,
            },
          ]);

        await supabase
          .from("CID and ENCRYPTION KEY")
          .insert([{ cid, Encryption_Key, IV }]);

        res.status(200).json({
          message: "File encrypted and uploaded successfully!",
          CID: cid,
        });
      } catch (pinataError) {
        console.error("Error uploading file to Pinata:", pinataError);
        res.status(500).send("Error uploading file to IPFS.");
      }
    } catch (encryptionError) {
      console.error("Error during encryption:", encryptionError);
      res.status(500).json({ error: "File encryption failed." });
    }
  }
);

app.post("/decryptImage", upload.none(), async (req: Request, res: Response) => {
//  console.log(req.body);
  const { cid, id } = req.body;

  try {
    // Check if user has access to the given CID
    const { data, error } = await supabase
      .from("File_Acess_Table") // Replace with your table name
      .select("id") // Selecting a column (can be any column)
      .eq("CID", cid)
      .eq("id", id)
      .single(); // Use .single() to expect at most one record

    if (error) {
      throw error;
    }

    if (!data) {
      console.log("User doesn't has access to the requested file");
      res.status(500).json({ error: "Access Denied" });
    }

    try {
      // Reaching here ensures the user has access to the file, now fetch the decryption key and iv for the given cid from Encrypted file info table
      const { data: encryptionData, error } = await supabase
        .from("CID and ENCRYPTION KEY")
        .select("Encryption_Key, IV")
        .eq("cid", cid)
        .single();
      // separate error handling for error while retrieval or access not available
      if (error || !encryptionData) {
        throw error;
      }

      const { Encryption_Key: key, IV: iv } = encryptionData;

      //fetch the file from pinata
      const encryptedFile = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        { responseType: "text" } // Fetch as plain text
      );

      //decrypt the file
      try {
        const keyBuffer = Buffer.from(key, "hex");
        const ivBuffer = Buffer.from(iv, "base64");

        // Convert encryptedFile from base64 back to its binary form
        const encryptedBuffer = Buffer.from(encryptedFile.data, "base64");

        // Extract the last 16 bytes as the authentication tag
        const authTag = encryptedBuffer.slice(-16);
        const encryptedContent = encryptedBuffer.slice(0, -16);

        // Initialize the decipher with AES-GCM and IV
        const decipher = crypto.createDecipheriv(
          algorithm,
          keyBuffer,
          ivBuffer
        );
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
    } catch (error) {
      console.log("Error fetching key and IV:", error);
    }
  } catch (error) {
    console.log("Error fetching user access file information", error);
  }
});

app.post("/decryptText", upload.none(), async (req: Request, res: Response) => {
  //const { id, cid } = req.body;
  const { cid, id } = req.body;
  try {
          // Reaching here ensures the user has access to the file, now fetch the decryption key and iv for the given cid from Encrypted file info table
          const { data: encryptionData, error } = await supabase
          .from("CID and ENCRYPTION KEY")
          .select("Encryption_Key, IV")
          .eq("cid", cid)
          .single();
        // separate error handling for error while retrieval or access not available
        if (error || !encryptionData) {
          throw error;
        }
  
        const { Encryption_Key: key, IV: iv } = encryptionData;
  
    // Fetch the encrypted file from IPFS (Pinata)
    const fileResponse = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      { responseType: "arraybuffer" } // Ensure binary data is received
    );

    // Convert the response to a buffer
    const encryptedBuffer = Buffer.from(fileResponse.data);

    // Log sizes for debugging
    //console.log("Encrypted Buffer Length:", encryptedBuffer.length);

    // Decrypt the file
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"), // Key from hex
      Buffer.from(iv, "base64") // IV from base64
    );

    // Extract the last 16 bytes as the authentication tag
    const authTag = encryptedBuffer.slice(-16);
    decipher.setAuthTag(authTag);

    // Extract the actual encrypted data (excluding the auth tag)
    const encryptedData = encryptedBuffer.slice(0, -16);

    // Log data lengths for debugging
  //  console.log("Auth Tag Length:", authTag.length);
    //console.log("Encrypted Data Length:", encryptedData.length);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
    //console.log("Decrypted:", decrypted.toString("utf-8"));
    // Send the decrypted text as response
    res.status(200).send(decrypted.toString("utf-8"));
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error decrypting file:", error.message);
    } else {
      console.error("Error decrypting file:", error);
    }
    res.status(500).send("Error decrypting file.");
  }
});

//Test Route
app.get("/hello", (req: Request, res: Response) => {
  res.send("Hello from the server");
});

//Fetch Files Route
app.get("/files/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch files from Supabase based on the user_id
    const { data, error } = await supabase
      .from("File_Acess_Table")
      .select("id, CID, fileName, fileSize, dateOfUpload,fileType")
      .eq("id", userId); // Filter by user ID

    if (error) {
      throw error;
    }

    res.status(200).json({ files: data });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
