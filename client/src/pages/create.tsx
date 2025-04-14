import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { insertPlaydateSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarIcon, Clock, MapPin } from "lucide-react";

const createPlaydateSchema = insertPlaydateSchema.extend({
  date: z.date({
    required_error: "Kies een datum voor de speelafspraak",
  }),
  startTimeString: z.string({
    required_error: "Kies een starttijd",
  }),
  endTimeString: z.string({
    required_error: "Kies een eindtijd",
  }),
});

type CreatePlaydateFormValues = z.infer<typeof createPlaydateSchema>;

export default function CreatePage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultValues: Partial<CreatePlaydateFormValues> = {
    title: "",
    description: "",
    location: "",
    maxParticipants: 5,
  };

  const form = useForm<CreatePlaydateFormValues>({
    resolver: zodResolver(createPlaydateSchema),
    defaultValues,
  });

  const onSubmit = async (data: CreatePlaydateFormValues) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    
    try {
      // Check if the form data is valid
      if (!data.date || !data.startTimeString || !data.endTimeString) {
        console.error("Missing required date or time data", data);
        toast({
          title: "Ontbrekende informatie",
          description: "Vul alle verplichte velden in (datum, start- en eindtijd).",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Convert the form data to the format expected by the API
      const [startHours, startMinutes] = data.startTimeString.split(':').map(Number);
      const [endHours, endMinutes] = data.endTimeString.split(':').map(Number);
      
      const startTime = new Date(data.date);
      startTime.setHours(startHours, startMinutes);
      
      const endTime = new Date(data.date);
      endTime.setHours(endHours, endMinutes);
      
      const playdateData = {
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        maxParticipants: data.maxParticipants,
      };
      
      console.log("Sending playdate data to API:", playdateData);
      
      const response = await apiRequest('POST', '/api/playdates', playdateData);
      console.log("API response:", response);
      
      // Invalidate queries to refetch playdates
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
      
      toast({
        title: "Speelafspraak aangemaakt!",
        description: "Je nieuwe speelafspraak is succesvol aangemaakt.",
      });
      
      // Navigate to the playdates page
      navigate("/playdates");
    } catch (error) {
      console.error("Error creating playdate:", error);
      toast({
        title: "Fout bij aanmaken",
        description: "Er is iets misgegaan bij het aanmaken van de speelafspraak.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">Nieuwe Speelafspraak</h1>
        <p className="text-muted-foreground">Plan een speelafspraak met andere vaders en kinderen</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="Bijv. 'Speelmiddag in het park'" {...field} />
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
                  <FormLabel>Beschrijving</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Vertel meer over deze speelafspraak..."
                      className="min-h-[100px]"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Datum</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: nl })
                          ) : (
                            <span>Kies een datum</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTimeString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starttijd</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="time" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTimeString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eindtijd</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="time" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locatie</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Bijv. 'Vondelpark, Amsterdam'" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximaal aantal deelnemers</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormDescription>
                    Inclusief jezelf en je kinderen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/playdates")}
                disabled={isSubmitting}
              >
                Annuleren
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-accent text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i> Opslaan...</>
                ) : (
                  <>Speelafspraak Aanmaken</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
