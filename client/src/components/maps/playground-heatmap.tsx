import { useEffect, useRef, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Place } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/use-location';
import { useTranslation } from 'react-i18next';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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

// Highlighted playground icon (using a completely different eye-catching icon)
const highlightedPlaygroundIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2529/2529521.png', // Using a location pin icon
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
  className: 'highlighted-marker'
});

// Restaurant icon
const restaurantIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448636.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Highlighted restaurant icon (using a bright location marker for better visibility)
const highlightedRestaurantIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2529/2529522.png', // Using a different colored pin
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60],
  className: 'highlighted-marker'
});

// Component to update map center and handle highlighted place
function SetViewOnLocationChange({ 
  coords,
  initialCoords,
  highlightedPlaceId,
  places
}: { 
  coords: [number, number] | null,
  initialCoords?: { lat: number, lng: number, zoom: number } | null,
  highlightedPlaceId?: number | null,
  places: Place[]
}) {
  const map = useMap();
  const initialCoordsApplied = useRef(false);
  const highlightedMarkerRef = useRef<L.Marker | null>(null);
  
  // First priority: use initial coordinates from URL if available
  useEffect(() => {
    if (initialCoords && !initialCoordsApplied.current) {
      console.log("Setting map view to initial coordinates:", initialCoords);
      map.setView([initialCoords.lat, initialCoords.lng], initialCoords.zoom);
      initialCoordsApplied.current = true;
    }
  }, [initialCoords, map]);
  
  // Second priority: use user's location if available and initial coords not set
  useEffect(() => {
    if (coords && !initialCoordsApplied.current) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map, initialCoordsApplied]);
  
  // Handle highlighted place
  useEffect(() => {
    // Clean up previous marker
    if (highlightedMarkerRef.current) {
      map.removeLayer(highlightedMarkerRef.current);
      highlightedMarkerRef.current = null;
    }
    
    // If we have a highlighted place ID, find it and add a special marker
    if (highlightedPlaceId) {
      console.log("Looking for highlighted place with ID:", highlightedPlaceId);
      
      const highlightedPlace = places.find(p => p.id === highlightedPlaceId);
      
      if (highlightedPlace) {
        console.log("Found highlighted place:", highlightedPlace.name);
        
        const lat = typeof highlightedPlace.latitude === 'string' 
          ? parseFloat(highlightedPlace.latitude) 
          : highlightedPlace.latitude;
          
        const lng = typeof highlightedPlace.longitude === 'string' 
          ? parseFloat(highlightedPlace.longitude) 
          : highlightedPlace.longitude;
        
        if (lat && lng) {
          // Use appropriate icon based on place type
          const icon = highlightedPlace.type === 'playground' 
            ? highlightedPlaygroundIcon 
            : highlightedRestaurantIcon;
            
          // Create the marker
          const marker = L.marker([lat, lng], { icon }).addTo(map);
          
          // Store in ref for later cleanup
          highlightedMarkerRef.current = marker;
          
          // Add popup with enhanced styling and more details
          marker.bindPopup(`
            <div style="padding: 15px; text-align: center; max-width: 300px;">
              <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #FF4500;">${highlightedPlace.name}</h3>
              ${highlightedPlace.imageUrl ? 
                `<img src="${highlightedPlace.imageUrl}" 
                    style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;"
                    onerror="this.src='https://images.unsplash.com/photo-${highlightedPlace.type === 'playground' ? '1551966775-a4ddc8df052b' : '1517248135467-4c7edcad34c4'}?w=500&q=80'; this.onerror=null;"
                />` : ''}
              <p style="margin-bottom: 8px; font-weight: bold;">${highlightedPlace.type === 'playground' ? '🛝 Playground' : '🍽️ Restaurant'}</p>
              <p style="margin-bottom: 12px; font-style: italic;">${highlightedPlace.address || 'No address available'}</p>
              <p style="margin-bottom: 12px; text-align: left;">${highlightedPlace.description || 'No description available'}</p>
              ${highlightedPlace.rating ? 
                `<div style="margin-bottom: 8px;">
                  <span style="color: gold;">${'★'.repeat(Math.round(highlightedPlace.rating))}</span>
                  <span style="color: #ccc;">${'★'.repeat(5-Math.round(highlightedPlace.rating))}</span>
                  <span style="margin-left: 5px;">${highlightedPlace.rating.toFixed(1)} (${highlightedPlace.reviewCount || 0})</span>
                </div>` : ''}
              ${highlightedPlace.features && highlightedPlace.features.length > 0 ? 
                `<div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; justify-content: center;">
                  ${highlightedPlace.features.map(feature => 
                    `<span style="background: #f0f0f0; padding: 3px 8px; border-radius: 12px; font-size: 12px;">${feature}</span>`
                  ).join('')}
                </div>` : ''}
              <div style="margin-top: 15px; color: #FF4500; font-weight: bold; background: #FFF5E6; padding: 8px; border-radius: 8px; border: 1px dashed #FF4500;">
                ★ Selected Location ★
              </div>
            </div>
          `).openPopup();
          
          // Make sure the map is centered on this place
          map.setView([lat, lng], initialCoords?.zoom || 17);
        }
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (highlightedMarkerRef.current) {
        map.removeLayer(highlightedMarkerRef.current);
      }
    };
  }, [highlightedPlaceId, map, places, initialCoords]);
  
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
  highlightedPlaceId?: number | null;
  initialCoords?: { lat: number, lng: number, zoom: number } | null;
}

// Component to handle click on map for adding a new playground
function AddPlaygroundMarker({ 
  onSelectLocation 
}: { 
  onSelectLocation: (position: [number, number]) => void 
}) {
  const map = useMapEvents({
    click: (e) => {
      onSelectLocation([e.latlng.lat, e.latlng.lng]);
    },
  });
  
  return null;
}

// Form schema for playground creation
const playgroundFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  // Image field removed
  features: z.array(z.string()).default([]),
});

