import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Place, Playdate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceCard } from "@/components/shared/place-card";
import { PlaydateCard } from "@/components/shared/playdate-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { MessageCircle, Calendar, MapPin, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UserProfileParams {
  id: string;
}

export default function UserProfilePage({ params }: { params?: UserProfileParams }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  
  // If params is undefined, extract ID from URL path
  let userId: number;
  if (params && params.id) {
    userId = parseInt(params.id);
  } else {
    // Extract ID from the URL path as fallback
    const pathMatch = location.match(/\/users\/(\d+)/);
    userId = pathMatch ? parseInt(pathMatch[1]) : NaN;
  }

  // Fetch the user's profile data
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !isNaN(userId),
  });

  // Fetch the user's favorite places
  const { data: favoritePlaces = [], isLoading: placesLoading } = useQuery<Place[]>({
    queryKey: [`/api/users/${userId}/favorite-places`],
    enabled: !isNaN(userId),
  });

  // Fetch the user's upcoming playdates
  const { data: upcomingPlaydates = [], isLoading: playdatesLoading } = useQuery<Playdate[]>({
    queryKey: [`/api/users/${userId}/playdates`],
    enabled: !isNaN(userId),
  });

  // Check if this is the current user's profile
  const isCurrentUser = currentUser?.id === userId;

  // Function to start a chat with this user
  const startChatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chats", {
        participants: [userId]
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Navigate to the chat page with the newly created chat
      navigate(`/chat?id=${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('chat.error', 'Error starting chat'),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle contact button click - start a chat
  const handleContactClick = () => {
    if (isCurrentUser) {
      // For current user, go to profile edit page
      navigate("/profile");
    } else {
      // For other users, start a chat
      startChatMutation.mutate();
    }
  };

  // If user is loading, show skeleton
  if (userLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="md:w-2/3">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  // If there was an error loading the user
  if (userError || !user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('errors.generic.title', 'Something went wrong')}</h2>
        <p className="mb-6">{t('errors.generic.message', 'An error occurred. Please try again later.')}</p>
        <Link href="/">
          <Button>{t('errors.notFound.backToHome', 'Back to Home')}</Button>
        </Link>
      </div>
    );
  }

  // Cache-busting function for profile images
  const getProfileImage = (imageUrl: string | null) => {
    if (!imageUrl) return "/avatar.png";
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // Add timestamp for cache-busting
    const timestamp = new Date().getTime();
    return `${imageUrl}?t=${timestamp}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Profile Image */}
        <div className="md:w-1/3">
          <div className="relative rounded-lg overflow-hidden shadow-md h-64">
            <img 
              src={getProfileImage(user.profileImage)} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-4 text-white">
              <div className="font-semibold text-sm flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> 
                {user.city || t('profile.locationUnknown', 'Location unknown')}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-1 font-heading">
            {user.firstName} {user.lastName}
          </h1>
          
          {/* Username */}
          <p className="text-muted-foreground mb-4">@{user.username}</p>
          
          {/* Bio */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 font-heading">{t('profile.bio', 'About Me')}</h2>
            <p className="text-dark/80 whitespace-pre-line">
              {user.bio || t('profile.noBio', 'This dad has not added a bio yet.')}
            </p>
          </div>
          
          {/* Children */}
          {user.childrenInfo && user.childrenInfo.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 font-heading">{t('profile.children', 'Children')}</h2>
              <div className="flex flex-wrap gap-2">
                {user.childrenInfo.map((child, index) => (
                  <span key={index} className="bg-accent/20 text-accent text-sm py-1 px-3 rounded-full">
                    {child.name}, {child.age} {t('profile.years', 'years')}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Contact Button */}
          <Button 
            className="bg-primary hover:bg-accent text-white transition-all duration-300 hover:scale-105"
            onClick={handleContactClick}
            disabled={startChatMutation.isPending}
          >
            {startChatMutation.isPending ? (
              <span className="flex items-center">
                <Skeleton className="h-4 w-4 rounded-full mr-2" />
                {t('common.loading', 'Loading...')}
              </span>
            ) : (
              <span className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                {isCurrentUser ? 
                  t('profile.editProfile', 'Edit Profile') : 
                  t('dads.contact', 'Contact')}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs for Playdates and Favorite Places */}
      <Tabs defaultValue="playdates" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="playdates" className="flex items-center justify-center">
            <Calendar className="w-4 h-4 mr-2" />
            {t('playdates.upcoming', 'Upcoming Playdates')}
          </TabsTrigger>
          <TabsTrigger value="places" className="flex items-center justify-center">
            <MapPin className="w-4 h-4 mr-2" />
            {t('dads.favoriteLocations', 'Favorite Places')}
          </TabsTrigger>
        </TabsList>
        
        {/* Playdates Tab */}
        <TabsContent value="playdates">
          {playdatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : upcomingPlaydates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingPlaydates.map(playdate => (
                <PlaydateCard 
                  key={playdate.id} 
                  playdate={playdate} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-medium text-lg mb-2">
                {t('playdates.noPlaydatesPlanned', 'No playdates planned')}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('playdates.checkBackLater', 'Check back later or invite this dad to one of your playdates!')}
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Places Tab */}
        <TabsContent value="places">
          {placesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : favoritePlaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoritePlaces.map(place => (
                <PlaceCard
                  key={place.id}
                  place={place}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-medium text-lg mb-2">
                {t('places.noFavoritesYet', 'No favorite places yet')}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('places.favoritesSoon', 'This dad hasn\'t saved any favorite places yet.')}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}