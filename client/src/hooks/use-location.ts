import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppConfig } from './use-app-config';

interface LocationState {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  error?: string;
  isLoading: boolean;
}

interface LocationHookReturn {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  error?: string;
  isLoading: boolean;
}

export function useLocation(): LocationHookReturn {
  const { weatherApiKey, isLoading: configLoading } = useAppConfig();
  const [locationState, setLocationState] = useState<LocationState>({
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;

    if (configLoading) return;

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
            
            if (!weatherApiKey) {
              if (isMounted) {
                setLocationState({
                  latitude,
                  longitude,
                  city: "Unknown",
                  isLoading: false
                });
              }
              return;
            }

            try {
              const response = await axios.get(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${weatherApiKey}`
              );
              
              let city = "Unknown";
              let country = "";
              
              if (response.data && response.data.length > 0) {
                city = response.data[0].name;
                country = response.data[0].country;
              }
              
              if (isMounted) {
                setLocationState({
                  latitude,
                  longitude,
                  city,
                  country,
                  isLoading: false
                });
              }
            } catch (geocodeError) {
              console.error("Geocoding error:", geocodeError);
              if (isMounted) {
                setLocationState({
                  latitude,
                  longitude,
                  city: "Unknown",
                  isLoading: false
                });
              }
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
    return () => { isMounted = false; };
  }, [weatherApiKey, configLoading]);

  return locationState;
}
