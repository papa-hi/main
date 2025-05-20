import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Place } from '@shared/schema';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Sun, 
  Cloud, 
  CloudRain, 
  Thermometer, 
  Star, 
  Award, 
  AlertTriangle,
  Users,
  Home,
  Coffee,
  TreePine
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecommendationResponse {
  place: Place;
  score: number;
  reasons: string[];
}

export function ActivityRecommendations() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [coordinates, setCoordinates] = useState<{ latitude?: number; longitude?: number }>({});
  const [withChildren, setWithChildren] = useState(true);
  const [preferIndoor, setPreferIndoor] = useState(false);
  
  // Get user's current location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: t('errors.location.title', 'Location access failed'),
            description: t('errors.location.message', 'Please enable location services to get personalized recommendations'),
            variant: 'destructive',
          });
        }
      );
    }
  }, [toast, t]);

  // Fetch recommendations based on user's location and preferences
  const { data: recommendations, isLoading, error, refetch } = useQuery<RecommendationResponse[]>({
    queryKey: [
      '/api/recommendations', 
      coordinates.latitude, 
      coordinates.longitude, 
      withChildren, 
      preferIndoor
    ],
    enabled: !!coordinates.latitude && !!coordinates.longitude,
  });

  // Refresh recommendations when preferences change
  useEffect(() => {
    if (coordinates.latitude && coordinates.longitude) {
      refetch();
    }
  }, [withChildren, preferIndoor, refetch, coordinates]);

  // Get icon based on place type
  const getPlaceIcon = (place: Place) => {
    switch (place.type) {
      case 'restaurant':
        return <Coffee className="h-5 w-5 text-amber-500" />;
      case 'playground':
        return <TreePine className="h-5 w-5 text-green-500" />;
      default:
        return <MapPin className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Format reasons into a nice display
  const formatReasons = (reasons: string[]) => {
    return reasons.map((reason, index) => (
      <Badge key={index} variant="outline" className="mr-1 mb-1">
        {reason}
      </Badge>
    ));
  };

  if (isLoading) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">
            {t('home.recommendations', 'Activity Recommendations')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full mb-2" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">
            {t('home.recommendations', 'Activity Recommendations')}
          </h2>
        </div>
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              {t('errors.generic.title', 'Error Loading Recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('errors.generic.message', 'Failed to load activity recommendations. Please try again later.')}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => refetch()}>
              {t('common.retry', 'Retry')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // No recommendations available
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">
            {t('home.recommendations', 'Activity Recommendations')}
          </h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('home.noRecommendations', 'No recommendations available')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('home.enableLocationForRecommendations', 'Enable location services to get personalized activity recommendations for your area.')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show recommendation cards
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-heading font-bold">
          {t('home.recommendations', 'Activity Recommendations')}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="with-children"
              checked={withChildren}
              onCheckedChange={setWithChildren}
            />
            <Label htmlFor="with-children" className="text-sm">
              <Users className="h-3.5 w-3.5 inline mr-1" />
              {t('recommendations.withChildren', 'With children')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="prefer-indoor"
              checked={preferIndoor}
              onCheckedChange={setPreferIndoor}
            />
            <Label htmlFor="prefer-indoor" className="text-sm">
              <Home className="h-3.5 w-3.5 inline mr-1" />
              {t('recommendations.preferIndoor', 'Prefer indoor')}
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.slice(0, 3).map((recommendation) => (
          <Card key={recommendation.place.id} className="hover:shadow-md transition-shadow overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    {getPlaceIcon(recommendation.place)}
                    <span className="ml-2">{recommendation.place.name}</span>
                  </CardTitle>
                  <CardDescription>
                    {recommendation.place.type.charAt(0).toUpperCase() + recommendation.place.type.slice(1)}
                    {recommendation.place.distance && (
                      <span className="ml-2">• {recommendation.place.distance.toFixed(1)} km</span>
                    )}
                  </CardDescription>
                </div>
                <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center">
                  {recommendation.score}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {recommendation.place.description || t('places.noDescription', 'No description available')}
              </p>
              <div className="flex flex-wrap">
                {formatReasons(recommendation.reasons)}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href={`https://maps.google.com/?q=${recommendation.place.address}`} target="_blank" rel="noopener noreferrer">
                  <MapPin className="mr-2 h-4 w-4" />
                  {t('places.viewLocation', 'View Location')}
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ActivityRecommendations;