import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useLocation as useGeoLocation } from "@/hooks/use-location";

// Form schema for museum creation
const museumFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  address: z.string().min(3, { message: "Address is required" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrl: z.string().optional(),
  features: z.array(z.string()).default([]),
});

type MuseumFormValues = z.infer<typeof museumFormSchema>;

interface AddMuseumFormProps {
  onSuccess?: () => void;
}

export function AddMuseumForm({ onSuccess }: AddMuseumFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { latitude: userLat, longitude: userLng } = useGeoLocation();

  // Form definition
  const form = useForm<MuseumFormValues>({
    resolver: zodResolver(museumFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
      features: [],
    },
    mode: 'onChange',
  });

  // Use current location
  const handleUseCurrentLocation = () => {
    if (userLat && userLng) {
      form.setValue('latitude', userLat);
      form.setValue('longitude', userLng);
      toast({
        title: t('places.locationUpdated', 'Location Updated'),
        description: t('places.locationCoordinatesSet', 'Location coordinates have been set.'),
      });
    } else {
      toast({
        title: t('places.locationError', 'Location Error'),
        description: t('places.couldNotGetLocation', 'Could not get your current location.'),
        variant: "destructive",
      });
    }
  };

  // Available museum features
  const museumFeatures = [
    { id: 'interactive_exhibits', label: t('places.museumFeatures.interactiveExhibits', 'Interactive exhibits') },
    { id: 'audio_guides', label: t('places.museumFeatures.audioGuides', 'Audio guides') },
    { id: 'family_tours', label: t('places.museumFeatures.familyTours', 'Family tours') },
    { id: 'educational_programs', label: t('places.museumFeatures.educationalPrograms', 'Educational programs') },
    { id: 'gift_shop', label: t('places.museumFeatures.giftShop', 'Gift shop') },
    { id: 'cafe', label: t('places.museumFeatures.cafe', 'Cafe') },
    { id: 'wheelchair_accessible', label: t('places.museumFeatures.wheelchairAccessible', 'Wheelchair accessible') },
    { id: 'stroller_friendly', label: t('places.museumFeatures.strollerFriendly', 'Stroller friendly') },
  ];

  // Mutation for adding museum
  const addMuseumMutation = useMutation({
    mutationFn: async (data: MuseumFormValues & { type: string }) => {
      const response = await apiRequest('POST', '/api/places', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      toast({
        title: t('places.museumAdded', 'Museum Added'),
        description: t('places.museumAddedMessage', 'The museum has been added successfully.'),
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error adding museum:', error);
      toast({
        title: t('places.museumAddError', 'Error Adding Museum'),
        description: error.message || t('places.museumAddErrorMessage', 'There was an error adding the museum. Please try again.'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MuseumFormValues) => {
    const museumData = {
      name: data.name,
      type: "museum",
      description: data.description || "",
      address: data.address,
      latitude: (data.latitude || 0).toString(),
      longitude: (data.longitude || 0).toString(),
      features: data.features,
    };
    
    addMuseumMutation.mutate(museumData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('places.name', 'Museum Name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('places.museumNamePlaceholder', 'e.g. Children\'s Science Museum')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('places.description', 'Description')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('places.museumDescriptionPlaceholder', 'e.g. Interactive museum with hands-on exhibits for children')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('places.address', 'Address')}</FormLabel>
              <FormControl>
                <Input placeholder={t('places.addressPlaceholder', 'e.g. 123 Main St, Amsterdam')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('places.latitude', 'Latitude')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any"
                    placeholder="52.3676" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('places.longitude', 'Longitude')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any"
                    placeholder="4.9041" 
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="button" 
          variant="outline" 
          onClick={handleUseCurrentLocation}
          className="w-full"
        >
          <i className="fas fa-location-arrow mr-2"></i>
          {t('places.useMyLocation', 'Use My Current Location')}
        </Button>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('places.imageUrl', 'Image URL (Optional)')}</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/museum-image.jpg" {...field} />
              </FormControl>
              <FormDescription>
                {t('places.imageUrlHelp', 'Provide a URL to an image of the museum')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">{t('places.features', 'Features')}</FormLabel>
                <FormDescription>
                  {t('places.featuresHelp', 'Select all features available at this museum')}
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {museumFeatures.map((feature) => (
                  <FormField
                    key={feature.id}
                    control={form.control}
                    name="features"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={feature.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(feature.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, feature.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== feature.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {feature.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={addMuseumMutation.isPending}
        >
          {addMuseumMutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {t('places.adding', 'Adding...')}
            </>
          ) : (
            <>
              <i className="fas fa-plus mr-2"></i>
              {t('places.addMuseum', 'Add Museum')}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}