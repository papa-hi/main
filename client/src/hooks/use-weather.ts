import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from './use-location';
import { useAppConfig } from './use-app-config';

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
  const { weatherApiKey, isLoading: configLoading } = useAppConfig();
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
      if (locationLoading || configLoading) return;

      if (locationError || !latitude || !longitude) {
        if (isMounted) {
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

      if (!weatherApiKey) {
        if (isMounted) {
          setWeatherData({
            temperature: 18,
            condition: "Clear",
            icon: "01d",
            city: city || "Amsterdam",
            country: country || "NL",
            isLoading: false,
            error: "Weather API key not configured"
          });
        }
        return;
      }

      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${weatherApiKey}`
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
    return () => { isMounted = false; };
  }, [latitude, longitude, city, country, locationLoading, locationError, weatherApiKey, configLoading]);

  return weatherData;
}
