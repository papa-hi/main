import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function SimpleTestPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("Test Playdate");
  const [description, setDescription] = useState("This is a test playdate");
  const [locationText, setLocationText] = useState("Amsterdam");
  const [participants, setParticipants] = useState(5);
  const [results, setResults] = useState("");

  const handleTestSubmit = async () => {
    setIsSubmitting(true);
    setResults("");
    
    try {
      // Create a simple object with minimal data
      const playdate = {
        title,
        description,
        location: locationText,
        maxParticipants: participants
      };
      
      // Send the request to our test endpoint
      const response = await fetch('/api/playdates/test-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playdate),
      });
      
      const responseText = await response.text();
      setResults(`Status: ${response.status}\n\nResponse: ${responseText}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${responseText}`);
      }
      
      try {
        const newPlaydate = JSON.parse(responseText);
        console.log("Successfully created playdate:", newPlaydate);
        
        // Update the UI
        queryClient.invalidateQueries({ queryKey: ['/api/playdates/upcoming'] });
        toast({
          title: "Playdate Created Successfully!",
          description: "Your test playdate has been created."
        });
        
        // Redirect to playdates list page
        console.log("Redirecting to playdates list");
        navigate("/playdates", { replace: true });
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
      }
    } catch (error) {
      console.error("Error creating playdate:", error);
      
      let errorMessage = "There was an error creating the playdate.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error Creating Playdate",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Simple Playdate Creation Test</h1>
        <p className="text-muted-foreground">This page provides a simplified way to test playdate creation</p>
      </div>
      
      <div className="grid gap-6 max-w-xl">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
          <Input 
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <Textarea 
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
          <Input 
            id="location"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="participants" className="block text-sm font-medium mb-1">Max Participants</label>
          <Input 
            id="participants"
            type="number"
            value={participants}
            onChange={(e) => setParticipants(parseInt(e.target.value) || 5)}
          />
        </div>
        
        <Button
          onClick={handleTestSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Creating..." : "Create Test Playdate"}
        </Button>
        
        {results && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Results</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[300px] whitespace-pre-wrap">
              {results}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}