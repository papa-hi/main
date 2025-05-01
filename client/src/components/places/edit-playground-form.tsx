import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Place } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";

// Playground edit form schema
const playgroundEditSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  address: z.string().optional().default(""),
  latitude: z.string(),
  longitude: z.string(),
  image: z.instanceof(File).optional(),
  features: z.array(z.string()).default([]),
});

type PlaygroundEditValues = z.infer<typeof playgroundEditSchema>;

interface EditPlaygroundFormProps {
  playground: Place;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditPlaygroundForm({ 
  playground, 
  open, 
  onOpenChange,
  onSuccess 
}: EditPlaygroundFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Form definition
  const form = useForm<PlaygroundEditValues>({
    resolver: zodResolver(playgroundEditSchema),
    defaultValues: {
      name: playground.name,
      description: playground.description || "",
      address: playground.address,
      latitude: playground.latitude,
      longitude: playground.longitude,
      features: playground.features || [],
    },
    mode: 'onChange',
  });

  // Update the form when the playground changes
  useEffect(() => {
    if (playground) {
      form.reset({
        name: playground.name,
        description: playground.description || "",
        address: playground.address,
        latitude: playground.latitude,
        longitude: playground.longitude,
        features: playground.features || [],
      });
    }
  }, [playground, form]);
  
  // Mutation for updating a playground
  const updatePlaygroundMutation = useMutation({
    mutationFn: async (data: PlaygroundEditValues) => {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('address', data.address);
      formData.append('latitude', data.latitude);
      formData.append('longitude', data.longitude);
      
      // Add features as a JSON string
      if (data.features && data.features.length > 0) {
        formData.append('features', JSON.stringify(data.features));
      }
      
      // Add image if provided
      if (data.image) {
        formData.append('placeImage', data.image);
      }
      
      // Use fetch for FormData
      const response = await fetch(`/api/places/${playground.id}`, {
        method: 'PATCH',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update playground');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t('places.updateSuccess', 'Playground Updated'),
        description: t('places.updateSuccessMessage', 'Playground information has been successfully updated'),
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/places/search'] });
      // Close dialog
      onOpenChange(false);
      // Call success callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t('places.updateError', 'Error Updating Playground'),
        description: error.message || t('places.updateErrorMessage', 'There was an error updating the playground information.'),
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: PlaygroundEditValues) => {
    updatePlaygroundMutation.mutate(data);
  };
  
  // Handle image upload and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="mb-2">
            {t('places.editPlayground', 'Edit Playground')}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name', 'Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                      {...field} 
                      value={field.value || ''}
                      className="min-h-24"
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.latitude', 'Latitude')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('places.features', 'Features')}</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'restrooms', defaultText: 'Restrooms' },
                        { key: 'picnicTables', defaultText: 'Picnic tables' },
                        { key: 'benches', defaultText: 'Benches' },
                        { key: 'sandbox', defaultText: 'Sandbox' },
                        { key: 'waterGames', defaultText: 'Water games' }
                      ].map((featureObj) => {
                        // Get the translated text for this feature
                        const translatedText = t(`places.playgroundFeatures.${featureObj.key}`, featureObj.defaultText);
                        
                        return (
                          <Button
                            key={featureObj.key}
                            type="button"
                            variant={field.value.includes(featureObj.key) ? "default" : "outline"}
                            size="sm"
                            className={field.value.includes(featureObj.key) ? "bg-primary text-white" : ""}
                            onClick={() => {
                              if (field.value.includes(featureObj.key)) {
                                field.onChange(field.value.filter(f => f !== featureObj.key));
                              } else {
                                field.onChange([...field.value, featureObj.key]);
                              }
                            }}
                          >
                            {translatedText}
                          </Button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>{t('places.playgroundImage', 'Playground Image')}</FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 gap-3">
                  {/* Current image preview */}
                  <div className="w-full rounded-md overflow-hidden h-40 bg-muted mb-2">
                    <img 
                      src={previewUrl || playground.imageUrl}
                      alt={playground.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Image upload input */}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('places.uploadNewImageHelp', 'Upload a new photo of the playground (Optional)')}
                  </p>
                </div>
              </FormControl>
            </FormItem>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button 
                type="submit"
                disabled={updatePlaygroundMutation.isPending}
              >
                {updatePlaygroundMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {t('common.updating', 'Updating...')}
                  </>
                ) : (
                  t('common.save', 'Save')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}