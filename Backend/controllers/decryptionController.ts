import { Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../src/supabaseclient";
import axios from "axios";

const algorithm = "aes-256-gcm";

export const decryptImage = async (req: Request, res: Response) => {
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
      console.log("User doesn't has access to the requested file");
      throw error;
    }

    if (!data) {
      console.log("User doesn't has access to the requested file");
      res.status(500).json({ error: "Access Denied" });
    }

    try {
      // Reaching here ensures the user has access to the file, now fetch the decryption key and iv for the given cid from Encrypted file info table
      const { data: encryptionData, error } = await supabase
        .from("CID_AND_ENCRYPTION_KEY")
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
};

export const decryptText = async (req: Request, res: Response) => {
  const { cid, id } = req.body;
  try {
    const { data: accessData, error: accessError } = await supabase
      .from("File_Acess_Table") // Replace with your table name
      .select("id") // Selecting a column (can be any column)
      .eq("CID", cid)
      .eq("id", id)
      .single(); // Expecting only one record

    if (accessError || !accessData) {
      console.log("User doesn't have access to the requested file");
      return res.status(403).json({ error: "Access Denied" });
    }

    // Reaching here ensures the user has access to the file, now fetch the decryption key and iv for the given cid from Encrypted file info table
    const { data: encryptionData, error } = await supabase
      .from("CID_AND_ENCRYPTION_KEY")
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
};
