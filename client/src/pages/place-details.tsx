import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Phone, Globe, Users } from "lucide-react";
import { useLocation } from "wouter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Place {
  id: number;
  name: string;
  type: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  features?: string[];
  createdBy?: number;
  createdAt?: string;
}

interface Rating {
  averageRating: number;
  totalRatings: string;
}

export default function PlaceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: place, isLoading: placeLoading, error: placeError } = useQuery<Place>({
    queryKey: ['/api/places', id],
    queryFn: async () => {
      const response = await fetch(`/api/places/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }
      return response.json();
    },
    enabled: !!id,
  });

  const { data: rating } = useQuery<Rating>({
    queryKey: ['/api/places', id, 'rating'],
    queryFn: async () => {
      const response = await fetch(`/api/places/${id}/rating`);
      if (!response.ok) {
        throw new Error('Failed to fetch rating');
      }
      return response.json();
    },
    enabled: !!id,
  });

  if (placeLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (placeError || !place) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{t('common.error', 'Error')}</h2>
              <p className="text-gray-600 mb-4">
                {t('places.placeNotFound', 'Place not found or could not be loaded.')}
              </p>
              <Button onClick={() => setLocation('/places')}>
                {t('common.goBack', 'Go Back')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPlaceTypeIcon = (type: string) => {
    switch (type) {
      case 'playground':
        return '🏛️';
      case 'restaurant':
        return '🍽️';
      case 'museum':
        return '🏛️';
      default:
        return '📍';
    }
  };

  const getPlaceTypeLabel = (type: string) => {
    switch (type) {
      case 'playground':
        return t('places.playground', 'Playground');
      case 'restaurant':
        return t('places.restaurant', 'Restaurant');
      case 'museum':
        return t('places.museum', 'Museum');
      default:
        return type;
    }
  };

  const getFeatureTranslation = (feature: string, type: string) => {
    return t(`places.${type}Features.${feature}`, feature);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 20); // Convert 0-100 to 0-5
    const hasHalfStar = (rating % 20) >= 10;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  // Ensure coordinates are valid numbers
  const lat = typeof place.latitude === 'string' ? parseFloat(place.latitude) : place.latitude;
  const lon = typeof place.longitude === 'string' ? parseFloat(place.longitude) : place.longitude;
  
  // Check if coordinates are valid
  const hasValidCoordinates = !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/places')}
          className="mb-4"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          {t('common.back', 'Back to Places')}
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{place.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <span>{getPlaceTypeIcon(place.type)}</span>
                {getPlaceTypeLabel(place.type)}
              </Badge>
              {rating && rating.totalRatings !== "0" && (
                <div className="flex items-center gap-1">
                  <div className="flex">{renderStars(rating.averageRating)}</div>
                  <span className="text-sm text-gray-600">
                    ({rating.totalRatings} {t('common.reviews', 'reviews')})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Place Information */}
        <div className="space-y-6">
          {/* Image */}
          {place.imageUrl && (
            <Card>
              <CardContent className="p-0">
                <img 
                  src={place.imageUrl} 
                  alt={place.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {place.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-info-circle"></i>
                  {t('common.description', 'Description')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{place.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Address */}
          {place.address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('common.address', 'Address')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{place.address}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    const encodedAddress = encodeURIComponent(place.address!);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                  }}
                >
                  <i className="fas fa-directions mr-2"></i>
                  {t('places.getDirections', 'Get Directions')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {place.features && place.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <i className="fas fa-list"></i>
                  {t('common.features', 'Features')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {place.features.map((feature, index) => (
                    <Badge key={index} variant="outline">
                      {getFeatureTranslation(feature, place.type)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-map"></i>
                {t('common.location', 'Location')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 rounded-lg overflow-hidden">
                {hasValidCoordinates ? (
                  <MapContainer
                    center={[lat, lon]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lon]}>
                      <Popup>
                        <div className="text-center">
                          <h3 className="font-semibold">{place.name}</h3>
                          {place.address && <p className="text-sm text-gray-600">{place.address}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">
                        {t('places.noLocationAvailable', 'Location coordinates not available')}
                      </p>
                      {place.address && (
                        <p className="text-xs mt-1">{place.address}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('places.quickActions', 'Quick Actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const encodedAddress = encodeURIComponent(place.address || place.name);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                }}
              >
                <i className="fas fa-directions mr-2"></i>
                {t('places.getDirections', 'Get Directions')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: place.name,
                      text: place.description || `Check out ${place.name}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                <i className="fas fa-share mr-2"></i>
                {t('common.share', 'Share')}
              </Button>

              <Button 
                className="w-full justify-start"
                onClick={() => {
                  console.log('=== CREATE PLAYDATE BUTTON CLICKED ===');
                  console.log('Place ID:', place.id);
                  console.log('Storing place data in sessionStorage');
                  // Store place data in sessionStorage to pass to create page
                  sessionStorage.setItem('selectedPlace', JSON.stringify({
                    id: place.id,
                    name: place.name,
                    address: place.address,
                    latitude: place.latitude,
                    longitude: place.longitude
                  }));
                  setLocation('/create');
                }}
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                {t('places.createPlaydate', 'Create Playdate Here')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}