import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, DollarSign, ExternalLink, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { FamilyEvent } from "@shared/schema";
import { format } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: event, isLoading, error } = useQuery<FamilyEvent>({
    queryKey: ['/api/events', id],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      return response.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
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

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{t('common.error', 'Error')}</h2>
              <p className="text-gray-600 mb-4">
                Event not found or could not be loaded.
              </p>
              <Button onClick={() => setLocation('/')}>
                {t('common.goBack', 'Go Back')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'workshop':
        return '🎨';
      case 'festival':
        return '🎉';
      case 'outdoor':
        return '🌳';
      case 'indoor':
        return '🏠';
      case 'educational':
        return '📚';
      case 'sports':
        return '⚽';
      default:
        return '📅';
    }
  };

  // Parse coordinates
  const lat = event.latitude ? parseFloat(event.latitude) : null;
  const lon = event.longitude ? parseFloat(event.longitude) : null;
  const hasValidCoordinates = lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);

  // Format dates
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="mb-4"
          data-testid="button-back"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          {t('common.back', 'Back')}
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-event-title">
              {event.title}
            </h1>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default" className="flex items-center gap-1">
                <span>{getCategoryIcon(event.category)}</span>
                {event.category}
              </Badge>
              {event.isRecurring && (
                <Badge variant="secondary">
                  <i className="fas fa-repeat mr-1"></i>
                  Recurring
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Event Information */}
        <div className="space-y-6">
          {/* Image */}
          {event.imageUrl && (
            <Card>
              <CardContent className="p-0">
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="w-full h-64 object-cover rounded-lg"
                  data-testid="img-event"
                />
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-info-circle"></i>
                {t('common.description', 'Description')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700" data-testid="text-event-description">
                {event.description}
              </p>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Date & Time</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-event-date">
                    {format(startDate, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(startDate, "h:mm a")}
                    {endDate && ` - ${format(endDate, "h:mm a")}`}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Location</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-event-location">
                    {event.location}
                  </p>
                </div>
              </div>

              {/* Age Range */}
              {event.ageRange && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Age Range</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-event-age">
                      {event.ageRange}
                    </p>
                  </div>
                </div>
              )}

              {/* Cost */}
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Cost</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-event-cost">
                    {event.cost}
                  </p>
                </div>
              </div>

              {/* Organizer */}
              {event.organizer && (
                <div className="flex items-start gap-3">
                  <i className="fas fa-user-tie text-muted-foreground mt-1"></i>
                  <div>
                    <p className="font-medium text-sm">Organizer</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-event-organizer">
                      {event.organizer}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              {event.contactInfo && (
                <div className="flex items-start gap-3">
                  <i className="fas fa-envelope text-muted-foreground mt-1"></i>
                  <div>
                    <p className="font-medium text-sm">Contact</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-event-contact">
                      {event.contactInfo}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map and Actions */}
        <div className="space-y-6">
          {/* Map */}
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
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.location}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">
                        Location coordinates not available
                      </p>
                      {event.location && (
                        <p className="text-xs mt-1">{event.location}</p>
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
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {event.registrationUrl && (
                <Button 
                  className="w-full justify-start"
                  onClick={() => window.open(event.registrationUrl, '_blank')}
                  data-testid="button-register"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Register for Event
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const encodedAddress = encodeURIComponent(event.location);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                }}
                data-testid="button-directions"
              >
                <i className="fas fa-directions mr-2"></i>
                Get Directions
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: event.title,
                      text: event.description || `Check out ${event.title}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                data-testid="button-share"
              >
                <i className="fas fa-share mr-2"></i>
                {t('common.share', 'Share')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
