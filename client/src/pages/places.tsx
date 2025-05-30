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
import { useTranslation } from "react-i18next";
import { AddRestaurantForm } from "@/components/places/add-restaurant-form";
import { AddMuseumForm } from "@/components/places/add-museum-form";
import { EditPlaygroundForm } from "@/components/places/edit-playground-form";
import { useAuth } from "@/hooks/use-auth";

export default function PlacesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { latitude, longitude } = useGeoLocation();
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
    queryKey: ['/api/places', latitude, longitude, activeTab],
  });
  
  const filteredPlaces = places?.filter(place => {
    // Filter by tab selection
    if (activeTab === 'restaurants' && place.type !== 'restaurant') return false;
    if (activeTab === 'playgrounds' && place.type !== 'playground') return false;
    if (activeTab === 'museums' && place.type !== 'museum') return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        place.name.toLowerCase().includes(searchLower) ||
        place.address.toLowerCase().includes(searchLower) ||
        (place.features && place.features.some(f => f.toLowerCase().includes(searchLower)))
      );
    }
    
    return true;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the filteredPlaces computation
  };
  
  // Define state for showing add restaurant form
  const [showAddRestaurantForm, setShowAddRestaurantForm] = useState(false);
  // Define state for showing add museum form
  const [showAddMuseumForm, setShowAddMuseumForm] = useState(false);
  // Define state for the edit playground dialog
  const [editPlaygroundOpen, setEditPlaygroundOpen] = useState(false);
  const [selectedPlayground, setSelectedPlayground] = useState<Place | null>(null);

  // Handler for edit button click
  const handleEditPlayground = (playground: Place) => {
    setSelectedPlayground(playground);
    setEditPlaygroundOpen(true);
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
          <h3 className="font-heading font-medium text-lg mb-2">{t('places.noPlacesFound')}</h3>
          <p className="text-dark/70 text-sm mb-4">
            {searchTerm 
              ? t('places.noResultsFor', { searchTerm }) 
              : t('places.noPlacesMatchingCriteria')}
          </p>
          {searchTerm && (
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
            >
              {t('places.clearSearch')}
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {filteredPlaces.map(place => (
          <PlaceCard 
            key={place.id} 
            place={place} 
            onEdit={place.type === 'playground' ? handleEditPlayground : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('places.placesForKids', 'Places for Kids')}</h1>
        <div className="flex gap-2">
          {user && activeTab === 'restaurants' && (
            <Button 
              onClick={() => setShowAddRestaurantForm(!showAddRestaurantForm)}
              className="flex items-center gap-1 text-sm"
              variant="default"
            >
              <i className={`fas fa-${showAddRestaurantForm ? 'times' : 'plus'} mr-1`}></i>
              {showAddRestaurantForm 
                ? t('places.cancel', 'Cancel') 
                : t('places.addRestaurant', 'Add Restaurant')}
            </Button>
          )}
          {user && activeTab === 'museums' && (
            <Button 
              onClick={() => setShowAddMuseumForm(!showAddMuseumForm)}
              className="flex items-center gap-1 text-sm"
              variant="default"
            >
              <i className={`fas fa-${showAddMuseumForm ? 'times' : 'plus'} mr-1`}></i>
              {showAddMuseumForm 
                ? t('places.cancel', 'Cancel') 
                : t('places.addMuseum', 'Add Museum')}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setLocation('/playground-map')}
            className="flex items-center gap-1 text-sm"
          >
            <i className="fas fa-map-marked-alt mr-1"></i>
            <span className="hidden sm:inline">{t('nav.playgroundMap')}</span>
            <span className="sm:hidden">{t('nav.map', 'Map')}</span>
          </Button>
        </div>
      </div>
      
      {/* Add Restaurant Form */}
      {user && showAddRestaurantForm && activeTab === 'restaurants' && (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">{t('places.addNewRestaurant', 'Add New Restaurant')}</h2>
          <AddRestaurantForm onSuccess={() => setShowAddRestaurantForm(false)} />
        </div>
      )}

      {/* Add Museum Form */}
      {user && showAddMuseumForm && activeTab === 'museums' && (
        <div className="mb-8 p-6 bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">{t('places.addNewMuseum', 'Add New Museum')}</h2>
          <AddMuseumForm onSuccess={() => setShowAddMuseumForm(false)} />
        </div>
      )}
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={t('places.searchPlaceholder', 'Search by name, location or features...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" className="bg-primary hover:bg-accent text-white">
            <i className="fas fa-search mr-2"></i> {t('common.search', 'Search')}
          </Button>
        </div>
      </form>
      
      {/* Tabs for filtering */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-6 w-full grid grid-cols-4">
          <TabsTrigger value="all" className="text-sm">{t('places.all')}</TabsTrigger>
          <TabsTrigger value="restaurants" className="text-sm">{t('places.restaurant')}</TabsTrigger>
          <TabsTrigger value="playgrounds" className="text-sm">{t('places.playground')}</TabsTrigger>
          <TabsTrigger value="museums" className="text-sm">{t('places.museum', 'Museums')}</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Places Grid */}
      {renderPlaceGrid()}
      
      {/* Edit Playground Dialog */}
      {selectedPlayground && (
        <EditPlaygroundForm
          playground={selectedPlayground}
          open={editPlaygroundOpen}
          onOpenChange={setEditPlaygroundOpen}
          onSuccess={() => {
            setEditPlaygroundOpen(false);
            setSelectedPlayground(null);
          }}
        />
      )}
    </div>
  );
}