type PlaygroundFormValues = z.infer<typeof playgroundFormSchema>;

export function PlaygroundHeatmap({ 
  className = '', 
  highlightedPlaceId = null,
  initialCoords = null
}: PlaygroundHeatmapProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.3676, 4.9041]); // Default: Amsterdam
  const { latitude, longitude } = useLocation();
  const [locationAvailable, setLocationAvailable] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [addMode, setAddMode] = useState(false);
  
  // Reference to track if highlighted place has been found and popup opened
  const highlightedPlaceRef = useRef<number | null>(null);
  
  // Form definition
  const form = useForm<PlaygroundFormValues>({
    resolver: zodResolver(playgroundFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      latitude: 0,
      longitude: 0,
      features: [],
    },
    mode: 'onChange',
  });
  
  // Mutation for adding a new playground
  const addPlaygroundMutation = useMutation({
    mutationFn: async (data: PlaygroundFormValues) => {
      // Simple JSON request for playground data (image upload removed)
      const response = await apiRequest('POST', '/api/playgrounds', {
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        latitude: data.latitude,
        longitude: data.longitude,
        features: data.features || []
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t('playgroundMap.addSuccess', 'Playground Added'),
        description: t('playgroundMap.addSuccessMessage', 'Thank you for contributing to our community playground map!'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/places/search'] });
      setShowAddDialog(false);
      setAddMode(false);
    },
    onError: (error) => {
      toast({
        title: t('playgroundMap.addError', 'Error Adding Playground'),
        description: error.message || t('playgroundMap.addErrorMessage', 'There was an error adding the playground. Please try again.'),
        variant: 'destructive',
      });
    },
  });
  
  // Function to handle form submission
  const onSubmit = (data: PlaygroundFormValues) => {
    addPlaygroundMutation.mutate(data);
  };
  
  // Update form values when location is selected
  useEffect(() => {
    if (selectedLocation) {
      form.setValue('latitude', selectedLocation[0]);
      form.setValue('longitude', selectedLocation[1]);
      setShowAddDialog(true);
    }
  }, [selectedLocation, form]);
  
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
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div>
            <h2 className="text-lg font-bold mb-2">{t('playgroundMap.title', 'Playground Heatmap')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('playgroundMap.description', 'Discover playgrounds and their popularity in your area')}
            </p>
          </div>
          
          <div className="flex gap-2">
            {user && !addMode && (
              <Button 
                onClick={() => setAddMode(true)} 
                variant="default"
                size="sm"
                className="flex items-center"
              >
                <i className="fas fa-plus mr-1"></i>
                {t('playgroundMap.addPlayground', 'Add Playground')}
              </Button>
            )}
            
            {addMode && (
              <Button 
                onClick={() => setAddMode(false)} 
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <i className="fas fa-times mr-1"></i>
                {t('common.cancel', 'Cancel')}
              </Button>
            )}
            
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
                size="sm"
                className="flex items-center"
              >
                <i className="fas fa-location-arrow mr-1"></i>
                {t('places.useMyLocation', 'Use My Location')}
              </Button>
            )}
          </div>
        </div>
        
        {addMode && (
          <div className="mt-4 p-3 bg-muted/20 border border-border rounded-lg">
            <h3 className="text-sm font-medium mb-2">
              {t('playgroundMap.addPlaygroundInstructions', 'Click on the map to add a new playground')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('playgroundMap.addPlaygroundTip', 'Select the exact location of the playground on the map')}
            </p>
          </div>
        )}
      </div>
      
      <div 
        className="rounded-xl overflow-hidden shadow-md h-[500px] relative" 
        style={{ 
          zIndex: 10,
          pointerEvents: showAddDialog ? 'none' : 'auto' 
        }}>
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Update map center when user location changes */}
          {/* Pass data to SetViewOnLocationChange */}
          {places && (
            <SetViewOnLocationChange 
              coords={latitude && longitude ? [latitude, longitude] : null}
              initialCoords={initialCoords}
              highlightedPlaceId={highlightedPlaceId}
              places={places}
            />
          )}
          
          {/* Add heatmap layer */}
          <HeatmapLayer points={heatmapPoints} />
          
          {/* Add playground marker mode */}
          {addMode && user && (
            <AddPlaygroundMarker 
              onSelectLocation={setSelectedLocation} 
            />
          )}
          
          {/* Add markers for all places (playgrounds and restaurants) */}
          {places.map(place => {
            // Ensure latitude and longitude are numbers
            const lat = typeof place.latitude === 'string' ? parseFloat(place.latitude) : place.latitude;
            const lng = typeof place.longitude === 'string' ? parseFloat(place.longitude) : place.longitude;
            
            // Determine if this place should be highlighted
            const isHighlighted = highlightedPlaceId !== null && place.id === highlightedPlaceId;
            
            // Select appropriate icon based on place type and highlighted status
            let markerIcon;
            if (place.type === 'playground') {
              markerIcon = isHighlighted ? highlightedPlaygroundIcon : playgroundIcon;
            } else if (place.type === 'restaurant') {
              markerIcon = isHighlighted ? highlightedRestaurantIcon : restaurantIcon;
            } else {
              markerIcon = playgroundIcon; // Default fallback
            }
            
            // Only render markers with valid coordinates
            return (lat && lng) ? (
              <Marker 
                key={place.id} 
                position={[lat, lng]}
                icon={markerIcon}
                eventHandlers={{
                  add: (e) => {
                    // Automatically open popup for highlighted place
                    if (isHighlighted && highlightedPlaceRef.current !== place.id) {
                      setTimeout(() => {
                        e.target.openPopup();
                        console.log("Opening popup for highlighted place:", place.id);
                        highlightedPlaceRef.current = place.id;
                      }, 500);
                    }
                  }
                }}
              >
                <Popup>
                  <div className="p-1">
                    <h3 className="font-medium text-base">{place.name}</h3>
                    
                    {place.imageUrl && (
                      <div className="my-2">
                        <img
                          src={place.imageUrl}
                          alt={place.name}
                          className="w-full h-32 object-cover rounded"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.src = place.type === 'playground'
                              ? "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=500&auto=format&fit=crop"
                              : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80";
                          }}
                        />
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      {place.description ? place.description.substring(0, 100) + (place.description.length > 100 ? '...' : '') : t('common.noDescription', 'No description available.')}
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
      
      {/* Custom Modal Dialog - Simple approach that's guaranteed to work */}
      {showAddDialog && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddDialog(false);
              setSelectedLocation(null);
              form.reset();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 shadow-xl max-w-[500px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{t('playgroundMap.addNewPlayground', 'Add New Playground')}</h2>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.name', 'Name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('playgroundMap.playgroundNamePlaceholder', 'e.g. Central Park Playground')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.description', 'Description')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('playgroundMap.descriptionPlaceholder', 'e.g. Playground with swings, slides, and climbing area')} 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.address', 'Address')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('playgroundMap.addressPlaceholder', 'e.g. 123 Main St, Amsterdam')} 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.latitude', 'Latitude')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text" 
                            disabled
                            value={field.value.toString()}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.longitude', 'Longitude')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            disabled
                            value={field.value.toString()}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.features', 'Features')}</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'restrooms', defaultText: 'Restrooms' },
                            { key: 'picnicTables', defaultText: 'Picnic tables' },
                            { key: 'benches', defaultText: 'Benches' },
                            { key: 'sandbox', defaultText: 'Sandbox' },
                            { key: 'waterGames', defaultText: 'Water games' }
                          ].map((featureObj) => {
                            // Get the translated text for this feature
                            const translatedText = t(`places.playgroundFeatures.${featureObj.key}`, featureObj.defaultText);
                            
                            return (
                              <Button
                                key={featureObj.key}
                                type="button"
                                variant={field.value.includes(featureObj.key) ? "default" : "outline"}
                                size="sm"
                                className={field.value.includes(featureObj.key) ? "bg-primary text-white" : ""}
                                onClick={() => {
                                  if (field.value.includes(featureObj.key)) {
                                    field.onChange(field.value.filter(f => f !== featureObj.key));
                                  } else {
                                    field.onChange([...field.value, featureObj.key]);
                                  }
                                }}
                              >
                                {field.value.includes(featureObj.key) && <i className="fas fa-check mr-1"></i>}
                                {translatedText}
                              </Button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t('playgroundMap.featuresHelp', 'Select all features available at this playground')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Image upload capability removed */}
                <div className="text-sm italic text-muted-foreground mt-4 mb-2 p-2 bg-muted rounded-md">
                  <p>{t('playgroundMap.imageUploadDisabled', 'Image uploads have been disabled')}</p>
                  <p>{t('playgroundMap.defaultImageUsed', 'A default image will be used for all playgrounds')}</p>
                </div>
                
                <div className="pt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setSelectedLocation(null);
                      form.reset();
                    }}
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addPlaygroundMutation.isPending}
                  >
                    {addPlaygroundMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {t('common.adding', 'Adding...')}
                      </>
                    ) : (
                      t('common.add', 'Add')
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}