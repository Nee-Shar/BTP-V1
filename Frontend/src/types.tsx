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

export interface reqFileData{
  id:string;
  requested_at:string;
  cid:string;
  requester_id:string;
  status:string;
  owner_id:string;
  fileType:string;
}


export interface recievedReqFileData{
  id:string;
  cid:string;
  requester_id:string;
  status:string;
}