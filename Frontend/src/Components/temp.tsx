import React, { useState } from "react";
import axios from "axios";

const Form: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [key, setKey] = useState(
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  ); // fixed for now maybe get from env in future
  const [encryptedData, setEncryptedData] = useState("");
  const [iv, setIv] = useState("");

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Handle form submission to encrypt
  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !key) {
      alert("Please provide an image and encryption key");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("key", key);

    try {
      const response = await axios.post(
        "http://localhost:3000/encrypt",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setEncryptedData(response.data.encrypted);
      setIv(response.data.iv);
      alert("Image encrypted successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Error encrypting image:", error);
    }
  };

  // Handle decryption
  const handleDecrypt = async () => {
    if (!encryptedData || !key || !iv) {
      alert("Missing encrypted data, key, or IV");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/decrypt", {
        encryptedData,
        key,
        iv,
      });

      const imgSrc = `data:image/png;base64,${response.data.image}`;
      const decryptedImage = new Image();
      decryptedImage.src = imgSrc;
      document.body.appendChild(decryptedImage);
      alert("Image decrypted successfully!");
    } catch (error) {
      console.error("Error decrypting image:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleEncrypt}>
        <div>
          <label>Upload Image:</label>
          <input type="file" onChange={handleFileChange} />
        </div>
        <div>
          <label>Encryption Key:</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>
        <button type="submit">Encrypt</button>
      </form>

      {encryptedData && (
        <div>
          <p>Encrypted Data: {encryptedData.slice(1, 10)}</p>
          <button onClick={handleDecrypt}>Decrypt</button>
        </div>
      )}
    </div>
  );
};

export default Form;
