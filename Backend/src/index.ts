import express, { Request, Response } from "express";
import crypto from "crypto";
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
  "/encrypt",
  upload.single("image"),
  async (req: Request, res: Response) => {
    // Extract user ID from the request body
    const id= req.body.id;
    const productName=req.body.productName;
    

    // check file exists
    if (!req.file) {
      return res.status(400).send("No image file uploaded");
    }

    try {
      // Step 1: Fetch key and IV from Supabase using user id
      const { data: userData, error } = await supabase
        .from("Users") // Your table name
        .select("Encryption_Key, IV")
        .eq("id", id)
        .single(); // Fetch single row

      if (error) {
        console.error("Error fetching encryption key and IV:", error);
        return res.status(400).send("Error fetching encryption key and IV");
      }
      if (!userData) {
        console.error("Error fetching user details", error);
        return res.status(400).send("Error fetching user details, user must register first");
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
      
      
      // Step 3: Upload the encrypted file to ipfs using pinata and retrieve CID
      const encryptedText = encrypted.toString("base64");
      const pinataFormData = new FormData();
      pinataFormData.append(
        "file",
        new Blob([encryptedText], { type: "text/plain" })
      ); // Encrypted file as a Blob
      pinataFormData.append(
        "pinataMetadata",
        JSON.stringify({ name: productName})
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
        console.log("File uploaded:", upload.data.IpfsHash);

        // Step 4: Insert the CID into the "File Access Table" after a successful upload
        const cid = upload.data.IpfsHash;
        const { error: insertError } = await supabase
          .from("File Access Table")
          .insert([{ id: 1, CID: cid }]); // Insert the CID with a fixed id of 1

        if (insertError) {
          console.log("Error inserting data into Supabase:", insertError);
        } else {
          console.log("Product added successfully!");
          res.status(200).json({ message: "File uploaded and encrypted successfully!" });
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

// app.post("/decrypt", upload.none(), (req: Request, res: Response) => {
//   const { key, iv, encryptedFile } = req.body;

//   if (!encryptedFile || !key || !iv) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   try {
//     const keyBuffer = Buffer.from(key, "hex");
//     const ivBuffer = Buffer.from(iv, "base64");

//     // Convert encryptedFile from base64 back to its binary form
//     const encryptedBuffer = Buffer.from(encryptedFile, "base64");

//     // Extract the last 16 bytes as the authentication tag
//     const authTag = encryptedBuffer.slice(-16);
//     const encryptedContent = encryptedBuffer.slice(0, -16);

//     // Initialize the decipher with AES-GCM and IV
//     const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
//     decipher.setAuthTag(authTag);

//     // Decrypt the binary content
//     const decrypted = Buffer.concat([
//       decipher.update(encryptedContent),
//       decipher.final(),
//     ]);

//     // Set response headers to indicate binary content
//     res.setHeader("Content-Type", "image/jpeg");
//     res.send(decrypted); // Send binary data
//   } catch (error) {
//     console.error("Decryption error:", error);
//     res.status(500).json({ error: "Decryption failed" });
//   }
// });

app.post("/decrypt",upload.none(),async(req:Request,res:Response)=>{
  console.log(req.body);
  const {cid,id}=req.body;
  

  try{
    // Check if user has access to the given CID
    const { data, error } = await supabase
    .from('File Access Table') // Replace with your table name
    .select('id') // Selecting a column (can be any column)
    .eq('CID', cid)
    .eq('id', id)
    .single(); // Use .single() to expect at most one record

    if(error){
      throw error;
    }

    if(!data){
      console.log("User doesn't has access to the requested file");
      res.status(500).json({error:"Access Denied"})
    }

    try{
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
    } catch(error){
      console.log("Error fetching key and IV:", error);
    }
    
  } catch(error){
    console.log("Error fetching user access file information",error);
  }
  
})

//Test Route
app.get("/hello", (req: Request, res: Response) => {
  res.send("Hello from the server");
});


//Fetch Files Route 
app.get('/files/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch files from Supabase based on the user_id
    const { data, error } = await supabase
      .from('File Access Table')  
      .select('id, CID, fileName, fileSize, Date_of_upload')
      .eq('id', userId); // Filter by user ID

    if (error) {
      throw error;
    }

    res.status(200).json({ files: data });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
