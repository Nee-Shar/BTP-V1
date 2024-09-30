import { Button } from "./ui/button";
import { supabase } from "../supabaseclient";
import { Github } from "lucide-react";

export default function SecureFileSystemLogin() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
    });

    if (error) {
      console.error("Login failed:", error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[350px] space-y-6 border rounded-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-sm ">
            Use your GitHub account to login , and access the secure file system
          </p>
        </div>
        <div className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleLogin}>
            <Github className="mr-2 h-4 w-4" />
            Login with GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
