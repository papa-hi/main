import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, PieChart } from "@/components/ui/custom-charts";
import { Users, Calendar, MapPin, TrendingUp } from "lucide-react";

export default function DashboardStats() {
  const {
    userStats,
    isLoadingUserStats,
    pageStats,
    isLoadingPageStats,
    featureStats,
    isLoadingFeatureStats,
  } = useAdmin();

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUserStats ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{userStats?.total || 0}</div>}
            {isLoadingUserStats ? <Skeleton className="h-3 w-24 mt-1" /> : <p className="text-xs text-muted-foreground">+{userStats?.newLastWeek || 0} from last week</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUserStats ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{userStats?.activeLastMonth || 0}</div>}
            {isLoadingUserStats ? <Skeleton className="h-3 w-24 mt-1" /> : (
              <p className="text-xs text-muted-foreground">
                {Math.round((userStats?.activeLastMonth || 0) / (userStats?.total || 1) * 100)}% of total users
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Playdates</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUserStats ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{userStats?.totalPlaydates ?? 0}</div>}
            {isLoadingUserStats ? <Skeleton className="h-3 w-24 mt-1" /> : <p className="text-xs text-muted-foreground">+{userStats?.newPlaydatesLastMonth ?? 0} from last month</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Places</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUserStats ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{userStats?.totalPlaces ?? 0}</div>}
            {isLoadingUserStats ? <Skeleton className="h-3 w-24 mt-1" /> : <p className="text-xs text-muted-foreground">+{userStats?.newPlacesLastMonth ?? 0} from last month</p>}
          </CardContent>
        </Card>
      </div>

      {/* Page views */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {isLoadingPageStats ? (
            <Skeleton className="h-[250px] w-full" />
          ) : pageStats.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No page data available</p>
            </div>
          ) : (
            <BarChart
              data={pageStats.map((page) => ({ name: page.path, value: page.count }))}
              xLabel="Page Path"
              yLabel="Views"
              height={250}
            />
          )}
        </CardContent>
      </Card>

      {/* Feature usage */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage</CardTitle>
          <CardDescription>Most used features in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {isLoadingFeatureStats ? (
            <Skeleton className="h-[250px] w-full" />
          ) : featureStats.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No feature data available</p>
            </div>
          ) : (
            <PieChart
              data={featureStats.map((feature) => ({ name: feature.feature, value: feature.count }))}
              height={250}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
