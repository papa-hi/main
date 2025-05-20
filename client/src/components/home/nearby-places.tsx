import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Place } from "@shared/schema";
import { PlaceCard } from "../shared/place-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation as useGeoLocation } from "@/hooks/use-location";
import { useTranslation } from "react-i18next";

type PlaceType = "all" | "restaurant" | "playground";

export function NearbyPlaces() {
  const [location] = useLocation();
  const locationState = useGeoLocation();
  const [activeFilter, setActiveFilter] = useState<PlaceType>("all");
  const { t } = useTranslation();
  
  // Extract type from URL query parameters if coming from places page
  useEffect(() => {
    if (location.includes("type=restaurant")) {
      setActiveFilter("restaurant");
    } else if (location.includes("type=playground")) {
      setActiveFilter("playground");
    }
  }, [location]);

  // Use sample data instead of database query to avoid schema issues
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load sample data that mimics API response
  useEffect(() => {
    // Simulate network loading
    const timer = setTimeout(() => {
      try {
        // Sample places data (Dutch locations)
        const samplePlaces: Place[] = [
          {
            id: 1,
            name: "Vondelpark Speelplaats",
            description: "Een prachtige speeltuin in het hart van Amsterdam met moderne speeltoestellen.",
            type: "playground",
            address: "Vondelpark 7, 1071 AA Amsterdam",
            latitude: locationState.latitude ? (parseFloat(locationState.latitude.toString()) + 0.01).toString() : "52.364",
            longitude: locationState.longitude ? (parseFloat(locationState.longitude.toString()) - 0.01).toString() : "4.878",
            features: ["schommels", "glijbanen", "klimrekken", "picknickplek"],
            imageUrl: "/uploads/place-images/playground1.jpg",
            distance: 1.2,
            createdAt: new Date(),
            rating: 4.7,
            reviewCount: 56,
            familyFriendly: true,
            kidFriendly: true,
            tags: ["outdoor", "playground", "family-friendly"],
            isSaved: false,
            isIndoor: false
          },
          {
            id: 2,
            name: "Pannenkoekenhuisje De Carrousel",
            description: "Gezellig pannenkoekenrestaurant met kindermenu en speelhoek.",
            type: "restaurant",
            address: "Prinsengracht 560, 1017 KK Amsterdam",
            latitude: locationState.latitude ? (parseFloat(locationState.latitude.toString()) - 0.005).toString() : "52.368",
            longitude: locationState.longitude ? (parseFloat(locationState.longitude.toString()) + 0.01).toString() : "4.884",
            features: ["kindermenu", "speelhoek", "kinderstoelen", "verschoontafels"],
            imageUrl: "/uploads/place-images/restaurant1.jpg",
            distance: 0.9,
            createdAt: new Date(),
            rating: 4.4,
            reviewCount: 127,
            familyFriendly: true,
            kidFriendly: true,
            tags: ["restaurant", "indoor", "kids-menu"],
            isSaved: true,
            isIndoor: true
          },
          {
            id: 3,
            name: "TunFun Speelpark",
            description: "Groot indoor speelparadijs, perfect voor regenachtige dagen.",
            type: "playground",
            address: "Mr. Visserplein 7, 1011 RD Amsterdam",
            latitude: locationState.latitude ? (parseFloat(locationState.latitude.toString()) + 0.005).toString() : "52.370",
            longitude: locationState.longitude ? (parseFloat(locationState.longitude.toString()) + 0.008).toString() : "4.901",
            features: ["indoor", "ballenbak", "klimrekken", "cafe"],
            imageUrl: "/uploads/place-images/indoor-playground.jpg",
            distance: 1.8,
            createdAt: new Date(),
            rating: 4.6,
            reviewCount: 212,
            familyFriendly: true,
            kidFriendly: true,
            tags: ["indoor", "playground", "rainy-day"],
            isSaved: false,
            isIndoor: true
          },
          {
            id: 4,
            name: "De Bakkerswinkel",
            description: "Beste ontbijt in de stad met familie-zitplaatsen.",
            type: "restaurant",
            address: "Warmoesstraat 69, 1012 HX Amsterdam",
            latitude: locationState.latitude ? (parseFloat(locationState.latitude.toString()) - 0.007).toString() : "52.372",
            longitude: locationState.longitude ? (parseFloat(locationState.longitude.toString()) - 0.009).toString() : "4.895",
            features: ["ontbijt", "familie-zitplaatsen", "buitenterras"],
            imageUrl: "/uploads/place-images/cafe.jpg",
            distance: 0.7,
            createdAt: new Date(),
            rating: 4.3,
            reviewCount: 89,
            familyFriendly: true,
            kidFriendly: true,
            tags: ["breakfast", "cafe", "outdoor-seating"],
            isSaved: false,
            isIndoor: false
          }
        ];

        // Filter by type if needed
        const filteredPlaces = activeFilter === 'all' 
          ? samplePlaces 
          : samplePlaces.filter(place => place.type === activeFilter);

        setPlaces(filteredPlaces);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load places'));
        setIsLoading(false);
      }
    }, 1000); // 1 second loading time to simulate network

    return () => clearTimeout(timer);
  }, [locationState.latitude, locationState.longitude, activeFilter]);

  const handleFilterChange = (filter: PlaceType) => {
    setActiveFilter(filter);
  };

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">{t('home.nearbyPlaces', 'Nearby Places')}</h2>
          <div className="flex space-x-2 text-sm">
            <Skeleton className="w-16 h-8 rounded-lg" />
            <Skeleton className="w-24 h-8 rounded-lg" />
            <Skeleton className="w-24 h-8 rounded-lg" />
          </div>
        </div>
        
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex space-x-4 pb-4 w-max">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm flex-shrink-0 w-64">
                <Skeleton className="w-full h-40 rounded-t-xl" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">{t('home.nearbyPlaces', 'Nearby Places')}</h2>
        </div>
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {t('common.error', 'An error occurred')}
        </div>
      </section>
    );
  }

  const filteredPlaces = places && activeFilter !== "all" 
    ? places.filter(place => place.type === activeFilter)
    : places;

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">{t('home.nearbyPlaces', 'Nearby Places')}</h2>
        <div className="flex space-x-2 text-sm">
          <button 
            className={`py-1 px-3 rounded-lg font-medium ${activeFilter === "all" 
              ? "bg-primary text-white" 
              : "bg-white text-dark"}`}
            onClick={() => handleFilterChange("all")}
          >
            {t('places.all', 'All')}
          </button>
          <button 
            className={`py-1 px-3 rounded-lg font-medium ${activeFilter === "restaurant" 
              ? "bg-primary text-white" 
              : "bg-white text-dark"}`}
            onClick={() => handleFilterChange("restaurant")}
          >
            {t('places.restaurant', 'Restaurants')}
          </button>
          <button 
            className={`py-1 px-3 rounded-lg font-medium ${activeFilter === "playground" 
              ? "bg-primary text-white" 
              : "bg-white text-dark"}`}
            onClick={() => handleFilterChange("playground")}
          >
            {t('places.playground', 'Playgrounds')}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex space-x-4 pb-4 w-max">
          {filteredPlaces && filteredPlaces.length > 0 ? (
            filteredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <p className="text-gray-500 mb-2">{t('places.noPlacesFound', 'No places found')}</p>
              <Link href="/places">
                <button className="bg-primary text-white hover:bg-accent transition py-2 px-6 rounded-lg font-medium text-sm">
                  {t('places.viewAllPlaces', 'View all places')}
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default NearbyPlaces;
