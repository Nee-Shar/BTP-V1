import { Request, Response } from "express";
import { supabase } from "../src/supabaseclient";

export const getAnalytics = async (req: Request, res: Response) => {
  // count number of users
  const { data: userData, error: userError } = await supabase
    .from("User2")
    .select("id");
  if (userError) {
    console.error("Error fetching users:", userError);
    return res.status(400).send("Error fetching users");
  }
  const users = userData.length;

  const { data: publicData, error: publicError } = await supabase
    .from("Public_Files")
    .select("id");
  if (publicError) {
    console.error("Error fetching public files:", publicError);
    return res.status(400).send("Error fetching public files");
  }
  const publicFiles = publicData.length;

  const { data: privateData, error: privateError } = await supabase
    .from("File_Acess_Table")
    .select("CID");
  if (privateError) {
    console.error("Error fetching private files:", privateError);
    return res.status(400).send("Error fetching private files");
  }
  const privateFiles = privateData.length;

  return res.status(200).json({ users, publicFiles, privateFiles });
};
