import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReviewFormProps {
  placeId: number;
  onSuccess?: () => void;
}

export function ReviewForm({ placeId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [kidsFriendlyRating, setKidsFriendlyRating] = useState(0);
  const [hoverKidsRating, setHoverKidsRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visitDate, setVisitDate] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const res = await apiRequest("POST", `/api/places/${placeId}/reviews`, reviewData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/places/${placeId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      toast({
        title: "Review submitted!",
        description: "Thank you for sharing your experience with other dads.",
      });
      // Reset form
      setRating(0);
      setKidsFriendlyRating(0);
      setTitle("");
      setContent("");
      setVisitDate("");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating || !kidsFriendlyRating || !title || !content) {
      toast({
        title: "Please fill all fields",
        description: "All fields including ratings are required.",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      rating,
      kidsFriendlyRating,
      title,
      content,
      visitDate: visitDate ? new Date(visitDate) : null,
    });
  };

  const renderStars = (
    currentRating: number,
    hoverValue: number,
    onChange: (rating: number) => void,
    onHover: (rating: number) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 rounded transition-colors hover:bg-gray-100"
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hoverValue || currentRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Share Your Experience</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderStars(
              rating,
              hoverRating,
              setRating,
              setHoverRating,
              "Overall Rating"
            )}
            
            {renderStars(
              kidsFriendlyRating,
              hoverKidsRating,
              setKidsFriendlyRating,
              setHoverKidsRating,
              "Kid-Friendly Rating"
            )}
          </div>

          <div>
            <Label htmlFor="title">Review Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Great place for families!"
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Your Review</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell other dads about your experience..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="visitDate">When did you visit? (optional)</Label>
            <Input
              id="visitDate"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createReviewMutation.isPending}
          >
            {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}