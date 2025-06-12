import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { CreatePlaydateForm } from "@/components/playdates/create-playdate-form";

interface Place {
  id: number;
  name: string;
  type: string;
  description?: string;
  address?: string;
  latitude: string;
  longitude: string;
}

export default function CreatePage() {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  
  // Extract place ID from URL parameters
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const placeId = searchParams.get('place');
  
  // Fetch place data if placeId is provided
  const { data: place } = useQuery<Place>({
    queryKey: ['/api/places', placeId],
    queryFn: async () => {
      if (!placeId) return null;
      const response = await fetch(`/api/places/${placeId}`);
      if (!response.ok) throw new Error('Failed to fetch place');
      return response.json();
    },
    enabled: !!placeId,
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="py-2">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  // Prepare default values from place data
  const defaultLocation = place ? 
    `${place.name}${place.address ? `, ${place.address}` : ''}` : 
    undefined;
  
  const defaultLatitude = place ? parseFloat(place.latitude) : undefined;
  const defaultLongitude = place ? parseFloat(place.longitude) : undefined;



  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">
          {place ? 
            t('playdates.createPlaydateAt', 'Create Playdate at {{placeName}}', { placeName: place.name }) :
            t('playdates.createPlaydate', 'Create New Playdate')
          }
        </h1>
        <p className="text-muted-foreground">
          {t('playdates.createPlaydateDesc', 'Plan een speelafspraak met andere vaders en kinderen')}
        </p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <CreatePlaydateForm 
          defaultLocation={defaultLocation}
          defaultLatitude={defaultLatitude}
          defaultLongitude={defaultLongitude}
          onSuccess={() => navigate("/playdates")}
        />
      </div>
    </div>
  );
}