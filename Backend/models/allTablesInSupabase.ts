// This file shows all types and interfaces of all tables in Supabase

import { UUID } from "crypto";

interface User2 {
  // This is new table since old one had id as int which is not good for security
  id: string; // PRIMARY KEY
  created_at: Date;
  IV: string;
  Encryption_Key: string;
}

interface File_Acess_Table {
  // This is also new since old one had int as id ( and yes Acess is a typo)
  CID: string; // PRIMARY KEY
  id: string;
  fileName: string;
  fileSize: number;
  dateOfUpload: string;
  fileType: string; // text or image
}

interface CID_AND_ENCRYPTION_KEY {
  cid: string; // PRIMARY KEY
  Encryption_Key: string;
  IV: string;
}

interface File_Permission_Table {
  id:UUID; // PRIMARY KEY auto added uuid
  requester_at: Date; // auto added
  cid:string;
  requester_id: string;
  owner_id: string;
  status: string; // Waiting, accepted, rejected
}