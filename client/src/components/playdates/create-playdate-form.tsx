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
import { Calendar, Clock, Users, MapPin, Euro, Repeat, Coffee, Bike, TreePine, Waves, Utensils, Gamepad2, Sparkles, CalendarPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addHours, setHours, setMinutes, nextSaturday, nextSunday } from "date-fns";

function generateGoogleCalendarUrl(title: string, description: string, location: string, startTime: string, endTime: string): string {
  const start = new Date(startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: location,
    dates: `${start}/${end}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface PlaydateTemplate {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultCost: string;
  defaultMaxParticipants: number;
  defaultDuration: number;
  suggestedTime: { hour: number; minute: number };
  weekend: boolean;
}

const playdateTemplates: PlaydateTemplate[] = [
  {
    id: "coffee-sandbox",
    icon: <Coffee className="h-5 w-5" />,
    title: "Coffee & Sandbox",
    description: "Saturday morning coffee while kids play",
    defaultTitle: "Saturday Morning Coffee & Sandbox",
    defaultDescription: "Let's grab a coffee while the kids play in the sandbox! Bring your favorite brew or we'll grab one nearby. Perfect for toddlers and young kids.",
    defaultCost: "Free",
    defaultMaxParticipants: 6,
    defaultDuration: 2,
    suggestedTime: { hour: 10, minute: 0 },
    weekend: true,
  },
  {
    id: "cargo-bike",
    icon: <Bike className="h-5 w-5" />,
    title: "Cargo-Bike Ride",
    description: "Afternoon bike adventure with the kids",
    defaultTitle: "Afternoon Cargo-Bike Ride",
    defaultDescription: "Join us for a relaxed cargo-bike ride through the neighborhood! We'll explore some nice routes and maybe stop for ice cream. All bike types welcome!",
    defaultCost: "Free",
    defaultMaxParticipants: 8,
    defaultDuration: 2,
    suggestedTime: { hour: 14, minute: 0 },
    weekend: true,
  },
  {
    id: "park-adventure",
    icon: <TreePine className="h-5 w-5" />,
    title: "Park Adventure",
    description: "Explore nature with the little ones",
    defaultTitle: "Park Adventure Day",
    defaultDescription: "Let's explore the park together! We'll look for bugs, climb trees, and let the kids run free. Bring snacks and water!",
    defaultCost: "Free",
    defaultMaxParticipants: 10,
    defaultDuration: 3,
    suggestedTime: { hour: 10, minute: 30 },
    weekend: true,
  },
  {
    id: "swimming",
    icon: <Waves className="h-5 w-5" />,
    title: "Swimming Pool",
    description: "Splash time at the local pool",
    defaultTitle: "Swimming Pool Playdate",
    defaultDescription: "Pool time! Let's take the kids for a swim. Bring swimsuits, towels, and goggles. We'll supervise together while kids have fun in the water.",
    defaultCost: "Entry fee varies",
    defaultMaxParticipants: 6,
    defaultDuration: 2,
    suggestedTime: { hour: 11, minute: 0 },
    weekend: true,
  },
  {
    id: "lunch-playdate",
    icon: <Utensils className="h-5 w-5" />,
    title: "Lunch Playdate",
    description: "Kid-friendly restaurant meetup",
    defaultTitle: "Family Lunch Meetup",
    defaultDescription: "Let's have lunch together at a kid-friendly spot! Great way to meet other dads while the kids enjoy their meal and play area.",
    defaultCost: "Pay for own food",
    defaultMaxParticipants: 8,
    defaultDuration: 2,
    suggestedTime: { hour: 12, minute: 0 },
    weekend: false,
  },
  {
    id: "indoor-play",
    icon: <Gamepad2 className="h-5 w-5" />,
    title: "Indoor Play",
    description: "Rainy day fun at indoor playground",
    defaultTitle: "Indoor Playground Fun",
    defaultDescription: "Perfect for rainy days! Let's meet at the indoor playground. Kids can climb, slide, and play while we catch up.",
    defaultCost: "Entry fee varies",
    defaultMaxParticipants: 8,
    defaultDuration: 2,
    suggestedTime: { hour: 10, minute: 0 },
    weekend: true,
  },
];

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  
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
      return { playdate: await response.json(), formData: data };
    },
    onSuccess: ({ formData }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playdates"] });
      
      const calendarUrl = generateGoogleCalendarUrl(
        formData.title,
        formData.description || "",
        formData.location || "",
        formData.startTime,
        formData.endTime
      );
      
      toast({
        title: "Playdate Created!",
        description: (
          <div className="flex flex-col gap-2 mt-1">
            <span>Your playdate is ready.</span>
            <a 
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <CalendarPlus className="h-4 w-4" />
              Add to Calendar
            </a>
          </div>
        ),
        duration: 8000,
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

  const applyTemplate = (template: PlaydateTemplate) => {
    setSelectedTemplate(template.id);
    setShowCustomForm(true);
    
    const suggestedDate = template.weekend ? nextSaturday(new Date()) : new Date();
    const startTime = setMinutes(setHours(suggestedDate, template.suggestedTime.hour), template.suggestedTime.minute);
    const endTime = addHours(startTime, template.defaultDuration);
    
    const locationName = defaultLocation?.split(',')[0] || "";
    
    form.reset({
      title: locationName ? `${template.defaultTitle} at ${locationName}` : template.defaultTitle,
      description: template.defaultDescription,
      location: defaultLocation || "",
      latitude: defaultLatitude?.toString() || "",
      longitude: defaultLongitude?.toString() || "",
      startTime: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      maxParticipants: template.defaultMaxParticipants,
      cost: template.defaultCost,
      isRecurring: false,
      recurringType: "none",
      recurringEndDate: "",
    });
    
    toast({
      title: "Template Applied",
      description: `"${template.title}" template loaded. Adjust details as needed!`,
    });
  };

  const startCustomPlaydate = () => {
    setSelectedTemplate(null);
    setShowCustomForm(true);
    form.reset({
      title: defaultLocation ? `Playdate at ${defaultLocation.split(',')[0]}` : "",
      description: "",
      location: defaultLocation || "",
      latitude: defaultLatitude?.toString() || "",
      longitude: defaultLongitude?.toString() || "",
      startTime: "",
      endTime: "",
      maxParticipants: 6,
      cost: "Free",
      isRecurring: false,
      recurringType: "none",
      recurringEndDate: "",
    });
  };

  if (!showCustomForm) {
    return (
      <div className="space-y-3">
        <p className="text-center text-sm text-muted-foreground">Tap to start</p>
        
        <div className="grid grid-cols-2 gap-2">
          {playdateTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template)}
              className="flex items-center gap-3 p-4 min-h-[72px] rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 active:scale-[0.98] transition-all group touch-manipulation"
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                {template.icon}
              </div>
              <span className="font-semibold text-left leading-tight">{template.title}</span>
            </button>
          ))}
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full mt-2 text-muted-foreground"
          onClick={startCustomPlaydate}
        >
          Or create your own
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {selectedTemplate && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCustomForm(false)}
          className="mb-2"
        >
          &larr; Back to Templates
        </Button>
      )}
      
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