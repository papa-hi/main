import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Place } from "@shared/schema";
import { PlaceCard } from "@/components/shared/place-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation as useGeoLocation } from "@/hooks/use-location";

export default function PlacesPage() {
  const [location, setLocation] = useLocation();
  const { location: geoLocation } = useGeoLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Parse query params to set initial tab
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const type = searchParams.get('type');
    
    if (type === 'restaurant') {
      setActiveTab('restaurants');
    } else if (type === 'playground') {
      setActiveTab('playgrounds');
    }
  }, [location]);

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab === 'restaurants') {
      setLocation('/places?type=restaurant', { replace: true });
    } else if (activeTab === 'playgrounds') {
      setLocation('/places?type=playground', { replace: true });
    } else {
      setLocation('/places', { replace: true });
    }
  }, [activeTab, setLocation]);

  const { data: places, isLoading } = useQuery<Place[]>({
    queryKey: ['/api/places', geoLocation?.latitude, geoLocation?.longitude, activeTab],
  });
  
  const filteredPlaces = places?.filter(place => {
    // Filter by tab selection
    if (activeTab === 'restaurants' && place.type !== 'restaurant') return false;
    if (activeTab === 'playgrounds' && place.type !== 'playground') return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        place.name.toLowerCase().includes(searchLower) ||
        place.address.toLowerCase().includes(searchLower) ||
        place.features.some(f => f.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the filteredPlaces computation
  };
  
  const renderPlaceGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm">
              <Skeleton className="w-full h-40 rounded-t-xl" />
              <div className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (!filteredPlaces || filteredPlaces.length === 0) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <h3 className="font-heading font-medium text-lg mb-2">Geen locaties gevonden</h3>
          <p className="text-dark/70 text-sm mb-4">
            {searchTerm 
              ? `Geen resultaten voor "${searchTerm}"` 
              : "Er zijn geen locaties die aan je criteria voldoen."}
          </p>
          {searchTerm && (
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
            >
              Zoekopdracht wissen
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {filteredPlaces.map(place => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    );
  };

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-heading font-bold">Locaties voor Kids</h1>
        <Button
          variant="outline"
          onClick={() => setLocation('/playground-map')}
          className="flex items-center gap-2"
        >
          <i className="fas fa-map-marked-alt"></i>
          <span className="hidden sm:inline">Speeltuin Kaart</span>
          <span className="sm:hidden">Kaart</span>
        </Button>
      </div>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Zoek op naam, locatie of faciliteiten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" className="bg-primary hover:bg-accent text-white">
            <i className="fas fa-search mr-2"></i> Zoeken
          </Button>
        </div>
      </form>
      
      {/* Tabs for filtering */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-6 w-full grid grid-cols-3">
          <TabsTrigger value="all" className="text-sm">Alles</TabsTrigger>
          <TabsTrigger value="restaurants" className="text-sm">Restaurants</TabsTrigger>
          <TabsTrigger value="playgrounds" className="text-sm">Speeltuinen</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Places Grid */}
      {renderPlaceGrid()}
    </div>
  );
}
