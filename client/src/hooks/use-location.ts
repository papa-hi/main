import { useState, useEffect } from 'react';

interface LocationState {
  latitude?: number;
  longitude?: number;
  city?: string;
  error?: string;
  isLoading: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      if (!navigator.geolocation) {
        if (isMounted) {
          setLocation({
            error: "Geolocation is not supported by your browser",
            isLoading: false
          });
        }
        return;
      }

      try {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocoding to get city name
            // In a real app, this would call a geocoding API
            // For demo purposes, we'll use Amsterdam
            const city = "Amsterdam";
            
            if (isMounted) {
              setLocation({
                latitude,
                longitude,
                city,
                isLoading: false
              });
            }
          },
          (error) => {
            if (isMounted) {
              setLocation({
                error: error.message,
                isLoading: false
              });
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } catch (error) {
        if (isMounted) {
          setLocation({
            error: "Failed to get location",
            isLoading: false
          });
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return location;
}
