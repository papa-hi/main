// Accurate distance calculation utilities

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: Location,
  point2: Location
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1Rad = (point1.latitude * Math.PI) / 180;
  const lat2Rad = (point2.latitude * Math.PI) / 180;
  const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Get user's current location using browser geolocation API
 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false, // Use faster, less accurate location
        timeout: 30000, // Increase timeout to 30 seconds
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Geocode an address to get latitude and longitude coordinates
 */
export async function geocodeAddress(address: string): Promise<Location | null> {
  try {
    // Using OpenStreetMap Nominatim API for free geocoding
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Geocoding failed for address:', address, error);
    return null;
  }
}

/**
 * Calculate distance from user's location to a place using address
 */
export async function calculateDistanceToPlace(place: {
  latitude?: string;
  longitude?: string;
  address: string;
}): Promise<number> {
  try {
    const userLocation = await getCurrentLocation();
    let placeLocation: Location | null = null;
    
    // First try to use existing coordinates if they exist and are valid
    if (place.latitude && place.longitude) {
      const lat = parseFloat(place.latitude);
      const lon = parseFloat(place.longitude);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        placeLocation = { latitude: lat, longitude: lon };
      }
    }
    
    // If no valid coordinates, geocode the address
    if (!placeLocation && place.address) {
      placeLocation = await geocodeAddress(place.address);
    }
    
    if (!placeLocation) {
      console.warn('Could not get coordinates for place:', place);
      return 0;
    }
    
    const distance = calculateDistance(userLocation, placeLocation);
    
    // Check if calculated distance is valid
    if (isNaN(distance)) {
      console.warn('Distance calculation returned NaN:', { userLocation, placeLocation });
      return 0;
    }
    
    return distance;
  } catch (error) {
    console.warn('Could not calculate distance:', error);
    return 0;
  }
}