import { useState, useEffect } from 'react';
import axios from 'axios';

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
  const [locationState, setLocationState] = useState<LocationState>({
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      console.log("[LOCATION] Starting geolocation request");
      
      if (!navigator.geolocation) {
        console.log("[LOCATION] Geolocation not supported");
        if (isMounted) {
          setLocationState({
            error: "Geolocation is not supported by your browser",
            isLoading: false
          });
        }
        return;
      }

      try {
        console.log("[LOCATION] Requesting position with enableHighAccuracy=true, timeout=10s");
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log("[LOCATION] Position obtained:", position.coords);
            const { latitude, longitude } = position.coords;
            
            try {
              // Get API key from server
              const keyResponse = await axios.get('/api/env');
              const apiKey = keyResponse.data.OPEN_WEATHER_API_KEY;
              
              // Use OpenWeatherMap reverse geocoding to get city name
              const response = await axios.get(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
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
              // In case geocoding fails, we still return the coordinates
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
            console.log("[LOCATION] Geolocation error:");
            console.log("[LOCATION] - Error code:", error.code);
            console.log("[LOCATION] - Error message:", error.message);
            console.log("[LOCATION] - PERMISSION_DENIED:", error.code === 1);
            console.log("[LOCATION] - POSITION_UNAVAILABLE:", error.code === 2);
            console.log("[LOCATION] - TIMEOUT:", error.code === 3);
            
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

  return locationState;
}
