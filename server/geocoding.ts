// Geocoding utility using Nominatim API
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (!address || address.trim() === '') return null;
    
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=nl`;
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'PaPa-Hi Family App (development)'
      }
    });
    
    if (!response.ok) {
      console.error(`Geocoding failed: HTTP ${response.status} for address: ${address}`);
      return null;
    }
    
    const data = await response.json();

    if (data && data.length > 0) {
      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
      console.log(`Geocoded "${address}" to coordinates: ${result.latitude}, ${result.longitude}`);
      return result;
    }
  } catch (error) {
    console.error(`[GEOCODE] Error:`, error);
  }
  return null;
}
