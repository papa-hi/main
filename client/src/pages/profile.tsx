import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Playdate, Place } from "@shared/schema";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceCard } from "@/components/shared/place-card";
import { PlaydateCard } from "@/components/shared/playdate-card";
import { useLocation } from "wouter";
import { Plus, Trash2, Baby, Users, Heart, X, RefreshCw, Settings, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { NotificationSettings } from "@/components/notifications/notification-settings";

type EditProfileFormValues = {
  firstName: string;
  lastName: string;
  bio: string;
  email: string;
  phoneNumber?: string;
  city: string;
  childrenInfo?: { name: string; age: number }[];
};

interface DadMatch {
  id: number;
  dadId1: number;
  dadId2: number;
  matchScore: number;
  distanceKm: number;
  commonAgeRanges: Array<{ minAge: number; maxAge: number; overlap: number }>;
  matchStatus: string;
  createdAt: string;
  dad1: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city: string | null;
    childrenInfo: Array<{ name: string; age: number }> | null;
  };
  dad2: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city: string | null;
    childrenInfo: Array<{ name: string; age: number }> | null;
  };
}

interface MatchPreferences {
  id: number;
  userId: number;
  maxDistanceKm: number;
  ageFlexibility: number;
  isEnabled: boolean;
  lastMatchRun: string | null;
}

