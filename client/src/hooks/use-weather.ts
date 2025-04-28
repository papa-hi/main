import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from './use-location';

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  city: string;
  country: string;
  isLoading: boolean;
  error?: string;
}

export function useWeather(): WeatherData {
  const { latitude, longitude, city, country, error: locationError, isLoading: locationLoading } = useLocation();
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 0,
    condition: '',
    icon: '',
    city: '',
    country: '',
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;
    console.log("Weather hook initialized with location data:", { latitude, longitude, city, country });

    const fetchWeather = async () => {
      // Wait for location data or use fallback
      if (locationLoading) {
        console.log("Location still loading, waiting...");
        return; // Wait for location to resolve
      }
      
      // Handle location errors
      if (locationError || !latitude || !longitude) {
        console.log("Location error or coordinates missing:", locationError);
        if (isMounted) {
          // Use Amsterdam fallback weather for testing when location fails
          setWeatherData({
            temperature: 18,
            condition: "Clear",
            icon: "01d",
            city: "Amsterdam",
            country: "NL",
            isLoading: false
          });
        }
        return;
      }

      try {
        // Get API key from server
        console.log("Fetching API key for weather");
        const keyResponse = await axios.get('/api/env');
        const apiKey = keyResponse.data.OPEN_WEATHER_API_KEY;
        console.log("Successfully retrieved API key for weather");
        
        // Fetch weather data
        console.log(`Fetching weather data for coordinates: ${latitude}, ${longitude}`);
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
        );
        console.log("Weather data received:", response.data);

        if (isMounted && response.data) {
          const { main, weather, name } = response.data;
          
          // Build weather data object
          const weatherObj = {
            temperature: Math.round(main.temp),
            condition: weather[0].main,
            icon: weather[0].icon,
            city: city || name || "Unknown",
            country: country || "",
            isLoading: false
          };
          
          console.log("Setting weather data:", weatherObj);
          setWeatherData(weatherObj);
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        if (isMounted) {
          // Use fallback weather data on error
          console.log("Using fallback weather data due to error");
          setWeatherData({
            temperature: 18,
            condition: "Clear",
            icon: "01d",
            city: city || "Amsterdam",
            country: country || "NL",
            isLoading: false,
            error: "Unable to fetch current weather"
          });
        }
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, city, country, locationLoading, locationError]);

  return weatherData;
}