import { Request, Response } from "express";
import FormData from "form-data";
import axios from "axios";
import { supabase } from "../src/supabaseclient";

export const uploadImageToPublic = async (req: Request, res: Response) => {
  const id = req.body.id;
  const fileName = req.body.productName;

  // Check if file exists
  if (!req.file) {
    return res.status(400).send("No image file uploaded");
  }

  try {
    // Create form data for Pinata upload
    const pinataFormData = new FormData();
    pinataFormData.append("file", req.file.buffer, fileName);
    pinataFormData.append("pinataMetadata", JSON.stringify({ name: fileName }));
    pinataFormData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    // Upload file to Pinata
    const uploadResponse = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      pinataFormData,
      {
        headers: {
          Authorization: `Bearer ${process.env.VITE_JWT}`,
          ...pinataFormData.getHeaders(),
        },
      }
    );

    // Extract CID and other upload details from the response
    const cid = uploadResponse.data.IpfsHash;
    const fileSize = uploadResponse.data.PinSize;
    const dateOfUpload = uploadResponse.data.Timestamp;
    const dateOnly = dateOfUpload.split("T")[0]; // Extract 'YYYY-MM-DD'
    const fileType = "image";

    // Insert the upload details into Supabase File Access Table
    const { error } = await supabase.from("Public_Files").insert([
      {
        CID: cid,
        fileName: fileName,
        fileSize: fileSize,
        owner: id,
        fileType: fileType,
      },
    ]);

    if (error) {
      console.error("Error inserting data into Supabase:", error);
      return res.status(500).json({ message: "Error storing file details" });
    }

    res.status(200).json({
      message: "File uploaded successfully to IPFS",
      cid: cid,
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
};

export const fetchPublicFiles = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("Public_Files")
      .select("id, CID, fileName, fileSize, created_at,owner, fileType");

    if (error) {
      throw error;
    }

    res.status(200).json({ files: data });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

export const viewImageFile = async (req: Request, res: Response) => {
  const { cid } = req.body;

  try {
    console.log("CID: here ", cid);
    // Fetch the image file from IPFS
    const fileResponse = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      {
        responseType: "arraybuffer", // Binary response for image file
      }
    );

    // Set content type for image and send binary data
    res.setHeader("Content-Type", "image/jpeg");
    res.send(Buffer.from(fileResponse.data, "binary"));
  } catch (error) {
    console.error("Error retrieving image file:", error);
    res.status(500).json({ error: "Error retrieving image file" });
  }
};

export const viewTextFile = async (req: Request, res: Response) => {
  const { cid } = req.body;

  try {
    // Fetch the text file from IPFS
    const fileResponse = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      { responseType: "text" } // Plain text response for text file
    );

    // Set content type for plain text and send text data
    res.setHeader("Content-Type", "text/plain");
    res.send(fileResponse.data);
  } catch (error) {
    console.error("Error retrieving text file:", error);
    res.status(500).json({ error: "Error retrieving text file" });
  }
};
