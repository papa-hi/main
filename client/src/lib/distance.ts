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
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Calculate distance from user's location to a place
 */
export async function calculateDistanceToPlace(place: {
  latitude: string;
  longitude: string;
}): Promise<number> {
  try {
    const userLocation = await getCurrentLocation();
    const placeLocation: Location = {
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude),
    };
    
    return calculateDistance(userLocation, placeLocation);
  } catch (error) {
    console.warn('Could not get user location for distance calculation:', error);
    // Return a fallback distance if location access fails
    return 0;
  }
}