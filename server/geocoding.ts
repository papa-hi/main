import axios from 'axios';

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

const geocodeCache = new Map<string, GeocodeResult>();

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  try {
    // Use OpenWeatherMap's geocoding API
    const apiKey = process.env.OPEN_WEATHER_API_KEY;
    if (!apiKey) {
      console.warn('OPEN_WEATHER_API_KEY not available for geocoding');
      return null;
    }

    const response = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address + ', Netherlands')}&limit=1&appid=${apiKey}`
    );

    if (response.data && response.data.length > 0) {
      const result = {
        latitude: response.data[0].lat,
        longitude: response.data[0].lon
      };
      
      // Cache the result
      geocodeCache.set(address, result);
      return result;
    }
  } catch (error) {
    console.error('Geocoding error for address:', address, error);
  }

  return null;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula for accurate distance calculation
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}