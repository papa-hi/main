// Track last geocoding request time to respect Nominatim's usage policy (1 req/sec)
let lastGeocodeTime = 0;

// Geocoding utility using Nominatim API
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (!address || address.trim() === '') return null;
    
    // Respect Nominatim's usage policy: max 1 request per second
    const now = Date.now();
    const timeSinceLastRequest = now - lastGeocodeTime;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    lastGeocodeTime = Date.now();
    
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=nl`;
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': `PaPa-Hi Family App (${environment}; papa-hi.com)`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.error(`[GEOCODE] Failed: HTTP ${response.status} for "${address}"`, errorText);
      return null;
    }
    
    const data = await response.json();

    if (data && data.length > 0) {
      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
      console.log(`[GEOCODE] Success: "${address}" -> ${result.latitude}, ${result.longitude}`);
      return result;
    } else {
      console.warn(`[GEOCODE] No results found for address: "${address}"`);
    }
  } catch (error) {
    console.error(`[GEOCODE] Error for "${address}":`, error);
  }
  return null;
}
