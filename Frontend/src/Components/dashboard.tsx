import {
  Bell,
  Home,
  LineChart,
  Menu,
  Package2,
  Search,
  ShoppingCart,
  Key,
  Users,
} from "lucide-react";
import axios from "axios";
import { useState, useEffect } from "react";

import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import toast, { Toaster } from "react-hot-toast";

import { FileData } from "../types";
import { supabase } from "../supabaseclient";

export default function Dashboard() {
  const [productName, setProductName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageURL, setImageURL] = useState("");
  const [name, setName] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user_id");
    localStorage.removeItem("sb-lbhauoweqnshaojwsesx-auth-token");
    localStorage.removeItem("avatar_url");
    localStorage.removeItem("Name");
    window.location.href = "/login";
  };

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleAddProduct = async (e: any) => {
    e.preventDefault();
    setUploading(true);

    if (!file) {
      alert("Please select a file to upload.");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file); // send file to the backend
      formData.append("id", "1"); // send id of the user who uploaded the file
      // Send the file to the backend for encryption
      const response = await axios.post(
        "http://localhost:3000/encrypt",
        formData
      );

      const { encrypted, iv, key } = response.data;
      console.log("Encrypted data:", iv, key);
      // Send encrypted data to Pinata
      const pinataFormData = new FormData();
      pinataFormData.append(
        "file",
        new Blob([encrypted], { type: "text/plain" })
      ); // Encrypted file as a Blob
      pinataFormData.append(
        "pinataMetadata",
        JSON.stringify({ name: productName })
      );
      pinataFormData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const upload = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        pinataFormData,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_JWT}`,
          },
        }
      );
      console.log("File uploaded:", upload.data.IpfsHash);

      // Step 2: Insert the CID into the "File Access Table" after a successful upload
      const cid = upload.data.IpfsHash;
      const { error: insertError } = await supabase
        .from("File Access Table")
        .insert([{ id: 1, CID: cid }]); // Insert the CID with a fixed id of 1

      if (insertError) {
        console.error("Error inserting data into Supabase:", insertError);
        toast.error("Failed to insert data into Supabase.");
      } else {
        toast.success("Product added successfully!");
      }

      //Step 3 : Add the encryption key and IV to the "CID and ENCRYPTION KEY" table
      const { error: insertError2 } = await supabase
        .from("CID and ENCRYPTION KEY")
        .insert([{ cid: cid, Encryption_Key: key, IV: iv }]); // Insert the CID with a fixed id of 1

      if (insertError2) {
        console.error("Error inserting data into Supabase:", insertError2);
        toast.error("Failed to insert data into Supabase.");
      }

      // Reset form
      setProductName("");
      setFile(null);
      fetchFiles();
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error("File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await axios.get(
        "https://api.pinata.cloud/data/pinList?status=pinned",
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_JWT}`,
          },
        }
      );
      setFiles(response.data.rows);
      console.log("Files fetched:", response.data.rows);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    setImageURL(localStorage.getItem("avatar_url") || "");
    setName(localStorage.getItem("Name") || "");
    console.log("Name:", name);
    fetchFiles();
  }, []);

  const handleViewFile = async (ipfsHash: string, fileName: string) => {
    try {
      // Step 2: Fetch key and IV from Supabase using the CID
      console.log(fileName, ipfsHash);
      const { data: encryptionData, error } = await supabase
        .from("CID and ENCRYPTION KEY")
        .select("Encryption_Key, IV")
        .eq("cid", ipfsHash)
        .single();

      if (error || !encryptionData) {
        console.error("Error fetching key and IV:", error);
        toast.error("Error fetching key and IV");
        return;
      }

      const { Encryption_Key: key, IV: iv } = encryptionData;

      // Step 3: Fetch the encrypted file from IPFS as plain text
      const fileResponse = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        { responseType: "text" } // Fetch as plain text
      );

      // Step 4: Prepare form data for decryption
      const formData = new FormData();
      formData.append("encryptedFile", fileResponse.data);
      formData.append("key", key); // Use the fetched key from Supabase
      formData.append("iv", iv); // Use the fetched IV from Supabase

      // Step 5: Send the encrypted file to the backend for decryption
      const decryptResponse = await axios.post(
        "http://localhost:3000/decrypt",
        formData,
        { responseType: "blob" } // Expect binary (Blob) data back
      );

      // Step 6: Create a URL for the decrypted Blob (image)
      const decryptedBlob = new Blob([decryptResponse.data], {
        type: "image/jpeg",
      });
      const url = URL.createObjectURL(decryptedBlob);

      // Step 7: Create an <img> element to display the image
      const img = document.createElement("img");
      img.src = url;
      img.style.width = "80%"; // Adjust image width
      img.style.height = "auto"; // Maintain aspect ratio
      img.style.display = "block"; // Remove inline space and ensure block-level element
      img.style.margin = "20px auto"; // Center the image and add some space around it
      img.style.borderRadius = "8px"; // Optional: Make corners rounded
      img.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"; // Optional: Add a subtle shadow for better visuals

      // Step 8: Open a new window and write the image into it
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.body.appendChild(img);
      } else {
        alert("Failed to open new window.");
      }
    } catch (error) {
      console.error("Error decrypting the file:", error);
      toast.error("Error decrypting the file");
    }
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Toaster />
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <Key className="h-6 w-6" />
              <span>BTP V1</span>
            </a>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary"
              >
                <ShoppingCart className="h-4 w-4" />
                Orders
              </a>

              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary"
              >
                <Users className="h-4 w-4" />
                Customers
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary"
              >
                <LineChart className="h-4 w-4" />
                Analytics
              </a>
            </nav>
          </div>
          <div className="mt-auto p-4">
            {/* <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>
                  Unlock all features and get unlimited access to our support
                  team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <a
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Package2 className="h-6 w-6" />
                  Acme Inc
                </a>
                <a
                  href="#"
                  className="flex items-center gap-4 rounded-xl bg-muted px-3 py-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Orders
                </a>
                {/* Add more navigation links here */}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full bg-background pl-8"
                />
              </div>
            </form>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={imageURL} alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
          </div>
          <div className="flex flex-1 items-center justify-center rounded-lg border border-solid shadow-md">
            <div className="flex flex-col items-center gap-3 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                List of your recent uploads
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>CID</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingFiles ? (
                    <TableRow>
                      <TableCell colSpan={3}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    files.map((file) => (
                      <TableRow key={file.ipfs_pin_hash}>
                        <TableCell>{file.metadata.name}</TableCell>
                        <TableCell>{file.size} bytes</TableCell>
                        <TableCell>{file.date_pinned}</TableCell>

                        <TableCell>
                          {file.ipfs_pin_hash.slice(0, 10)}...
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() =>
                              handleViewFile(
                                file.ipfs_pin_hash,
                                file.metadata.name
                              )
                            }
                          >
                            View File
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">Add a new file</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add a new file</DialogTitle>
                    <DialogDescription>
                      Fill out the form and upload a file .
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="File Name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        required
                      />

                      <Input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={uploading}>
                        {uploading ? "Uploading..." : "Add Product"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}