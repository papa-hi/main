import { useTranslation } from 'react-i18next';
import { PlaygroundHeatmap } from '@/components/maps/playground-heatmap';
import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { AlertCircle, MapPin } from "lucide-react";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

export default function PlaygroundMapPage() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { toast } = useToast();
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<number | null>(null);
  const [initialCoords, setInitialCoords] = useState<{lat: number, lng: number, zoom: number} | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [placeInfo, setPlaceInfo] = useState<any | null>(null);
  const [showPlaceDetails, setShowPlaceDetails] = useState<boolean>(false);
  
  // Parse URL parameters and fetch place details
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1] || '');
    const placeId = searchParams.get('placeId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');
    const name = searchParams.get('name');
    const shouldShowTooltip = searchParams.get('showTooltip') === 'true';
    
    // Debug logs
    console.log("URL Parameters:", {
      placeId,
      lat,
      lng,
      zoom,
      name,
      showTooltip: shouldShowTooltip,
      fullLocation: location
    });
    
    if (placeId) {
      const id = parseInt(placeId);
      console.log("Setting highlighted place ID:", id);
      setHighlightedPlaceId(id);
      
      // Fetch place details
      fetch(`/api/places/${id}`)
        .then(response => {
          if (!response.ok) {
            // If specific place endpoint fails, try the search endpoint
            return fetch(`/api/places/search?type=all`);
          }
          return response;
        })
        .then(response => response.json())
        .then(data => {
          // If we got an array from search, find the place by ID
          if (Array.isArray(data)) {
            const place = data.find(p => p.id === id);
            if (place) {
              setPlaceInfo(place);
              console.log("Found place in search results:", place);
              setShowPlaceDetails(true);
            }
          } else {
            // If we got a direct result
            setPlaceInfo(data);
            console.log("Found place details:", data);
            setShowPlaceDetails(true);
          }
        })
        .catch(error => {
          console.error("Error fetching place details:", error);
          toast({
            title: t('places.error', 'Error'),
            description: t('places.errorFetchingDetails', 'Could not fetch place details.'),
            variant: "destructive"
          });
        });
    }
    
    if (name) {
      setPlaceName(decodeURIComponent(name));
    }
    
    if (shouldShowTooltip) {
      setShowTooltip(true);
    }
    
    if (lat && lng) {
      const coords = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        zoom: zoom ? parseInt(zoom) : 16
      };
      console.log("Setting initial coords:", coords);
      setInitialCoords(coords);
    }
  }, [location, t, toast]);
  
  // Show a welcome tooltip when a place is selected
  useEffect(() => {
    if (showTooltip && placeName) {
      toast({
        title: `${t('places.viewingOnMap', 'Viewing on Map')}: ${placeName}`,
        description: t('places.locationDetailsOnMap', 'You can now see the selected location highlighted on the map with a special pin marker'),
        variant: "default",
        duration: 5000,
      });
    }
  }, [showTooltip, placeName, toast, t]);
  
  // Ensure leaflet CSS is properly loaded
  useEffect(() => {
    // Add leaflet CSS if not already present
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">
          {t('playgroundMap.title', 'Playground Map')}
        </h1>
        <p className="text-muted-foreground">
          {t('playgroundMap.description', 'Discover playgrounds and their popularity in your area')}
        </p>
      </div>
      
      <PlaygroundHeatmap 
        className="mb-8"
        highlightedPlaceId={highlightedPlaceId}
        initialCoords={initialCoords}
      />
      
      {/* Place Details Modal */}
      <Dialog open={showPlaceDetails} onOpenChange={setShowPlaceDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {placeInfo?.type === 'playground' ? (
                <span className="text-green-600">🛝</span>
              ) : (
                <span className="text-orange-500">🍽️</span>
              )}
              {placeInfo?.name || t('places.placeDetails', 'Place Details')}
            </DialogTitle>
            <DialogDescription>
              {placeInfo?.address || t('places.noAddress', 'No address information available')}
            </DialogDescription>
          </DialogHeader>
          
          {placeInfo && (
            <div className="space-y-4 my-3">
              {/* Place Image */}
              {placeInfo.imageUrl && (
                <div className="rounded-lg overflow-hidden max-h-[250px]">
                  <img 
                    src={placeInfo.imageUrl} 
                    alt={placeInfo.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = placeInfo.type === 'playground' 
                        ? "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=500&auto=format&fit=crop"
                        : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80";
                    }}
                  />
                </div>
              )}
              
              {/* Description */}
              <div>
                <h3 className="text-lg font-bold mb-2">{t('places.description', 'Description')}</h3>
                <p className="text-muted-foreground">
                  {placeInfo.description || t('places.noDescription', 'No description available')}
                </p>
              </div>
              
              {/* Location Info */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> 
                  {t('places.location', 'Location')}
                </h3>
                <p className="mb-2">
                  {t('places.coordinates', 'Coordinates')}: {placeInfo.latitude}, {placeInfo.longitude}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('places.distanceFromYou', 'Distance')}: {placeInfo.distance ? 
                    `${(placeInfo.distance / 1000).toFixed(1)} km` : 
                    t('places.distanceUnknown', 'Unknown')}
                </p>
                <Button 
                  className="mt-2 w-full"
                  onClick={() => {
                    // Open in Google Maps
                    window.open(`https://www.google.com/maps/search/?api=1&query=${placeInfo.latitude},${placeInfo.longitude}`, '_blank');
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {t('places.getDirections', 'Get Directions')}
                </Button>
              </div>
              
              {/* Features */}
              {placeInfo.features && placeInfo.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-2">{t('places.features', 'Features')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {placeInfo.features.map((feature: string, index: number) => (
                      <span
                        key={index}
                        className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full"
                      >
                        {t(`places.${placeInfo.type}Features.${feature}`, feature)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Ratings */}
              {placeInfo.rating && (
                <div>
                  <h3 className="text-lg font-bold mb-2">{t('places.rating', 'Rating')}</h3>
                  <div className="flex items-center gap-2">
                    <div className="text-yellow-500 text-xl">
                      {Array(Math.round(placeInfo.rating)).fill('★').join('')}
                      {Array(5 - Math.round(placeInfo.rating)).fill('☆').join('')}
                    </div>
                    <span className="text-lg font-semibold">{placeInfo.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">
                      ({placeInfo.reviewCount} {t('places.reviews', 'reviews')})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline"
              onClick={() => setShowPlaceDetails(false)}
            >
              {t('common.close', 'Close')}
            </Button>
            <Button onClick={() => {
              // Find on map - close dialog and let the map handle displaying the location
              setShowPlaceDetails(false);
            }}>
              {t('places.viewOnMap', 'View on Map')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('playgroundMap.aboutHeatmap', 'About the Heatmap')}
          </h2>
          <div className="space-y-4">
            <p>
              {t('playgroundMap.heatmapExplanation', 
                'The playground heatmap shows areas with high concentrations of playgrounds. ' +
                'Red areas indicate more playgrounds close together, while blue areas have fewer playgrounds.')}
            </p>
            <p>
              {t('playgroundMap.heatmapUsage', 
                'Use this map to find areas with many playgrounds, which are ideal for planning playdates ' +
                'with multiple options nearby.')}
            </p>
            <div className="flex items-center space-x-2 mt-4">
              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">{t('playgroundMap.lowDensity', 'Lower density')}</span>
              <div className="h-4 w-4 rounded-full bg-lime-500 ml-4"></div>
              <span className="text-sm">{t('playgroundMap.mediumDensity', 'Medium density')}</span>
              <div className="h-4 w-4 rounded-full bg-red-500 ml-4"></div>
              <span className="text-sm">{t('playgroundMap.highDensity', 'Higher density')}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('playgroundMap.contributeTitle', 'Contribute to the Community')}
          </h2>
          <div className="space-y-4">
            <p>
              {t('playgroundMap.contributeExplanation', 
                'Our playground data comes from both OpenStreetMap and community contributions. ' +
                'Help other parents by adding playgrounds you know about.')}
            </p>
            <p>
              {t('playgroundMap.contributeHowTo', 
                'To add a playground, click the "Add Playground" button in the map and select the exact location. ' +
                'Fill in the details like name and description to help other parents find great playgrounds.')}
            </p>
            <p className="text-sm text-muted-foreground italic">
              {t('playgroundMap.contributeNote', 
                'Note: You need to be logged in to contribute. All contributions are reviewed for quality.')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('playgroundMap.tips', 'Tips for Finding Great Playgrounds')}
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {t('playgroundMap.tip1', 'Look for playgrounds in red areas for more options in close proximity')}
            </li>
            <li>
              {t('playgroundMap.tip2', 'Click on a playground marker to see details and get directions')}
            </li>
            <li>
              {t('playgroundMap.tip3', 'Use your current location to find playgrounds near you')}
            </li>
            <li>
              {t('playgroundMap.tip4', 'Arrange playdates at playgrounds with multiple options nearby in case one is too crowded')}
            </li>
          </ul>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {t('playgroundMap.dataSourcesTitle', 'Data Sources')}
          </h2>
          <div className="space-y-4">
            <p>
              {t('playgroundMap.osmSource', 
                'Playground data is sourced from OpenStreetMap, a collaborative mapping project. ' +
                'This provides us with up-to-date information about publicly known playgrounds.')}
            </p>
            <p>
              {t('playgroundMap.userSource', 
                'Additional playground data comes from our community of users who contribute ' +
                'playgrounds they know about that might not be on public maps yet.')}
            </p>
            <p className="text-sm text-muted-foreground">
              <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                OpenStreetMap © OpenStreetMap contributors
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}