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
import { useState, useEffect, useRef } from "react";

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
  // Declaring state variables
  const [productName, setProductName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageURL, setImageURL] = useState("");

  const [files, setFiles] = useState<FileData[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New state for text file handling
  const [textFile, setTextFile] = useState<File | null>(null);
  const [textFileName, setTextFileName] = useState("");
  const [uploadingText, setUploadingText] = useState(false);
  const textFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user_id");
    localStorage.removeItem("sb-lbhauoweqnshaojwsesx-auth-token");
    localStorage.removeItem("avatar_url");
    localStorage.removeItem("Name");
    window.location.href = "/login";
  };

  // fetches file uploaded and sets the state file as the uploaded
  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleTextFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    setTextFile(selectedFile);
  };

  // handles how the file is uploaded to ipfs
  const handleAddFile = async (e: any) => {
    e.preventDefault();
    setUploading(true);

    //check if file is uploaded or not
    if (!file) {
      alert("Please select a file to upload.");
      setUploading(false);
      return;
    }

    try {
      //Prepare data to send to backend, File, UserId,FileName
      const formData = new FormData();
      const uid = localStorage.getItem("user_id");
      formData.append("image", file); // send file to the backend
      formData.append("id", uid || "1"); // send id of the user who uploaded the file
      formData.append("productName", productName);

      try {
        const response = await axios.post(
          "http://localhost:3000/encryptImage",
          formData
        );

        console.log(response);
        toast.success("File Uploaded!");
      } catch (err) {
        console.error("Error occured while uploading", err);
      }
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error("File upload failed.");
    } finally {
      // Reset form
      setUploading(false);
      setProductName("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input field
      }
      fetchFiles();
    }
  };

  const handleAddTextFile = async (e: any) => {
    e.preventDefault();
    setUploadingText(true);

    if (!textFile) {
      alert("Please select a text file to upload.");
      setUploadingText(false);
      return;
    }

    try {
      const formData = new FormData();
      const uid = localStorage.getItem("user_id");
      formData.append("textFile", textFile); // send file to the backend
      formData.append("id", uid || "1"); // send id of the user who uploaded the file
      formData.append("fileName", textFileName);

      const response = await axios.post(
        "http://localhost:3000/encryptText",
        formData
      );
      console.log(response);
      toast.success("Text File Uploaded!");
    } catch (err) {
      console.error("Error occurred while uploading text file", err);
      toast.error("Text file upload failed.");
    } finally {
      setUploadingText(false);
      setTextFileName("");
      setTextFile(null);
      if (textFileInputRef.current) {
        textFileInputRef.current.value = "";
      }
      fetchFiles();
    }
  };

  const userId = localStorage.getItem("user_id");
  const fetchFiles = async () => {
    setLoadingFiles(true);
  };

  useEffect(() => {
    const fetchFiles = async () => {
      setLoadingFiles(true);
      const uid = localStorage.getItem("user_id");
      try {
        // Call the backend API to fetch files for the given user ID
        const response = await axios.get(`http://localhost:3000/files/${uid}`);
        setFiles(response.data.files); // Assuming backend returns { files: [...] }
        console.log("Files fetched:", response.data.files);
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoadingFiles(false);
      }
    };
    setImageURL(localStorage.getItem("avatar_url") || "");
    fetchFiles();
  }, [userId]);

  const handleViewFile = async (ipfsHash: string, fileType: string) => {
    try {
      // Send to backend, ipfsHash and id
      const formData = new FormData();
      const uid = localStorage.getItem("user_id");
      formData.append("cid", ipfsHash); // send file to the backend
      formData.append("id", uid || "1"); // send id of the user who uploaded the file

      // Determine which endpoint to call based on the file type
      let endpoint = "";
      let responseType = "blob"; // Expect binary data for image files

      if (fileType === "image") {
        endpoint = "http://localhost:3000/decryptImage";
      } else if (fileType === "text") {
        endpoint = "http://localhost:3000/decryptText";
        responseType = "text"; // For text files, expect plain text as the response
      } else {
        throw new Error("Unsupported file type.");
      }

      const decryptResponse = await axios.post(endpoint, formData, {
        responseType: responseType as "blob" | "text",
      });

      // Handle image file
      if (fileType === "image") {
        const decryptedBlob = new Blob([decryptResponse.data], {
          type: "image/jpeg",
        });
        const url = URL.createObjectURL(decryptedBlob);

        const img = document.createElement("img");
        img.src = url;
        img.style.width = "80%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.margin = "20px auto";
        img.style.borderRadius = "8px";
        img.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";

        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.body.appendChild(img);
        } else {
          alert("Failed to open new window.");
        }
      }

      // Handle text file
      else if (fileType === "text") {
        const decryptedText = decryptResponse.data; // Text response
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.body.innerHTML = `
          <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <pre style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; font-size: 16px; line-height: 1.6; color: #444; overflow-wrap: break-word; word-wrap: break-word; white-space: pre-wrap;">
            ${decryptedText}
            </pre>
          </div>
        `;
        } else {
          alert("Failed to open new window.");
        }
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

                    <TableHead>File Type</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingFiles ? (
                    <TableRow>
                      <TableCell colSpan={5}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    files.map((file) => (
                      <TableRow key={file.CID}>
                        <TableCell>{file.fileName}</TableCell>
                        <TableCell>{file.fileSize} bytes</TableCell>
                        <TableCell>
                          {new Date(file.dateOfUpload).toLocaleDateString()}
                        </TableCell>

                        <TableCell>{file.CID.slice(0, 10)}...</TableCell>

                        <TableCell>{file.fileType}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() =>
                              handleViewFile(file.CID, file.fileType)
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

              {/* For Image  */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">Add a new image file</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add a new file</DialogTitle>
                    <DialogDescription>
                      Fill out the form and upload a file .
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddFile} className="grid gap-4 py-4">
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
                        ref={fileInputRef}
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

              {/* New Dialog for adding a new text file */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">Add a new text file</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add a new text file</DialogTitle>
                    <DialogDescription>
                      Fill out the form and upload a .txt file.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={handleAddTextFile}
                    className="grid gap-4 py-4"
                  >
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="Text File Name"
                        value={textFileName}
                        onChange={(e) => setTextFileName(e.target.value)}
                        required
                      />
                      <Input
                        ref={textFileInputRef}
                        type="file"
                        accept=".txt"
                        onChange={handleTextFileChange}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={uploadingText}>
                        {uploadingText ? "Uploading..." : "Add Text File"}
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
