import { useEffect, useState, useCallback } from "react";
import { WelcomeSection } from "../components/home/welcome-section";
import { OnboardingCard } from "../components/home/onboarding-card";
import { QuickActions } from "../components/home/quick-actions";
import { UpcomingPlaydates } from "../components/home/upcoming-playdates";
import { NearbyEvents } from "../components/home/nearby-events";
import { NearbyPlaces } from "../components/home/nearby-places";
import { DadSpotlight } from "../components/home/dad-spotlight";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocation as useGeoLocation } from "@/hooks/use-location";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCanonical } from "@/hooks/use-canonical";
import { useTranslation } from "react-i18next";
import { Calendar, MapPin, Users } from "lucide-react";

// Persist the active tab in sessionStorage so navigating away and back
// returns the user to where they were.
const TAB_STORAGE_KEY = "home_active_tab";
type HomeTab = "for-you" | "nearby" | "dads";

export default function HomePage() {
  useCanonical("/");
  const { t } = useTranslation();
  const { toast } = useToast();
  const { latitude, longitude, error: locationError, isLoading } = useGeoLocation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    return (sessionStorage.getItem(TAB_STORAGE_KEY) as HomeTab) || "for-you";
  });

  const handleTabChange = useCallback((tab: string) => {
    const value = tab as HomeTab;
    setActiveTab(value);
    sessionStorage.setItem(TAB_STORAGE_KEY, value);
  }, []);

  // Request location permission once per session
  useEffect(() => {
    const hasAskedForLocation = localStorage.getItem("location_permission_asked");
    if (!hasAskedForLocation && !latitude && !longitude && !isLoading) {
      localStorage.setItem("location_permission_asked", "true");
      toast({
        title: t("location.shareTitle", "Share your location"),
        description: t(
          "location.shareDesc",
          "PaPa-Hi works best when you share your location to find nearby places."
        ),
        duration: 10000,
      });
    }
  }, [latitude, longitude, isLoading, toast, t]);

  useEffect(() => {
    if (locationError) {
      toast({
        title: t("location.unavailableTitle", "Location unavailable"),
        description: t(
          "location.unavailableDesc",
          "Some features are limited without location access."
        ),
        variant: "destructive",
      });
    }
  }, [locationError, toast, t]);

  return (
    <div>
      {/* ── Always-visible above-the-fold sections ── */}
      <WelcomeSection userName={user?.firstName || t("common.visitor", "Visitor")} />
      <OnboardingCard />
      <QuickActions />

      {/* ── Tabbed below-the-fold content ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Sticky tab bar so it stays visible while scrolling tab content */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-border mb-4">
          <TabsList className="w-full grid grid-cols-3 h-11">
            <TabsTrigger value="for-you" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t("home.tabs.forYou", "For You")}</span>
            </TabsTrigger>
            <TabsTrigger value="nearby" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t("home.tabs.nearby", "Nearby")}</span>
            </TabsTrigger>
            <TabsTrigger value="dads" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t("home.tabs.dads", "Dads")}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: For You — personal / upcoming content */}
        <TabsContent value="for-you">
          <UpcomingPlaydates />
        </TabsContent>

        {/* Tab: Nearby — location-based content */}
        <TabsContent value="nearby">
          <NearbyEvents />
          <NearbyPlaces />
        </TabsContent>

        {/* Tab: Dads — social / community content */}
        <TabsContent value="dads">
          <DadSpotlight />
        </TabsContent>
      </Tabs>
    </div>
  );
}