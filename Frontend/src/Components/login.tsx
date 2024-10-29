import { Button } from "./ui/button";
import { supabase } from "../supabaseclient";
import { Github, Twitter, Mail ,ShieldCheck} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel"; 

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Carousel Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-[hsl(var(--card))] p-12">
        <Carousel className="w-full max-w-md"
        opts={
          {
            loop: true,
            
            
          }
        }>
          <CarouselContent>
            <CarouselItem>
              <div className="p-1">
                <img
                  src="./security-on-animate.svg"
                  alt="Secure Files Illustration 1"
                  className="aspect-square object-cover"
                />
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="p-1">
                <img
                  src="./secure-login-animate.svg"
                  alt="Secure Files Illustration 2"
                  className="aspect-square object-cover"
                />
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="p-1">
                <img
                  src="./security-on-animate-2.svg"
                  alt="Secure Files Illustration 2"
                  className="aspect-square object-cover"
                />
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Form Section */}
      <div className="flex flex-col items-center justify-center flex-1 p-10 space-y-10 bg-[hsl(var(--background))]">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[hsl(var(--primary))]">
          Your Files, Fortified
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))]">
          Access, store, and share sensitive files with world-class security
          </p>
        </div>

        <div className="w-full max-w-[400px] border border-[hsl(var(--border))] rounded-lg shadow-lg p-8 bg-[hsl(var(--card))] space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Welcome Back</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Sign in with one of the following options
            </p>
          </div>

          {/* Login Buttons */}
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border border-[hsl(var(--border))] py-2 rounded-lg flex items-center justify-center space-x-2 transition-transform transform hover:scale-105"
              onClick={handleLogin}
            >
              <Github className="h-5 w-5" />
              <span>Login with GitHub</span>
            </Button>

            <Button
              variant="outline"
              className="w-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] py-2 rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed"
              disabled
            >
              <Mail className="h-5 w-5" />
              <span>Login with Google</span>
            </Button>

            <Button
              variant="outline"
              className="w-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] py-2 rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed"
              disabled
            >
              <Twitter className="h-5 w-5" />
              <span>Login with Twitter</span>
            </Button>

            <div className="relative flex items-center">
            <div className="flex-grow border-t border-[hsl(var(--border))]" />
            <span className="mx-4 text-sm text-[hsl(var(--muted-foreground))]">
            <ShieldCheck color="#16a34a" />
            </span>
            <div className="flex-grow border-t border-[hsl(var(--border))]" />
          </div>

          <div className="text-center text-xs text-[hsl(var(--muted-foreground))]">
            By logging in, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
