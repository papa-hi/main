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

  const { data: events, isLoading, error } = useQuery<FamilyEvent[]>({
    queryKey: ['/api/events', locationState.latitude, locationState.longitude, activeFilter === "all" ? undefined : activeFilter],
  });

  const handleFilterChange = (filter: EventCategory) => {
    setActiveFilter(filter);
  };

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">Family Events Nearby</h2>
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
          <h2 className="text-xl font-heading font-bold">Family Events Nearby</h2>
        </div>
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {t('common.error', 'An error occurred')}
        </div>
      </section>
    );
  }

  const filteredEvents = events && activeFilter !== "all" 
    ? events.filter(event => event.category === activeFilter)
    : events;

  const eventCategories = [
    { value: "all", label: "All" },
    { value: "workshop", label: "Workshops" },
    { value: "festival", label: "Festivals" },
    { value: "outdoor", label: "Outdoor" },
    { value: "indoor", label: "Indoor" },
    { value: "educational", label: "Educational" },
    { value: "sports", label: "Sports" }
  ];

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">Family Events Nearby</h2>
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
          {filteredEvents && filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 min-w-full">
              <Calendar className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 mb-2">No events found nearby</p>
              <p className="text-sm text-gray-400">Check back later for upcoming family activities</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default NearbyEvents;
