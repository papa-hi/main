import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, MapPin, Users, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EditPlaydatePage() {
  const { id } = useParams<{ id: string }>();
  const playdateId = parseInt(id);
  
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [participants, setParticipants] = useState(5);
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  
  // Fetch playdate data
  useEffect(() => {
    async function fetchPlaydate() {
      setIsFetching(true);
      try {
        const response = await fetch(`/api/playdates/${playdateId}`);
        
        if (!response.ok) {
          throw new Error(await response.text());
        }
        
        const playdate = await response.json();
        
        // Check if user is the creator (first participant)
        if (user && playdate.participants[0]?.id !== user.id) {
          toast({
            title: t('playdates.notCreator', 'Geen toegang'),
            description: t('playdates.notCreatorMessage', 'Je kunt alleen je eigen speelafspraken bewerken.'),
            variant: "destructive",
          });
          navigate('/playdates');
          return;
        }
        
        // Fill form with playdate data
        setTitle(playdate.title);
        setDescription(playdate.description || "");
        setLocationText(playdate.location);
        setParticipants(playdate.maxParticipants);
        
        // Handle dates
        const startDate = new Date(playdate.startTime);
        const endDate = new Date(playdate.endTime);
        
        setDate(startDate);
        setStartTime(
          `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
        );
        setEndTime(
          `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
        );
        
      } catch (err) {
        console.error("Error fetching playdate:", err);
        setError(t('playdates.fetchError', 'De speelafspraak kon niet worden opgehaald.'));
      } finally {
        setIsFetching(false);
      }
    }
    
    if (user) {
      fetchPlaydate();
    }
  }, [playdateId, user, t, toast, navigate]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: t('auth.notLoggedIn', 'Je bent niet ingelogd'),
        description: t('auth.loginRequired', 'Je moet ingelogd zijn om een speelafspraak te bewerken.'),
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isLoading, user, navigate, toast, t]);

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
        title: title || "Speelafspraak",
        description: description || "",
        location: locationText || "Te bepalen",
        startTime: selectedDate.toISOString(),
        endTime: endDate.toISOString(),
        maxParticipants: participants || 5
      };
      
      console.log("Sending updated playdate data:", playdate);
      
      // Send the request to update the playdate
      const response = await fetch(`/api/playdates/${playdateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playdate),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error updating playdate (${response.status}):`, errorText);
        throw new Error(`Error updating playdate: ${errorText}`);
      }
      
      const updatedPlaydate = await response.json();
      console.log("Successfully updated playdate:", updatedPlaydate);
      
      // Update the UI and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/playdates/past'] });
      
      toast({
        title: t('playdates.updated', 'Speelafspraak bijgewerkt!'),
        description: t('playdates.updateSuccess', 'Je speelafspraak is succesvol bijgewerkt.')
      });
      
      // Redirect to the playdates list
      console.log("Redirecting to playdates list");
      navigate("/playdates", { replace: true });
    } catch (error) {
      console.error("Error updating playdate:", error);
      
      let errorMessage = t('playdates.updateError', 'Er is iets misgegaan bij het bijwerken van de speelafspraak.');
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: t('common.error', 'Fout bij wijzigen'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="py-8 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">{t('common.error', 'Fout')}</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => navigate('/playdates')}>
          {t('common.back', 'Terug naar speelafspraken')}
        </Button>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="py-8 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">{t('common.loading', 'Laden...')}</h1>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold">{t('playdates.editTitle', 'Speelafspraak Bewerken')}</h1>
        <p className="text-muted-foreground">{t('playdates.editSubtitle', 'Pas de details van je speelafspraak aan')}</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">{t('playdates.title', 'Titel')}</label>
            <Input 
              id="title"
              placeholder={t('playdates.titlePlaceholder', 'Bijv. \'Speelmiddag in het park\'')}
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
                  {date ? format(date, "PPP", { locale: nl }) : t('playdates.selectDate', 'Kies een datum')}
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
                placeholder={t('playdates.locationPlaceholder', 'Bijv. \'Vondelpark, Amsterdam\'')} 
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
              {t('common.cancel', 'Annuleren')}
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.saving', 'Opslaan...') : t('common.save', 'Opslaan')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}