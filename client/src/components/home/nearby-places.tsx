import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Place } from "@shared/schema";
import { PlaceCard } from "../shared/place-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation as useGeoLocation } from "@/hooks/use-location";
import { useTranslation } from "react-i18next";

type PlaceType = "all" | "restaurant" | "playground" | "museum";

export function NearbyPlaces() {
  const [location] = useLocation();
  const locationState = useGeoLocation();
  const [activeFilter, setActiveFilter] = useState<PlaceType>("all");
  const { t } = useTranslation();
  
  useEffect(() => {
    if (location.includes("type=restaurant")) {
      setActiveFilter("restaurant");
    } else if (location.includes("type=playground")) {
      setActiveFilter("playground");
    }
  }, [location]);

  const queryUrl = `/api/places/nearby?latitude=${locationState.latitude}&longitude=${locationState.longitude}&activeFilter=${activeFilter}`;
  
  const { data: places, isLoading, error } = useQuery<Place[]>({
    queryKey: [queryUrl],
  });

  const handleFilterChange = (filter: PlaceType) => setActiveFilter(filter);

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
              <div key={i} className="bg-card rounded-xl shadow-sm flex-shrink-0 w-64">
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

  const filterButtons: { value: PlaceType; label: string }[] = [
    { value: "all", label: t('places.all', 'All') },
    { value: "restaurant", label: t('places.restaurant', 'Restaurants') },
    { value: "playground", label: t('places.playground', 'Playgrounds') },
    { value: "museum", label: t('places.museum', 'Museums') },
  ];

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">{t('home.nearbyPlaces', 'Nearby Places')}</h2>
        <div className="flex space-x-2 text-sm">
          {filterButtons.map(({ value, label }) => (
            <button
              key={value}
              className={`py-1 px-3 rounded-lg font-medium ${activeFilter === value
                ? "bg-primary text-white"
                : "bg-muted text-foreground"}`}
              onClick={() => handleFilterChange(value)}
            >
              {label}
            </button>
          ))}
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
              <p className="text-muted-foreground mb-2">{t('places.noPlacesFound', 'No places found')}</p>
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
