import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "./use-auth";

// Type definitions for admin-related data
type UserStats = {
  total: number;
  newLastWeek: number;
  activeLastMonth: number;
};

type PageStat = {
  path: string;
  count: number;
};

type FeatureStat = {
  feature: string;
  count: number;
};

type UserActivity = {
  id: number;
  userId: number | null;
  action: string;
  timestamp: Date;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AdminLog = {
  id: number;
  adminId: number | null;
  action: string;
  timestamp: Date;
  details?: any;
  ipAddress?: string | null;
};

type User = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage: string | null;
  lastLogin: Date | null;
  createdAt: Date;
  [key: string]: any; // For other potential properties
};

// Admin context type definition
type AdminContextType = {
  // Users management
  users: User[];
  isLoadingUsers: boolean;
  changeUserRole: (userId: number, role: string) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  isChangingRole: boolean;
  isDeleting: boolean;
  
  // Stats
  userStats: UserStats | null;
  isLoadingUserStats: boolean;
  pageStats: PageStat[];
  isLoadingPageStats: boolean;
  featureStats: FeatureStat[];
  isLoadingFeatureStats: boolean;
  
  // Activity logs
  activityLogs: UserActivity[];
  isLoadingActivityLogs: boolean;
  adminLogs: AdminLog[];
  isLoadingAdminLogs: boolean;
  
  // Refetch functions
  refetchUsers: () => void;
  refetchStats: () => void;
  refetchLogs: () => void;
};

// Create the context
const AdminContext = createContext<AdminContextType | null>(null);

// Provider component
export function AdminProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Users management queries
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/users", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
    enabled: !!user, // Only run when user is logged in
    retry: false, // Don't retry on auth errors
  });

  // User stats query
  const {
    data: userStats,
    isLoading: isLoadingUserStats,
    refetch: refetchUserStats,
  } = useQuery<UserStats>({
    queryKey: ["/api/admin/stats/users"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/stats/users", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Failed to fetch user stats");
      return await res.json();
    },
    enabled: !!user,
    retry: false,
  });

  // Page stats query
  const {
    data: pageStats = [],
    isLoading: isLoadingPageStats,
    refetch: refetchPageStats,
  } = useQuery<PageStat[]>({
    queryKey: ["/api/admin/stats/pages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats/pages");
      if (!res.ok) throw new Error("Failed to fetch page stats");
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load page statistics: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Feature stats query
  const {
    data: featureStats = [],
    isLoading: isLoadingFeatureStats,
    refetch: refetchFeatureStats,
  } = useQuery<FeatureStat[]>({
    queryKey: ["/api/admin/stats/features"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats/features");
      if (!res.ok) throw new Error("Failed to fetch feature stats");
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load feature statistics: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Activity logs query
  const {
    data: activityLogs = [],
    isLoading: isLoadingActivityLogs,
    refetch: refetchActivityLogs,
  } = useQuery<UserActivity[]>({
    queryKey: ["/api/admin/activity"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/activity");
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load activity logs: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Admin logs query
  const {
    data: adminLogs = [],
    isLoading: isLoadingAdminLogs,
    refetch: refetchAdminLogs,
  } = useQuery<AdminLog[]>({
    queryKey: ["/api/admin/logs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/logs");
      if (!res.ok) throw new Error("Failed to fetch admin logs");
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to load admin logs: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Change user role mutation
  const changeUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to change user role");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      // Invalidate queries that depend on user data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete user");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      // Invalidate queries that depend on user data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Helper functions for batch operations
  const changeUserRole = async (userId: number, role: string) => {
    await changeUserRoleMutation.mutateAsync({ userId, role });
  };

  const deleteUser = async (userId: number) => {
    await deleteUserMutation.mutateAsync(userId);
  };

  const refetchStats = () => {
    refetchUserStats();
    refetchPageStats();
    refetchFeatureStats();
  };

  const refetchLogs = () => {
    refetchActivityLogs();
    refetchAdminLogs();
  };

  return (
    <AdminContext.Provider
      value={{
        // Users
        users,
        isLoadingUsers,
        changeUserRole,
        deleteUser,
        isChangingRole: changeUserRoleMutation.isPending,
        isDeleting: deleteUserMutation.isPending,
        
        // Stats
        userStats,
        isLoadingUserStats,
        pageStats,
        isLoadingPageStats,
        featureStats,
        isLoadingFeatureStats,
        
        // Logs
        activityLogs,
        isLoadingActivityLogs,
        adminLogs,
        isLoadingAdminLogs,
        
        // Refetch functions
        refetchUsers,
        refetchStats,
        refetchLogs,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

// Hook to use the admin context
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}