import { useEffect } from "react";
import { WelcomeSection } from "../components/home/welcome-section";
import { QuickActions } from "../components/home/quick-actions";
import { UpcomingPlaydates } from "../components/home/upcoming-playdates";
import { NearbyEvents } from "../components/home/nearby-events";
import { NearbyPlaces } from "../components/home/nearby-places";
import { DadSpotlight } from "../components/home/dad-spotlight";
import { useLocation } from "@/hooks/use-location";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCanonical } from "@/hooks/use-canonical";

export default function HomePage() {
  useCanonical("/");
  const { toast } = useToast();
  const { latitude, longitude, error: locationError, isLoading } = useLocation();
  const { user } = useAuth();
  
  // Request location permission if not already granted
  useEffect(() => {
    // Only ask for location permission if the user hasn't seen this toast
    const hasAskedForLocation = localStorage.getItem('location_permission_asked');
    
    if (!hasAskedForLocation && !latitude && !longitude && !isLoading) {
      localStorage.setItem('location_permission_asked', 'true');
      
      toast({
        title: "Locatie delen",
        description: "Papa-Hi werkt het beste wanneer je locatie gedeeld wordt voor het vinden van nabije locaties.",
        duration: 10000, // 10 seconds
      });
    }
  }, [latitude, longitude, isLoading, toast]);

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
      <WelcomeSection userName={user?.firstName || "Bezoeker"} />
      <QuickActions />
      <UpcomingPlaydates />
      <NearbyEvents />
      <NearbyPlaces />
      <DadSpotlight />
    </div>
  );
}
