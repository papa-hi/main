import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { nl, enUS, de, es, fr } from "date-fns/locale";
import type { Locale } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, MapPin, Users, Clock } from "lucide-react";

export default function CreatePage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the appropriate locale for date formatting
  const getDateLocale = (): Locale => {
    switch (i18n.language) {
      case 'nl': return nl;
      case 'en': return enUS;
      case 'de': return de;
      case 'es': return es;
      case 'fr': return fr;
      default: return nl;
    }
  };
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [participants, setParticipants] = useState(5);
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: t('playdates.notLoggedIn', 'Je bent niet ingelogd'),
        description: t('playdates.loginRequired', 'Je moet ingelogd zijn om een speelafspraak te maken.'),
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isLoading, user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create date with selected date and start time
      const selectedDate = new Date(date);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      selectedDate.setHours(startHours || 0, startMinutes || 0, 0, 0);
      
      // Create end date with the same date but end time
      const endDate = new Date(date);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      endDate.setHours(endHours || 0, endMinutes || 0, 0, 0);
      
      // Create a playdate object with all fields
      const playdate = {
        title: title || t('playdates.defaultTitle', 'Nieuwe speelafspraak'),
        description: description || "",
        location: locationText || t('playdates.defaultLocation', 'Te bepalen'),
        startTime: selectedDate.toISOString(),
        endTime: endDate.toISOString(),
        maxParticipants: participants || 5
      };
      
      console.log("Sending playdate data:", playdate);
      
      // Send the request to our simplified test endpoint
      const response = await fetch('/api/playdates/test-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playdate),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error creating playdate (${response.status}):`, errorText);
        throw new Error(`Error creating playdate: ${errorText}`);
      }
      
      const newPlaydate = await response.json();
      console.log("Successfully created playdate:", newPlaydate);
      
      // Update the UI and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
      toast({
        title: t('playdates.created', 'Speelafspraak aangemaakt!'),
        description: t('playdates.createdSuccess', 'Je nieuwe speelafspraak is succesvol aangemaakt.')
      });
      
      // Always redirect to the playdates list
      console.log("Redirecting to playdates list");
      navigate("/playdates", { replace: true });
    } catch (error) {
      console.error("Error creating playdate:", error);
      
      let errorMessage = "Er is iets misgegaan bij het aanmaken van de speelafspraak.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Fout bij aanmaken",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('playdates.createPlaydate', 'Nieuwe Speelafspraak')}</h1>
        <p className="text-muted-foreground">{t('playdates.createPlaydateDesc', 'Plan een speelafspraak met andere vaders en kinderen')}</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">{t('playdates.title', 'Titel')}</label>
            <Input 
              id="title"
              placeholder={t('playdates.titlePlaceholder', "Bijv. 'Speelmiddag in het park'")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">{t('playdates.description', 'Beschrijving')}</label>
            <Textarea
              id="description"
              placeholder={t('playdates.descriptionPlaceholder', 'Vertel meer over deze speelafspraak...')}
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-1">{t('playdates.date', 'Datum')}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal justify-start",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: getDateLocale() }) : t('playdates.chooseDatePlaceholder', 'Kies een datum')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium mb-1">{t('playdates.startTime', 'Starttijd')}</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="startTime"
                  type="time" 
                  className="pl-10" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium mb-1">{t('playdates.endTime', 'Eindtijd')}</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="endTime"
                  type="time" 
                  className="pl-10" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">{t('playdates.location', 'Locatie')}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="location"
                placeholder={t('playdates.locationPlaceholder', "Bijv. 'Vondelpark, Amsterdam'")} 
                className="pl-10" 
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium mb-1">{t('playdates.maxParticipants', 'Maximaal aantal deelnemers')}</label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxParticipants"
                type="number"
                min={1}
                max={50}
                className="pl-10"
                value={participants}
                onChange={(e) => setParticipants(parseInt(e.target.value) || 5)}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t('playdates.participantsNote', 'Inclusief jezelf en je kinderen')}</p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/playdates")}
              disabled={isSubmitting}
            >
              {t('playdates.cancel', 'Annuleren')}
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('playdates.creating', 'Opslaan...') : t('playdates.createButton', 'Speelafspraak Aanmaken')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
