import { Place } from "@shared/schema";
import axios from "axios";

interface WeatherData {
  main: {
    temp: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
}

interface RecommendationQuery {
  latitude?: number;
  longitude?: number;
  userId?: number;
  withChildren?: boolean;
  maxDistance?: number;
  preferIndoor?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

interface ActivityRecommendation {
  place: Place;
  score: number;
  reasons: string[];
}

// Helper function to determine if a place is likely indoor based on type and features
function isLikelyIndoor(place: Place): boolean {
  // Check place type
  if (place.type === 'restaurant' || place.type === 'museum' || place.type === 'cafe') {
    return true;
  }
  
  // Check features for indoor indicators
  const features = place.features || [];
  return features.some(feature => 
    feature.toLowerCase().includes('indoor') || 
    feature.toLowerCase().includes('air conditioning') ||
    feature.toLowerCase().includes('heated')
  );
}

// Helper function to determine if a place is kid-friendly
function isKidFriendly(place: Place): boolean {
  // Playgrounds are always kid-friendly
  if (place.type === 'playground') {
    return true;
  }
  
  // Check features for kid-friendly indicators
  const features = place.features || [];
  return features.some(feature => 
    feature.toLowerCase().includes('kids') || 
    feature.toLowerCase().includes('children') ||
    feature.toLowerCase().includes('playground') ||
    feature.toLowerCase().includes('family')
  );
}

// Helper to extract tags from place data
function getPlaceTags(place: Place): string[] {
  const tags: string[] = [];
  
  // Base tags on type
  if (place.type === 'restaurant') {
    tags.push('food', 'dining');
    
    // Special tags for times of day
    if (place.name.toLowerCase().includes('breakfast') || 
        place.description?.toLowerCase().includes('breakfast')) {
      tags.push('breakfast');
    }
    
    if (place.name.toLowerCase().includes('lunch') || 
        place.description?.toLowerCase().includes('lunch')) {
      tags.push('lunch');
    }
    
    if (place.name.toLowerCase().includes('dinner') || 
        place.description?.toLowerCase().includes('dinner')) {
      tags.push('dinner');
    }
  }
  
  if (place.type === 'playground') {
    tags.push('outdoor', 'active', 'play');
  }
  
  // Extract tags from features
  (place.features || []).forEach(feature => {
    const f = feature.toLowerCase();
    
    if (f.includes('quiet') || f.includes('peace')) tags.push('quiet');
    if (f.includes('popular') || f.includes('busy')) tags.push('popular');
    if (f.includes('edu') || f.includes('learn')) tags.push('educational');
    if (f.includes('toddler')) tags.push('toddler-friendly');
    if (f.includes('teen')) tags.push('teen-friendly');
  });
  
  return tags;
}

export async function getRecommendations(
  places: Place[],
  query: RecommendationQuery
): Promise<ActivityRecommendation[]> {
  if (!places || places.length === 0) {
    return [];
  }

  // Get current weather if coordinates are provided
  let weatherData: WeatherData | null = null;
  if (query.latitude && query.longitude && process.env.OPEN_WEATHER_API_KEY) {
    try {
      const apiKey = process.env.OPEN_WEATHER_API_KEY;
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${query.latitude}&lon=${query.longitude}&units=metric&appid=${apiKey}`
      );
      weatherData = response.data;
      console.log('Weather data retrieved:', weatherData.weather[0].main);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  }

  // Score each place
  const recommendations = places.map(place => {
    let score = 50; // Base score
    const reasons: string[] = [];
    
    // Determine place properties from existing data
    const isIndoor = isLikelyIndoor(place);
    const kidFriendly = isKidFriendly(place);
    const tags = getPlaceTags(place);

    // Distance factor (if coordinates provided)
    if (query.latitude && query.longitude && place.latitude && place.longitude) {
      // Convert coordinates from string to number if needed
      const placeLat = typeof place.latitude === 'string' ? parseFloat(place.latitude) : place.latitude;
      const placeLon = typeof place.longitude === 'string' ? parseFloat(place.longitude) : place.longitude;
      
      if (!isNaN(placeLat) && !isNaN(placeLon)) {
        const distance = calculateDistance(
          query.latitude,
          query.longitude,
          placeLat,
          placeLon
        );
        
        // Reduce score for places far away
        if (distance > (query.maxDistance || 10)) {
          score -= Math.min(30, distance / 2);
          reasons.push(`Further away (${distance.toFixed(1)}km)`);
        } else {
          score += Math.max(10, 30 - distance * 2);
          reasons.push(`Close by (${distance.toFixed(1)}km)`);
        }
      }
    }

    // Weather considerations
    if (weatherData) {
      const temp = weatherData.main.temp;
      const weatherType = weatherData.weather[0].main.toLowerCase();
      const isRainy = weatherType.includes('rain') || weatherType.includes('shower');
      const isSnowy = weatherType.includes('snow');
      const isCloudy = weatherType.includes('cloud');
      const isClear = weatherType.includes('clear');
      
      // Indoor place bonus during bad weather
      if (isIndoor) {
        if (isRainy || isSnowy || temp < 5) {
          score += 25;
          reasons.push('Indoor activity perfect for current weather');
        } else if (query.preferIndoor) {
          score += 15;
          reasons.push('Indoor activity (preferred)');
        }
      } 
      // Outdoor place bonus during nice weather
      else {
        if (isClear && temp > 15 && temp < 30) {
          score += 20;
          reasons.push('Great weather for outdoor activity');
        } else if (isCloudy && temp > 10 && temp < 25) {
          score += 10;
          reasons.push('Decent weather for outdoor activity');
        } else if (isRainy || isSnowy || temp < 5 || temp > 32) {
          score -= 20;
          reasons.push('Weather not ideal for outdoor activity');
        }
      }
    }

    // Kid-friendly bonus
    if (kidFriendly && query.withChildren) {
      score += 20;
      reasons.push('Great for children');
    }

    // Time of day considerations
    if (query.timeOfDay) {
      // Restaurants get bonus in meal times
      if (place.type === 'restaurant') {
        if (query.timeOfDay === 'morning' && tags.includes('breakfast')) {
          score += 15;
          reasons.push('Great for breakfast');
        }
        if (query.timeOfDay === 'afternoon' && tags.includes('lunch')) {
          score += 15;
          reasons.push('Great for lunch');
        }
        if (query.timeOfDay === 'evening' && tags.includes('dinner')) {
          score += 15;
          reasons.push('Great for dinner');
        }
      }
      
      // Playgrounds get bonus during daylight
      if (place.type === 'playground' && (query.timeOfDay === 'morning' || query.timeOfDay === 'afternoon')) {
        score += 10;
        reasons.push('Perfect time for playground');
      }
    }

    // Tags-based scoring
    if (tags.includes('popular')) {
      score += 10;
      reasons.push('Popular destination');
    }
    
    if (tags.includes('quiet') && query.withChildren) {
      score += 5;
      reasons.push('Quiet environment good for families');
    }
    
    if (tags.includes('educational') && query.withChildren) {
      score += 10;
      reasons.push('Educational activity for children');
    }
    
    return {
      place,
      score: Math.min(100, Math.max(0, score)), // Clamp between 0-100
      reasons
    };
  });

  // Sort by score (highest first)
  return recommendations.sort((a, b) => b.score - a.score);
}

// Calculate distance between two coordinates in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function degToRad(deg: number): number {
  return deg * (Math.PI/180);
}

// Determine current time of day based on hour
export function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}