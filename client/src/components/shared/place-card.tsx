import { Place } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { StarRating } from "@/components/reviews/review-form";
import { useDistance } from "@/hooks/use-distance";

interface PlaceCardProps {
  place: Place;
  onEdit?: (place: Place) => void;
}

export function PlaceCard({ place, onEdit }: PlaceCardProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(place.isSaved);
  const [isToggling, setIsToggling] = useState(false);
  const [animateHeart, setAnimateHeart] = useState(false);
  
  // Calculate real distance from device location to place
  const { distance, isLoading: distanceLoading } = useDistance({
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address
  });
  
  // Effect to reset animation
  useEffect(() => {
    if (animateHeart) {
      const timer = setTimeout(() => {
        setAnimateHeart(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [animateHeart]);

  const toggleSave = async () => {
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      if (isSaved) {
        await apiRequest('DELETE', `/api/places/${place.id}/favorite`);
        setIsSaved(false);
        toast({
          title: t('places.removedFromFavorites', 'Removed from favorites'),
          description: t('places.placeRemovedFromFavorites', '{{name}} has been removed from your favorites.', {name: place.name}),
        });
      } else {
        await apiRequest('POST', `/api/places/${place.id}/favorite`);
        setIsSaved(true);
        setAnimateHeart(true); // Trigger animation when saving
        toast({
          title: t('places.addedToFavorites', 'Added to favorites'),
          description: t('places.placeAddedToFavorites', '{{name}} has been added to your favorites.', {name: place.name}),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('places.favoriteUpdateError', 'An error occurred while updating your favorites.'),
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm flex-shrink-0 w-64 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-md">
      <div className="relative">
        <img 
          src={place.imageUrl} 
          alt={place.name} 
          onError={(e) => {
            // If image fails to load, fallback to a default image
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite loop
            target.src = place.type === 'playground' 
              ? 'https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=500&auto=format&fit=crop'
              : place.type === 'museum'
              ? 'https://images.unsplash.com/photo-1566127992631-137a642a90f4?q=80&w=500&auto=format&fit=crop'
              : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80';
          }}
          className="w-full h-40 object-cover rounded-t-xl" 
        />
        <div className="absolute top-3 left-3 bg-white py-1 px-3 rounded-full text-xs font-medium">
          {place.type === 'restaurant' ? (
            <>
              <i className="fas fa-utensils text-primary mr-1"></i>
              {t('places.restaurant', 'Restaurant')}
            </>
          ) : place.type === 'museum' ? (
            <>
              <i className="fas fa-university text-primary mr-1"></i>
              {t('places.museum', 'Museums')}
            </>
          ) : (
            <>
              <i className="fas fa-tree text-primary mr-1"></i>
              {t('places.playground', 'Playground')}
            </>
          )}
        </div>
        <button 
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
            isSaved 
              ? 'bg-orange-500 text-white' 
              : 'bg-white text-orange-500 hover:bg-orange-50'
          } transition-all duration-200 transform hover:scale-110`} 
          aria-label={isSaved ? t('places.unsavePlace', 'Remove from saved') : t('places.savePlace', 'Save Place')}
          onClick={toggleSave}
          disabled={isToggling}
        >
          <i className={`
            ${isSaved ? "fas fa-heart" : "far fa-heart"} 
            text-lg
            ${animateHeart ? 'animate-heartbeat' : ''}
          `}></i>
        </button>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-medium text-base">{place.name}</h3>
          <div>
            {/* Show debug info */}
            <span className="text-xs text-gray-400 mr-2">
              {place.type === 'playground' ? '(P)' : '(R)'}
            </span>
            
            {/* Edit button */}
            {place.type === 'playground' && onEdit && (
              <button 
                onClick={() => onEdit(place)}
                className="bg-primary text-white px-2 py-1 rounded-md text-xs hover:bg-primary/80 transition-colors"
                aria-label={t('places.editPlace', 'Edit place')}
              >
                <i className="fas fa-edit text-xs mr-1"></i>
                Edit
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center text-sm text-dark/70 mb-2">
          <i className="fas fa-map-marker-alt mr-1 text-xs"></i>
          <span>{place.address}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-primary font-medium">
            {distanceLoading ? '...' : distance}
          </span>
        </div>
        {place.features && place.features.length > 0 && (
          <div className="flex flex-wrap mb-3 gap-1">
            {place.features.map((feature, index) => {
              // Determine which translation namespace to use based on place type
              const featureKey = place.type === 'restaurant' 
                ? `places.restaurantFeatures.${feature}` 
                : `places.playgroundFeatures.${feature}`;
              
              return (
                <span 
                  key={index} 
                  className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-md transform transition-all duration-200 hover:scale-105 hover:bg-primary/20 cursor-default"
                >
                  {t(featureKey, feature)}
                </span>
              );
            })}
          </div>
        )}
        {/* Rating moved to bottom */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <StarRating placeId={place.id} size="sm" showCount={true} />
        </div>
      </div>
    </div>
  );
}
