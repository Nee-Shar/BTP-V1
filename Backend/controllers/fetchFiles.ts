import { Request, Response } from "express";
import { supabase } from "../src/supabaseclient";

export const fetchUserFiles = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // Fetch all files from Supabase based on the user_id
    const { data, error } = await supabase
      .from("File_Acess_Table")
      .select("id, CID, fileName, fileSize, dateOfUpload, fileType")
      .eq("id", userId); // Filter by user ID

    if (error) {
      throw error;
    }

    res.status(200).json({ files: data });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};
