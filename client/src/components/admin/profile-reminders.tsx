import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Send, Users, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IncompleteUser {
  id: number;
  firstName: string;
  username: string;
  email: string;
  missingFields: string[];
}

interface ProfileReminderStatus {
  isRunning: boolean;
  lastRun: string | null;
  nextCheck: string;
}

interface IncompleteProfilesData {
  totalIncomplete: number;
  users: IncompleteUser[];
}

export function ProfileReminders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUserList, setShowUserList] = useState(false);

  // Fetch scheduler status
  const { data: status, isLoading: statusLoading } = useQuery<ProfileReminderStatus>({
    queryKey: ["/api/admin/profile-reminders/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch incomplete profiles
  const { data: incompleteData, isLoading: profilesLoading, refetch: refetchProfiles } = useQuery<IncompleteProfilesData>({
    queryKey: ["/api/admin/profile-reminders/check"],
    enabled: showUserList,
  });

  // Send reminders mutation
  const sendRemindersMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/profile-reminders/send"),
    onSuccess: () => {
      toast({
        title: "Profile Reminders Sent",
        description: "Profile reminder emails are being sent in the background.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile-reminders/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send profile reminders",
        variant: "destructive",
      });
    },
  });

  const fieldLabels: Record<string, string> = {
    profileImage: "Profile Photo",
    bio: "Bio/About Me",
    city: "City/Location",
    phoneNumber: "Phone Number",
    childrenInfo: "Children Information",
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Profile Reminder System</h3>
          <p className="text-sm text-muted-foreground">
            Monitor and manage weekly email reminders for incomplete profiles
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {statusLoading ? (
                <Badge variant="secondary">Loading...</Badge>
              ) : status?.isRunning ? (
                <Badge variant="default">Running</Badge>
              ) : (
                <Badge variant="outline">Idle</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {statusLoading ? "Loading..." : formatDate(status?.lastRun || null)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Check</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {statusLoading ? "Loading..." : status?.nextCheck || "Unknown"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Check for incomplete profiles and send reminder emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowUserList(!showUserList);
                if (!showUserList) {
                  refetchProfiles();
                }
              }}
              disabled={profilesLoading}
            >
              <Users className="mr-2 h-4 w-4" />
              {showUserList ? "Hide" : "Check"} Incomplete Profiles
            </Button>

            <Button
              onClick={() => sendRemindersMutation.mutate()}
              disabled={sendRemindersMutation.isPending || status?.isRunning}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendRemindersMutation.isPending ? "Sending..." : "Send Reminders Now"}
            </Button>
          </div>

          {showUserList && incompleteData && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium">
                  Incomplete Profiles ({incompleteData.totalIncomplete})
                </h4>
                <Badge variant="secondary">
                  {incompleteData.totalIncomplete} users need reminders
                </Badge>
              </div>

              {incompleteData.totalIncomplete === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  All users have complete profiles! 🎉
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {incompleteData.users.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {user.firstName} (@{user.username})
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.missingFields.map((field) => (
                              <Badge key={field} variant="destructive" className="text-xs">
                                {fieldLabels[field] || field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {user.missingFields.length} missing
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>• Weekly reminders are sent automatically every Monday at 10:00 AM</div>
          <div>• Users receive reminders until they complete their profiles</div>
          <div>• Essential fields: Profile Photo, Bio, City, Phone Number, Children Information</div>
          <div>• Email delivery uses Resend service with papa@papa-hi.com as sender</div>
          <div>• All reminder activities are logged for admin tracking</div>
        </CardContent>
      </Card>
    </div>
  );
}