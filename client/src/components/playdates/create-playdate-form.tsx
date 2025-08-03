import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlaydateSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, MapPin, Euro, Repeat } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Create form schema with validation for playdate creation
const createPlaydateFormSchema = insertPlaydateSchema.extend({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  cost: z.string().optional().default("Free"),
  isRecurring: z.boolean().optional().default(false),
  recurringType: z.string().optional().default("none"),
  recurringEndDate: z.string().optional(),
}).refine((data) => {
  if (data.isRecurring && data.recurringType === "daily" && !data.recurringEndDate) {
    return false;
  }
  return true;
}, {
  message: "End date is required for daily recurring playdates",
  path: ["recurringEndDate"],
});

type CreatePlaydateFormData = z.infer<typeof createPlaydateFormSchema>;

interface CreatePlaydateFormProps {
  onSuccess?: () => void;
  defaultLocation?: string;
  defaultLatitude?: number;
  defaultLongitude?: number;
}

export function CreatePlaydateForm({ 
  onSuccess, 
  defaultLocation,
  defaultLatitude,
  defaultLongitude 
}: CreatePlaydateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRecurring, setIsRecurring] = useState(false);
  
  const form = useForm<CreatePlaydateFormData>({
    resolver: zodResolver(createPlaydateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      latitude: "",
      longitude: "",
      startTime: "",
      endTime: "",
      maxParticipants: 6,
      cost: "Free",
      isRecurring: false,
      recurringType: "none",
      recurringEndDate: "",
    },
  });

  // Update form values when default props change
  useEffect(() => {
    console.log('CreatePlaydateForm useEffect triggered:', {
      defaultLocation,
      defaultLatitude,
      defaultLongitude
    });

    if (defaultLocation || defaultLatitude || defaultLongitude) {
      const newValues = {
        title: defaultLocation ? `Playdate at ${defaultLocation.split(',')[0]}` : "",
        location: defaultLocation || "",
        latitude: defaultLatitude?.toString() || "",
        longitude: defaultLongitude?.toString() || "",
      };
      
      console.log('Updating form with new values:', newValues);
      
      // Only update if values are different
      const currentValues = form.getValues();
      if (currentValues.location !== newValues.location || 
          currentValues.latitude !== newValues.latitude ||
          currentValues.longitude !== newValues.longitude) {
        console.log('Form values are different, resetting form');
        form.reset({
          ...currentValues,
          ...newValues,
        });
      } else {
        console.log('Form values are the same, not updating');
      }
    }
  }, [defaultLocation, defaultLatitude, defaultLongitude, form]);

  const createPlaydateMutation = useMutation({
    mutationFn: async (data: CreatePlaydateFormData) => {
      const response = await apiRequest("POST", "/api/playdates", {
        ...data,
        latitude: data.latitude || "0",
        longitude: data.longitude || "0",
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playdates"] });
      toast({
        title: "Playdate Created",
        description: "Your playdate has been created successfully!",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create playdate",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePlaydateFormData) => {
    createPlaydateMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Playdate Title
          </Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Fun playdate at the park"
            className="mt-1"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Describe your playdate..."
            className="mt-1"
            rows={3}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </Label>
          <Input
            id="location"
            {...form.register("location")}
            placeholder="Park name or address"
            className="mt-1"
          />
          {form.formState.errors.location && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.location.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Start Time
            </Label>
            <Input
              id="startTime"
              type="datetime-local"
              {...form.register("startTime")}
              className="mt-1"
            />
            {form.formState.errors.startTime && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.startTime.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              {...form.register("endTime")}
              className="mt-1"
            />
            {form.formState.errors.endTime && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.endTime.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="maxParticipants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Maximum Participants
          </Label>
          <Input
            id="maxParticipants"
            type="number"
            min="2"
            max="20"
            {...form.register("maxParticipants", { valueAsNumber: true })}
            className="mt-1"
          />
          {form.formState.errors.maxParticipants && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.maxParticipants.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="cost" className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Cost
          </Label>
          <Input
            id="cost"
            {...form.register("cost")}
            placeholder="e.g., Free, €5 per child, €10 entry fee"
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Enter "Free" for no cost, or specify the amount (e.g., "€5 per child")
          </p>
          {form.formState.errors.cost && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.cost.message}
            </p>
          )}
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isRecurring" 
              checked={isRecurring}
              onCheckedChange={(checked) => {
                setIsRecurring(checked as boolean);
                form.setValue("isRecurring", checked as boolean);
                if (!checked) {
                  form.setValue("recurringType", "none");
                  form.setValue("recurringEndDate", "");
                }
              }}
            />
            <Label htmlFor="isRecurring" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurring Playdate
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-4 ml-6">
              <div>
                <Label htmlFor="recurringType">Repeat</Label>
                <Select
                  value={form.watch("recurringType")}
                  onValueChange={(value) => form.setValue("recurringType", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select repeat option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="recurringEndDate">End Date</Label>
                <Input
                  id="recurringEndDate"
                  type="date"
                  {...form.register("recurringEndDate")}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The last date for this recurring playdate
                </p>
                {form.formState.errors.recurringEndDate && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.recurringEndDate.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hidden coordinate fields */}
        <input type="hidden" {...form.register("latitude")} />
        <input type="hidden" {...form.register("longitude")} />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={createPlaydateMutation.isPending}
      >
        {createPlaydateMutation.isPending ? "Creating..." : "Create Playdate"}
      </Button>
    </form>
  );
}