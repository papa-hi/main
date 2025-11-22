import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function LocationMapPreview({ location }: { location: string }) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const geocode = async () => {
      if (!location || location.trim() === '') {
        setCoordinates(null);
        setError(null);
        return;
      }

      setIsGeocoding(true);
      setError(null);

      try {
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(location)}`);
        
        if (!response.ok) {
          throw new Error('Geocoding failed');
        }

        const data = await response.json();
        
        if (!isCancelled && data && data.latitude && data.longitude) {
          setCoordinates({ lat: data.latitude, lon: data.longitude });
          setError(null);
        } else {
          throw new Error('Invalid coordinates');
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Geocoding error:', err);
          setCoordinates(null);
          setError('Could not geocode this location. Please verify the address.');
        }
      } finally {
        if (!isCancelled) {
          setIsGeocoding(false);
        }
      }
    };

    // Debounce geocoding by 1 second
    const timeoutId = setTimeout(geocode, 1000);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [location]);

  if (!location || location.trim() === '') {
    return (
      <div className="h-48 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center" data-testid="map-preview-empty">
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm" data-testid="text-map-preview-placeholder">Enter a location to see map preview</p>
        </div>
      </div>
    );
  }

  if (isGeocoding) {
    return (
      <div className="h-48 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center" data-testid="map-preview-loading">
        <div className="text-center text-gray-500">
          <Loader2 className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p className="text-sm" data-testid="text-map-preview-geocoding">Geocoding location...</p>
        </div>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="h-48 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center" data-testid="map-preview-error">
        <div className="text-center text-red-600">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-medium" data-testid="text-map-preview-error">Location not found</p>
          <p className="text-xs mt-1" data-testid="text-map-preview-error-message">{error || 'Please verify the address'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-48 rounded-lg overflow-hidden border border-green-200" data-testid="map-preview-success">
      <MapContainer
        center={[coordinates.lat, coordinates.lon]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        data-testid="map-preview-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coordinates.lat, coordinates.lon]}>
          <Popup>
            <div className="text-center">
              <p className="text-sm font-semibold" data-testid="text-map-location">{location}</p>
              <p className="text-xs text-gray-600" data-testid="text-map-coordinates">
                {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
