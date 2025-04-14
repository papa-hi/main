import { useState, useEffect } from 'react';

interface LocationState {
  latitude?: number;
  longitude?: number;
  city?: string;
  error?: string;
  isLoading: boolean;
}

export function useLocation() {
  const [locationState, setLocationState] = useState<LocationState>({
    isLoading: true
  });
  
  // For backward compatibility with existing components
  const location = {
    latitude: locationState.latitude,
    longitude: locationState.longitude,
    city: locationState.city
  };

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      if (!navigator.geolocation) {
        if (isMounted) {
          setLocationState({
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
              setLocationState({
                latitude,
                longitude,
                city,
                isLoading: false
              });
            }
          },
          (error) => {
            if (isMounted) {
              setLocationState({
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
          setLocationState({
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
