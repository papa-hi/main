import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Place } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const playdateFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  location: z.string().min(3, { message: "Location is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  maxParticipants: z.number().min(1).max(50),
});

type PlaydateFormValues = z.infer<typeof playdateFormSchema>;

interface CreatePlaydateFormProps {
  place?: Place;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreatePlaydateForm({ place, onSuccess, onCancel }: CreatePlaydateFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Get today's date for default values
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const defaultDate = tomorrow.toISOString().split('T')[0];
  const defaultStartTime = "10:00";
  const defaultEndTime = "12:00";

  const form = useForm<PlaydateFormValues>({
    resolver: zodResolver(playdateFormSchema),
    defaultValues: {
      title: place ? `Playdate at ${place.name}` : '',
      description: '',
      location: place ? `${place.name}, ${place.address} [${place.latitude},${place.longitude}]` : '',
      startTime: `${defaultDate}T${defaultStartTime}`,
      endTime: `${defaultDate}T${defaultEndTime}`,
      maxParticipants: 4,
    },
  });

  const createPlaydateMutation = useMutation({
    mutationFn: async (data: PlaydateFormValues) => {
      const response = await apiRequest('POST', '/api/playdates', {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
      toast({
        title: t('playdates.playdateCreated', 'Playdate Created'),
        description: t('playdates.playdateCreatedMessage', 'Your playdate has been created successfully.'),
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating playdate:', error);
      toast({
        title: t('playdates.createError', 'Error Creating Playdate'),
        description: error.message || t('playdates.createErrorMessage', 'There was an error creating the playdate. Please try again.'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlaydateFormValues) => {
    createPlaydateMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('playdates.title', 'Title')}</FormLabel>
              <FormControl>
                <Input placeholder={t('playdates.titlePlaceholder', 'Enter playdate title')} {...field} />
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
              <FormLabel>{t('playdates.description', 'Description')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t('playdates.descriptionPlaceholder', 'Tell more about this playdate...')}
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('playdates.location', 'Location')}</FormLabel>
              <FormControl>
                <Input placeholder={t('playdates.locationPlaceholder', 'Enter location')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('playdates.startTime', 'Start Time')}</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('playdates.endTime', 'End Time')}</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maxParticipants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('playdates.maxParticipants', 'Max Participants')}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1} 
                  max={50}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={createPlaydateMutation.isPending}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={createPlaydateMutation.isPending}
          >
            {createPlaydateMutation.isPending 
              ? t('playdates.creating', 'Creating...') 
              : t('playdates.createButton', 'Create Playdate')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}