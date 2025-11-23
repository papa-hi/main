import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft, Users, BarChart, ClipboardList, MapPin, TrendingUp, FileText, Mail, Calendar, Archive } from "lucide-react";

import UsersManagement from "@/components/admin/users-management";
import DashboardStats from "@/components/admin/dashboard-stats";
import ActivityLogs from "@/components/admin/activity-logs";
import { PlacesManagement } from "@/components/admin/places-management";
import PostsManagement from "@/components/admin/posts-management";
import { ActivityAnalytics } from "@/components/admin/activity-analytics";
import { ProfileReminders } from "@/components/admin/profile-reminders";
import { EventsManagement } from "@/components/admin/events-management";
import { DataRetentionManagement } from "@/components/admin/data-retention-management";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-admin users
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back to App
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-9 max-w-6xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
          <TabsTrigger value="places" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Places</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Reminders</span>
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardStats />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ActivityAnalytics />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <PostsManagement />
        </TabsContent>

        <TabsContent value="places" className="space-y-6">
          <PlacesManagement />
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <EventsManagement />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityLogs />
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <ProfileReminders />
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <DataRetentionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}