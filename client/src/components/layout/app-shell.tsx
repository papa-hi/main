import { Header } from "./header";
import { MobileFooter } from "./mobile-footer";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const { toast } = useToast();
  
  // Mock user state - in a real app, this would come from authentication
  const [user, setUser] = useState({
    firstName: "Thomas",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80"
  });

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
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 pt-5 pb-20 md:pb-5 max-w-6xl">
        {children}
      </main>

      <MobileFooter />
    </div>
  );
}
