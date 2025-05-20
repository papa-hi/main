import { useAdmin } from "@/hooks/use-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, User, LayoutGrid, Shield } from "lucide-react";

export default function ActivityLogs() {
  const { 
    activityLogs, 
    isLoadingActivityLogs,
    adminLogs,
    isLoadingAdminLogs
  } = useAdmin();

  // Format timestamp to human-readable format
  const formatTimestamp = (timestamp: Date) => {
    try {
      const date = new Date(timestamp);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        full: format(date, "PPpp") // Format: May 25, 2023, 12:34 PM
      };
    } catch (error) {
      return {
        relative: "Unknown time",
        full: "Invalid date"
      };
    }
  };

  return (
    <Tabs defaultValue="user-activity">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="user-activity">User Activity</TabsTrigger>
        <TabsTrigger value="admin-logs">Admin Actions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="user-activity">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent User Activity</CardTitle>
            <CardDescription>
              Track what users are doing in the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingActivityLogs ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-1 border-b pb-3">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No recent user activity recorded
              </div>
            ) : (
              activityLogs.map((log: any, index: number) => {
                const time = formatTimestamp(log.timestamp);
                return (
                  <div key={index} className="flex flex-col space-y-1 border-b pb-3 last:border-0">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        User {log.userId || "Anonymous"}
                      </span>
                    </div>
                    <p className="text-sm">{log.action}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground">
                        {typeof log.details === 'object' 
                          ? JSON.stringify(log.details) 
                          : String(log.details)}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span title={time.full}>{time.relative}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="admin-logs">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Admin Action Log</CardTitle>
            <CardDescription>
              History of administrative actions taken by admins and moderators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingAdminLogs ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-1 border-b pb-3">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : adminLogs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No admin actions recorded
              </div>
            ) : (
              adminLogs.map((log: any, index: number) => {
                const time = formatTimestamp(log.timestamp);
                return (
                  <div key={index} className="flex flex-col space-y-1 border-b pb-3 last:border-0">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span className="font-medium">
                        Admin {log.adminId || "System"}
                      </span>
                    </div>
                    <p className="text-sm">{log.action}</p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground">
                        {typeof log.details === 'object' 
                          ? JSON.stringify(log.details) 
                          : String(log.details)}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span title={time.full}>{time.relative}</span>
                      {log.ipAddress && (
                        <>
                          <span>•</span>
                          <span>IP: {log.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}