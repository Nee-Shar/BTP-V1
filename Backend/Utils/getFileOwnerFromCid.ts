import { supabase } from "../src/supabaseclient";
import { Request, Response } from "express";

export const getUserFromCid = async (cid: string): Promise<{ id: string, fileType: string } | null> => {
  try {
    const { data, error } = await supabase
      .from("File_Acess_Table")
      .select("id, fileType")
      .eq("CID", cid)
      .single();

    if (error || !data) {
      console.error('Error fetching user data:', error);
      return null;
    }

    return { id: data.id, fileType: data.fileType };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

  export const getCurrentUser = async (): Promise<string | null> => {
    // Fetch the user ID from localStorage
    const userId = localStorage.getItem('user_id');
  
    // Return the user ID, or null if not found
    return userId ? userId : null;
  };
  