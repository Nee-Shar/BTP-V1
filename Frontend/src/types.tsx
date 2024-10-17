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
