import { useState, useEffect } from 'react';
import { calculateDistanceToPlace, formatDistance } from '@/lib/distance';

interface Place {
  latitude?: string;
  longitude?: string;
  address: string;
}

export function useDistance(place: Place) {
  const [distance, setDistance] = useState<string>('...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function calculateDistance() {
      try {
        setIsLoading(true);
        
        // Debug: log the coordinates we're working with
        console.log('Calculating distance for place:', {
          latitude: place.latitude,
          longitude: place.longitude,
          latType: typeof place.latitude,
          lonType: typeof place.longitude
        });
        
        const distanceKm = await calculateDistanceToPlace(place);
        
        console.log('Distance calculation result:', distanceKm, 'km');
        
        if (!isCancelled) {
          if (distanceKm === 0) {
            setDistance('Location unavailable');
          } else if (isNaN(distanceKm)) {
            console.warn('Distance is NaN, setting fallback');
            setDistance('Location unavailable');
          } else {
            setDistance(formatDistance(distanceKm));
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.warn('Distance calculation failed:', error);
          setDistance('Location unavailable');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    calculateDistance();

    return () => {
      isCancelled = true;
    };
  }, [place.latitude, place.longitude]);

  return { distance, isLoading };
}