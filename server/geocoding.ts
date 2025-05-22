import axios from 'axios';

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

const geocodeCache = new Map<string, GeocodeResult>();

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  // Check cache first
  if (geocodeCache.has(address)) {
    console.log(`[GEOCODING] Cache hit for: ${address}`);
    return geocodeCache.get(address)!;
  }

  try {
    // Use OpenWeatherMap's geocoding API
    const apiKey = process.env.OPEN_WEATHER_API_KEY;
    if (!apiKey) {
      console.warn('[GEOCODING] OPEN_WEATHER_API_KEY not available for geocoding');
      return null;
    }

    const query = `${address}, Netherlands`;
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`;
    console.log(`[GEOCODING] Requesting: ${address} -> ${query}`);
    
    const response = await axios.get(url, { timeout: 5000 });

    if (response.data && response.data.length > 0) {
      const result = {
        latitude: response.data[0].lat,
        longitude: response.data[0].lon
      };
      
      console.log(`[GEOCODING] Success: ${address} -> (${result.latitude}, ${result.longitude})`);
      
      // Cache the result
      geocodeCache.set(address, result);
      return result;
    } else {
      console.log(`[GEOCODING] No results for: ${address}`);
    }
  } catch (error) {
    console.error(`[GEOCODING] Error for ${address}:`, error.message);
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