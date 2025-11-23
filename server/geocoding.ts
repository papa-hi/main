// Track last geocoding request time to respect Nominatim's usage policy (1 req/sec)
let lastGeocodeTime = 0;

async function makeGeocodeRequest(query: string): Promise<any[] | null> {
  // Respect Nominatim's usage policy: max 1 request per second
  const now = Date.now();
  const timeSinceLastRequest = now - lastGeocodeTime;
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
  }
  lastGeocodeTime = Date.now();
  
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const userAgent = `PaPa-Hi Family App (${environment}; contact: papa-hi.com)`;
  const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=3&countrycodes=nl`;
  
  console.log(`[GEOCODE] Request: "${query}" with User-Agent: "${userAgent}"`);
  
  const response = await fetch(geocodeUrl, {
    headers: {
      'User-Agent': userAgent
    }
  });
  
  console.log(`[GEOCODE] Response status: ${response.status} for "${query}"`);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error');
    console.error(`[GEOCODE] HTTP ${response.status} for "${query}"`);
    console.error(`[GEOCODE] Error details:`, errorText);
    console.error(`[GEOCODE] User-Agent used:`, userAgent);
    console.error(`[GEOCODE] URL:`, geocodeUrl);
    return null;
  }
  
  const data = await response.json();
  console.log(`[GEOCODE] Got ${data?.length || 0} results for "${query}"`);
  
  if (!data || data.length === 0) {
    console.warn(`[GEOCODE] Empty results from Nominatim for "${query}"`);
    console.warn(`[GEOCODE] This might mean the address is not in OpenStreetMap database`);
  }
  
  return data;
}

// Geocoding utility using Nominatim API with fallback strategies for Netherlands addresses
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (!address || address.trim() === '') return null;
    
    const cleanAddress = address.trim();
    
    // Try the full address first
    let data = await makeGeocodeRequest(cleanAddress);
    
    if (!data || data.length === 0) {
      // Fallback strategy 1: Try without house number suffix (e.g., "2A" -> "2")
      const withoutSuffix = cleanAddress.replace(/(\d+)[A-Za-z]+\b/, '$1');
      if (withoutSuffix !== cleanAddress) {
        console.log(`[GEOCODE] Retry without suffix: "${withoutSuffix}"`);
        data = await makeGeocodeRequest(withoutSuffix);
      }
    }
    
    if (!data || data.length === 0) {
      // Fallback strategy 2: Try with just street name and postal code/city
      const parts = cleanAddress.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        // Get street name (first part) and city/postal (last part)
        const streetPart = parts[0].replace(/\d.*/, '').trim(); // Remove house number
        const cityPart = parts[parts.length - 1];
        const broadSearch = `${streetPart}, ${cityPart}`;
        
        if (broadSearch !== cleanAddress) {
          console.log(`[GEOCODE] Retry with broad search: "${broadSearch}"`);
          data = await makeGeocodeRequest(broadSearch);
        }
      }
    }
    
    if (!data || data.length === 0) {
      // Fallback strategy 3: Try just the postal code and city
      const postalMatch = cleanAddress.match(/\d{4}\s*[A-Z]{2}/i);
      if (postalMatch) {
        const postalSearch = postalMatch[0];
        console.log(`[GEOCODE] Retry with postal code: "${postalSearch}"`);
        data = await makeGeocodeRequest(postalSearch);
      }
    }

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
