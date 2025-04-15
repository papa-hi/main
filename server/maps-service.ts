import axios from 'axios';
import { Place } from '@shared/schema';

interface OverpassNode {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    description?: string;
    leisure?: string;
    access?: string;
    address?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:postcode"?: string;
    "addr:city"?: string;
  };
}

interface OverpassResponse {
  elements: OverpassNode[];
}

export async function fetchNearbyPlaygrounds(lat: number, lon: number, radius: number = 5000): Promise<Place[]> {
  try {
    // Build Overpass query for playgrounds within the radius
    const query = `
      [out:json];
      (
        node["leisure"="playground"](around:${radius},${lat},${lon});
        way["leisure"="playground"](around:${radius},${lat},${lon});
        relation["leisure"="playground"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      query,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const data: OverpassResponse = response.data;
    
    // Convert OpenStreetMap data to our Place format
    const playgrounds: Place[] = data.elements
      .filter(element => element.lat && element.lon)
      .map((element, index) => {
        // Calculate distance (approximate)
        const distance = calculateDistance(lat, lon, element.lat, element.lon);
        
        // Format address from OSM tags
        let address = '';
        if (element.tags?.address) {
          address = element.tags.address;
        } else if (element.tags?.["addr:street"]) {
          address = `${element.tags["addr:street"]} ${element.tags["addr:housenumber"] || ''}, ${element.tags["addr:city"] || ''}`;
        }

        return {
          id: element.id,
          name: element.tags?.name || `Playground ${index + 1}`,
          type: 'playground',
          description: element.tags?.description || 'A community playground.',
          address,
          latitude: element.lat.toString(),
          longitude: element.lon.toString(),
          imageUrl: "https://images.unsplash.com/photo-1680099567302-d1e26339a2ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80",
          rating: Math.floor(Math.random() * 10) + 40, // Random rating between 40-50
          reviewCount: Math.floor(Math.random() * 100) + 50, // Random review count
          features: element.tags?.access === 'public' ? ["Public access"] : [],
          createdAt: new Date(),
          distance,
          isSaved: false
        };
      });

    return playgrounds;
  } catch (error) {
    console.error('Error fetching playgrounds from OpenStreetMap:', error);
    return [];
  }
}

// Calculate distance between two coordinates in meters using the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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