function DadMatchesSection() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch matches
  const { data: matches = [], isLoading: matchesLoading, refetch: refetchMatches } = useQuery<DadMatch[]>({
    queryKey: ["/api/matches"],
    queryFn: () => apiRequest("GET", "/api/matches")
  });

  // Fetch preferences
  const { data: preferences, isLoading: preferencesLoading, refetch: refetchPreferences } = useQuery<MatchPreferences>({
    queryKey: ["/api/match-preferences"],
    queryFn: () => apiRequest("GET", "/api/match-preferences")
  });

  // Run matching mutation
  const runMatchingMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/matches/run"),
    onSuccess: (data: any) => {
      toast({
        title: "Matches Updated",
        description: `Found ${data.newMatches || 0} new matches!`
      });
      refetchMatches();
      refetchPreferences();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to find matches",
        variant: "destructive"
      });
    }
  });

  // Update match status mutation
  const updateMatchMutation = useMutation({
    mutationFn: ({ matchId, status }: { matchId: number; status: 'accepted' | 'declined' }) =>
      apiRequest("PATCH", `/api/matches/${matchId}`, { status }),
    onSuccess: () => {
      toast({
        title: "Match Updated",
        description: "Match status updated successfully"
      });
      refetchMatches();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update match",
        variant: "destructive"
      });
    }
  });

  const getOtherDad = (match: DadMatch, currentUserId: number) => {
    return match.dadId1 === currentUserId ? match.dad2 : match.dad1;
  };

  const canRunMatching = user?.city && user?.childrenInfo && user?.childrenInfo.length > 0;

  if (matchesLoading || preferencesLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Requirements Check */}
      {!canRunMatching && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Complete Your Profile</h3>
                <p className="text-sm text-amber-700 mt-1">
                  To find dad matches, please add your city and children's information to your profile.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences Card */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Match Preferences
            </CardTitle>
            <CardDescription>
              Your current matching settings and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Max Distance:</span>
                <span className="ml-2">{preferences.maxDistanceKm}km</span>
              </div>
              <div>
                <span className="font-medium">Age Flexibility:</span>
                <span className="ml-2">±{preferences.ageFlexibility} years</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={() => runMatchingMutation.mutate()}
                disabled={runMatchingMutation.isPending || !canRunMatching}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${runMatchingMutation.isPending ? 'animate-spin' : ''}`} />
                {runMatchingMutation.isPending ? "Finding Matches..." : "Find New Matches"}
              </Button>
            </div>
            
            {preferences.lastMatchRun && (
              <p className="text-sm text-gray-500 mt-2">
                Last match run: {new Date(preferences.lastMatchRun).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Matches List */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Yet</h3>
            <p className="text-gray-600 mb-4">
              {!canRunMatching 
                ? "Complete your profile to start finding dad matches."
                : "We haven't found any dad matches for you yet. Click 'Find New Matches' to discover connections."
              }
            </p>
            {canRunMatching && (
              <Button onClick={() => runMatchingMutation.mutate()}>
                Find My First Matches
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const otherDad = getOtherDad(match, user?.id || 0);
            const isPending = match.matchStatus === 'pending';
            
            return (
              <Card key={match.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Dad Profile */}
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={otherDad.profileImage || ""} />
                        <AvatarFallback className="text-lg">
                          {otherDad.firstName[0]}{otherDad.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {otherDad.firstName} {otherDad.lastName}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {otherDad.city}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>~{Math.round(match.distanceKm)}km away</span>
                          </div>
                        </div>
                        
                        {/* Children Info */}
                        {otherDad.childrenInfo && otherDad.childrenInfo.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Baby className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Children:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {otherDad.childrenInfo.map((child: any, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {child.name} ({child.age}y)
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Match Details */}
                        <div className="mt-3">
                          <Badge variant="secondary" className="text-xs">
                            {match.matchScore}% match
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {isPending && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                          size="sm"
                          onClick={() => updateMatchMutation.mutate({ 
                            matchId: match.id, 
                            status: 'accepted' 
                          })}
                          disabled={updateMatchMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Heart className="h-4 w-4" />
                          Accept
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMatchMutation.mutate({ 
                            matchId: match.id, 
                            status: 'declined' 
                          })}
                          disabled={updateMatchMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    )}
                    
                    {!isPending && (
                      <div className="flex items-center">
                        <Badge 
                          variant={match.matchStatus === 'accepted' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {match.matchStatus}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logoutMutation } = useAuth();
  
  // Profile editing form schema with translations
  const editProfileSchema = z.object({
    firstName: z.string().min(2, {
      message: t('profile.firstNameMinLength', 'First name must contain at least 2 characters'),
    }),
    lastName: z.string().min(2, {
      message: t('profile.lastNameMinLength', 'Last name must contain at least 2 characters'),
    }),
    bio: z.string().max(500, {
      message: t('profile.bioMaxLength', 'Bio may contain at most 500 characters'),
    }),
    email: z.string().email({
      message: t('profile.validEmail', 'Please enter a valid email address'),
    }),
    phoneNumber: z.string().optional(),
    city: z.string().min(2, {
      message: t('profile.cityMinLength', 'City must contain at least 2 characters'),
    }),
    childrenInfo: z.array(z.object({
      name: z.string().min(1, 'Child name is required'),
      age: z.number().min(0).max(18, 'Age must be between 0 and 18'),
    })).optional(),
  });
  
  // Fetch user profile data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users/me'],
  });
  
  // Fetch user's favorite places
  const { data: favoritePlaces = [], isLoading: placesLoading } = useQuery<Place[]>({
    queryKey: ['/api/users/me/favorite-places'],
  });
  
  // Fetch user's created playdates
  const { data: createdPlaydates = [], isLoading: playdatesLoading } = useQuery<Playdate[]>({
    queryKey: ['/api/users/me/playdates'],
  });
  
  // Function to handle account deletion
  const handleDeleteAccount = () => {
    setIsDeleteConfirmOpen(true);
  };
  
  // Function to perform the actual account deletion
  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json().catch(() => null);
      
      if (!response.ok) {
        console.error('Delete account response:', response.status, data);
        throw new Error(data?.message || 'Failed to delete account');
      }
      
      toast({
        title: t('profile.accountDeleted', 'Account deleted'),
        description: t('profile.accountDeletedDesc', 'Your account has been successfully deleted.'),
      });
      
      // Logout the user
      await logoutMutation.mutateAsync();
      
      // Redirect to home page
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Fout bij verwijderen",
        description: `Er is iets misgegaan bij het verwijderen van je account: ${error?.message || String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };
  
  // Form setup for profile editing
  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      bio: user?.bio || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      city: user?.city || "",
      childrenInfo: user?.childrenInfo || [],
    },
  });

  // Field array for managing children info
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "childrenInfo",
  });
  
  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || "",
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        city: user.city || "",
        childrenInfo: user.childrenInfo || [],
      });
    }
  }, [user, form]);
  
  // Handle profile image selection
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 8MB)
      if (file.size > 8 * 1024 * 1024) {
        toast({
          title: "Bestand te groot",
          description: "Maximale bestandsgrootte is 8MB",
          variant: "destructive"
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ongeldig bestandstype",
          description: "Alleen afbeeldingsbestanden zijn toegestaan",
          variant: "destructive"
        });
        return;
      }
      
      setProfileImage(file);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  const onSubmit = async (data: EditProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      // First update the profile data via the regular API
      await apiRequest('PATCH', '/api/users/me', data);
      
      // If there's a profile image, upload it
      if (profileImage) {
        const formData = new FormData();
        formData.append('profileImage', profileImage);
        
        const response = await fetch('/api/users/me/profile-image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload profile image');
        }
      }
      
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profielinformatie is succesvol bijgewerkt.",
      });
      
      // Reset the states
      setProfileImage(null);
      setPreviewUrl(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is iets misgegaan bij het bijwerken van je profiel.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (userLoading) {
    return (
      <div className="py-2">
        <div className="mb-6">
          <Skeleton className="h-10 w-40 mb-2" />
          <Skeleton className="h-5 w-60" />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="md:flex">
            <Skeleton className="w-full md:w-1/3 h-64" />
            <div className="p-6 md:w-2/3">
              <Skeleton className="h-8 w-48 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-5" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="py-2">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          Kon gebruikersprofiel niet laden. Probeer later nog eens.
        </div>
      </div>
    );
  }
  
  // Render profile view
  const renderProfileView = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3">
          {/* Use a direct image with cache-busting parameter to avoid caching issues */}
          <img 
            src={`${user.profileImage}?t=${new Date().getTime()}`} 
            alt={`${user.firstName} ${user.lastName}`} 
            className="w-full h-64 md:h-full object-cover"
            onError={(e) => {
              // On error, replace with a default image
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.src = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80";
            }}
          />
        </div>
        <div className="p-6 md:w-2/3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-heading font-bold text-2xl mb-1">
                {user.firstName} {user.lastName}
              </h2>
              {user.city && (
                <p className="text-dark/70 flex items-center mb-4">
                  <i className="fas fa-map-marker-alt mr-2"></i> {user.city}
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1"
            >
              <i className="fas fa-edit"></i> {t('profile.edit', 'Edit')}
            </Button>
          </div>
          
          <h3 className="font-heading font-medium text-lg mb-2">{t('profile.aboutMe', 'About me')}</h3>
          <p className="text-dark/80 mb-4">
            {user.bio || t('profile.noBio', 'No bio set. Click edit to add information about yourself.')}
          </p>
          
          {user.childrenInfo && user.childrenInfo.length > 0 && (
            <div className="mb-4">
              <h3 className="font-heading font-medium text-lg mb-2">{t('profile.myChildren', 'My children')}</h3>
              <div className="flex flex-wrap gap-2">
                {user.childrenInfo.map((child, index) => (
                  <div key={index} className="bg-primary/5 p-2 rounded-lg flex items-center">
                    <i className="fas fa-child text-primary mr-2"></i>
                    <span>{child.name} ({child.age} {t('profile.yearsOld', 'years old')})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {user.favoriteLocations && user.favoriteLocations.length > 0 && (
            <div>
              <h3 className="font-heading font-medium text-lg mb-2">Favoriete plekken</h3>
              <div className="flex flex-wrap gap-2">
                {user.favoriteLocations.map((location, index) => (
                  <span key={index} className="bg-secondary/20 text-secondary text-xs py-1 px-2 rounded-md">
                    {location}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render profile edit form
  const renderProfileEditForm = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-bold text-xl">{t('profile.editProfile', 'Edit Profile')}</h2>
        <Button 
          variant="outline" 
          onClick={() => setIsEditing(false)}
          disabled={isSubmitting}
        >
          {t('profile.cancel', 'Cancel')}
        </Button>
      </div>
      
      {/* Profile Image Upload */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Profielfoto</h3>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="relative w-32 h-32 overflow-hidden rounded-lg border border-input">
            <img 
              src={previewUrl || user.profileImage || "https://via.placeholder.com/150?text=Profielfoto"} 
              alt="Profielfoto" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Upload een afbeelding (max. 8MB). Formaten: JPEG, PNG, GIF.
            </p>
          </div>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.firstName', 'First Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('profile.firstName', 'First Name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.lastName', 'Last Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('profile.lastName', 'Last Name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('profile.bio', 'Bio')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('profile.bioPlaceholder', 'Tell something about yourself and your children...')}
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Maximaal 500 tekens
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.email', 'Email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('profile.emailAddress', 'Email address')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.phoneNumber', 'Phone Number')} ({t('profile.optional', 'optional')})</FormLabel>
                  <FormControl>
                    <Input placeholder={t('profile.phoneNumber', 'Phone Number')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('profile.city', 'City')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('profile.cityPlaceholder', 'e.g. Amsterdam')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Children Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('profile.childrenInfo', 'Children Information')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('profile.childrenInfoDescription', 'Add your children\'s names and ages to help other parents find suitable playdates.')}
            </p>
            
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                {t('profile.noChildrenAdded', 'No children added yet.')}
              </p>
            )}
            
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-end p-4 border rounded-lg bg-muted/30">
                <FormField
                  control={form.control}
                  name={`childrenInfo.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t('profile.childName', 'Child Name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('profile.childNamePlaceholder', 'e.g. Emma')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`childrenInfo.${index}.age`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>{t('profile.age', 'Age')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="18"
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ name: "", age: 0 })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('profile.addChild', 'Add Child')}
            </Button>
          </div>
          
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isSubmitting}
            >
              <i className="fas fa-trash-alt mr-2"></i> {t('profile.deleteAccount', 'Delete Account')}
            </Button>
            
            <Button 
              type="submit" 
              className="bg-primary hover:bg-accent text-white" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i> {t('profile.saving', 'Saving...')}</>
              ) : (
                <>{t('profile.saveProfile', 'Save Profile')}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
  
  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('profile.myProfile', 'My Profile')}</h1>
        <p className="text-muted-foreground">{t('profile.manageInfo', 'Manage your personal information')}</p>
      </div>
      
      {isEditing ? renderProfileEditForm() : renderProfileView()}
      
      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.deleteAccountTitle', 'Delete Account?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.deleteAccountWarning', 'Are you sure you want to delete your account? This action cannot be undone. All your data, including your playdates and messages, will be permanently deleted.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('profile.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteAccount();
              }}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i> {t('profile.deleting', 'Deleting...')}</>
              ) : (
                <>{t('profile.deleteAccount', 'Delete Account')}</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Tabs for favorite places and created playdates */}
      <div className="mt-8">
        <Tabs defaultValue="playdates">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="playdates">{t('profile.myPlaydates', 'My Playdates')}</TabsTrigger>
            <TabsTrigger value="places">{t('profile.favoritePlaces', 'Favorite Places')}</TabsTrigger>
            <TabsTrigger value="matches">Dad Matches</TabsTrigger>
            <TabsTrigger value="notifications">{t('profile.notifications', 'Notifications')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="playdates" className="mt-4">
            {playdatesLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : createdPlaydates && createdPlaydates.length > 0 ? (
              <div className="space-y-4">
                {createdPlaydates.map((playdate) => (
                  <div key={playdate.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-14 h-14 bg-accent/10 rounded-lg flex flex-col items-center justify-center mr-4">
                        <span className="text-accent font-bold text-lg">{playdate.startTime ? new Date(playdate.startTime).getDate() : ''}</span>
                        <span className="text-accent text-xs uppercase">
                          {playdate.startTime ? new Date(playdate.startTime).toLocaleString('nl-NL', { month: 'short' }) : ''}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading font-medium text-base mb-1">{playdate.title}</h3>
                        <div className="flex items-center text-sm text-dark/70 mb-2">
                          <i className="fas fa-clock mr-1 text-xs"></i>
                          <span>
                            {playdate.startTime && new Date(playdate.startTime).toLocaleTimeString('nl-NL', {hour: '2-digit', minute:'2-digit'})} - 
                            {playdate.endTime && new Date(playdate.endTime).toLocaleTimeString('nl-NL', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <i className="fas fa-map-marker-alt ml-3 mr-1 text-xs"></i>
                          <span>{playdate.location}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          <span className="text-xs text-dark/60">
                            {playdate.participants.length} / {playdate.maxParticipants} deelnemers
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                            onClick={() => navigate(`/edit-playdate/${playdate.id}`)}
                          >
                            <i className="fas fa-edit"></i> Bewerken
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="text-xs flex items-center gap-1"
                            onClick={async () => {
                              if (window.confirm('Weet je zeker dat je deze speelafspraak wilt verwijderen?')) {
                                try {
                                  const response = await fetch(`/api/playdates/${playdate.id}`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                  });
                                  
                                  if (response.ok) {
                                    toast({
                                      title: "Speelafspraak verwijderd",
                                      description: "De speelafspraak is succesvol verwijderd.",
                                    });
                                    
                                    // Refresh the data by invalidating the query
                                    queryClient.invalidateQueries({ queryKey: ['/api/users/me/playdates'] });
                                  } else {
                                    throw new Error('Fout bij verwijderen');
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Fout",
                                    description: "Er is iets misgegaan bij het verwijderen van de speelafspraak.",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <i className="fas fa-trash-alt"></i> Verwijderen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <h3 className="font-heading font-medium text-lg mb-2">{t('profile.noPlaydatesPlanned', 'No playdates planned')}</h3>
                <p className="text-dark/70 text-sm mb-4">{t('profile.noPlaydatesMade', 'You haven\'t made any playdates yet.')}</p>
                <Button 
                  className="bg-primary text-white hover:bg-accent transition"
                  onClick={() => navigate("/create")}
                >
                  {t('profile.newPlaydate', 'New Playdate')}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="places" className="mt-4">
            {placesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : favoritePlaces && favoritePlaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoritePlaces.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <h3 className="font-heading font-medium text-lg mb-2">Geen favoriete plekken</h3>
                <p className="text-dark/70 text-sm mb-4">Je hebt nog geen plekken als favoriet gemarkeerd.</p>
                <Button 
                  className="bg-primary text-white hover:bg-accent transition"
                  onClick={() => navigate("/places")}
                >
                  Plekken Ontdekken
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="mt-4">
            <DadMatchesSection />
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
