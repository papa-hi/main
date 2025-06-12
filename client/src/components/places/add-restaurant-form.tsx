
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


// Form schema for restaurant creation
const restaurantFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  address: z.string().min(3, { message: "Address is required" }),
  latitude: z.number(),
  longitude: z.number(),
  imageUrl: z.string().optional(),
  features: z.array(z.string()).default([]),
});

type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

interface AddRestaurantFormProps {
  onSuccess?: () => void;
}

export function AddRestaurantForm({ onSuccess }: AddRestaurantFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Form definition
  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      latitude: 0,
      longitude: 0,
      features: [],
    },
    mode: 'onChange',
  });

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
          toast({
            title: t('places.locationUpdated', 'Location Updated'),
            description: t('places.locationCoordinatesSet', 'Location coordinates have been set.'),
          });
        },
        (error) => {
          toast({
            title: t('places.locationError', 'Location Error'),
            description: t('places.couldNotGetLocation', 'Could not get your current location.'),
            variant: 'destructive',
          });
          console.error("Error getting location:", error);
        }
      );
    } else {
      toast({
        title: t('places.browserNotSupported', 'Browser Not Supported'),
        description: t('places.geolocationNotSupported', 'Geolocation is not supported by this browser.'),
        variant: 'destructive',
      });
    }
  };

  // Mutation for adding a new restaurant
  const addRestaurantMutation = useMutation({
    mutationFn: async (data: RestaurantFormValues) => {
      // Create restaurant data object
      const restaurantData = {
        name: data.name,
        type: "restaurant",
        description: data.description || "",
        address: data.address,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        features: data.features,
        // imageUrl is now handled by the server with random restaurant images
      };

      const response = await apiRequest('POST', '/api/places', restaurantData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t('places.restaurantAdded', 'Restaurant Added'),
        description: t('places.restaurantAddedMessage', 'The restaurant has been added successfully.'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      queryClient.invalidateQueries({ queryKey: ['/api/places/nearby'] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: t('places.addError', 'Error Adding Restaurant'),
        description: error.message || t('places.addErrorMessage', 'There was an error adding the restaurant. Please try again.'),
        variant: 'destructive',
      });
    },
  });

  // Function to handle form submission
  const onSubmit = (data: RestaurantFormValues) => {
    addRestaurantMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.name', 'Name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('places.restaurantNamePlaceholder', 'e.g. Family Kitchen')} {...field} />
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
              <FormLabel>{t('common.description', 'Description')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('places.restaurantDescriptionPlaceholder', 'e.g. Family-friendly restaurant with play area')} 
                  {...field} 
                  value={field.value || ''}
                />
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
              <FormLabel>{t('common.address', 'Address')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('places.addressPlaceholder', 'e.g. 123 Main St, Amsterdam')} 
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
                <FormLabel>{t('common.latitude', 'Latitude')}</FormLabel>
                <FormControl>
                  <Input
                    type="number" 
                    step="any"
                    value={field.value}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
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
                <FormLabel>{t('common.longitude', 'Longitude')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="any"
                    value={field.value}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
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
          className="w-full"
          onClick={getUserLocation}
        >
          <i className="fas fa-location-arrow mr-2"></i>
          {t('places.useMyLocation', 'Use My Current Location')}
        </Button>
        
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.features', 'Features')}</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'kidsMenu', defaultText: 'Kids menu' },
                    { key: 'highChairs', defaultText: 'High Chairs' },
                    { key: 'changingTables', defaultText: 'Changing Tables' },
                    { key: 'playCorner', defaultText: 'Play corner' },
                    { key: 'strollerAccessible', defaultText: 'Stroller accessible' }
                  ].map((featureObj) => {
                    const translatedText = t(`places.restaurantFeatures.${featureObj.key}`, featureObj.defaultText);
                    
                    return (
                      <div key={featureObj.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={featureObj.key}
                          checked={field.value.includes(featureObj.key)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, featureObj.key]);
                            } else {
                              field.onChange(field.value.filter(f => f !== featureObj.key));
                            }
                          }}
                        />
                        <label
                          htmlFor={featureObj.key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {translatedText}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </FormControl>
              <FormDescription>
                {t('places.featuresHelp', 'Select all features available at this restaurant')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="pt-4 flex justify-end gap-2">
          {onSuccess && (
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          <Button 
            type="submit"
            disabled={addRestaurantMutation.isPending}
          >
            {addRestaurantMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                {t('common.adding', 'Adding...')}
              </>
            ) : (
              t('common.add', 'Add')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}