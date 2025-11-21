import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FamilyEvent } from "@shared/schema";
import { EventCard } from "../shared/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/hooks/use-location";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";

type EventCategory = "all" | "workshop" | "festival" | "outdoor" | "indoor" | "educational" | "sports";

export function NearbyEvents() {
  const locationState = useLocation();
  const [activeFilter, setActiveFilter] = useState<EventCategory>("all");
  const { t } = useTranslation();

  // Build query string with location and category parameters
  const eventsUrl = (() => {
    const params = new URLSearchParams();
    if (locationState.latitude) params.append('latitude', locationState.latitude.toString());
    if (locationState.longitude) params.append('longitude', locationState.longitude.toString());
    if (activeFilter !== "all") params.append('category', activeFilter);
    params.append('upcoming', 'true'); // Only show upcoming events
    
    const queryString = params.toString();
    return queryString ? `/api/events?${queryString}` : '/api/events?upcoming=true';
  })();

  const { data: events, isLoading, error} = useQuery<FamilyEvent[]>({
    queryKey: ['/api/events', locationState.latitude, locationState.longitude, activeFilter],
    queryFn: async () => {
      const res = await fetch(eventsUrl, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    }
  });

  const handleFilterChange = (filter: EventCategory) => {
    setActiveFilter(filter);
  };

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">{t('events.familyEventsNearby')}</h2>
          <div className="flex space-x-2 text-sm">
            <Skeleton className="w-16 h-8 rounded-lg" />
            <Skeleton className="w-24 h-8 rounded-lg" />
            <Skeleton className="w-24 h-8 rounded-lg" />
          </div>
        </div>
        
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex space-x-4 pb-4 w-max">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm flex-shrink-0 w-80">
                <Skeleton className="w-full h-48 rounded-t-xl" />
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
          <h2 className="text-xl font-heading font-bold">{t('events.familyEventsNearby')}</h2>
        </div>
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {t('common.error', 'An error occurred')}
        </div>
      </section>
    );
  }

  const eventCategories = [
    { value: "all", label: t('events.categories.all') },
    { value: "workshop", label: t('events.categories.workshop') },
    { value: "festival", label: t('events.categories.festival') },
    { value: "outdoor", label: t('events.categories.outdoor') },
    { value: "indoor", label: t('events.categories.indoor') },
    { value: "educational", label: t('events.categories.educational') },
    { value: "sports", label: t('events.categories.sports') }
  ];

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">{t('events.familyEventsNearby')}</h2>
        <div className="flex overflow-x-auto scrollbar-hide space-x-2 text-sm">
          {eventCategories.map(cat => (
            <button 
              key={cat.value}
              className={`py-1 px-3 rounded-lg font-medium whitespace-nowrap ${activeFilter === cat.value 
                ? "bg-primary text-white" 
                : "bg-white text-dark"}`}
              onClick={() => handleFilterChange(cat.value as EventCategory)}
              data-testid={`button-filter-${cat.value}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex space-x-4 pb-4 w-max">
          {events && events.length > 0 ? (
            events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 min-w-full">
              <Calendar className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 mb-2">{t('events.noEventsNearby')}</p>
              <p className="text-sm text-gray-400">{t('events.checkBackLater')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default NearbyEvents;
