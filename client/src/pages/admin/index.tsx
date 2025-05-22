import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ChevronLeft, Users, BarChart, ClipboardList, MapPin } from "lucide-react";

import UsersManagement from "@/components/admin/users-management";
import DashboardStats from "@/components/admin/dashboard-stats";
import ActivityLogs from "@/components/admin/activity-logs";
import { PlacesManagement } from "@/components/admin/places-management";

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
        <TabsList className="grid grid-cols-4 max-w-2xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="places" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Places</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardStats />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="places" className="space-y-6">
          <PlacesManagement />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}