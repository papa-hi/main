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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
});

type PlaygroundFormValues = z.infer<typeof playgroundFormSchema>;

export function PlaygroundHeatmap({ className = '' }: PlaygroundHeatmapProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [mapCenter, setMapCenter] = useState<[number, number]>([52.3676, 4.9041]); // Default: Amsterdam
  const { latitude, longitude } = useLocation();
  const [locationAvailable, setLocationAvailable] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [addMode, setAddMode] = useState(false);
  
  // Form definition
  const form = useForm<PlaygroundFormValues>({
    resolver: zodResolver(playgroundFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      latitude: 0,
      longitude: 0,
    },
  });
  
  // Mutation for adding a new playground
  const addPlaygroundMutation = useMutation({
    mutationFn: async (data: PlaygroundFormValues) => {
      const response = await apiRequest('POST', '/api/playgrounds', data);
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
      
      <div className="rounded-xl overflow-hidden shadow-md h-[500px] relative" style={{ zIndex: 10 }}>
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
          <SetViewOnLocationChange coords={latitude && longitude ? [latitude, longitude] : null} />
          
          {/* Add heatmap layer */}
          <HeatmapLayer points={heatmapPoints} />
          
          {/* Add playground marker mode */}
          {addMode && user && (
            <AddPlaygroundMarker 
              onSelectLocation={setSelectedLocation} 
            />
          )}
          
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
      
      {/* Add Playground Dialog */}
      <Dialog 
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setSelectedLocation(null);
            form.reset();
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[500px] map-dialog-content"
        >
          <DialogHeader>
            <DialogTitle>{t('playgroundMap.addNewPlayground', 'Add New Playground')}</DialogTitle>
          </DialogHeader>
          
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
                          type="number"
                          step="any" 
                          disabled
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                          type="number" 
                          step="any"
                          disabled
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
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
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}