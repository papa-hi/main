import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Middleware to check if user is an admin
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const user = req.user;
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
  
  next();
};

// Log admin action
export const logAdminAction = async (
  adminId: number,
  action: string,
  details: any,
  req: Request
) => {
  try {
    await storage.logAdminAction({
      adminId,
      action,
      details,
      ipAddress: req.ip || null,
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// Helper to log user activity
export const logUserActivity = async (
  userId: number | null,
  action: string,
  details: any,
  req: Request
) => {
  try {
    await storage.logUserActivity({
      userId,
      action,
      details,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

// Helper to log page views
export const logPageView = async (
  userId: number | null,
  path: string,
  duration: number | null,
  referrer: string | null,
  req: Request
) => {
  try {
    await storage.logPageView({
      userId,
      path,
      duration,
      referrer,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
    });
  } catch (error) {
    console.error('Error logging page view:', error);
  }
};

// Helper to log feature usage
export const logFeatureUsage = async (
  userId: number | null,
  feature: string,
  action: string,
  details: any
) => {
  try {
    await storage.logFeatureUsage({
      userId,
      feature,
      action,
      details,
    });
  } catch (error) {
    console.error('Error logging feature usage:', error);
  }
};

// Setup admin routes
export function setupAdminRoutes(app: Express) {
  // Get all users (for admin)
  app.get('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords before sending to client
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
      
      // Log admin action
      logAdminAction(req.user.id, 'view_all_users', {}, req);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
  // Get user statistics
  app.get('/api/admin/stats/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
      
      // Log admin action
      logAdminAction(req.user.id, 'view_user_stats', {}, req);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
  });
  
  // Update user role
  app.patch('/api/admin/users/:userId/role', isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }
      
      const updatedUser = await storage.setUserRole(parseInt(userId), role);
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
      
      // Log admin action
      logAdminAction(req.user.id, 'update_user_role', { userId, newRole: role }, req);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });
  
  // Delete user (admin only)
  app.delete('/api/admin/users/:userId', isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const deleted = await storage.deleteUser(parseInt(userId));
      
      if (deleted) {
        res.json({ success: true });
        
        // Log admin action
        logAdminAction(req.user.id, 'delete_user', { userId }, req);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });
  
  // Get recent user activity
  app.get('/api/admin/activity', isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const activity = await storage.getRecentUserActivity(limit);
      res.json(activity);
      
      // Log admin action
      logAdminAction(req.user.id, 'view_user_activity', { limit }, req);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ error: 'Failed to fetch user activity' });
    }
  });
  
  // Get top pages
  app.get('/api/admin/stats/pages', isAdmin, async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const pages = await storage.getTopPages(days);
      res.json(pages);
      
      // Log admin action
      logAdminAction(req.user.id, 'view_top_pages', { days }, req);
    } catch (error) {
      console.error('Error fetching top pages:', error);
      res.status(500).json({ error: 'Failed to fetch top pages' });
    }
  });
  
  // Get feature usage statistics
  app.get('/api/admin/stats/features', isAdmin, async (req: Request, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const features = await storage.getFeatureUsageStats(days);
      res.json(features);
      
      // Log admin action
      logAdminAction(req.user.id, 'view_feature_stats', { days }, req);
    } catch (error) {
      console.error('Error fetching feature usage stats:', error);
      res.status(500).json({ error: 'Failed to fetch feature usage statistics' });
    }
  });
  
  // Get admin logs
  app.get('/api/admin/logs', isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAdminLogs(limit);
      res.json(logs);
      
      // Log admin action
      logAdminAction(req.user.id, 'view_admin_logs', { limit }, req);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      res.status(500).json({ error: 'Failed to fetch admin logs' });
    }
  });
}