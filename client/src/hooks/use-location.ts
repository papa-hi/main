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
    console.log("Location hook initialized");

    const getLocation = async () => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.log("Geolocation not supported by this browser");
        if (isMounted) {
          setLocationState({
            error: "Geolocation is not supported by your browser",
            isLoading: false
          });
        }
        return;
      }

      // Fallback values in case geolocation is denied
      const fallbackLocation = {
        latitude: 52.3676,  // Amsterdam coordinates as fallback
        longitude: 4.9041,
        city: "Amsterdam",
        country: "NL",
        isLoading: false
      };

      try {
        console.log("Requesting geolocation permission...");
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log("Geolocation permission granted");
            const { latitude, longitude } = position.coords;
            console.log(`Location obtained: ${latitude}, ${longitude}`);
            
            try {
              // Get API key from server
              console.log("Fetching API key from server");
              const keyResponse = await axios.get('/api/env');
              const apiKey = keyResponse.data.OPEN_WEATHER_API_KEY;
              console.log("API key retrieved successfully");
              
              // Use OpenWeatherMap reverse geocoding to get city name
              console.log("Fetching city name from coordinates...");
              const response = await axios.get(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
              );
              
              let city = "Unknown";
              let country = "";
              
              if (response.data && response.data.length > 0) {
                city = response.data[0].name;
                country = response.data[0].country;
                console.log(`City name found: ${city}, ${country}`);
              } else {
                console.log("No city data found in API response");
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
            console.log("Geolocation permission denied or error:", error.message);
            // If user denied permission, use fallback location
            if (isMounted) {
              console.log("Using fallback location (Amsterdam)");
              setLocationState(fallbackLocation);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } catch (error) {
        console.error("Unexpected error in geolocation request:", error);
        if (isMounted) {
          // Use fallback location on error
          console.log("Using fallback location after error");
          setLocationState(fallbackLocation);
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
