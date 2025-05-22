import { useState, useEffect } from 'react';
import { calculateDistanceToPlace, formatDistance } from '@/lib/distance';

interface Place {
  latitude: string;
  longitude: string;
}

export function useDistance(place: Place) {
  const [distance, setDistance] = useState<string>('...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function calculateDistance() {
      try {
        setIsLoading(true);
        const distanceKm = await calculateDistanceToPlace(place);
        
        if (!isCancelled) {
          if (distanceKm === 0) {
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