export interface cidAndEncryptionKey {
  cid: string;
  encryptionKey: string;
  iv: string;
}

export interface FileData {
  CID: string;
  fileName: string;
  fileSize: string;
  dateOfUpload: string;
  fileType: string;
}

export interface reqFileData {
  id: string;
  requested_at: string;
  cid: string;
  requester_id: string;
  status: string;
  owner_id: string;
  fileType: string;
}

export interface recievedReqFileData {
  id: string;
  cid: string;
  requester_id: string;
  status: string;
  fileType: string;
}

export interface publicFileData{
  id:string; // PRIMARY KEY auto added uuid
  created_at: Date; // auto added
  CID:string;
  fileName: string;
  fileSize: number;
  fileType: string; // text or image
  owner : string;
}

export interface analyticsData {
  users: number;
  publicFiles: number;
  privateFiles: number;
}