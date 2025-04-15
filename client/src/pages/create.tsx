import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Users } from "lucide-react";

export default function CreatePage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [participants, setParticipants] = useState(5);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Je bent niet ingelogd",
        description: "Je moet ingelogd zijn om een speelafspraak te maken.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isLoading, user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create a simplified object with just the essential fields
      const playdate = {
        title: title || "Nieuwe speelafspraak",
        description: description || "",
        location: locationText || "Te bepalen",
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
        title: "Speelafspraak aangemaakt!",
        description: "Je nieuwe speelafspraak is succesvol aangemaakt."
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
        <h1 className="text-2xl font-heading font-bold">Nieuwe Speelafspraak</h1>
        <p className="text-muted-foreground">Plan een speelafspraak met andere vaders en kinderen</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">Titel</label>
            <Input 
              id="title"
              placeholder="Bijv. 'Speelmiddag in het park'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Beschrijving</label>
            <Textarea
              id="description"
              placeholder="Vertel meer over deze speelafspraak..."
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">Locatie</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="location"
                placeholder="Bijv. 'Vondelpark, Amsterdam'" 
                className="pl-10" 
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium mb-1">Maximaal aantal deelnemers</label>
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
            <p className="text-sm text-muted-foreground mt-1">Inclusief jezelf en je kinderen</p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
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
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Opslaan..." : "Speelafspraak Aanmaken"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
