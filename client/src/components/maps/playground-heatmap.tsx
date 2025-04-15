import { useEffect, useRef, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Place } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/use-location';
import { useTranslation } from 'react-i18next';

// Fix marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Playground icon
const playgroundIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/5264/5264078.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Component to update map center when user location changes
function SetViewOnLocationChange({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (coords) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  
  return null;
}

// Component to create and update heatmap
function HeatmapLayer({ points }: { points: number[][] }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);
  
  useEffect(() => {
    if (!map) return;

    // Remove existing heatmap layer if it exists
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }
    
    // Create new heatmap layer with playground points
    if (points.length > 0) {
      // @ts-ignore - leaflet.heat type issue
      heatLayerRef.current = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
      }).addTo(map);
    }
    
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);
  
  return null;
}

interface PlaygroundHeatmapProps {
  className?: string;
}

export function PlaygroundHeatmap({ className = '' }: PlaygroundHeatmapProps) {
  const { t } = useTranslation();
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.3676, 4.9041]); // Default: Amsterdam
  const { latitude, longitude } = useLocation();
  const [locationAvailable, setLocationAvailable] = useState(false);
  
  // Fetch all playgrounds from the API
  const { data: places = [], isLoading: placesLoading } = useQuery<Place[]>({
    queryKey: ['/api/places/search', { type: 'playground' }],
  });
  
  // Generate points for the heatmap
  const heatmapPoints = places
    .filter(place => place.type === 'playground')
    .map(place => {
      if (place.latitude && place.longitude) {
        // Ensure latitude and longitude are numbers
        const lat = typeof place.latitude === 'string' ? parseFloat(place.latitude) : place.latitude;
        const lng = typeof place.longitude === 'string' ? parseFloat(place.longitude) : place.longitude;
        return [lat, lng, 0.5]; // 0.5 is the intensity
      }
      return null;
    })
    .filter((point): point is number[] => point !== null);
  
  // Update map center when user location is available
  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setLocationAvailable(true);
    }
  }, [latitude, longitude]);
  
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
        <h2 className="text-lg font-bold mb-2">{t('playgroundMap.title', 'Playground Heatmap')}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('playgroundMap.description', 'Discover playgrounds and their popularity in your area')}
        </p>
        
        {!locationAvailable && (
          <Button 
            onClick={() => navigator.geolocation.getCurrentPosition(
              pos => {
                setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                setLocationAvailable(true);
              },
              err => console.error('Error getting location:', err)
            )}
            variant="outline"
            className="mb-4"
          >
            <i className="fas fa-location-arrow mr-2"></i>
            {t('places.useMyLocation', 'Use My Location')}
          </Button>
        )}
      </div>
      
      <div className="rounded-xl overflow-hidden shadow-md h-[500px] relative">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Update map center when user location changes */}
          <SetViewOnLocationChange coords={latitude && longitude ? [latitude, longitude] : null} />
          
          {/* Add heatmap layer */}
          <HeatmapLayer points={heatmapPoints} />
          
          {/* Add markers for each playground */}
          {places
            .filter(place => place.type === 'playground')
            .map(place => {
              // Ensure latitude and longitude are numbers
              const lat = typeof place.latitude === 'string' ? parseFloat(place.latitude) : place.latitude;
              const lng = typeof place.longitude === 'string' ? parseFloat(place.longitude) : place.longitude;
              
              // Only render markers with valid coordinates
              return (lat && lng) ? (
                <Marker 
                  key={place.id} 
                  position={[lat, lng]}
                  icon={playgroundIcon}
                >
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-medium text-base">{place.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {place.description ? place.description.substring(0, 100) + '...' : t('common.noDescription', 'No description available.')}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <i className="fas fa-map-marker-alt text-primary"></i>
                        <span>{place.address || t('common.noAddress', 'No address')}</span>
                      </div>
                      <Button 
                        className="mt-2 w-full text-xs"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                        }}
                      >
                        <i className="fas fa-directions mr-1"></i>
                        {t('common.directions', 'Directions')}
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ) : null;
            })}
          
          {/* Add marker for user location */}
          {latitude && longitude && (
            <Marker position={[latitude, longitude]}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-medium">{t('places.yourLocation', 'Your Location')}</h3>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}