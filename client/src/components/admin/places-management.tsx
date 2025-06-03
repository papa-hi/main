import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Place } from "@shared/schema";
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
import { Edit, Trash2, MapPin, Star, Users } from "lucide-react";

// Component to show real rating data for each place
function PlaceRatingDisplay({ placeId }: { placeId: number }) {
  const { data: ratingData } = useQuery({
    queryKey: [`/api/places/${placeId}/rating`],
  });

  const averageRating = ratingData?.averageRating ? (ratingData.averageRating / 20).toFixed(1) : "0.0";
  const totalRatings = ratingData?.totalRatings || 0;

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 text-orange-400" />
        {averageRating}/5.0
      </div>
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4" />
        {totalRatings} ratings
      </div>
    </div>
  );
}

export function PlacesManagement() {
  const { toast } = useToast();
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    address: "",
    type: "",
    features: [] as string[]
  });

  // Fetch all places
  const { data: places = [], isLoading } = useQuery<Place[]>({
    queryKey: ["/api/admin/places"],
  });

  // Edit place mutation
  const editPlaceMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Place> }) => {
      const res = await apiRequest(`/api/admin/places/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update place');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      setEditingPlace(null);
      toast({
        title: "Success",
        description: "Place updated successfully",
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

  // Delete place mutation
  const deletePlaceMutation = useMutation({
    mutationFn: async (placeId: number) => {
      const res = await apiRequest(`/api/admin/places/${placeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete place');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      toast({
        title: "Success",
        description: "Place deleted successfully",
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

  const handleEditPlace = (place: Place) => {
    setEditingPlace(place);
    setEditFormData({
      name: place.name,
      description: place.description || "",
      address: place.address,
      type: place.type,
      features: place.features || []
    });
  };

  const handleUpdatePlace = () => {
    if (!editingPlace) return;

    editPlaceMutation.mutate({
      id: editingPlace.id,
      updates: editFormData
    });
  };

  const handleDeletePlace = (placeId: number) => {
    deletePlaceMutation.mutate(placeId);
  };

  const addFeature = (feature: string) => {
    if (feature && !editFormData.features.includes(feature)) {
      setEditFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const removeFeature = (feature: string) => {
    setEditFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const commonFeatures = {
    playground: ["restrooms", "benches", "sandbox", "picnicTables", "waterGames", "climbing", "swings"],
    restaurant: ["kidsMenu", "highChairs", "changingTables", "playCorner", "Kinderstoel", "Speelhoek", "Verschoontafel"]
  };

  if (isLoading) {
    return <div className="p-6">Loading places...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Places Management</h2>
        <div className="text-sm text-muted-foreground">
          Total places: {places.length}
        </div>
      </div>

      <div className="grid gap-4">
        {places.map((place) => (
          <Card key={place.id} className="w-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{place.name}</CardTitle>
                    <Badge variant={place.type === 'playground' ? 'default' : 'secondary'}>
                      {place.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {place.address}
                  </div>
                  <PlaceRatingDisplay placeId={place.id} />
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPlace(place)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Place</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select
                            value={editFormData.type}
                            onValueChange={(value) => setEditFormData(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="playground">Playground</SelectItem>
                              <SelectItem value="restaurant">Restaurant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={editFormData.address}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label>Features</Label>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {editFormData.features.map((feature) => (
                                <Badge key={feature} variant="secondary" className="cursor-pointer" onClick={() => removeFeature(feature)}>
                                  {feature} ×
                                </Badge>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {commonFeatures[editFormData.type as keyof typeof commonFeatures]?.map((feature) => (
                                !editFormData.features.includes(feature) && (
                                  <Button
                                    key={feature}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addFeature(feature)}
                                  >
                                    + {feature}
                                  </Button>
                                )
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingPlace(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdatePlace}
                            disabled={editPlaceMutation.isPending}
                          >
                            {editPlaceMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Place</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{place.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePlace(place.id)}
                          disabled={deletePlaceMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deletePlaceMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{place.description}</p>
              {place.features && place.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {place.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}