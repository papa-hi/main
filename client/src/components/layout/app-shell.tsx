import { Header } from "./header";
import { MobileFooter } from "./mobile-footer";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const { toast } = useToast();
  const { user: authUser, isLoading } = useAuth();
  
  // Default user info when not authenticated or loading
  const [userDisplay, setUserDisplay] = useState({
    firstName: "",
    profileImage: "https://placehold.co/36x36/4F6F52/white?text=P"
  });
  
  // Update user display info when auth user changes
  useEffect(() => {
    if (authUser) {
      setUserDisplay({
        firstName: authUser.firstName || authUser.username,
        profileImage: authUser.profileImage || "https://placehold.co/36x36/4F6F52/white?text=" + (authUser.firstName?.[0] || authUser.username?.[0] || "P")
      });
    }
  }, [authUser]);

  // Example of checking online status - useful for a PWA
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Je bent weer online",
        description: "Je hebt nu weer toegang tot alle functies",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Je bent offline",
        description: "Sommige functies zijn beperkt beschikbaar",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header user={userDisplay} />
      
      <main className="flex-grow container mx-auto px-4 pt-5 pb-24 md:pb-5 max-w-6xl overflow-x-hidden">
        {children}
      </main>

      <MobileFooter />
    </div>
  );
}
