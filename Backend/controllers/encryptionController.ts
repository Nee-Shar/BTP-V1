import { Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../src/supabaseclient"
import axios from "axios";

const algorithm = "aes-256-gcm";

export const encryptImage = async (req: Request, res: Response) => {
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
          console.log("Image added successfully!");
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
  
};

export const encryptText = async (req: Request, res: Response) => {
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
};
