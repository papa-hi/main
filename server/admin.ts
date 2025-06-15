import type { Request, Response, NextFunction, Express } from "express";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Middleware to check if user is an admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = req.user;
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Not authorized" });
  }

  next();
};

// Log admin actions
export const logAdminAction = async (
  action: string,
  details: any,
  req: Request
) => {
  try {
    const adminId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress || null;

    await storage.logAdminAction({
      action,
      details,
      adminId,
      ipAddress,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
};

// Log user activity
export const logUserActivity = async (
  action: string,
  details: any,
  req: Request
) => {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;

    await storage.logUserActivity({
      action,
      userId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error logging user activity:", error);
  }
};

// Log page view
export const logPageView = async (
  path: string,
  duration: number | null,
  req: Request
) => {
  try {
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;
    const referrer = req.headers.referer || null;

    await storage.logPageView({
      path,
      userId,
      ipAddress,
      userAgent,
      duration,
      referrer,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error logging page view:", error);
  }
};

// Log feature usage
export const logFeatureUsage = async (
  feature: string,
  action: string,
  details: any,
  userId: number | null
) => {
  try {
    await storage.logFeatureUsage({
      feature,
      action,
      userId,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error logging feature usage:", error);
  }
};

// Set up admin routes
export function setupAdminRoutes(app: Express) {
  // Get all users (admin only)
  app.get('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAdminUsers();
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
      
      // Log admin action
      await logAdminAction("Get all users", null, req);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get user statistics
  app.get('/api/admin/stats/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
      
      // Log admin action
      await logAdminAction("View user statistics", null, req);
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });

  // Change user role
  app.patch('/api/admin/users/:userId/role', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      if (!role || typeof role !== 'string') {
        return res.status(400).json({ error: "Role is required" });
      }
      
      if (!['user', 'moderator', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const user = await storage.setUserRole(userId, role);
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
      
      // Log admin action
      await logAdminAction("Change user role", { userId, newRole: role }, req);
    } catch (error) {
      console.error("Error changing user role:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ error: "Failed to change user role" });
    }
  });

  // Delete user
  app.delete('/api/admin/users/:userId', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get user before deleting for logging
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const result = await storage.deleteUser(userId);
      
      if (result) {
        res.json({ success: true });
        
        // Log admin action
        await logAdminAction("Delete user", { 
          userId, 
          username: user.username,
          email: user.email 
        }, req);
      } else {
        res.status(500).json({ error: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get user activity
  app.get('/api/admin/activity', isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const activity = await storage.getRecentUserActivity(limit);
      res.json(activity);
      
      // Log admin action
      await logAdminAction("View user activity", { limit }, req);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ error: "Failed to fetch user activity" });
    }
  });

  // Get detailed user activity statistics
  app.get('/api/admin/activity/stats', isAdmin, async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const stats = await storage.getUserActivityStats(days);
      res.json(stats);
      
      // Log admin action
      await logAdminAction("View user activity statistics", { days }, req);
    } catch (error) {
      console.error("Error fetching user activity stats:", error);
      res.status(500).json({ error: "Failed to fetch user activity statistics" });
    }
  });

  // Get page view statistics
  app.get('/api/admin/stats/pages', isAdmin, async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const pages = await storage.getTopPages(days);
      res.json(pages);
      
      // Log admin action
      await logAdminAction("View page statistics", { days }, req);
    } catch (error) {
      console.error("Error fetching page statistics:", error);
      res.status(500).json({ error: "Failed to fetch page statistics" });
    }
  });

  // Get feature usage statistics
  app.get('/api/admin/stats/features', isAdmin, async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const features = await storage.getFeatureUsageStats(days);
      res.json(features);
      
      // Log admin action
      await logAdminAction("View feature usage statistics", { days }, req);
    } catch (error) {
      console.error("Error fetching feature usage statistics:", error);
      res.status(500).json({ error: "Failed to fetch feature usage statistics" });
    }
  });

  // Get admin logs
  app.get('/api/admin/logs', isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAdminLogs(limit);
      res.json(logs);
      
      // Log admin action
      await logAdminAction("View admin logs", { limit }, req);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ error: "Failed to fetch admin logs" });
    }
  });

  // Places management routes
  app.get('/api/admin/places', isAdmin, async (req: Request, res: Response) => {
    try {
      const places = await storage.getPlaces({});
      await logAdminAction("View places list", { count: places.length }, req);
      res.json(places);
    } catch (error) {
      console.error("Error fetching places:", error);
      res.status(500).json({ error: "Failed to fetch places" });
    }
  });

  app.patch('/api/admin/places/:placeId', isAdmin, async (req: Request, res: Response) => {
    try {
      const placeId = parseInt(req.params.placeId);
      const updatedPlace = await storage.updatePlace(placeId, req.body);
      await logAdminAction("Edit place", { placeId, placeName: updatedPlace.name }, req);
      res.json(updatedPlace);
    } catch (error) {
      console.error("Error updating place:", error);
      res.status(500).json({ error: "Failed to update place" });
    }
  });

  app.delete('/api/admin/places/:placeId', isAdmin, async (req: Request, res: Response) => {
    try {
      const placeId = parseInt(req.params.placeId);
      const success = await storage.deletePlace(placeId);
      if (success) {
        await logAdminAction("Delete place", { placeId }, req);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Place not found" });
      }
    } catch (error) {
      console.error("Error deleting place:", error);
      res.status(500).json({ error: "Failed to delete place" });
    }
  });
}