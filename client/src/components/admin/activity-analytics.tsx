import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, Activity, TrendingUp, Clock, BarChart3, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface ActivityStats {
  totalActions: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  activityByDay: { date: string; count: number }[];
  activeUsers: { userId: number; username: string; firstName: string; lastName: string; activityCount: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

export function ActivityAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = !!user && user.role === 'admin';

  const { data: stats, isLoading } = useQuery<ActivityStats>({
    queryKey: ['/api/admin/activity/stats'],
    refetchInterval: 120000,
    enabled: isAdmin,
  });

  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['/api/admin/activity'],
    refetchInterval: 60000,
    enabled: isAdmin,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse bg-gray-100 h-20"></CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No activity data available</p>
        </CardContent>
      </Card>
    );
  }

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Unique users active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Actions/User</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.uniqueUsers > 0 ? Math.round(stats.totalActions / stats.uniqueUsers) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per active user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Action</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.topActions[0] ? formatActionName(stats.topActions[0].action) : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topActions[0] ? `${stats.topActions[0].count} times` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="actions">Top Actions</TabsTrigger>
          <TabsTrigger value="users">Active Users</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="admin-logs">Admin Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
                <CardDescription>Daily activity over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.activityByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: any) => [value, 'Actions']}
                    />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Actions Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Action Distribution
                </CardTitle>
                <CardDescription>Most popular user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.topActions.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ action, percent }) => `${formatActionName(action)}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.topActions.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, 'Actions']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Actions Breakdown</CardTitle>
              <CardDescription>Detailed view of user action frequencies</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.topActions.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="action" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatActionName}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={formatActionName}
                    formatter={(value: any) => [value, 'Count']}
                  />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Top Actions</CardTitle>
              <CardDescription>Most frequently performed actions by users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topActions.map((action, index) => (
                  <div key={action.action} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{formatActionName(action.action)}</p>
                        <p className="text-sm text-muted-foreground">User action type</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{action.count}</p>
                      <p className="text-sm text-muted-foreground">occurrences</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Most Active Users</CardTitle>
              <CardDescription>Users with the highest activity levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.activeUsers.map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{user.activityCount}</p>
                      <p className="text-sm text-muted-foreground">actions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest user actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 h-16 rounded"></div>
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 20).map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {activity.user ? getInitials(activity.user.firstName, activity.user.lastName) : 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'Unknown User'}
                          </span>
                          {' '}
                          <span className="text-muted-foreground">
                            {formatActionName(activity.action)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatActionName(activity.action)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admin-logs">
          <AdminLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminLogsTab() {
  const { user } = useAuth();
  const { data: adminLogs = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/logs'],
    refetchInterval: 60000,
    enabled: !!user && user.role === 'admin',
  });

  const formatTimestamp = (timestamp: Date) => {
    try {
      const date = new Date(timestamp);
      return { relative: formatDistanceToNow(date, { addSuffix: true }), full: format(date, "PPpp") };
    } catch {
      return { relative: "Unknown time", full: "Invalid date" };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Action Log
        </CardTitle>
        <CardDescription>History of administrative actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-1 border-b pb-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : adminLogs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No admin actions recorded</div>
        ) : (
          adminLogs.map((log: any, index: number) => {
            const time = formatTimestamp(log.timestamp);
            return (
              <div key={index} className="flex flex-col space-y-1 border-b pb-3 last:border-0">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Admin {log.adminId || "System"}</span>
                </div>
                <p className="text-sm">{log.action}</p>
                {log.details && (
                  <p className="text-xs text-muted-foreground">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                  </p>
                )}
                <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span title={time.full}>{time.relative}</span>
                  {log.ipAddress && <><span>•</span><span>IP: {log.ipAddress}</span></>}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}