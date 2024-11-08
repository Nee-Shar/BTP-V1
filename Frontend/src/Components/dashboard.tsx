import {
  Home,
  LineChart,
  Menu,
  Search,
  FileText,
  Image as ImageIcon,
  Plus,
  ExternalLink,
  FileInput,
  Paperclip,
  Globe,
  TrendingUp,
  Copy,
} from "lucide-react";
import axios from "axios";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
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

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

import {
  FileData,
  reqFileData,
  recievedReqFileData,
  publicFileData,
  analyticsData,
} from "../types";
import { supabase } from "../supabaseclient";
import { Label, Pie, PieChart } from "recharts";
import { GenerateQRCode } from "./genqr";

export default function Dashboard() {
  // Declaring state variables
  const [productName, setProductName] = useState("");
  const [requestedFileName, setRequestedFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publicFiles, setPublicFiles] = useState<publicFileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageURL, setImageURL] = useState("");

  const [isApprovedDisabled, setApprovedDisabled] = useState(false);
  const [isRejectedDisabled, setRejectedDisabled] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [reqFiles, setReqFiles] = useState<reqFileData[]>([]);
  const [recievedReqFiles, setRecievedReqFiles] = useState<
    recievedReqFileData[]
  >([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New state for text file handling
  const [textFile, setTextFile] = useState<File | null>(null);
  const [textFileName, setTextFileName] = useState("");
  const [uploadingText, setUploadingText] = useState(false);
  const textFileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const [analyticData, setAnalyticsData] = useState<analyticsData | null>(null);

  const handleCopyCid = (cid: string) => {
    navigator.clipboard.writeText(cid);
    toast.success("CID copied to clipboard!");
  };

  const chartConfig = {
    users: {
      label: "Users",
      color: "#7c3aed",
    },
  } satisfies ChartConfig;

  const chartConfig2 = {
    publicFiles: {
      label: "Public Files",
      color: "#3aed3f",
    },
  } satisfies ChartConfig;

  const chartConfig3 = {
    privateFiles: {
      label: "Private Files",
      color: "#ed963a",
    },
  } satisfies ChartConfig;

  const handleTabClick = (tab: string): void => {
    setSelectedTab(tab);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user_id");
    localStorage.removeItem("sb-lbhauoweqnshaojwsesx-auth-token");
    localStorage.removeItem("avatar_url");
    localStorage.removeItem("Name");
    window.location.href = "/";
  };

  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleTextFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    setTextFile(selectedFile);
  };

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
          `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/api/encrypt/encryptImage`,
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
    }
  };

  const handleAddPublicFile = async (e: any) => {
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
          `${
            import.meta.env.VITE_PUBLIC_BACKEND_URL
          }/api/public/uploadPublicImage`,
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
    }
  };
  const handleRequestFile = async (e: any) => {
    e.preventDefault();
    setUploading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/api/fetch/requestFile`,
        // API endpoint
        {
          cid: requestedFileName,
          user_id: localStorage.getItem("user_id"),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response) {
        console.error("Error requesting file:", response);
      }
      toast.success("File Requested Successfully!");
      fetchFiles();
      fetchReqFiles();
      fetchRecivedReqFiles();
      setRequestedFileName("");
    } catch (e) {
      console.error("Error occured while requesting file", e);
    } finally {
      setUploading(false);
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
        `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/api/encrypt/encryptText`,
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

  const handleAddPublicTextFile = async (e: any) => {
    console.log("Inside handleAddPublicTextFile");
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
        `${
          import.meta.env.VITE_PUBLIC_BACKEND_URL
        }/api/public/uploadPublicText`,
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
    }
  };

  const fetchReqFiles = async () => {
    setLoadingFiles(true);
    const uid = localStorage.getItem("user_id");
    try {
      // Call the backend API to fetch files for the given user ID
      const response = await axios.get(
        `${
          import.meta.env.VITE_PUBLIC_BACKEND_URL
        }/api/fetch/requestedFiles/${uid}`
      );
      setReqFiles(response.data.files); // Assuming backend returns { files: [...] }
      console.log("Files fetched:", response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };
  const fetchFiles = async () => {
    setLoadingFiles(true);
    const uid = localStorage.getItem("user_id");
    try {
      // Call the backend API to fetch files for the given user ID
      const response = await axios.get(
        `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/api/fetch/files/${uid}`
      );
      setFiles(response.data.files); // Assuming backend returns { files: [...] }
      console.log("Files fetched:", response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchPublicFiles = async () => {
    setLoadingFiles(true);
    try {
      // Call the backend API to fetch files for the given user ID
      const response = await axios.get(
        `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/api/public/fetchPublicFiles`
      );
      setPublicFiles(response.data.files); // Assuming backend returns { files: [...] }
      console.log("Files fetched:", response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchRecivedReqFiles = async () => {
    setLoadingFiles(true);
    const uid = localStorage.getItem("user_id");
    try {
      // Call the backend API to fetch files for the given user ID
      const response = await axios.get(
        `${
          import.meta.env.VITE_PUBLIC_BACKEND_URL
        }/api/fetch/receivedRequestedFiles/${uid}`
      );
      setRecievedReqFiles(response.data.files); // Assuming backend returns { files: [...] }
      console.log("Files fetched:", response.data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/api/analytics`
      );
      setAnalyticsData(response.data);
      console.log("Analytics data fetched:", response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const chartData = useMemo(() => {
    if (!analyticData) return [];
    return [
      {
        name: "Users",
        value: analyticData.users,
        fill: chartConfig.users.color,
      },
      // {
      //   name: "Public Files",
      //   value: analyticData.publicFiles,
      //   fill: chartConfig2.publicFiles.color,
      // },
      // {
      //   name: "Private Files",
      //   value: analyticData.privateFiles,
      //   fill: chartConfig3.privateFiles.color,
      // },
    ];
  }, [analyticData]);
  const chartData2 = useMemo(() => {
    if (!analyticData) return [];
    return [
      {
        name: "Public Files",
        value: analyticData.publicFiles,
        fill: chartConfig2.publicFiles.color,
      },
    ];
  }, [analyticData]);

  const chartData3 = useMemo(() => {
    if (!analyticData) return [];
    return [
      {
        name: "Private Files",
        value: analyticData.privateFiles,
        fill: chartConfig3.privateFiles.color,
      },
    ];
  }, [analyticData]);

  useEffect(() => {
    setImageURL(
      localStorage.getItem("avatar_url") ||
        "https://w7.pngwing.com/pngs/134/822/png-transparent-computer-icons-business-man-people-logo-recruiter-thumbnail.png"
    );
    fetchFiles();
    fetchPublicFiles();
    fetchReqFiles();
    fetchRecivedReqFiles();
    fetchAnalytics();
  }, [
    files.length,
    reqFiles.length,
    recievedReqFiles.length,
    publicFiles.length,
  ]);

  const handleViewFile = async (
    ipfsHash: string,
    fileType: string,
    owner_id: string
  ) => {
    try {
      // Send to backend, ipfsHash and id
      const formData = new FormData();
      const uid = owner_id;
      formData.append("cid", ipfsHash); // send file to the backend
      formData.append("id", uid || "1"); // send id of the user who uploaded the file
      console.log(ipfsHash, fileType);
      // Determine which endpoint to call based on the file type
      let endpoint = "";
      let responseType = "blob"; // Expect binary data for image files

      if (fileType === "image") {
        endpoint = `${
          import.meta.env.VITE_PUBLIC_BACKEND_URL
        }/api/decrypt/decryptImage`;
      } else if (fileType === "text") {
        endpoint = `${
          import.meta.env.VITE_PUBLIC_BACKEND_URL
        }/api/decrypt/decryptText`;

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

  const handlePublicViewFile = async (ipfsHash: string, fileType: string) => {
    try {
      // Send to backend, ipfsHash and id
      const formData = new FormData();

      formData.append("cid", ipfsHash); // send file to the backend
      console.log(ipfsHash, fileType);
      // Determine which endpoint to call based on the file type
      let endpoint = "";
      let responseType = "blob"; // Expect binary data for image files

      if (fileType === "image") {
        endpoint = `${
          import.meta.env.VITE_PUBLIC_BACKEND_URL
        }/api/public/viewImageFile`;
      } else if (fileType === "text") {
        endpoint = `${
          import.meta.env.VITE_PUBLIC_BACKEND_URL
        }/api/public/viewTextFile`;

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
  const handleApproveFileRequest = async (
    cid: string,
    requester_id: string,
    status: string
  ) => {
    //const { cid, owner_id, requester_id, status } = req.body;
    try {
      const owner_id = localStorage.getItem("user_id");

      const response = await axios.post(
        `${
          import.meta.env.VITE_PUBLIC_BACKEND_URL
        }/api/fetch/acceptOrRejectFileRequest`,

        {
          cid: cid,
          owner_id: owner_id,
          requester_id: requester_id,
          status: status,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success(`File request ${status} successfully!`);
        fetchReqFiles();

        fetchRecivedReqFiles();
        if (status === "Approved") {
          console.log(isApprovedDisabled);
          setApprovedDisabled(true); // Disable the approve button
        } else if (status === "Rejected") {
          console.log(isRejectedDisabled);

          setRejectedDisabled(true); // Disable the reject button
        }
      } else {
        toast.error(`Failed to ${status} file request`);
      }
    } catch (error) {
      console.error("Error updating file request status:", error);
      const err = error as any;
      toast.error(`Error updating file request status: ${err.message}`);
    }
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Toaster />
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full fixed max-h-screen flex-col gap-2">
          <div className="flex  h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <a href="/" className="flex items-center gap-2 font-semibold">
              {/* <Cat className="h-6 w-6" /> */}

              <img src="./lgo.png" alt="logo" className="h-8 w-8" />
              <span>Suraksha Setu</span>
            </a>
          </div>
          <div className="flex-1  ">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <a
                href="#"
                onClick={() => handleTabClick("Dashboard")}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  selectedTab === "Dashboard"
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </a>
              <a
                href="#"
                onClick={() => handleTabClick("Requests")}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  selectedTab === "Requests"
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Paperclip className="h-4 w-4" />
                Sent Requests
              </a>

              <a
                href="#"
                onClick={() => handleTabClick("Approvals")}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  selectedTab === "Approvals"
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <FileInput className="h-4 w-4" />
                Received Requests
              </a>

              <a
                onClick={() => handleTabClick("Public")}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  selectedTab === "Public"
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
                href="#"
              >
                <Globe className="h-4 w-4" />
                Public Pool
              </a>
              <a
                href="#"
                onClick={() => handleTabClick("Analytics")}
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
                <a href="/" className="flex items-center gap-2 font-semibold">
                  {/* <Cat className="h-6 w-6" /> */}
                  <img src="./lgo.png" alt="logo" className="h-6 w-6" />
                  <span>Suraksha Setu</span>
                </a>
                <a
                  href="#"
                  onClick={() => handleTabClick("Dashboard")}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    selectedTab === "Dashboard"
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </a>
                <a
                  href="#"
                  onClick={() => handleTabClick("Requests")}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    selectedTab === "Requests"
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Paperclip className="h-4 w-4" />
                  Sent Requests
                </a>

                <a
                  href="#"
                  onClick={() => handleTabClick("Approvals")}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    selectedTab === "Approvals"
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <FileInput className="h-4 w-4" />
                  Received Requests
                </a>

                <a
                  onClick={() => handleTabClick("Public")}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                    selectedTab === "Public"
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  href="#"
                >
                  <Globe className="h-4 w-4" />
                  Public Pool
                </a>
                <a
                  href="#"
                  onClick={() => handleTabClick("Analytics")}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary"
                >
                  <LineChart className="h-4 w-4" />
                  Analytics
                </a>
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

        {selectedTab === "Dashboard" && (
          <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Add image
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add a new image file</DialogTitle>
                      <DialogDescription>
                        Fill out the form and upload an image file.
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
                          {uploading ? "Uploading..." : "Add Image"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Add text file
                    </Button>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingFiles ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p>Loading...</p>
                  </CardContent>
                </Card>
              ) : (
                files.map((file) => (
                  <Card key={file.CID} className="overflow-hidden">
                    <div
                      className="h-32 bg-cover bg-center"
                      style={{
                        backgroundImage:
                          file.fileType === "image"
                            ? `url('https://repository-images.githubusercontent.com/229240000/2b1bba00-eae1-11ea-8b31-ea57fe8a3f95')`
                            : `url("https://www.hitechnectar.com/wp-content/uploads/2018/07/notepad-jpg-webp.webp")`,
                      }}
                    />

                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {file.fileType === "image" ? (
                          <ImageIcon className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        {file.fileName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Size: {file.fileSize} bytes
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded:{" "}
                        {new Date(file.dateOfUpload).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CID: {file.CID.slice(0, 10)}...
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {file.fileType}
                      </Badge>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() =>
                          handleViewFile(
                            file.CID,
                            file.fileType,
                            localStorage.getItem("user_id") || "1"
                          )
                        }
                        className="w-full"
                      >
                        View File
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleCopyCid(file.CID)}
                        className="ml-2"
                        variant="outline"
                      >
                        Copy CID
                        <Copy className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </main>
        )}
        {selectedTab === "Requests" && (
          <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold tracking-tight">
                Sent Requests
              </h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Request a new file
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Request a new file</DialogTitle>
                    <DialogDescription>
                      Fill out the form to request a file.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={handleRequestFile}
                    className="grid gap-4 py-4"
                  >
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="File CID"
                        value={requestedFileName}
                        onChange={(e) => setRequestedFileName(e.target.value)}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={uploading}>
                        {uploading ? "Requesting..." : "Request File"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingFiles ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p>Loading...</p>
                  </CardContent>
                </Card>
              ) : (
                reqFiles.map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <div
                      className="h-32 bg-cover bg-center flex items-center justify-center"
                      style={{
                        backgroundImage:
                          file.fileType === "image"
                            ? `url('https://repository-images.githubusercontent.com/229240000/2b1bba00-eae1-11ea-8b31-ea57fe8a3f95')`
                            : `url("https://www.hitechnectar.com/wp-content/uploads/2018/07/notepad-jpg-webp.webp")`,
                      }}
                    ></div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {file.fileType === "image" ? (
                          <ImageIcon className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        File: {file.cid.slice(0, 20)}...
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Owner ID: {file.owner_id}
                      </p>
                      <p className="text-sm font-bold">Status: {file.status}</p>
                      <Badge variant="outline" className="mt-2">
                        {file.fileType}
                      </Badge>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() =>
                          handleViewFile(file.cid, file.fileType, file.owner_id)
                        }
                        className="w-full"
                        disabled={file.status !== "Approved"}
                      >
                        View File
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleCopyCid(file.cid)}
                        className="ml-2"
                        variant="outline"
                      >
                        Copy CID
                        <Copy className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </main>
        )}
        {selectedTab === "Approvals" && (
          <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold tracking-tight">
                Received Requests
              </h1>
              {/* You can add a dialog here for actions related to approvals if needed */}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingFiles ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p>Loading...</p>
                  </CardContent>
                </Card>
              ) : (
                recievedReqFiles.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <div
                      className="h-32 bg-cover bg-center flex items-center justify-center"
                      style={{
                        backgroundImage:
                          request.fileType === "image"
                            ? `url('https://repository-images.githubusercontent.com/229240000/2b1bba00-eae1-11ea-8b31-ea57fe8a3f95')`
                            : `url('https://www.hitechnectar.com/wp-content/uploads/2018/07/notepad-jpg-webp.webp')`,
                      }}
                    ></div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        File: {request.cid.slice(0, 20)}...
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Requested By: {request.requester_id}
                      </p>
                      <p className="text-sm font-bold">
                        Status: {request.status}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {request.fileType}
                      </Badge>
                    </CardContent>
                    <CardFooter>
                      <div className="flex gap-2">
                        {request.status === "Waiting" ? (
                          <>
                            <Button
                              onClick={() =>
                                handleApproveFileRequest(
                                  request.cid,
                                  request.requester_id,
                                  "Approved"
                                )
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                handleApproveFileRequest(
                                  request.cid,
                                  request.requester_id,
                                  "Rejected"
                                )
                              }
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button disabled>Approve</Button>
                            <Button disabled>Reject</Button>
                          </>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </main>
        )}
        {selectedTab === "Public" && (
          <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold tracking-tight">
                Public Files
              </h1>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Add image
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add a new image file</DialogTitle>
                      <DialogDescription>
                        Fill out the form and upload an image file.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleAddPublicFile}
                      className="grid gap-4 py-4"
                    >
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
                          {uploading ? "Uploading..." : "Add Image"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Add text file
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add a new text file</DialogTitle>
                      <DialogDescription>
                        Fill out the form and upload a .txt file.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleAddPublicTextFile}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingFiles ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p>Loading...</p>
                  </CardContent>
                </Card>
              ) : (
                publicFiles.map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <div
                      className="h-32 bg-cover bg-center"
                      style={{
                        backgroundImage:
                          file.fileType === "image"
                            ? `url('https://repository-images.githubusercontent.com/229240000/2b1bba00-eae1-11ea-8b31-ea57fe8a3f95')`
                            : `url("https://www.hitechnectar.com/wp-content/uploads/2018/07/notepad-jpg-webp.webp")`,
                      }}
                    />
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {file.fileType === "image" ? (
                          <ImageIcon className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        {file.fileName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Size: {file.fileSize} bytes
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded:{" "}
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CID: {file.CID.slice(0, 10)}....
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {file.fileType}
                      </Badge>
                      <div className="mt-4 flex justify-center">
                        <GenerateQRCode
                          text={`https://ipfs.io/ipfs/${file.CID}`}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() =>
                          handlePublicViewFile(file.CID, file.fileType)
                        }
                        className="w-full"
                      >
                        View File
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleCopyCid(file.CID)}
                        className="ml-2"
                        variant="outline"
                      >
                        Copy CID
                        <Copy className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </main>
        )}
        {selectedTab === "Analytics" && (
          <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle>Users Overview</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {analyticData?.users.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    Total
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 font-medium leading-none">
                    Growth trend: 5.2% this month{" "}
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Showing distribution of public files.
                  </div>
                </CardFooter>
              </Card>
              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle>Public Files Overview</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={chartConfig2}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={chartData2}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {analyticData?.publicFiles.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    Total
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 font-medium leading-none">
                    Growth trend: 5.2% this month{" "}
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Showing distribution of users.
                  </div>
                </CardFooter>
              </Card>{" "}
              <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                  <CardTitle>Private Files Overview</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={chartConfig3}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={chartData3}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {analyticData?.privateFiles.toLocaleString()}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    Total
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 font-medium leading-none">
                    Growth trend: 5.2% this month{" "}
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Showing distribution of private files
                  </div>
                </CardFooter>
              </Card>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
