import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Heart, X, RefreshCw, Settings, Baby } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface DadMatch {
  id: number;
  dadId1: number;
  dadId2: number;
  matchScore: number;
  distanceKm: number;
  commonAgeRanges: Array<{ minAge: number; maxAge: number; overlap: number }>;
  matchStatus: string;
  createdAt: string;
  dad1: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city: string | null;
    childrenInfo: Array<{ name: string; age: number }> | null;
  };
  dad2: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city: string | null;
    childrenInfo: Array<{ name: string; age: number }> | null;
  };
}



export default function MatchesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery<DadMatch[]>({
    queryKey: ["/api/matches"],
  });

  // Run matching algorithm
  const runMatchingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/matches/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to run matching");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Matching Complete!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run matching algorithm",
        variant: "destructive",
      });
    },
  });

  // Update match status
  const updateMatchMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number; status: string }) => {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update match");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Match Updated",
        description: "Your response has been recorded",
      });
    },
  });

  const getOtherDad = (match: DadMatch, currentUserId: number) => {
    return match.dadId1 === currentUserId ? match.dad2 : match.dad1;
  };

  const formatAgeRanges = (ranges: Array<{ minAge: number; maxAge: number }>) => {
    return ranges.map(range => 
      range.minAge === range.maxAge ? `${range.minAge}` : `${range.minAge}-${range.maxAge}`
    ).join(', ') + ' years';
  };

  if (matchesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dad Matches</h1>
          <p className="text-gray-600 mt-1">
            Connect with fathers near you who have children of similar ages
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link to="/settings">
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          
          <Button
            onClick={() => runMatchingMutation.mutate()}
            disabled={runMatchingMutation.isPending}
            className="flex items-center gap-2"
          >
            {runMatchingMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Find Matches
          </Button>
        </div>
      </div>



      {/* Matches List */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Yet</h3>
            <p className="text-gray-600 mb-4">
              We haven't found any dad matches for you yet. Make sure your profile is complete with your location and children's information.
            </p>
            <Button onClick={() => runMatchingMutation.mutate()}>
              Find My First Matches
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const otherDad = getOtherDad(match, match.dadId1); // We'd need current user ID here
            const isPending = match.matchStatus === 'pending';
            
            return (
              <Card key={match.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Dad Profile */}
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={otherDad.profileImage || ""} />
                        <AvatarFallback className="text-lg">
                          {otherDad.firstName[0]}{otherDad.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {otherDad.firstName} {otherDad.lastName}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {otherDad.city} • {match.distanceKm}km away
                          </div>
                          
                          <Badge variant="secondary">
                            {match.matchScore}% match
                          </Badge>
                        </div>
                        
                        {/* Children Info */}
                        {otherDad.childrenInfo && otherDad.childrenInfo.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Baby className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Children:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {otherDad.childrenInfo.map((child, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {child.name} ({child.age})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Common Age Ranges */}
                        <div className="mt-3">
                          <span className="text-sm font-medium text-gray-700">
                            Compatible ages: {formatAgeRanges(match.commonAgeRanges)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {isPending && (
                      <div className="flex flex-col gap-2 sm:w-32">
                        <Button
                          size="sm"
                          onClick={() => updateMatchMutation.mutate({ 
                            matchId: match.id, 
                            status: 'accepted' 
                          })}
                          disabled={updateMatchMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Heart className="h-4 w-4" />
                          Accept
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMatchMutation.mutate({ 
                            matchId: match.id, 
                            status: 'declined' 
                          })}
                          disabled={updateMatchMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    )}
                    
                    {!isPending && (
                      <div className="flex items-center">
                        <Badge 
                          variant={match.matchStatus === 'accepted' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {match.matchStatus}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}