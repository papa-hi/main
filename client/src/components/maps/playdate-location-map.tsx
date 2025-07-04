import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation as useGeoLocation } from "@/hooks/use-location";
import { useTranslation } from "react-i18next";

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const playdateIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#fff" stroke-width="2"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="9" cy="9" r="1" fill="#fff"/>
      <circle cx="15" cy="9" r="1" fill="#fff"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const userIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="#fff"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

interface PlaydateLocationMapProps {
  location: string;
  title: string;
  className?: string;
}

// Component to fit map bounds when both locations are available
function FitBounds({ playdateCoords, userCoords }: { 
  playdateCoords: [number, number] | null; 
  userCoords: [number, number] | null; 
}) {
  const map = useMap();
  
  useEffect(() => {
    if (playdateCoords && userCoords) {
      const bounds = L.latLngBounds([playdateCoords, userCoords]);
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (playdateCoords) {
      map.setView(playdateCoords, 14);
    }
  }, [map, playdateCoords, userCoords]);
  
  return null;
}

// Function to get coordinates from database or fallback to geocoding
async function getLocationCoordinates(location: string): Promise<[number, number] | null> {
  try {
    // First try to get coordinates from our database
    const response = await fetch(`/api/places/coordinates?location=${encodeURIComponent(location)}`);
    
    if (response.ok) {
      const data = await response.json();
      return [data.latitude, data.longitude];
    }
    
    // If not found in database, try geocoding as fallback
    const geocodeResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=nl`
    );
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData && geocodeData.length > 0) {
      const lat = parseFloat(geocodeData[0].lat);
      const lon = parseFloat(geocodeData[0].lon);
      return [lat, lon];
    }
  } catch (error) {
    console.error('Location lookup error:', error);
  }
  
  // Default to Amsterdam center if all fails
  return [52.3676, 4.9041];
}

// Calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
}

export function PlaydateLocationMap({ location, title, className = "h-64" }: PlaydateLocationMapProps) {
  const { t } = useTranslation();
  const { latitude: userLat, longitude: userLng } = useGeoLocation();
  const [playdateCoords, setPlaydateCoords] = useState<[number, number] | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    // Get playdate location coordinates
    const loadCoordinates = async () => {
      setIsGeocoding(true);
      const coords = await getLocationCoordinates(location);
      setPlaydateCoords(coords);
      setIsGeocoding(false);
    };
    
    loadCoordinates();
  }, [location]);

  useEffect(() => {
    // Set user coordinates when available
    if (userLat && userLng) {
      setUserCoords([userLat, userLng]);
    }
  }, [userLat, userLng]);

  useEffect(() => {
    // Calculate distance when both coordinates are available
    if (playdateCoords && userCoords) {
      const dist = calculateDistance(
        userCoords[0], userCoords[1],
        playdateCoords[0], playdateCoords[1]
      );
      setDistance(dist);
    }
  }, [playdateCoords, userCoords]);

  if (!playdateCoords || isGeocoding) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          {isGeocoding ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-gray-500">{t('playdate.loadingLocation', 'Loading location...')}</p>
            </>
          ) : (
            <p className="text-gray-500">{t('playdate.locationNotFound', 'Location not found')}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {distance && (
        <div className="flex items-center gap-2 text-sm">
          <i className="fas fa-route text-primary"></i>
          <span className="font-medium">
            {t('playdate.distanceFromYou', 'Distance from you: {{distance}}', { distance })}
          </span>
        </div>
      )}
      
      <div className={`${className} rounded-lg overflow-hidden border border-gray-200`}>
        <MapContainer
          center={playdateCoords}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Playdate location marker */}
          <Marker position={playdateCoords} icon={playdateIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-medium">{title}</div>
                <div className="text-sm text-gray-600">{location}</div>
              </div>
            </Popup>
          </Marker>
          
          {/* User location marker */}
          {userCoords && (
            <Marker position={userCoords} icon={userIcon}>
              <Popup>
                <div className="text-center">
                  <div className="font-medium">{t('common.yourLocation', 'Your Location')}</div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Auto-fit bounds */}
          <FitBounds playdateCoords={playdateCoords} userCoords={userCoords} />
        </MapContainer>
      </div>
    </div>
  );
}