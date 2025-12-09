import type { Request, Response, NextFunction, Express } from "express";
import { storage } from "./storage";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertFamilyEventSchema, updateFamilyEventSchema } from "@shared/schema";
import { geocodeAddress } from "./geocoding";
import { sendNewEventNotification } from "./email-service";
import { format } from "date-fns";

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
  // Get all users (admin only) with pagination
  app.get('/api/admin/users', isAdmin, async (req: Request, res: Response) => {
    try {
      // Parse and validate pagination parameters
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const rawOffset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Validate and clamp values
      if (isNaN(rawLimit) || isNaN(rawOffset)) {
        return res.status(400).json({ error: "Invalid pagination parameters" });
      }
      
      const limit = Math.min(Math.max(1, rawLimit), 200); // Clamp between 1 and 200
      const offset = Math.max(0, rawOffset); // Ensure non-negative
      
      const { users, total } = await storage.getAdminUsers({ limit, offset });
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({
        users: sanitizedUsers,
        total,
        limit,
        offset,
        hasMore: offset + users.length < total
      });
      
      // Log admin action
      await logAdminAction("Get all users", { limit, offset }, req);
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

  // Get user activity with pagination
  app.get('/api/admin/activity', isAdmin, async (req: Request, res: Response) => {
    try {
      // Parse and validate pagination parameters
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const rawOffset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Validate and clamp values
      if (isNaN(rawLimit) || isNaN(rawOffset)) {
        return res.status(400).json({ error: "Invalid pagination parameters" });
      }
      
      const limit = Math.min(Math.max(1, rawLimit), 200); // Clamp between 1 and 200
      const offset = Math.max(0, rawOffset); // Ensure non-negative
      
      const { activity, total } = await storage.getRecentUserActivity({ limit, offset });
      res.json({
        activity,
        total,
        limit,
        offset,
        hasMore: offset + activity.length < total
      });
      
      // Log admin action
      await logAdminAction("View user activity", { limit, offset }, req);
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

  // Get admin logs with pagination
  app.get('/api/admin/logs', isAdmin, async (req: Request, res: Response) => {
    try {
      // Parse and validate pagination parameters
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const rawOffset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Validate and clamp values
      if (isNaN(rawLimit) || isNaN(rawOffset)) {
        return res.status(400).json({ error: "Invalid pagination parameters" });
      }
      
      const limit = Math.min(Math.max(1, rawLimit), 200); // Clamp between 1 and 200
      const offset = Math.max(0, rawOffset); // Ensure non-negative
      
      const { logs, total } = await storage.getAdminLogs({ limit, offset });
      res.json({
        logs,
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      });
      
      // Log admin action
      await logAdminAction("View admin logs", { limit, offset }, req);
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

  // Admin community post management
  app.get('/api/admin/posts', isAdmin, async (req: Request, res: Response) => {
    try {
      const posts = await storage.getCommunityPosts({ limit: 100 });
      await logAdminAction("View community posts", { postCount: posts.length }, req);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching admin posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.delete('/api/admin/posts/:postId', isAdmin, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      const post = await storage.getCommunityPostById(postId);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const success = await storage.deleteCommunityPost(postId);
      if (success) {
        await logAdminAction("Delete harmful post", { 
          postId, 
          postTitle: post.title,
          authorId: post.userId,
          reason: req.body.reason || "Harmful content removal"
        }, req);
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete post" });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Profile reminder system endpoints
  app.get('/api/admin/profile-reminders/status', isAdmin, async (req: Request, res: Response) => {
    try {
      const { weeklyScheduler } = await import('./weekly-scheduler');
      const status = weeklyScheduler.getStatus();
      await logAdminAction("Check profile reminder status", status, req);
      res.json(status);
    } catch (error) {
      console.error("Error getting scheduler status:", error);
      res.status(500).json({ error: "Failed to get scheduler status" });
    }
  });

  app.get('/api/admin/profile-reminders/check', isAdmin, async (req: Request, res: Response) => {
    try {
      const { findUsersWithIncompleteProfiles } = await import('./profile-reminder-scheduler');
      const incompleteUsers = await findUsersWithIncompleteProfiles();
      
      await logAdminAction("Check incomplete profiles", { 
        totalIncomplete: incompleteUsers.length 
      }, req);
      
      res.json({
        totalIncomplete: incompleteUsers.length,
        users: incompleteUsers.map(user => ({
          id: user.id,
          firstName: user.firstName,
          username: user.username,
          email: user.email,
          missingFields: user.missingFields
        }))
      });
    } catch (error) {
      console.error("Error checking incomplete profiles:", error);
      res.status(500).json({ error: "Failed to check incomplete profiles" });
    }
  });

  app.post('/api/admin/profile-reminders/send', isAdmin, async (req: Request, res: Response) => {
    try {
      const { weeklyScheduler } = await import('./weekly-scheduler');
      
      // Run the reminders in the background
      weeklyScheduler.forceRun().then(() => {
        console.log('Manual profile reminders completed');
      }).catch((error) => {
        console.error('Error in manual profile reminders:', error);
      });

      await logAdminAction("Trigger profile reminders", { 
        triggeredBy: "manual",
        timestamp: new Date().toISOString()
      }, req);
      
      res.json({ 
        success: true, 
        message: "Profile reminders are being sent in the background" 
      });
    } catch (error) {
      console.error("Error triggering profile reminders:", error);
      res.status(500).json({ error: "Failed to trigger profile reminders" });
    }
  });

  // Family Events Management
  app.get('/api/admin/events', isAdmin, async (req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      await logAdminAction("View events", { eventCount: events.length }, req);
      res.json(events);
    } catch (error) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get('/api/admin/events/:eventId', isAdmin, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      await logAdminAction("View event details", { eventId }, req);
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post('/api/admin/events', isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertFamilyEventSchema.parse(req.body);
      
      // Geocode the location if lat/lon not provided
      if (!validatedData.latitude || !validatedData.longitude) {
        const coordinates = await geocodeAddress(validatedData.location);
        if (!coordinates) {
          return res.status(400).json({ 
            error: `Unable to geocode location "${validatedData.location}". Please verify the address or provide coordinates manually.`
          });
        }
        validatedData.latitude = coordinates.latitude.toString();
        validatedData.longitude = coordinates.longitude.toString();
      }
      
      const newEvent = await storage.createEvent(validatedData);
      
      await logAdminAction("Create event", { 
        eventId: newEvent.id, 
        title: newEvent.title 
      }, req);
      
      // Send email notifications to all users (non-blocking)
      sendNewEventNotifications(newEvent).catch(err => {
        console.error('Error sending new event notifications:', err);
      });
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch('/api/admin/events/:eventId', isAdmin, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Validate the update data using update schema (no defaults)
      const validatedData = updateFamilyEventSchema.parse(req.body);
      
      // If location changed, re-geocode unless lat/lon explicitly provided
      if (validatedData.location && validatedData.location !== event.location && (!validatedData.latitude || !validatedData.longitude)) {
        const coordinates = await geocodeAddress(validatedData.location);
        if (!coordinates) {
          // Block update if location changed but geocoding failed (prevents coordinate/location mismatch)
          return res.status(400).json({ 
            error: `Unable to geocode new location "${validatedData.location}". Please verify the address. The event location was not updated.`
          });
        }
        validatedData.latitude = coordinates.latitude.toString();
        validatedData.longitude = coordinates.longitude.toString();
      }
      
      const updatedEvent = await storage.updateEvent(eventId, validatedData);
      
      await logAdminAction("Update event", { 
        eventId, 
        title: updatedEvent.title,
        changes: validatedData 
      }, req);
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete('/api/admin/events/:eventId', isAdmin, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const success = await storage.deleteEvent(eventId);
      
      if (success) {
        await logAdminAction("Delete event", { 
          eventId, 
          title: event.title 
        }, req);
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to delete event" });
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
}

async function sendNewEventNotifications(event: any): Promise<void> {
  try {
    const allUsers = await storage.getAllUsers();
    
    // Filter users who:
    // 1. Have an email address
    // 2. Are not admins
    // 3. Have a city in their profile
    // 4. Their city matches the event location (case-insensitive)
    const eventLocationLower = event.location.toLowerCase();
    
    const usersWithEmail = allUsers.filter(user => {
      if (!user.email || user.role === 'admin') return false;
      if (!user.city) return false; // Skip users without city
      
      // Check if user's city is mentioned in the event location
      const userCityLower = user.city.toLowerCase();
      return eventLocationLower.includes(userCityLower);
    });
    
    console.log(`Sending new event notifications to ${usersWithEmail.length} users in ${event.location} for event: ${event.title}`);
    
    const eventDate = format(new Date(event.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a");
    
    let successCount = 0;
    let failCount = 0;
    
    for (const user of usersWithEmail) {
      try {
        const result = await sendNewEventNotification({
          to: user.email!,
          firstName: user.firstName || user.username || 'Friend',
          eventTitle: event.title,
          eventDescription: event.description || '',
          eventDate: eventDate,
          eventLocation: event.location,
          eventCategory: event.category,
          eventId: event.id
        });
        
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Failed to send notification to ${user.email}:`, err);
        failCount++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    console.log(`New event notifications sent: ${successCount}/${usersWithEmail.length} successful, ${failCount} failed`);
  } catch (error) {
    console.error('Error in sendNewEventNotifications:', error);
  }
}