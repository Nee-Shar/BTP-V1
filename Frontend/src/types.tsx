export interface cidAndEncryptionKey {
  cid: string;
  encryptionKey: string;
  iv: string;
}

export interface FileData {
    ipfs_pin_hash: string;
    size: number;
    date_pinned: string;
    metadata: {
      name: string;
    };
  }