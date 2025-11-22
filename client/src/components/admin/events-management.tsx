import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FamilyEvent } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, MapPin, Calendar, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map preview component that geocodes the location
function LocationMapPreview({ location }: { location: string }) {
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

export function EventsManagement() {
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    ageRange: "",
    category: "",
    cost: "free",
    organizer: "",
    contactInfo: "",
    registrationUrl: "",
    isActive: true
  });

  const { data: events = [], isLoading } = useQuery<FamilyEvent[]>({
    queryKey: ["/api/admin/events"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/events", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editEventMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<FamilyEvent> }) => {
      const res = await apiRequest("PATCH", `/api/admin/events/${data.id}`, data.updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setEditingEvent(null);
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/events/${eventId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      imageUrl: "",
      startDate: "",
      endDate: "",
      ageRange: "",
      category: "",
      cost: "free",
      organizer: "",
      contactInfo: "",
      registrationUrl: "",
      isActive: true
    });
  };

  const handleEditEvent = (event: FamilyEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      imageUrl: event.imageUrl || "",
      startDate: event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm") : "",
      endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : "",
      ageRange: event.ageRange || "",
      category: event.category,
      cost: event.cost || "free",
      organizer: event.organizer || "",
      contactInfo: event.contactInfo || "",
      registrationUrl: event.registrationUrl || "",
      isActive: event.isActive
    });
  };

  const handleCreateEvent = () => {
    createEventMutation.mutate({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : null
    });
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;

    editEventMutation.mutate({
      id: editingEvent.id,
      updates: {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : null
      }
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    deleteEventMutation.mutate(eventId);
  };

  if (isLoading) {
    return <div className="p-6">Loading events...</div>;
  }

  const eventCategories = [
    { value: "workshop", label: "Workshop" },
    { value: "festival", label: "Festival" },
    { value: "outdoor", label: "Outdoor Activity" },
    { value: "indoor", label: "Indoor Activity" },
    { value: "educational", label: "Educational" },
    { value: "sports", label: "Sports" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Events Management</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total events: {events.length}
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-event">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Event Title*</Label>
                    <Input
                      id="title"
                      data-testid="input-event-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Family Art Workshop"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Description*</Label>
                    <Textarea
                      id="description"
                      data-testid="input-event-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="Join us for a creative afternoon..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category*</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger data-testid="select-event-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ageRange">Age Range</Label>
                    <Input
                      id="ageRange"
                      data-testid="input-event-age-range"
                      value={formData.ageRange}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageRange: e.target.value }))}
                      placeholder="e.g., 3-8 or All ages"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="location">Location*</Label>
                    <Input
                      id="location"
                      data-testid="input-event-location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Community Center Amsterdam"
                    />
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      Coordinates will be automatically geocoded from the location address
                    </p>
                    <LocationMapPreview location={formData.location} />
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date & Time*</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      data-testid="input-event-start-date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      data-testid="input-event-end-date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      id="cost"
                      data-testid="input-event-cost"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      placeholder="free or €10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organizer">Organizer</Label>
                    <Input
                      id="organizer"
                      data-testid="input-event-organizer"
                      value={formData.organizer}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                      placeholder="Amsterdam Arts Center"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      data-testid="input-event-image-url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://example.com/event-image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactInfo">Contact Info</Label>
                    <Input
                      id="contactInfo"
                      data-testid="input-event-contact"
                      value={formData.contactInfo}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                      placeholder="info@example.com or +31123456789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="registrationUrl">Registration URL</Label>
                    <Input
                      id="registrationUrl"
                      data-testid="input-event-registration-url"
                      value={formData.registrationUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, registrationUrl: e.target.value }))}
                      placeholder="https://example.com/register"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateEvent}
                    disabled={createEventMutation.isPending || !formData.title || !formData.description || !formData.location || !formData.startDate || !formData.category}
                    data-testid="button-submit-create"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id} className="w-full" data-testid={`card-event-${event.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg" data-testid={`text-event-title-${event.id}`}>
                      {event.title}
                    </CardTitle>
                    <Badge variant="default" data-testid={`badge-event-category-${event.id}`}>
                      {event.category}
                    </Badge>
                    {!event.isActive && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                    {event.ageRange && (
                      <Badge variant="outline">{event.ageRange}</Badge>
                    )}
                    <Badge variant="secondary" data-testid={`badge-event-cost-${event.id}`}>
                      {event.cost}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span data-testid={`text-event-location-${event.id}`}>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span data-testid={`text-event-date-${event.id}`}>
                      {format(new Date(event.startDate), "PPP 'at' p")}
                      {event.endDate && ` - ${format(new Date(event.endDate), "PPP 'at' p")}`}
                    </span>
                  </div>
                  {event.organizer && (
                    <div className="text-sm text-muted-foreground">
                      Organizer: {event.organizer}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                        data-testid={`button-edit-event-${event.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="edit-title">Event Title*</Label>
                            <Input
                              id="edit-title"
                              value={formData.title}
                              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>

                          <div className="col-span-2">
                            <Label htmlFor="edit-description">Description*</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-category">Category*</Label>
                            <Select
                              value={formData.category}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {eventCategories.map(cat => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="edit-ageRange">Age Range</Label>
                            <Input
                              id="edit-ageRange"
                              value={formData.ageRange}
                              onChange={(e) => setFormData(prev => ({ ...prev, ageRange: e.target.value }))}
                            />
                          </div>

                          <div className="col-span-2">
                            <Label htmlFor="edit-location">Location*</Label>
                            <Input
                              id="edit-location"
                              value={formData.location}
                              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                              Coordinates will be automatically geocoded from the location address
                            </p>
                            <LocationMapPreview location={formData.location} />
                          </div>

                          <div>
                            <Label htmlFor="edit-startDate">Start Date & Time*</Label>
                            <Input
                              id="edit-startDate"
                              type="datetime-local"
                              value={formData.startDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-endDate">End Date & Time</Label>
                            <Input
                              id="edit-endDate"
                              type="datetime-local"
                              value={formData.endDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-cost">Cost</Label>
                            <Input
                              id="edit-cost"
                              value={formData.cost}
                              onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-organizer">Organizer</Label>
                            <Input
                              id="edit-organizer"
                              value={formData.organizer}
                              onChange={(e) => setFormData(prev => ({ ...prev, organizer: e.target.value }))}
                            />
                          </div>

                          <div className="col-span-2">
                            <Label htmlFor="edit-imageUrl">Image URL</Label>
                            <Input
                              id="edit-imageUrl"
                              value={formData.imageUrl}
                              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-contactInfo">Contact Info</Label>
                            <Input
                              id="edit-contactInfo"
                              value={formData.contactInfo}
                              onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                            />
                          </div>

                          <div>
                            <Label htmlFor="edit-registrationUrl">Registration URL</Label>
                            <Input
                              id="edit-registrationUrl"
                              value={formData.registrationUrl}
                              onChange={(e) => setFormData(prev => ({ ...prev, registrationUrl: e.target.value }))}
                            />
                          </div>

                          <div className="col-span-2">
                            <Label htmlFor="edit-isActive">Status</Label>
                            <Select
                              value={formData.isActive ? "active" : "inactive"}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === "active" }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingEvent(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateEvent}
                            disabled={editEventMutation.isPending}
                          >
                            {editEventMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-event-${event.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{event.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={deleteEventMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2" data-testid={`text-event-description-${event.id}`}>
                {event.description}
              </p>
              {event.imageUrl && (
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-md mt-2"
                />
              )}
              {event.registrationUrl && (
                <a 
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-block mt-2"
                >
                  Registration Link →
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events created yet</p>
            <p className="text-sm mt-1">Click "Create Event" to add your first event</p>
          </div>
        </Card>
      )}
    </div>
  );
}
