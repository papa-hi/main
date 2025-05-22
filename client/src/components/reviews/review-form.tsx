import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface StarRatingProps {
  placeId: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function StarRating({ placeId, size = "md", showCount = true }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get current user's rating for this place
  const { data: userRating } = useQuery({
    queryKey: [`/api/places/${placeId}/user-rating`],
    enabled: !!user,
  });

  // Get place rating statistics
  const { data: placeRating } = useQuery({
    queryKey: [`/api/places/${placeId}/rating`],
  });

  const ratePlaceMutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await apiRequest("POST", `/api/places/${placeId}/rate`, { rating });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/places/${placeId}/rating`] });
      queryClient.invalidateQueries({ queryKey: [`/api/places/${placeId}/user-rating`] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      toast({
        title: "Rating submitted!",
        description: "Thank you for rating this place.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit rating",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRating = (rating: number) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to rate places.",
        variant: "destructive",
      });
      return;
    }
    ratePlaceMutation.mutate(rating);
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const averageRating = placeRating?.averageRating ? placeRating.averageRating / 20 : 0; // Convert 0-100 to 0-5
  const totalRatings = placeRating?.totalRatings || 0;
  const currentUserRating = userRating || 0;

  return (
    <div className="flex items-center justify-between">
      {/* Show just the numeric rating */}
      <span className="text-sm font-medium text-gray-600">
        {totalRatings > 0 ? averageRating.toFixed(1) : "No ratings"}
      </span>

      {/* Interactive rating for logged-in users */}
      {user && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={`rate-${star}`}
              type="button"
              className="p-1 rounded transition-colors hover:bg-gray-100"
              onClick={() => handleRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={ratePlaceMutation.isPending}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  star <= (hoverRating || currentUserRating)
                    ? "fill-orange-400 text-orange-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}