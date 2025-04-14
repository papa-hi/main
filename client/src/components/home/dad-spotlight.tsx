import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function DadSpotlight() {
  // Query featured dad from the API
  const { data: featuredDad, isLoading, error } = useQuery<User>({
    queryKey: ['/api/users/featured'],
  });

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">Vader Uitgelicht</h2>
          <Skeleton className="h-6 w-24" />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="md:flex">
            <Skeleton className="md:w-1/3 h-64" />
            <div className="p-6 md:w-2/3">
              <div className="flex items-center mb-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24 ml-3" />
              </div>
              <Skeleton className="h-24 w-full mb-4" />
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !featuredDad) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">Vader Uitgelicht</h2>
          <a href="#" className="text-primary text-sm font-medium hover:text-accent transition">Meer Papa's</a>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-dark/70">Op dit moment is er geen uitgelichte vader beschikbaar.</p>
        </div>
      </section>
    );
  }

  const handleContactClick = () => {
    // In a real app, this would open a chat or messaging interface
    console.log("Contact with featured dad requested");
  };

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">Vader Uitgelicht</h2>
        <a href="#" className="text-primary text-sm font-medium hover:text-accent transition">Meer Papa's</a>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <img 
              src={featuredDad.profileImage || "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80"} 
              alt={`${featuredDad.firstName} ${featuredDad.lastName}`} 
              className="w-full h-64 md:h-full object-cover"
            />
          </div>
          <div className="p-6 md:w-2/3">
            <div className="flex items-center mb-4">
              <h3 className="font-heading font-bold text-lg">
                {featuredDad.firstName} {featuredDad.lastName}
              </h3>
              <span className="bg-primary text-white text-xs py-1 px-2 rounded-full ml-3">
                {featuredDad.badge || "Actieve Papa"}
              </span>
            </div>
            <p className="text-dark/80 mb-4">{featuredDad.bio}</p>
            
            {featuredDad.favoriteLocations && featuredDad.favoriteLocations.length > 0 && (
              <div className="bg-primary/5 p-4 rounded-lg mb-4">
                <h4 className="font-heading font-medium text-sm mb-2">Favoriete plekken:</h4>
                <div className="flex flex-wrap gap-2">
                  {featuredDad.favoriteLocations.map((location, index) => (
                    <span key={index} className="bg-secondary/20 text-secondary text-xs py-1 px-2 rounded-md">
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              className="bg-primary text-white hover:bg-accent transition py-2 px-6 rounded-lg font-medium text-sm"
              onClick={handleContactClick}
            >
              Contact Opnemen
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DadSpotlight;
