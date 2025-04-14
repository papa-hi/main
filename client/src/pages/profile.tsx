import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceCard } from "@/components/shared/place-card";
import { PlaydateCard } from "@/components/shared/playdate-card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Profile editing form schema
const editProfileSchema = z.object({
  firstName: z.string().min(2, {
    message: "Voornaam moet minimaal 2 tekens bevatten",
  }),
  lastName: z.string().min(2, {
    message: "Achternaam moet minimaal 2 tekens bevatten",
  }),
  bio: z.string().max(500, {
    message: "Bio mag maximaal 500 tekens bevatten",
  }),
  email: z.string().email({
    message: "Voer een geldig e-mailadres in",
  }),
  phoneNumber: z.string().optional(),
  city: z.string().min(2, {
    message: "Stad moet minimaal 2 tekens bevatten",
  }),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user profile data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users/me'],
  });
  
  // Fetch user's favorite places
  const { data: favoritePlaces, isLoading: placesLoading } = useQuery({
    queryKey: ['/api/users/me/favorite-places'],
  });
  
  // Fetch user's created playdates
  const { data: createdPlaydates, isLoading: playdatesLoading } = useQuery({
    queryKey: ['/api/users/me/playdates'],
  });
  
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
    },
  });
  
  // Update form values when user data is loaded
  useState(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || "",
        email: user.email,
        phoneNumber: user.phoneNumber || "",
        city: user.city || "",
      });
    }
  });
  
  const onSubmit = async (data: EditProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest('PATCH', '/api/users/me', data);
      
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profielinformatie is succesvol bijgewerkt.",
      });
      
      setIsEditing(false);
    } catch (error) {
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
          <img 
            src={user.profileImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80"} 
            alt={`${user.firstName} ${user.lastName}`} 
            className="w-full h-64 md:h-full object-cover"
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
              <i className="fas fa-edit"></i> Bewerken
            </Button>
          </div>
          
          <h3 className="font-heading font-medium text-lg mb-2">Over mij</h3>
          <p className="text-dark/80 mb-4">
            {user.bio || "Geen bio ingesteld. Klik op bewerken om informatie over jezelf toe te voegen."}
          </p>
          
          {user.childrenInfo && user.childrenInfo.length > 0 && (
            <div className="mb-4">
              <h3 className="font-heading font-medium text-lg mb-2">Mijn kinderen</h3>
              <div className="flex flex-wrap gap-2">
                {user.childrenInfo.map((child, index) => (
                  <div key={index} className="bg-primary/5 p-2 rounded-lg flex items-center">
                    <i className="fas fa-child text-primary mr-2"></i>
                    <span>{child.name} ({child.age} jaar)</span>
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
        <h2 className="font-heading font-bold text-xl">Profiel Bewerken</h2>
        <Button 
          variant="outline" 
          onClick={() => setIsEditing(false)}
          disabled={isSubmitting}
        >
          Annuleren
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voornaam</FormLabel>
                  <FormControl>
                    <Input placeholder="Voornaam" {...field} />
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
                  <FormLabel>Achternaam</FormLabel>
                  <FormControl>
                    <Input placeholder="Achternaam" {...field} />
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
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Vertel iets over jezelf en je kinderen..."
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
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="E-mailadres" {...field} />
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
                  <FormLabel>Telefoonnummer (optioneel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefoonnummer" {...field} />
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
                <FormLabel>Woonplaats</FormLabel>
                <FormControl>
                  <Input placeholder="Bijv. 'Amsterdam'" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-accent text-white" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i> Opslaan...</>
              ) : (
                <>Profiel Opslaan</>
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
        <h1 className="text-2xl font-heading font-bold">Mijn Profiel</h1>
        <p className="text-muted-foreground">Beheer je persoonlijke informatie</p>
      </div>
      
      {isEditing ? renderProfileEditForm() : renderProfileView()}
      
      {/* Tabs for favorite places and created playdates */}
      <div className="mt-8">
        <Tabs defaultValue="playdates">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="playdates">Mijn Speelafspraken</TabsTrigger>
            <TabsTrigger value="places">Favoriete Plekken</TabsTrigger>
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
                  <PlaydateCard key={playdate.id} playdate={playdate} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <h3 className="font-heading font-medium text-lg mb-2">Geen speelafspraken gepland</h3>
                <p className="text-dark/70 text-sm mb-4">Je hebt nog geen speelafspraken gemaakt.</p>
                <Button className="bg-primary text-white hover:bg-accent transition">
                  Nieuwe Afspraak
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
                <Button className="bg-primary text-white hover:bg-accent transition">
                  Plekken Ontdekken
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
