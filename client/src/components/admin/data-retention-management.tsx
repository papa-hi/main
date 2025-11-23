import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Archive, RefreshCw, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface ArchivedPlaydate {
  id: number;
  title: string;
  location: string;
  startTime: string;
  archivedAt: string;
  creator: {
    username: string;
    firstName: string;
    lastName: string;
  };
  participantCount: number;
}

interface ArchivedEvent {
  id: number;
  title: string;
  location: string;
  startDate: string;
  category: string;
  archivedAt: string;
}

export function DataRetentionManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch archived playdates
  const { data: archivedPlaydates = [], isLoading: loadingPlaydates, refetch: refetchPlaydates } = useQuery<ArchivedPlaydate[]>({
    queryKey: ["/api/admin/archived/playdates"],
    enabled: activeTab === "playdates",
  });

  // Fetch archived events
  const { data: archivedEvents = [], isLoading: loadingEvents, refetch: refetchEvents } = useQuery<ArchivedEvent[]>({
    queryKey: ["/api/admin/archived/events"],
    enabled: activeTab === "events",
  });

  // Manual cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/cleanup");
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup Completed",
        description: `Archived ${data.archivedCount} items and deleted ${data.deletedCount} old items.`,
      });
      refetchPlaydates();
      refetchEvents();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to run cleanup",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="playdates">Archived Playdates</TabsTrigger>
          <TabsTrigger value="events">Archived Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policy</CardTitle>
              <CardDescription>
                Automated cleanup to optimize database performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Archive className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Soft Delete (90 days)</h3>
                    <p className="text-sm text-muted-foreground">
                      Playdates and family events are automatically archived after 90 days.
                      Archived items are hidden from users but remain in the database for analytics.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Hard Delete (12 months)</h3>
                    <p className="text-sm text-muted-foreground">
                      Archived items are permanently deleted after 12 months to prevent unbounded database growth.
                      All related data (participants, etc.) is cascaded automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Automated Schedule</h3>
                    <p className="text-sm text-muted-foreground">
                      Cleanup runs automatically every Monday at 10:00 AM.
                      You can also trigger it manually using the button below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full sm:w-auto"
                      disabled={cleanupMutation.isPending}
                      data-testid="button-trigger-cleanup"
                    >
                      {cleanupMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Running Cleanup...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Run Cleanup Now
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Run Manual Cleanup?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will archive playdates/events older than 90 days and permanently delete
                        archived items older than 12 months. This action cannot be undone for deleted items.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => cleanupMutation.mutate()}>
                        Run Cleanup
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Current Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{archivedPlaydates.length}</div>
                    <div className="text-sm text-muted-foreground">Archived Playdates</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{archivedEvents.length}</div>
                    <div className="text-sm text-muted-foreground">Archived Events</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playdates">
          <Card>
            <CardHeader>
              <CardTitle>Archived Playdates</CardTitle>
              <CardDescription>
                Playdates that have been archived (soft deleted) but not yet permanently removed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlaydates ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading archived playdates...
                </div>
              ) : archivedPlaydates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No archived playdates found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedPlaydates.map((playdate) => (
                    <Card key={playdate.id} data-testid={`card-archived-playdate-${playdate.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold">{playdate.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {playdate.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(playdate.startTime), "PPP")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {playdate.participantCount} participants
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Created by: {playdate.creator.firstName} {playdate.creator.lastName} (@{playdate.creator.username})
                            </div>
                          </div>
                          <Badge variant="secondary">
                            Archived {format(new Date(playdate.archivedAt), "PP")}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Archived Family Events</CardTitle>
              <CardDescription>
                Family events that have been archived (soft deleted) but not yet permanently removed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading archived events...
                </div>
              ) : archivedEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No archived events found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedEvents.map((event) => (
                    <Card key={event.id} data-testid={`card-archived-event-${event.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(event.startDate), "PPP")}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {event.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            Archived {format(new Date(event.archivedAt), "PP")}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
