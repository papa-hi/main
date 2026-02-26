import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Heart, X, RefreshCw, Settings, Baby, Calendar, Clock, MessageCircle } from "lucide-react";
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

interface AvailabilityMatch {
  matchId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city: string | null;
    childrenInfo: Array<{ name: string; age: number }> | null;
  };
  sharedSlots: Array<{
    dayOfWeek: number;
    dayName: string;
    timeSlot: string;
    timeSlotDisplay: string;
    nextOccurrence: string;
  }>;
  matchScore: number;
  distanceKm: number;
  calculatedAt: string;
}

interface AvailabilityMatchesResponse {
  success: boolean;
  totalMatches: number;
  matches: AvailabilityMatch[];
}

const SLOT_EMOJI: Record<string, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌆",
};

export default function MatchesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: matches = [], isLoading: matchesLoading } = useQuery<DadMatch[]>({
    queryKey: ["/api/matches"],
  });

  const { data: availabilityData, isLoading: availabilityLoading } = useQuery<AvailabilityMatchesResponse>({
    queryKey: ["/api/availability/matches"],
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/availability/matches"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run matching algorithm",
        variant: "destructive",
      });
    },
  });

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

  const availabilityMatches = availabilityData?.matches || [];
  const isLoading = matchesLoading || availabilityLoading;

  if (isLoading) {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Dad Matches</h1>
          <p className="text-muted-foreground mt-1">
            Connect with fathers based on location, availability, and children's ages
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </Link>
          
          <Button
            onClick={() => runMatchingMutation.mutate()}
            disabled={runMatchingMutation.isPending}
            size="sm"
          >
            {runMatchingMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Find Matches
          </Button>
        </div>
      </div>

      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="availability" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span> Matches
            {availabilityMatches.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                {availabilityMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span> Matches
            {matches.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                {matches.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="mt-4">
          {availabilityMatches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Schedule Matches Yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Set up your Dad Days calendar so we can match you with dads who are free at the same times.
                </p>
                <Link to="/dad-days">
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('dadDays.setYourDadDays')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {availabilityMatches.map((match) => (
                <Card key={match.matchId} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Link to={`/users/${match.user.id}`}>
                          <Avatar className="h-14 w-14 cursor-pointer">
                            <AvatarImage src={match.user.profileImage || ""} />
                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                              {match.user.firstName[0]}{match.user.lastName?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/users/${match.user.id}`}>
                              <h3 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer">
                                {match.user.firstName} {match.user.lastName}
                              </h3>
                            </Link>
                            <Badge variant="secondary" className="text-xs">
                              {match.matchScore}% match
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{match.user.city || "Unknown"} · {match.distanceKm}km</span>
                          </div>

                          {match.user.childrenInfo && match.user.childrenInfo.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <Baby className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {match.user.childrenInfo.map((child, i) => (
                                <Badge key={i} variant="outline" className="text-xs py-0">
                                  {child.name} ({child.age})
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="text-xs font-medium text-primary">Shared availability</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {match.sharedSlots.map((slot, i) => (
                                <Badge 
                                  key={i} 
                                  className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                  variant="outline"
                                >
                                  {SLOT_EMOJI[slot.timeSlot] || ""} {slot.dayName} {slot.timeSlotDisplay.split(" ")[0]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col gap-2 sm:w-28 shrink-0">
                        <Link to={`/users/${match.user.id}`} className="flex-1 sm:flex-none">
                          <Button size="sm" variant="outline" className="w-full text-xs">
                            View Profile
                          </Button>
                        </Link>
                        <Link to={`/chat/${match.user.id}`} className="flex-1 sm:flex-none">
                          <Button size="sm" className="w-full text-xs">
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />
                            Message
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          {matches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Profile Matches Yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Make sure your profile is complete with your location and children's information, then run the matching algorithm.
                </p>
                <Button onClick={() => runMatchingMutation.mutate()}>
                  Find My First Matches
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                const otherDad = getOtherDad(match, user?.id || 0);
                const isPending = match.matchStatus === 'pending';
                
                return (
                  <Card key={match.id} className="overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <Link to={`/users/${otherDad.id}`}>
                            <Avatar className="h-14 w-14 cursor-pointer">
                              <AvatarImage src={otherDad.profileImage || ""} />
                              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                {otherDad.firstName[0]}{otherDad.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link to={`/users/${otherDad.id}`}>
                                <h3 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer">
                                  {otherDad.firstName} {otherDad.lastName}
                                </h3>
                              </Link>
                              <Badge variant="secondary" className="text-xs">
                                {match.matchScore}% match
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span>{otherDad.city || "Unknown"} · {match.distanceKm}km</span>
                            </div>
                            
                            {otherDad.childrenInfo && otherDad.childrenInfo.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <Baby className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {otherDad.childrenInfo.map((child, index) => (
                                  <Badge key={index} variant="outline" className="text-xs py-0">
                                    {child.name} ({child.age})
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="mt-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Compatible ages: {formatAgeRanges(match.commonAgeRanges)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex sm:flex-col gap-2 sm:w-28 shrink-0">
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateMatchMutation.mutate({ 
                                  matchId: match.id, 
                                  status: 'accepted' 
                                })}
                                disabled={updateMatchMutation.isPending}
                                className="flex-1 sm:flex-none text-xs"
                              >
                                <Heart className="h-3.5 w-3.5 mr-1" />
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
                                className="flex-1 sm:flex-none text-xs"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Decline
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge 
                                variant={match.matchStatus === 'accepted' ? 'default' : 'secondary'}
                                className="capitalize justify-center"
                              >
                                {match.matchStatus}
                              </Badge>
                              {match.matchStatus === 'accepted' && (
                                <Link to={`/chat/${otherDad.id}`}>
                                  <Button size="sm" variant="outline" className="w-full text-xs">
                                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                    Message
                                  </Button>
                                </Link>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
