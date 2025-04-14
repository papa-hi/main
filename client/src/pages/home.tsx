import { useEffect } from "react";
import { WelcomeSection } from "../components/home/welcome-section";
import { QuickActions } from "../components/home/quick-actions";
import { UpcomingPlaydates } from "../components/home/upcoming-playdates";
import { NearbyPlaces } from "../components/home/nearby-places";
import { DadSpotlight } from "../components/home/dad-spotlight";
import { useLocation } from "@/hooks/use-location";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { toast } = useToast();
  const { location, error: locationError, isLoading } = useLocation();
  
  // Request location permission if not already granted
  useEffect(() => {
    // Only ask for location permission if the user hasn't seen this toast
    const hasAskedForLocation = localStorage.getItem('location_permission_asked');
    
    if (!hasAskedForLocation && !location && !isLoading) {
      localStorage.setItem('location_permission_asked', 'true');
      
      toast({
        title: "Locatie delen",
        description: "Papa-Hi werkt het beste wanneer je locatie gedeeld wordt voor het vinden van nabije locaties.",
        action: (
          <button 
            className="bg-primary text-white hover:bg-secondary py-1 px-3 rounded text-xs font-medium"
            onClick={() => location}
          >
            Toestaan
          </button>
        ),
        duration: 10000, // 10 seconds
      });
    }
  }, [location, isLoading, toast]);

  // Show an error toast if location access was denied
  useEffect(() => {
    if (locationError) {
      toast({
        title: "Locatie niet beschikbaar",
        description: "Sommige functies zijn beperkt zonder toegang tot je locatie.",
        variant: "destructive",
      });
    }
  }, [locationError, toast]);

  return (
    <div>
      <WelcomeSection userName="Thomas" />
      <QuickActions />
      <UpcomingPlaydates />
      <NearbyPlaces />
      <DadSpotlight />
    </div>
  );
}
