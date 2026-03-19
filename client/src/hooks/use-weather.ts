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

const AMSTERDAM_FALLBACK: WeatherData = {
  temperature: 18,
  condition: "Clear",
  icon: "01d",
  city: "Amsterdam",
  country: "NL",
  isLoading: false,
};

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
      if (locationLoading) return;

      if (locationError || !latitude || !longitude) {
        if (isMounted) setWeatherData(AMSTERDAM_FALLBACK);
        return;
      }

      try {
        const response = await axios.get(
          `/api/weather?lat=${latitude}&lon=${longitude}`
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
          setWeatherData({
            ...AMSTERDAM_FALLBACK,
            city: city || "Amsterdam",
            country: country || "NL",
            error: "Unable to fetch current weather"
          });
        }
      }
    };

    fetchWeather();
    return () => { isMounted = false; };
  }, [latitude, longitude, city, country, locationLoading, locationError]);

  return weatherData;
}
