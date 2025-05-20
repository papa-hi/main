import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// Type for featured user response
interface FeaturedUserResponse extends User {
  favoriteLocations: string[];
  hasSetFavorites: boolean;
  hasChildrenInfo: boolean;
}

export function DadSpotlight() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Query featured dad from the API with refetch interval for rotating dads
  const { data: featuredDad, isLoading, error, refetch } = useQuery<FeaturedUserResponse>({
    queryKey: ['/api/users/featured'],
    refetchInterval: 300000, // Refetch every 5 minutes for variety
  });

  // Function to add cache-busting parameter to image URLs
  const getProfileImage = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500&q=80";
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // Add timestamp for cache-busting
    const timestamp = new Date().getTime();
    return `${imageUrl}?t=${timestamp}`;
  };

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">{t('home.dadSpotlight', 'Dad Spotlight')}</h2>
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
          <h2 className="text-xl font-heading font-bold">{t('home.dadSpotlight', 'Dad Spotlight')}</h2>
          <Link href="/discover" className="text-primary text-sm font-medium hover:text-accent transition">
            {t('dads.moreDads', 'More Dads')}
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-dark/70">{t('dads.noFeaturedDadAvailable', 'No featured dad is currently available.')}</p>
        </div>
      </section>
    );
  }

  // Navigate to the user's profile page, which will have a contact/messaging option
  const handleContactClick = () => {
    if (featuredDad && featuredDad.id) {
      navigate(`/users/${featuredDad.id}`);
    }
  };

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">{t('home.dadSpotlight', 'Dad Spotlight')}</h2>
        <Link href="/discover" className="text-primary text-sm font-medium hover:text-accent transition">
          {t('dads.moreDads', 'More Dads')}
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="md:flex">
          <div className="md:w-1/3 relative group">
            <img 
              src={getProfileImage(featuredDad.profileImage)} 
              alt={`${featuredDad.firstName} ${featuredDad.lastName}`} 
              className="w-full h-64 md:h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div className="p-6 md:w-2/3">
            <div className="flex flex-wrap items-center mb-4">
              <h3 className="font-heading font-bold text-lg mr-3">
                {featuredDad.firstName} {featuredDad.lastName}
              </h3>
              <span className="bg-primary text-white text-xs py-1 px-2 rounded-full">
                {t('dads.activeDad', 'Active Dad')}
              </span>
            </div>
            <p className="text-dark/80 mb-4 line-clamp-3">{featuredDad.bio || t('profile.noBio', 'This dad has not added a bio yet.')}</p>
            
            {/* Children information only if user has real children data */}
            {featuredDad.hasChildrenInfo && featuredDad.childrenInfo && featuredDad.childrenInfo.length > 0 && (
              <div className="bg-primary/5 p-3 rounded-lg mb-4">
                <h4 className="font-heading font-medium text-sm mb-2">{t('profile.children', 'Children:')}</h4>
                <div className="flex flex-wrap gap-2">
                  {featuredDad.childrenInfo.map((child, index) => (
                    <span key={index} className="bg-accent/20 text-accent text-xs py-1 px-2 rounded-md">
                      {child.name}, {child.age} {t('profile.years', 'years')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Favorite locations - only show if user has explicitly set favorites */}
            {featuredDad.hasSetFavorites && featuredDad.favoriteLocations && featuredDad.favoriteLocations.length > 0 ? (
              <div className="bg-primary/5 p-3 rounded-lg mb-4">
                <h4 className="font-heading font-medium text-sm mb-2">{t('dads.favoriteLocations', 'Favorite locations:')}</h4>
                <div className="flex flex-wrap gap-2">
                  {featuredDad.favoriteLocations.map((location, index) => (
                    <span key={index} className="bg-secondary/20 text-secondary text-xs py-1 px-2 rounded-md">
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            
            <Button 
              className="bg-primary text-white hover:bg-accent transition-all duration-300 py-2 px-6 rounded-lg font-medium text-sm hover:scale-105"
              onClick={handleContactClick}
            >
              {t('dads.contact', 'Contact')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DadSpotlight;
