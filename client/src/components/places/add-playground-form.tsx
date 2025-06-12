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

// Form schema for playground creation
const playgroundFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  address: z.string().min(3, { message: "Address is required" }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  features: z.array(z.string()).default([]),
});

type PlaygroundFormValues = z.infer<typeof playgroundFormSchema>;

interface AddPlaygroundFormProps {
  onSuccess?: () => void;
}

export function AddPlaygroundForm({ onSuccess }: AddPlaygroundFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { latitude: userLat, longitude: userLng } = useGeoLocation();

  // Form definition
  const form = useForm<PlaygroundFormValues>({
    resolver: zodResolver(playgroundFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      latitude: userLat || 0,
      longitude: userLng || 0,
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

  // Available playground features
  const playgroundFeatures = [
    { id: 'swings', label: t('places.playgroundFeatures.swings', 'Swings') },
    { id: 'slides', label: t('places.playgroundFeatures.slides', 'Slides') },
    { id: 'climbing_equipment', label: t('places.playgroundFeatures.climbingEquipment', 'Climbing equipment') },
    { id: 'sandbox', label: t('places.playgroundFeatures.sandbox', 'Sandbox') },
    { id: 'seesaw', label: t('places.playgroundFeatures.seesaw', 'Seesaw') },
    { id: 'spring_riders', label: t('places.playgroundFeatures.springRiders', 'Spring riders') },
    { id: 'basketball_court', label: t('places.playgroundFeatures.basketballCourt', 'Basketball court') },
    { id: 'soccer_field', label: t('places.playgroundFeatures.soccerField', 'Soccer field') },
    { id: 'picnic_tables', label: t('places.playgroundFeatures.picnicTables', 'Picnic tables') },
    { id: 'benches', label: t('places.playgroundFeatures.benches', 'Benches') },
    { id: 'restrooms', label: t('places.playgroundFeatures.restrooms', 'Restrooms') },
    { id: 'parking', label: t('places.playgroundFeatures.parking', 'Parking available') },
    { id: 'shade', label: t('places.playgroundFeatures.shade', 'Shade/covered areas') },
    { id: 'fenced', label: t('places.playgroundFeatures.fenced', 'Fenced area') },
    { id: 'water_features', label: t('places.playgroundFeatures.waterFeatures', 'Water features') },
  ];

  // Mutation for adding playground
  const addPlaygroundMutation = useMutation({
    mutationFn: async (data: PlaygroundFormValues & { type: string }) => {
      const response = await apiRequest('POST', '/api/places', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      toast({
        title: t('places.playgroundAdded', 'Playground Added'),
        description: t('places.playgroundAddedMessage', 'The playground has been added successfully.'),
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error adding playground:', error);
      toast({
        title: t('places.playgroundAddError', 'Error Adding Playground'),
        description: error.message || t('places.playgroundAddErrorMessage', 'There was an error adding the playground. Please try again.'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlaygroundFormValues) => {
    addPlaygroundMutation.mutate({
      ...data,
      type: 'playground',
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('places.playgroundName', 'Playground Name')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('places.playgroundNamePlaceholder', 'Enter playground name')} 
                  {...field} 
                />
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
                <Textarea
                  placeholder={t('places.playgroundDescriptionPlaceholder', 'Describe the playground, its equipment, and what makes it special...')}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('places.descriptionOptional', 'Optional: Help other parents know what to expect')}
              </FormDescription>
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
                <Input 
                  placeholder={t('places.addressPlaceholder', 'Enter the full address')} 
                  {...field} 
                />
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

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-2"
          >
            <i className="fas fa-location-arrow"></i>
            {t('places.useCurrentLocation', 'Use Current Location')}
          </Button>
        </div>

        <FormField
          control={form.control}
          name="features"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">{t('places.playgroundFeatures.title', 'Playground Features')}</FormLabel>
                <FormDescription>
                  {t('places.playgroundFeatures.description', 'Select all features available at this playground')}
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {playgroundFeatures.map((feature) => (
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
                          <FormLabel className="text-sm font-normal cursor-pointer">
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
          disabled={addPlaygroundMutation.isPending}
        >
          {addPlaygroundMutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {t('places.adding', 'Adding...')}
            </>
          ) : (
            <>
              <i className="fas fa-plus mr-2"></i>
              {t('places.addPlayground', 'Add Playground')}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}