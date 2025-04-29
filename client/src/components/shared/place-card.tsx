import { Place } from "@shared/schema";
import { useState, useEffect } from "react";
import { getFormattedDistance } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSaved, setIsSaved] = useState(place.isSaved);
  const [isToggling, setIsToggling] = useState(false);
  const [animateHeart, setAnimateHeart] = useState(false);
  
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
    <div className="bg-white rounded-xl shadow-sm flex-shrink-0 w-64">
      <div className="relative">
        <img 
          src={place.imageUrl} 
          alt={place.name} 
          className="w-full h-40 object-cover rounded-t-xl" 
        />
        <div className="absolute top-3 left-3 bg-white py-1 px-3 rounded-full text-xs font-medium">
          {place.type === 'restaurant' ? (
            <>
              <i className="fas fa-utensils text-primary mr-1"></i>
              {t('places.restaurant', 'Restaurant')}
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
        <h3 className="font-heading font-medium text-base mb-1">{place.name}</h3>
        <div className="flex items-center text-sm text-dark/70 mb-2">
          <i className="fas fa-map-marker-alt mr-1 text-xs"></i>
          <span>{place.address}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-star text-accent text-xs mr-1"></i>
            <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
            <span className="text-sm text-dark/70 ml-1">({place.reviewCount})</span>
          </div>
          <span className="text-sm text-primary font-medium">
            {getFormattedDistance(place.distance)}
          </span>
        </div>
        {place.features && place.features.length > 0 && (
          <div className="flex flex-wrap mt-2 gap-1">
            {place.features.map((feature, index) => {
              // Determine which translation namespace to use based on place type
              const featureKey = place.type === 'restaurant' 
                ? `places.restaurantFeatures.${feature}` 
                : `places.playgroundFeatures.${feature}`;
              
              return (
                <span key={index} className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-md">
                  {t(featureKey, feature)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
