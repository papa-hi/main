import { Place } from "@shared/schema";
import { useState } from "react";
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
        toast({
          title: t('places.addedToFavorites', 'Added to favorites'),
          description: t('places.placeAddedToFavorites', '{{name}} has been added to your favorites.', {name: place.name}),
        });
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is iets misgegaan bij het bijwerken van je favorieten.",
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
              Restaurant
            </>
          ) : (
            <>
              <i className="fas fa-tree text-primary mr-1"></i>
              Speeltuin
            </>
          )}
        </div>
        <button 
          className={`absolute top-3 right-3 bg-white w-8 h-8 rounded-full flex items-center justify-center ${
            isSaved ? 'text-accent' : 'text-dark hover:text-accent'
          } transition`} 
          aria-label={isSaved ? "Remove from saved" : "Save"}
          onClick={toggleSave}
          disabled={isToggling}
        >
          <i className={isSaved ? "fas fa-heart" : "far fa-heart"}></i>
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
            {place.features.map((feature, index) => (
              <span key={index} className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-md">
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
