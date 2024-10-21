import { Request, Response } from "express";
import { supabase } from "../src/supabaseclient";
import {getUserFromCid,getCurrentUser} from "../Utils/getFileOwnerFromCid";
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


export const fetchRequestedFiles = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // Fetch all files from Supabase based on the user_id
    const { data, error } = await supabase
      .from("File_Permission_Table")
      .select("id,cid, owner_id, status,fileType")
      .eq("requester_id", userId); // Filter by user ID

    if (error) {
      throw error;
    }

    res.status(200).json({ files: data });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }

}


export const fetchRequestReceivedFiles = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // Fetch all files from Supabase based on the user_id
    const { data, error } = await supabase
      .from("File_Permission_Table")
      .select("id,cid, requester_id, status")
      .eq("owner_id", userId); // Filter by user ID

    if (error) {
      throw error;
    }

    res.status(200).json({ files: data });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }

}

export const sendFileRequest = async (req: Request, res: Response) => {
  const {cid,user_id}=req.body;
  const owner_id=await getUserFromCid(cid);

  if(!owner_id){
    return res.status(400).json({error:"File not found"});
  }
  if(user_id===""){
    return res.status(400).json({error:"User not found"});
  }

  const requester_id=user_id;

  // TODO: Un comment this Later
  // if(requester_id===owner_id){
  //   return res.status(400).json({error:"You are the owner of the file"});
  // }

  if(!requester_id){
    return res.status(400).json({error:"User not found"});
  }

 // Check if a similar request already exists
 const { data: existingRequest, error: checkError } = await supabase
 .from('File_Permission_Table')
 .select('*')
 .eq('cid', cid)
 .eq('requester_id', requester_id)
 .single();

if (checkError && checkError.code !== 'PGRST116') {
 // Handle error when querying the table
 console.error("Error checking existing request:", checkError);
 return res.status(500).json({ error: "Failed to check existing request" });
}

if (existingRequest) {
 return res.status(400).json({ error: "You have already requested access to this file" });
}

// Add new entry in File_Permission_Table
const { error } = await supabase
 .from('File_Permission_Table')
 .insert({
   cid: cid,
   owner_id: owner_id,
   requester_id: requester_id,
   status: 'Waiting', // Default status as "Waiting"
   
 });

if (error) {
 console.error("Error inserting request:", error);
 return res.status(500).json({ error: "Failed to send file request" });
}

return res.status(200).json({ message: "File access request sent successfully" });

}


export const approveOrRejectFileRequest = async (req: Request, res: Response) => {
  // We require owner id, file cid, and requester id to approve or reject the file request
  const { cid, owner_id, requester_id, status } = req.body;

  try {
      // Fetch the entry from the File_Permission_Table
      const { data, error } = await supabase
          .from("File_Permission_Table")
          .select("id, cid, requester_id, status")
          .eq("owner_id", owner_id)
          .eq("cid", cid)
          .eq("requester_id", requester_id)
          .single();

      if (error) {
          return res.status(400).json({ error: "Error fetching file request", details: error.message });
      }

      if (!data) {
          return res.status(404).json({ error: "File request not found" });
      }

      // Update the status of the file request to either 'approved' or 'rejected'
      const { error: updateError } = await supabase
          .from("File_Permission_Table")
          .update({ status })
          .eq("id", data.id);

      if (updateError) {
          return res.status(400).json({ error: "Error updating file request status", details: updateError.message });
      }

      return res.status(200).json({ message: `File request ${status}` });
  } catch (err) {
      return res.status(500).json({ error: "Server error", details: (err as Error).message });
  }
};
