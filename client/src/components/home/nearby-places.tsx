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
  const { location: geoLocation } = useGeoLocation();
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

  const { data: places, isLoading, error } = useQuery<Place[]>({
    queryKey: ['/api/places/nearby', geoLocation?.latitude, geoLocation?.longitude, activeFilter],
  });

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
