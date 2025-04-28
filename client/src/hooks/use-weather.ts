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

    const fetchWeather = async () => {
      if (locationLoading || locationError || !latitude || !longitude) {
        if (!locationLoading && (locationError || !latitude || !longitude)) {
          setWeatherData(prev => ({
            ...prev,
            isLoading: false,
            error: locationError || "Location not available"
          }));
        }
        return;
      }

      try {
        const apiKey = process.env.OPEN_WEATHER_API_KEY;
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
        );

        if (isMounted && response.data) {
          const { main, weather, name } = response.data;
          
          setWeatherData({
            temperature: Math.round(main.temp),
            condition: weather[0].main,
            icon: weather[0].icon,
            city: city || name || "Unknown",
            country: country || "",
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        if (isMounted) {
          setWeatherData(prev => ({
            ...prev,
            isLoading: false,
            error: "Failed to fetch weather data"
          }));
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