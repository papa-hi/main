import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { playdates, places, users, chatMessages, imageStorage, insertPlaydateSchema, insertPlaceSchema, User as SelectUser, insertChatMessageSchema, playdateParticipants, userFavorites, ratings } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { setupAdminRoutes } from "./admin";
import { upload, getFileUrl, deleteProfileImage, storeImageInDatabase } from "./upload";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from 'ws';
import { fetchNearbyPlaygrounds } from "./maps-service";
import { db } from "./db";
import { eq, and, gte, asc, count } from "drizzle-orm";
import crypto from "crypto";
import { getVapidPublicKey, sendNotificationToUser, sendPlaydateReminder, sendPlaydateUpdate } from "./push-notifications";
import { pushSubscriptions } from "@shared/schema";
import { schedulePlaydateReminders, notifyNewParticipant, notifyPlaydateModified } from "./notification-scheduler";

// Helper function to geocode address and get coordinates
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (!address || address.trim() === '') return null;
    
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=nl`;
    const response = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'PaPa-Hi Family App (development)'
      }
    });
    
    if (!response.ok) {
      console.error(`Geocoding failed: HTTP ${response.status} for address: ${address}`);
      return null;
    }
    
    const data = await response.json();

    if (data && data.length > 0) {
      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
      console.log(`Geocoded "${address}" to coordinates: ${result.latitude}, ${result.longitude}`);
      return result;
    }
  } catch (error) {
    console.error(`[GEOCODE] Error:`, error);
  }
  return null;
}

// Counter to track which playground image to use next
let playgroundImageCounter = 0;
// Counter to track which restaurant image to use next
let restaurantImageCounter = 0;
// Counter to track which museum image to use next
let museumImageCounter = 0;

// Helper function to get a playground image with variety
function getRandomPlaygroundImage(): string {
  const playgroundImages = [
    "/assets/playground2.png",
    "/assets/playground3.png", 
    "/assets/playground4.png"
  ];
  
  // Cycle through images sequentially to ensure variety
  const selectedImage = playgroundImages[playgroundImageCounter % playgroundImages.length];
  playgroundImageCounter++;
  
  return selectedImage;
}

// Helper function to get a restaurant image with variety
function getRandomRestaurantImage(): string {
  const restaurantImages = [
    "/assets/restaurant1.png",
    "/assets/restaurant2.png", 
    "/assets/restaurant3.png",
    "/assets/restaurant4.png"
  ];
  
  // Cycle through images sequentially to ensure variety
  const selectedImage = restaurantImages[restaurantImageCounter % restaurantImages.length];
  restaurantImageCounter++;
  
  return selectedImage;
}

// Helper function to get a museum image with variety
function getRandomMuseumImage(): string {
  const museumImages = [
    "/assets/museum1.png",
    "/assets/museum2.png", 
    "/assets/museum3.png",
    "/assets/museum4.png"
  ];
  
  // Cycle through images sequentially to ensure variety
  const selectedImage = museumImages[museumImageCounter % museumImages.length];
  museumImageCounter++;
  
  return selectedImage;
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // For search endpoints, we'll bypass authentication for testing purposes
  if (req.path.includes("/search")) {
    console.log("Bypassing authentication for search route:", req.path);
    return next();
  }
  
  // Debug authentication for profile endpoints
  if (req.path.includes("/api/users/me/")) {
    console.log("Auth check for profile endpoint:", req.path);
    console.log("Is authenticated:", req.isAuthenticated());
    console.log("User object:", req.user);
    console.log("Session:", req.session);
  }
  
  // For request debugging, log headers
  if (req.method === 'GET' && req.path === '/api/user' && !req.isAuthenticated()) {
    console.log("ERROR HEADERS for GET /api/user:", JSON.stringify(req.headers));
  }

  // For API requests, show the full request body
  if (req.method === 'POST' && req.path === '/api/playdates') {
    console.log("REQUEST BODY for POST /api/playdates:", JSON.stringify(req.body));
  }
  
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: "Not authenticated" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Setup admin routes
  setupAdminRoutes(app);

  // Image serving endpoint - serves images from database
  app.get("/api/images/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      const [image] = await db
        .select()
        .from(imageStorage)
        .where(eq(imageStorage.filename, filename));
      
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Convert base64 back to buffer
      const imageBuffer = Buffer.from(image.dataBase64, 'base64');
      
      res.set({
        'Content-Type': image.mimeType,
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });
      
      res.send(imageBuffer);
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Push notification endpoints
  app.get("/api/push/vapid-public-key", (req, res) => {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      return res.status(500).json({ error: "VAPID keys not configured" });
    }
    res.json({ publicKey });
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }

      // Save subscription to database
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
      }).onConflictDoUpdate({
        target: [pushSubscriptions.userId, pushSubscriptions.endpoint],
        set: {
          lastUsed: new Date(),
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint required" });
      }

      await db.delete(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  app.post("/api/push/test", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user as SelectUser;
      await sendNotificationToUser(userId, {
        title: "PaPa-Hi Test Melding",
        body: `Hallo ${user.firstName}! Dit is een test melding van PaPa-Hi.`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        data: {
          type: "test",
          url: "/"
        }
      });

      res.json({ success: true, message: "Test notification sent" });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });
  
  // Handle profile image upload during registration (no auth required)
  app.post("/api/upload/profile-image", upload.single('profileImage'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Store image in database - no user ID since this is during registration
      const filename = await storeImageInDatabase(req.file, null, 'profile');
      const imageUrl = `/api/images/${filename}`;
      
      console.log(`Profile image uploaded during registration: ${filename}`);
      console.log(`Database image URL: ${imageUrl}`);
      
      res.json({ 
        success: true, 
        filename,
        imageUrl
      });
    } catch (err) {
      console.error("Error uploading profile image:", err);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });
  
  // Serve images from database
  app.get('/api/images/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Security check to prevent directory traversal
      if (filename.includes('..') || filename.includes('/')) {
        return res.status(403).send('Forbidden');
      }
      
      console.log(`[DATABASE_IMAGE_SERVER] Request for: ${filename}`);
      
      // Fetch image from database
      const imageRecord = await db.select().from(imageStorage).where(eq(imageStorage.filename, filename)).limit(1);
      
      if (imageRecord.length === 0) {
        console.error(`[DATABASE_IMAGE_SERVER] Image not found: ${filename}`);
        return res.status(404).send('Image not found');
      }
      
      const image = imageRecord[0];
      
      // Convert base64 back to buffer
      const imageBuffer = Buffer.from(image.dataBase64, 'base64');
      
      // Set appropriate headers
      res.setHeader('Content-Type', image.mimeType);
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      console.log(`[DATABASE_IMAGE_SERVER] Serving image: ${filename}, size: ${imageBuffer.length} bytes`);
      
      // Send the image
      res.send(imageBuffer);
    } catch (error) {
      console.error(`[DATABASE_IMAGE_SERVER] Error serving image:`, error);
      res.status(500).send('Error serving image');
    }
  });
  
  // Serve other uploaded files
  app.use('/uploads', (req, res, next) => {
    // Security check to prevent directory traversal
    if (req.path.includes('..')) {
      return res.status(403).send('Forbidden');
    }
    next();
  }, (req, res, next) => {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsPath, req.path);
    
    // Add debug logging
    console.log(`[FILE_SERVER] Request for: ${req.path}`);
    console.log(`[FILE_SERVER] Full path: ${filePath}`);
    
    // Check if file exists before sending
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`[FILE_SERVER] Error sending file: ${err.message}`);
          next(err);
        }
      });
    } else {
      console.error(`[FILE_SERVER] File not found: ${filePath}`);
      res.status(404).send('File not found');
    }
  });
  
  // put application routes here
  // prefix all routes with /api

  // User routes
  app.get("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      // Get the authenticated user
      const user = req.user;
      
      // Format the response to match the expected structure
      const userWithoutPassword = { ...user } as Partial<SelectUser>;
      delete userWithoutPassword.password;
      
      // Add children info if available, or default to empty array
      if (!userWithoutPassword.childrenInfo) {
        userWithoutPassword.childrenInfo = [];
      }
      
      // Add favorite locations if available, or default to empty array
      if (!userWithoutPassword.favoriteLocations) {
        userWithoutPassword.favoriteLocations = [];
      }
      
      // Use default avatar if no profile image is set
      if (!userWithoutPassword.profileImage) {
        userWithoutPassword.profileImage = "/avatar.png";
      }
      
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users for user directory
  // GDPR Data Export endpoint
  app.get("/api/user/export-data", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Gather all user data for GDPR export
      const userData = await storage.getUserById(userId);
      const userPlaydates = await storage.getUserPlaydates(userId);
      // Get user's favorite places
      const userFavoritesList = await storage.getUserFavoritePlaces(userId);
      const userChatMessages = await db.select().from(chatMessages).where(eq(chatMessages.senderId, userId));
      const userSubscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

      // Create comprehensive data export
      const exportData = {
        exportDate: new Date().toISOString(),
        userData: {
          id: userData?.id,
          username: userData?.username,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          email: userData?.email,
          city: userData?.city,
          bio: userData?.bio,
          badge: userData?.badge,
          childrenInfo: userData?.childrenInfo,
          profileImage: userData?.profileImage,
          createdAt: userData?.createdAt
        },
        playdates: userPlaydates.map((playdate: any) => ({
          id: playdate.id,
          title: playdate.title,
          description: playdate.description,
          startTime: playdate.startTime,
          endTime: playdate.endTime,
          location: playdate.location,
          createdAt: playdate.createdAt
        })),
        favoritePlaces: userFavoritesList.map((place: any) => ({
          id: place.id,
          name: place.name,
          description: place.description,
          address: place.address,
          type: place.type,
          createdAt: place.createdAt
        })),
        chatMessages: userChatMessages.map(message => ({
          id: message.id,
          content: message.content,
          sentAt: message.sentAt
        })),
        pushSubscriptions: userSubscriptions.length,
        dataProcessingConsent: {
          analytics: req.headers['analytics-consent'] || 'not-set',
          marketing: req.headers['marketing-consent'] || 'not-set',
          location: req.headers['location-consent'] || 'not-set'
        }
      };

      res.json(exportData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ error: "Failed to export user data" });
    }
  });

  // GDPR Account Deletion endpoint
  app.delete("/api/user/delete-account", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Delete user data in correct order to maintain referential integrity
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
      await db.delete(chatMessages).where(eq(chatMessages.senderId, userId));
      await db.delete(playdateParticipants).where(eq(playdateParticipants.userId, userId));
      await db.delete(playdates).where(eq(playdates.creatorId, userId));
      await db.delete(userFavorites).where(eq(userFavorites.userId, userId));
      await db.delete(ratings).where(eq(ratings.userId, userId));
      
      // Finally delete the user account
      const success = await storage.deleteUser(userId);
      
      if (success) {
        // Destroy the session
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
          }
        });
        
        res.json({ success: true, message: "Account deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete account" });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Get all users from storage, limiting what data is returned
      const users = await storage.getAllUsers();
      
      // Filter out sensitive information
      const safeUsers = users.map(user => {
        const userWithoutSensitive = { ...user } as Partial<SelectUser>;
        delete userWithoutSensitive.password;
        
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage || "/avatar.png",
          city: user.city,
          badge: user.badge,
          bio: user.bio
        };
      });
      
      res.json(safeUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Get featured user - random dad from the database
  // IMPORTANT: This route MUST come before /api/users/:id to avoid conflicts!
  app.get("/api/users/featured", isAuthenticated, async (req, res) => {
    try {
      console.log("Fetching featured user");
      
      // Get all users to select a random one
      const allUsers = await storage.getAllUsers();
      
      // Check if we have users to feature
      if (!allUsers || allUsers.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }
      
      // Filter out the current logged-in user (if authenticated)
      let otherUsers = allUsers;
      if (req.user && req.user.id) {
        otherUsers = allUsers.filter(user => user.id !== req.user?.id);
      }
      
      if (otherUsers.length === 0) {
        // If there are no other users, just return a random user anyway
        otherUsers = allUsers;
      }
      
      // Select a random user as the featured dad
      const randomIndex = Math.floor(Math.random() * otherUsers.length);
      const featuredUser = otherUsers[randomIndex];
      
      // Generate consistent favorite places based on user ID
      const cityBasedLocations = {
        'Amsterdam': ["Vondelpark", "NEMO Science Museum", "Artis Zoo"],
        'Rotterdam': ["Plaswijckpark", "Maritiem Museum", "Euromast Park"],
        'Utrecht': ["Griftpark", "TivoliVredenburg", "Wilhelminapark"],
        'Den Haag': ["Madurodam", "Scheveningen Beach", "Zuiderpark"],
        'Eindhoven': ["Genneper Parken", "Philips Museum", "Stadswandelpark"]
      };
      
      // Use the user's city or default to Amsterdam
      const userCity = featuredUser.city || 'Amsterdam';
      const defaultLocations = cityBasedLocations[userCity as keyof typeof cityBasedLocations] || 
                              cityBasedLocations['Amsterdam'];
      
      // Get user's real favorite places and track if they have actually set them
      let userFavoritePlaces: string[] = [];
      let hasSetFavorites = false;
      
      try {
        const favoritePlaces = await storage.getUserFavoritePlaces(featuredUser.id);
        if (favoritePlaces && favoritePlaces.length > 0) {
          userFavoritePlaces = favoritePlaces.map(place => place.name).slice(0, 3);
          hasSetFavorites = true;
          console.log(`Using user's actual favorite places: ${userFavoritePlaces.join(', ')}`);
        } else {
          console.log(`No favorite places found for ${featuredUser.firstName}`);
        }
      } catch (error) {
        console.log(`Could not fetch favorite places for user ${featuredUser.id}: ${error}`);
      }
      
      // Check if the user has actual children data
      const hasChildrenInfo = featuredUser.childrenInfo && 
                           Array.isArray(featuredUser.childrenInfo) && 
                           featuredUser.childrenInfo.length > 0;
      
      console.log(`Children info for ${featuredUser.firstName}: ${hasChildrenInfo ? 'Available' : 'Not available'}`);
                           
      // Use actual user data for badge and children
      const userWithDetails = {
        ...featuredUser,
        badge: featuredUser.badge || "Actieve Papa",
        // Use default avatar if no profile image is set
        profileImage: featuredUser.profileImage || "/avatar.png",
        // Only include real children data, no fictional data
        childrenInfo: hasChildrenInfo ? featuredUser.childrenInfo : [],
        hasChildrenInfo: hasChildrenInfo,
        favoriteLocations: userFavoritePlaces,
        hasSetFavorites: hasSetFavorites
      };
      
      console.log(`Selected featured user: ${featuredUser.firstName} ${featuredUser.lastName}`);
      res.json(userWithDetails);
    } catch (err) {
      console.error("Error fetching featured user:", err);
      res.status(500).json({ message: "Failed to fetch featured user" });
    }
  });
  
  // This must come AFTER specific routes like /api/users/featured to avoid conflicts
  app.get("/api/users/:id([0-9]+)", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Filter out sensitive information
      const userWithoutSensitive = { ...user } as Partial<SelectUser>;
      delete userWithoutSensitive.password;
      
      // Add some additional details if it's not already there
      if (!userWithoutSensitive.childrenInfo) {
        userWithoutSensitive.childrenInfo = [];
      }
      
      // Use default avatar if no profile image is set
      if (!userWithoutSensitive.profileImage) {
        userWithoutSensitive.profileImage = "/avatar.png";
      }
      
      // Return user data
      res.json(userWithoutSensitive);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // IMPORTANT: /me routes must come BEFORE /:id routes to avoid conflicts
  app.get("/api/users/me/favorite-places", async (req, res) => {
    console.log("🔍 FAVORITES ENDPOINT - User ID:", req.user?.id, "Auth:", req.isAuthenticated());
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const userId = req.user?.id;
      if (!userId) return res.sendStatus(401);
      
      console.log("✅ Fetching favorites for user:", userId);
      const favoritePlaces = await storage.getUserFavoritePlaces(userId);
      console.log("📍 Found", favoritePlaces.length, "favorite places");
      res.json(favoritePlaces);
    } catch (err) {
      console.error("❌ Error fetching favorite places:", err);
      res.status(500).json({ message: "Failed to fetch favorite places" });
    }
  });

  app.get("/api/users/me/playdates", async (req, res) => {
    console.log("🎯 PLAYDATES ENDPOINT - User ID:", req.user?.id, "Auth:", req.isAuthenticated());
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const userId = req.user?.id;
      if (!userId) return res.sendStatus(401);
      
      console.log("✅ Fetching playdates for user:", userId);
      const userPlaydates = await storage.getUserPlaydates(userId);
      console.log("🎈 Found", userPlaydates.length, "playdates");
      res.json(userPlaydates);
    } catch (err) {
      console.error("❌ Error fetching user playdates:", err);
      res.status(500).json({ message: "Failed to fetch user playdates" });
    }
  });
  
  // Get a user's favorite places
  app.get("/api/users/:id/favorite-places", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const places = await storage.getUserFavoritePlaces(userId);
      res.json(places);
    } catch (err) {
      console.error("Error fetching user's favorite places:", err);
      res.status(500).json({ message: "Failed to fetch favorite places" });
    }
  });
  
  // Get a user's upcoming playdates
  app.get("/api/users/:id/playdates", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const playdates = await storage.getUserPlaydates(userId);
      
      // Only return playdates that haven't happened yet
      const upcomingPlaydates = playdates.filter(playdate => 
        new Date(playdate.startTime) > new Date()
      );
      
      res.json(upcomingPlaydates);
    } catch (err) {
      console.error("Error fetching user's playdates:", err);
      res.status(500).json({ message: "Failed to fetch playdates" });
    }
  });



  // Advanced search endpoint - Allow without authentication for testing
  app.get("/api/users/search", async (req: Request, res: Response) => {
    // Skip authentication check for testing
    console.log("Accessing /api/users/search without authentication check");
    try {
      const { 
        query, 
        city, 
        childMinAge, 
        childMaxAge,
        limit, 
        offset 
      } = req.query;
      
      // Convert query parameters to the right format
      const searchParams: any = {};
      
      if (query) {
        searchParams.searchQuery = query as string;
      }
      
      if (city) {
        searchParams.city = city as string;
      }
      
      // Handle child age range if both min and max are provided
      if (childMinAge && childMaxAge) {
        const minAge = parseInt(childMinAge as string);
        const maxAge = parseInt(childMaxAge as string);
        
        if (!isNaN(minAge) && !isNaN(maxAge)) {
          searchParams.childAgeRange = [minAge, maxAge];
        }
      }
      
      // Handle pagination
      if (limit) {
        const parsedLimit = parseInt(limit as string);
        if (!isNaN(parsedLimit)) {
          searchParams.limit = parsedLimit;
        }
      }
      
      if (offset) {
        const parsedOffset = parseInt(offset as string);
        if (!isNaN(parsedOffset)) {
          searchParams.offset = parsedOffset;
        }
      }
      
      const users = await storage.getAllUsers(searchParams);
      
      // Remove sensitive information
      const sanitizedUsers = users.map(user => {
        const { password, email, phoneNumber, ...rest } = user;
        return rest;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Get user profile by ID
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Filter out sensitive information
      const userWithoutSensitive = { ...user } as Partial<SelectUser>;
      delete userWithoutSensitive.password;
      delete userWithoutSensitive.email;
      delete userWithoutSensitive.phoneNumber;
      
      // Make sure childrenInfo is available
      if (!userWithoutSensitive.childrenInfo) {
        userWithoutSensitive.childrenInfo = [];
      }
      
      // Make sure favoriteLocations is available
      if (!userWithoutSensitive.favoriteLocations) {
        userWithoutSensitive.favoriteLocations = [];
      }
      
      res.json(userWithoutSensitive);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Remove sensitive fields that shouldn't be updated directly
      const updateData = { ...req.body } as Partial<SelectUser>;
      delete updateData.password; // Password should be updated through a dedicated endpoint
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Remove password from response
      const userWithoutPassword = { ...updatedUser } as Partial<SelectUser>;
      delete userWithoutPassword.password;
      
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Delete user profile
  app.delete("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      console.log(`[DELETE USER] Attempting to delete user with ID ${userId}`);
      
      // Get the current user to find the profile image (if any)
      const currentUser = await storage.getUserById(userId);
      console.log(`[DELETE USER] Current user:`, currentUser);
      
      if (currentUser?.profileImage) {
        // Extract filename from the URL if it exists
        const oldFilename = currentUser.profileImage.split('/').pop();
        console.log(`[DELETE USER] Profile image filename:`, oldFilename);
        
        if (oldFilename) {
          // Delete the profile image
          try {
            deleteProfileImage(oldFilename);
            console.log(`[DELETE USER] Profile image deleted:`, oldFilename);
          } catch (error) {
            console.error(`[DELETE USER] Error deleting profile image:`, error);
            // Continue with user deletion even if image deletion fails
          }
        }
      }
      
      // Delete the user
      console.log(`[DELETE USER] Calling storage.deleteUser(${userId})`);
      const deleted = await storage.deleteUser(userId);
      console.log(`[DELETE USER] Result:`, deleted);
      
      if (!deleted) {
        console.log(`[DELETE USER] Failed to delete user - returned false`);
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      // Log the user out
      req.logout((err) => {
        if (err) {
          console.error("[DELETE USER] Error logging out:", err);
          return res.status(500).json({ message: "Failed to log out after deleting account" });
        }
        console.log(`[DELETE USER] User ${userId} successfully deleted and logged out`);
        res.status(200).json({ message: "User account deleted successfully" });
      });
    } catch (err: any) {
      console.error("[DELETE USER] Error deleting user:", err);
      res.status(500).json({ message: "Failed to delete user account", error: err?.message || String(err) });
    }
  });
  
  // Upload profile image
  app.post("/api/users/me/profile-image", isAuthenticated, upload.single('profileImage'), async (req: Request, res: Response) => {
    console.log("REQUEST BODY for POST /api/users/me/profile-image:", req.body);
    console.log("Auth check for profile endpoint:", req.url);
    console.log("Is authenticated:", req.isAuthenticated());
    console.log("User object:", req.user);
    console.log("Session:", req.session);
    
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Store image in database and get the filename
      const filename = await storeImageInDatabase(req.file, userId, 'profile');
      const profileImageUrl = `/api/images/${filename}`;
      
      console.log(`Profile image updated: ${filename}`);
      console.log(`Image stored at: ${profileImageUrl}`);
      
      // Update the user's profile with the database image URL
      const updatedUser = await storage.updateUser(userId, { 
        profileImage: profileImageUrl
      });
      
      // Remove password from response
      const userWithoutPassword = { ...updatedUser } as Partial<SelectUser>;
      delete userWithoutPassword.password;
      
      res.json({ 
        success: true, 
        user: userWithoutPassword,
        imageUrl: profileImageUrl
      });
    } catch (err) {
      console.error("Error uploading profile image:", err);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Playdate routes
  app.get("/api/playdates/upcoming", async (req, res) => {
    try {
      const upcomingPlaydates = await storage.getUpcomingPlaydates();
      res.json(upcomingPlaydates);
    } catch (err) {
      console.error("Error fetching upcoming playdates:", err);
      res.status(500).json({ message: "Failed to fetch upcoming playdates" });
    }
  });
  
  // Simple test endpoint for playdate creation
  app.post("/api/playdates/test-create", isAuthenticated, async (req, res) => {
    try {
      console.log("TEST ENDPOINT: Creating playdate with data:", req.body);
      console.log("TEST ENDPOINT: Authenticated user:", req.user);
      console.log("TEST ENDPOINT: Session:", req.session);
      
      // Get the authenticated user's ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      console.log("TEST ENDPOINT: Using userId:", userId);
      
      // Basic data validation
      if (!req.body.title) {
        return res.status(400).json({ error: "Title is required" });
      }
      
      // Process dates from the request
      let startTime = new Date();
      let endTime = new Date(Date.now() + 3600000);
      
      // If startTime and endTime are provided in the request, use them
      if (req.body.startTime) {
        startTime = new Date(req.body.startTime);
      }
      
      if (req.body.endTime) {
        endTime = new Date(req.body.endTime);
      }
      
      // Create a playdate with the authenticated user as creator
      const playdateData = {
        title: req.body.title,
        description: req.body.description || "Test description",
        location: req.body.location || "Test location",
        startTime: startTime,
        endTime: endTime,
        creatorId: userId, // Use authenticated user's ID
        maxParticipants: req.body.maxParticipants || 5
      };
      
      console.log("TEST ENDPOINT: Playdate data being sent to storage:", playdateData);
      console.log("TEST ENDPOINT: Creator ID specifically:", playdateData.creatorId);
      
      const newPlaydate = await storage.createPlaydate(playdateData);
      
      console.log("Successfully created test playdate:", newPlaydate);
      return res.status(201).json(newPlaydate);
    } catch (err) {
      console.error("Error creating test playdate:", err);
      return res.status(500).json({ error: "Failed to create test playdate", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get("/api/playdates/past", async (req, res) => {
    try {
      const pastPlaydates = await storage.getPastPlaydates();
      res.json(pastPlaydates);
    } catch (err) {
      console.error("Error fetching past playdates:", err);
      res.status(500).json({ message: "Failed to fetch past playdates" });
    }
  });
  
  // Get a single playdate by ID
  app.get("/api/playdates/:id", async (req, res) => {
    try {
      const playdateId = parseInt(req.params.id);
      if (isNaN(playdateId)) {
        return res.status(400).json({ message: "Invalid playdate ID" });
      }
      
      const playdate = await storage.getPlaydateById(playdateId);
      if (!playdate) {
        return res.status(404).json({ message: "Playdate not found" });
      }
      
      res.json(playdate);
    } catch (err) {
      console.error("Error fetching playdate:", err);
      res.status(500).json({ message: "Failed to fetch playdate" });
    }
  });

  app.post("/api/playdates", isAuthenticated, async (req, res) => {
    try {
      // Log everything for debugging
      console.log("======= CREATE PLAYDATE REQUEST =======");
      console.log("Request body:", req.body);
      console.log("Auth user:", req.user);
      console.log("Is authenticated:", req.isAuthenticated());
      console.log("Session ID:", req.sessionID);
      console.log("Session data:", req.session);
      console.log("Cookies:", req.headers.cookie);
      console.log("=======================================");
      
      // Get the authenticated user ID
      const creatorId = req.user?.id;
      
      if (!creatorId) {
        console.log("ERROR: User not authenticated or ID missing");
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      try {
        // Pre-process dates for validation
        const playdateData = {
          ...req.body,
          // Convert ISO strings to Date objects
          startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
          endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
        };
        
        console.log("Processed dates:", {
          originalStartTime: req.body.startTime,
          convertedStartTime: playdateData.startTime,
          originalEndTime: req.body.endTime,
          convertedEndTime: playdateData.endTime
        });
        
        // Validate request body
        const validPlaydate = insertPlaydateSchema.parse(playdateData);
        console.log("Validated playdate data:", validPlaydate);
        
        // Create the playdate
        const playdateDataWithCreator = {
          ...validPlaydate,
          creatorId
        };
        
        console.log("REGULAR ENDPOINT: Final playdate data with creatorId:", playdateDataWithCreator);
        
        const newPlaydate = await storage.createPlaydate(playdateDataWithCreator);
        
        // Schedule push notification reminders for the new playdate
        await schedulePlaydateReminders(newPlaydate.id);
        
        console.log("Successfully created new playdate:", newPlaydate);
        return res.status(201).json(newPlaydate);
      } catch (validationErr) {
        if (validationErr instanceof ZodError) {
          console.error("Validation error:", validationErr.errors);
          const validationError = fromZodError(validationErr);
          return res.status(400).json({ error: validationError.message });
        }
        throw validationErr;
      }
    } catch (err) {
      console.error("Fatal error creating playdate:", err);
      return res.status(500).json({ error: "Failed to create playdate", details: err instanceof Error ? err.message : String(err) });
    }
  });

  // Update a playdate
  app.put("/api/playdates/:id", isAuthenticated, async (req, res) => {
    try {
      const playdateId = parseInt(req.params.id);
      if (isNaN(playdateId)) {
        return res.status(400).json({ message: "Invalid playdate ID" });
      }
      
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Get the playdate to check ownership
      const playdates = await storage.getUserPlaydates(userId);
      const playdate = playdates.find(p => p.id === playdateId);
      
      // Check if user is the creator (first participant)
      if (!playdate || playdate.participants[0]?.id !== userId) {
        return res.status(403).json({ message: "Only the creator can update this playdate" });
      }
      
      // Process dates for validation
      const updateData = {
        ...req.body,
        // Convert ISO strings to Date objects if provided
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
      };
      
      // Update the playdate
      const updatedPlaydate = await storage.updatePlaydate(playdateId, updateData);
      
      // Notify participants about the playdate modification
      await notifyPlaydateModified(playdateId);
      
      res.status(200).json(updatedPlaydate);
    } catch (err) {
      console.error("Error updating playdate:", err);
      res.status(500).json({ message: "Failed to update playdate" });
    }
  });
  
  // Delete a playdate
  app.delete("/api/playdates/:id", isAuthenticated, async (req, res) => {
    try {
      const playdateId = parseInt(req.params.id);
      if (isNaN(playdateId)) {
        return res.status(400).json({ message: "Invalid playdate ID" });
      }
      
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Get the playdate to check ownership
      const playdates = await storage.getUserPlaydates(userId);
      const playdate = playdates.find(p => p.id === playdateId);
      
      // Check if user is the creator (first participant)
      if (!playdate || playdate.participants[0]?.id !== userId) {
        return res.status(403).json({ message: "Only the creator can delete this playdate" });
      }
      
      const deleted = await storage.deletePlaydate(playdateId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Playdate not found" });
      }
      
      res.status(200).json({ message: "Playdate deleted successfully" });
    } catch (err) {
      console.error("Error deleting playdate:", err);
      res.status(500).json({ message: "Failed to delete playdate" });
    }
  });
  
  // Join a playdate
  app.post("/api/playdates/:id/join", isAuthenticated, async (req, res) => {
    try {
      const playdateId = parseInt(req.params.id);
      if (isNaN(playdateId)) {
        return res.status(400).json({ message: "Invalid playdate ID" });
      }
      
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      await storage.joinPlaydate(userId, playdateId);
      
      // Send notification to other participants about new joiner
      await notifyNewParticipant(playdateId, userId);
      
      // Get the updated playdate to return to client
      const updatedPlaydate = await storage.getUserPlaydates(userId);
      
      res.status(200).json({ 
        message: "Successfully joined playdate", 
        playdate: updatedPlaydate.find(p => p.id === playdateId) 
      });
    } catch (err) {
      console.error("Error joining playdate:", err);
      res.status(500).json({ message: err instanceof Error ? err.message : "Failed to join playdate" });
    }
  });
  
  // Leave a playdate
  app.delete("/api/playdates/:id/join", isAuthenticated, async (req, res) => {
    try {
      const playdateId = parseInt(req.params.id);
      if (isNaN(playdateId)) {
        return res.status(400).json({ message: "Invalid playdate ID" });
      }
      
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const left = await storage.leavePlaydate(userId, playdateId);
      
      if (!left) {
        return res.status(400).json({ message: "User is not a participant in this playdate" });
      }
      
      res.status(200).json({ message: "Successfully left playdate" });
    } catch (err) {
      console.error("Error leaving playdate:", err);
      res.status(500).json({ message: err instanceof Error ? err.message : "Failed to leave playdate" });
    }
  });

  // Places routes
  app.get("/api/places", async (req, res) => {
    try {
      // Extract query parameters for filtering
      const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
      const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
      const type = req.query.activeTab as string;
      
      const placesList = await storage.getPlaces({ latitude, longitude, type });
      
      // Remove latitude and longitude from response to hide technical details
      const placesWithoutCoordinates = placesList.map(place => {
        const { latitude, longitude, ...placeWithoutCoordinates } = place;
        return placeWithoutCoordinates;
      });
      
      res.json(placesWithoutCoordinates);
    } catch (err) {
      console.error("Error fetching places:", err);
      res.status(500).json({ message: "Failed to fetch places" });
    }
  });

  app.get("/api/places/nearby", async (req, res) => {
    try {
      // Extract query parameters for filtering
      const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
      const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
      const type = req.query.activeFilter as string;
      
      const nearbyPlaces = await storage.getNearbyPlaces({ latitude, longitude, type });
      
      // Remove latitude and longitude from response to hide technical details
      const placesWithoutCoordinates = nearbyPlaces.map(place => {
        const { latitude, longitude, ...placeWithoutCoordinates } = place;
        return placeWithoutCoordinates;
      });
      
      res.json(placesWithoutCoordinates);
    } catch (err) {
      console.error("Error fetching nearby places:", err);
      res.status(500).json({ message: "Failed to fetch nearby places" });
    }
  });

  // Get place coordinates by name (for playdate location mapping)
  app.get("/api/places/coordinates", async (req, res) => {
    try {
      const location = req.query.location as string;
      if (!location) {
        return res.status(400).json({ error: "Location parameter is required" });
      }
      
      console.log(`Looking up coordinates for location: ${location}`);
      
      // Try to find a place by name in the location string
      const places = await storage.getPlaces({});
      
      // Look for a place name that appears in the location string
      const matchingPlace = places.find(place => 
        location.toLowerCase().includes(place.name.toLowerCase().trim()) ||
        place.name.toLowerCase().trim().includes(location.toLowerCase())
      );
      
      if (matchingPlace && Number(matchingPlace.latitude) !== 0 && Number(matchingPlace.longitude) !== 0) {
        res.json({ 
          latitude: matchingPlace.latitude, 
          longitude: matchingPlace.longitude,
          address: matchingPlace.address,
          name: matchingPlace.name
        });
      } else {
        res.status(404).json({ error: "Place not found or coordinates not available" });
      }
    } catch (err) {
      console.error("Error fetching place coordinates:", err);
      res.status(500).json({ error: "Failed to fetch place coordinates" });
    }
  });

  // Update place coordinates using geocoding
  app.post("/api/places/:id/update-coordinates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) {
        return res.status(400).json({ error: "Invalid place ID" });
      }

      const place = await storage.getPlaceById(placeId);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      // Check if coordinates are already set
      if (Number(place.latitude) !== 0 && Number(place.longitude) !== 0) {
        return res.json({ 
          message: "Place already has coordinates",
          latitude: place.latitude,
          longitude: place.longitude
        });
      }

      // Geocode the address
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place.address)}&limit=1&countrycodes=nl`;
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        // Update the place with new coordinates
        const updatedPlace = await storage.updatePlace(placeId, {
          latitude: lat.toString(),
          longitude: lon.toString()
        });

        res.json({
          message: "Coordinates updated successfully",
          latitude: lat,
          longitude: lon,
          place: updatedPlace
        });
      } else {
        res.status(400).json({ error: "Could not geocode address" });
      }
    } catch (err) {
      console.error("Error updating place coordinates:", err);
      res.status(500).json({ error: "Failed to update coordinates" });
    }
  });

  // Batch update coordinates for all places missing them
  app.post("/api/places/update-all-coordinates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const places = await storage.getPlaces({});
      const placesToUpdate = places.filter(place => 
        Number(place.latitude) === 0 && Number(place.longitude) === 0
      );

      if (placesToUpdate.length === 0) {
        return res.json({ message: "All places already have coordinates" });
      }

      const results = [];
      
      for (const place of placesToUpdate) {
        try {
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place.address)}&limit=1&countrycodes=nl`;
          const response = await fetch(geocodeUrl);
          const data = await response.json();

          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            const updatedPlace = await storage.updatePlace(place.id, {
              latitude: lat.toString(),
              longitude: lon.toString()
            });

            results.push({
              id: place.id,
              name: place.name,
              success: true,
              latitude: lat,
              longitude: lon
            });
          } else {
            results.push({
              id: place.id,
              name: place.name,
              success: false,
              error: "Could not geocode address"
            });
          }
        } catch (error) {
          results.push({
            id: place.id,
            name: place.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      res.json({
        message: `Updated coordinates for ${results.filter(r => r.success).length} of ${placesToUpdate.length} places`,
        results
      });
    } catch (err) {
      console.error("Error batch updating coordinates:", err);
      res.status(500).json({ error: "Failed to batch update coordinates" });
    }
  });

  app.post("/api/places/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) {
        return res.status(400).json({ message: "Invalid place ID" });
      }
      
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const favorite = await storage.addFavoritePlace(userId, placeId);
      res.status(201).json(favorite);
    } catch (err) {
      console.error("Error adding favorite place:", err);
      res.status(500).json({ message: "Failed to add favorite place" });
    }
  });

  app.delete("/api/places/:id/favorite", isAuthenticated, async (req, res) => {
    try {
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) {
        return res.status(400).json({ message: "Invalid place ID" });
      }
      
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const removed = await storage.removeFavoritePlace(userId, placeId);
      
      if (!removed) {
        return res.status(404).json({ message: "Favorite place not found" });
      }
      
      res.status(200).json({ message: "Place removed from favorites successfully" });
    } catch (err) {
      console.error("Error removing favorite place:", err);
      res.status(500).json({ message: "Failed to remove favorite place" });
    }
  });

  // Chat REST API endpoints
  app.get("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const chats = await storage.getChats(userId);
      res.json(chats);
    } catch (err) {
      console.error("Error fetching chats:", err);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });
  
  app.get("/api/chats/:id", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const chat = await storage.getChatById(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Check if user is a participant in this chat
      const isParticipant = chat.participants.some((p: any) => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not a participant in this chat" });
      }
      
      res.json(chat);
    } catch (err) {
      console.error("Error fetching chat:", err);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });
  
  app.get("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Optional pagination parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      // Get chat to verify user is a participant
      const chat = await storage.getChatById(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Check if user is a participant in this chat
      const isParticipant = chat.participants.some((p: any) => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not a participant in this chat" });
      }
      
      const messages = await storage.getChatMessages(chatId, limit, offset);
      res.json(messages);
    } catch (err) {
      console.error("Error fetching chat messages:", err);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  app.post("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Validate request body - expect array of participant IDs
      if (!req.body.participants || !Array.isArray(req.body.participants)) {
        return res.status(400).json({ message: "Invalid request: Expected array of participant IDs" });
      }
      
      // Ensure all participant IDs are integers
      const participants = req.body.participants.map((id: any) => parseInt(id));
      
      // Always include the current user as a participant
      if (!participants.includes(userId)) {
        participants.push(userId);
      }
      
      console.log("Creating chat with participants:", participants);
      
      // Create new chat
      const newChat = await storage.createChat(participants);
      
      console.log("Created new chat:", newChat);
      
      res.status(201).json(newChat);
    } catch (err) {
      console.error("Error creating chat:", err);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });
  
  // Advanced search/filter endpoints
  
  /* User search endpoint was moved to line ~133 to appear before the /api/users/:id route */
  
  // Search playdates with advanced parameters - temporarily allow without authentication for testing
  app.get("/api/playdates/search", async (req: Request, res: Response) => {
    try {
      const { 
        query,
        location,
        startDateMin,
        startDateMax,
        hasAvailableSpots,
        creatorId,
        limit,
        offset
      } = req.query;
      
      // Convert query parameters to the right format
      const searchParams: any = {};
      
      if (query) {
        searchParams.searchQuery = query as string;
      }
      
      if (location) {
        searchParams.location = location as string;
      }
      
      if (startDateMin) {
        searchParams.startDateMin = new Date(startDateMin as string);
      }
      
      if (startDateMax) {
        searchParams.startDateMax = new Date(startDateMax as string);
      }
      
      if (hasAvailableSpots === 'true') {
        searchParams.hasAvailableSpots = true;
      }
      
      if (creatorId) {
        const parsedCreatorId = parseInt(creatorId as string);
        if (!isNaN(parsedCreatorId)) {
          searchParams.creatorId = parsedCreatorId;
        }
      }
      
      // Handle pagination
      if (limit) {
        const parsedLimit = parseInt(limit as string);
        if (!isNaN(parsedLimit)) {
          searchParams.limit = parsedLimit;
        }
      }
      
      if (offset) {
        const parsedOffset = parseInt(offset as string);
        if (!isNaN(parsedOffset)) {
          searchParams.offset = parsedOffset;
        }
      }
      
      const playdates = await storage.getUpcomingPlaydates(searchParams);
      res.json(playdates);
    } catch (error) {
      console.error("Error searching playdates:", error);
      res.status(500).json({ error: "Failed to search playdates" });
    }
  });
  
  // Search places with advanced parameters - temporarily allow without authentication for testing
  app.get("/api/places/search", async (req: Request, res: Response) => {
    try {
      const { 
        query,
        type,
        minRating,
        features,
        latitude,
        longitude,
        sortBy,
        sortOrder,
        limit,
        offset,
        source // 'osm' for OpenStreetMap or 'db' for database
      } = req.query;
      
      // Get the authenticated user ID for favorites
      const userId = req.user?.id;

      // If source is "osm" and coordinates are provided, fetch from OpenStreetMap
      if (source === "osm" && latitude && longitude && type === "playground") {
        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          // Fetch playgrounds from OpenStreetMap
          try {
            const radius = req.query.radius ? parseInt(req.query.radius as string) : 5000;
            console.log(`Fetching OpenStreetMap playgrounds near ${lat},${lng} with radius ${radius}m`);
            
            const osmPlaygrounds = await fetchNearbyPlaygrounds(lat, lng, radius);
            
            // Add favorite status if user is logged in
            if (userId) {
              // Fetch user's favorite places to check against
              const userFavorites = await storage.getUserFavoritePlaces(userId);
              const favoriteIds = new Set(userFavorites.map(place => place.id));
              
              // Mark places as favorite if they're in user's favorites
              osmPlaygrounds.forEach(playground => {
                playground.isSaved = favoriteIds.has(playground.id);
              });
            }
            
            // Return OSM playgrounds
            return res.json(osmPlaygrounds);
          } catch (osmError) {
            console.error("Error fetching from OpenStreetMap:", osmError);
            // Continue with database lookup as fallback
          }
        }
      }
      
      // Convert query parameters to the right format
      const searchParams: any = {
        userId // Include the user ID to check favorite status
      };
      
      if (query) {
        searchParams.searchQuery = query as string;
      }
      
      if (type) {
        searchParams.type = type as string;
      }
      
      if (minRating) {
        const parsedRating = parseFloat(minRating as string);
        if (!isNaN(parsedRating)) {
          searchParams.minRating = parsedRating;
        }
      }
      
      if (features) {
        if (Array.isArray(features)) {
          searchParams.features = features as string[];
        } else {
          searchParams.features = [features as string];
        }
      }
      
      if (latitude && longitude) {
        const lat = parseFloat(latitude as string);
        const lng = parseFloat(longitude as string);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          searchParams.latitude = lat;
          searchParams.longitude = lng;
        }
      }
      
      if (sortBy) {
        searchParams.sortBy = sortBy as 'rating' | 'distance' | 'name';
      }
      
      if (sortOrder) {
        searchParams.sortOrder = sortOrder as 'asc' | 'desc';
      }
      
      // Handle pagination
      if (limit) {
        const parsedLimit = parseInt(limit as string);
        if (!isNaN(parsedLimit)) {
          searchParams.limit = parsedLimit;
        }
      }
      
      if (offset) {
        const parsedOffset = parseInt(offset as string);
        if (!isNaN(parsedOffset)) {
          searchParams.offset = parsedOffset;
        }
      }
      
      const places = await storage.getPlaces(searchParams);
      res.json(places);
    } catch (error) {
      console.error("Error searching places:", error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });
  
  // Get playgrounds from OpenStreetMap API
  app.get("/api/playgrounds/osm", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const rad = radius ? parseInt(radius as string) : 5000;
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Invalid latitude or longitude" });
      }
      
      const playgrounds = await fetchNearbyPlaygrounds(lat, lng, rad);
      
      // Add favorite status if user is logged in
      if (req.user?.id) {
        const userFavorites = await storage.getUserFavoritePlaces(req.user.id);
        const favoriteIds = new Set(userFavorites.map(place => place.id));
        
        playgrounds.forEach(playground => {
          playground.isSaved = favoriteIds.has(playground.id);
        });
      }
      
      res.json(playgrounds);
    } catch (error) {
      console.error("Error fetching playgrounds from OpenStreetMap:", error);
      res.status(500).json({ error: "Failed to fetch playgrounds from OpenStreetMap" });
    }
  });
  
  // Add a user-contributed playground
  app.post("/api/playgrounds", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Validate required fields
      if (!req.body.name || !req.body.latitude || !req.body.longitude) {
        return res.status(400).json({ error: "Name, latitude, and longitude are required" });
      }
      
      // Use the shared random playground image function
      const randomImageUrl = getRandomPlaygroundImage();
      
      // Create a new place object
      const playgroundData = {
        name: req.body.name,
        type: "playground",
        description: req.body.description || "User-contributed playground",
        address: req.body.address || "",
        latitude: req.body.latitude.toString(),
        longitude: req.body.longitude.toString(),
        imageUrl: randomImageUrl,
        features: req.body.features || [],
      };
      
      try {
        // Validate the playground data against the schema
        insertPlaceSchema.parse(playgroundData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          const readableError = fromZodError(validationError);
          return res.status(400).json({ error: readableError.message });
        }
        throw validationError;
      }
      
      // Save the playground
      const newPlayground = await storage.createPlace(playgroundData);
      
      res.status(201).json(newPlayground);
    } catch (error) {
      console.error("Error creating playground:", error);
      res.status(500).json({ error: "Failed to create playground" });
    }
  });
  
  // Add a playground with image upload
  app.post("/api/playgrounds/with-image", isAuthenticated, upload.single('placeImage'), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Validate required fields from form data
      if (!req.body.name || !req.body.latitude || !req.body.longitude) {
        return res.status(400).json({ error: "Name, latitude, and longitude are required" });
      }
      
      // Use the shared random playground image function
      const imageUrl = getRandomPlaygroundImage();
      console.log(`Using random playground image: ${imageUrl}`)
      
      // Parse features if they were sent as a JSON string (from FormData)
      let features = [];
      if (req.body.features) {
        try {
          if (typeof req.body.features === 'string') {
            features = JSON.parse(req.body.features);
          } else if (Array.isArray(req.body.features)) {
            features = req.body.features;
          }
        } catch (e) {
          console.error("Error parsing features JSON:", e);
        }
      }
      
      // Create a new place object
      const playgroundData = {
        name: req.body.name,
        type: "playground",
        description: req.body.description || "User-contributed playground",
        address: req.body.address || "",
        latitude: req.body.latitude.toString(),
        longitude: req.body.longitude.toString(),
        imageUrl: imageUrl,
        features: features,
      };
      
      try {
        // Validate the playground data against the schema
        insertPlaceSchema.parse(playgroundData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          const readableError = fromZodError(validationError);
          return res.status(400).json({ error: readableError.message });
        }
        throw validationError;
      }
      
      // Save the playground
      const newPlayground = await storage.createPlace(playgroundData);
      
      res.status(201).json(newPlayground);
    } catch (error) {
      console.error("Error creating playground with image:", error);
      res.status(500).json({ error: "Failed to create playground" });
    }
  });
  
  // Add generic place (restaurant or playground)
  app.post("/api/places", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Validate required fields - allow 0 coordinates if address is provided for geocoding
      if (!req.body.name || !req.body.type) {
        return res.status(400).json({ error: "Name and type are required" });
      }
      
      // Check if we have coordinates or an address for geocoding
      const hasCoordinates = req.body.latitude && req.body.longitude && 
                           parseFloat(req.body.latitude) !== 0 && parseFloat(req.body.longitude) !== 0;
      const hasAddress = req.body.address && req.body.address.trim().length > 0;
      
      if (!hasCoordinates && !hasAddress) {
        return res.status(400).json({ error: "Either valid coordinates or an address is required" });
      }
      
      // Validate type is either restaurant, playground, or museum
      if (req.body.type !== 'restaurant' && req.body.type !== 'playground' && req.body.type !== 'museum') {
        return res.status(400).json({ error: "Type must be either 'restaurant', 'playground', or 'museum'" });
      }
      
      // Auto-geocode coordinates if they are 0 or missing but address is provided
      let latitude = parseFloat(req.body.latitude) || 0;
      let longitude = parseFloat(req.body.longitude) || 0;
      
      if ((latitude === 0 || longitude === 0) && req.body.address) {
        const coords = await geocodeAddress(req.body.address);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      }

      // Create a new place object
      const placeData = {
        name: req.body.name,
        type: req.body.type,
        description: req.body.description || "",
        address: req.body.address || "",
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        imageUrl: req.body.imageUrl || (
          req.body.type === 'restaurant' 
            ? getRandomRestaurantImage()
            : req.body.type === 'museum'
            ? getRandomMuseumImage()
            : getRandomPlaygroundImage()
        ),
        features: req.body.features || [],
      };
      
      try {
        // Validate the place data against the schema
        insertPlaceSchema.parse(placeData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          const readableError = fromZodError(validationError);
          return res.status(400).json({ error: readableError.message });
        }
        throw validationError;
      }
      
      // Save the place
      const newPlace = await storage.createPlace(placeData);
      
      res.status(201).json(newPlace);
    } catch (error) {
      console.error("Error creating place:", error);
      res.status(500).json({ error: "Failed to create place" });
    }
  });
  
  // Add a place with image upload (restaurant or playground)
  app.post("/api/places/with-image", isAuthenticated, upload.single('placeImage'), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Validate required fields - allow 0 coordinates if address is provided for geocoding
      if (!req.body.name || !req.body.type) {
        return res.status(400).json({ error: "Name and type are required" });
      }
      
      // Check if we have coordinates or an address for geocoding
      const hasCoordinates = req.body.latitude && req.body.longitude && 
                           parseFloat(req.body.latitude) !== 0 && parseFloat(req.body.longitude) !== 0;
      const hasAddress = req.body.address && req.body.address.trim().length > 0;
      
      if (!hasCoordinates && !hasAddress) {
        return res.status(400).json({ error: "Either valid coordinates or an address is required" });
      }
      
      // Validate type is either restaurant, playground, or museum
      if (req.body.type !== 'restaurant' && req.body.type !== 'playground' && req.body.type !== 'museum') {
        return res.status(400).json({ error: "Type must be either 'restaurant', 'playground', or 'museum'" });
      }
      
      // Get the uploaded image file, if any
      let imageUrl = '';
      
      // Use custom images for both restaurants and playgrounds
      if (req.body.type === 'playground') {
        // Use a random playground image
        imageUrl = getRandomPlaygroundImage();
        console.log(`Using random playground image: ${imageUrl}`);
      } else if (req.body.type === 'restaurant') {
        if (req.file) {
          // Create a proper URL to the uploaded file if user uploaded one
          const filename = req.file.filename;
          imageUrl = `/uploads/place-images/${filename}`;
          console.log(`Restaurant image uploaded: ${filename}`);
          console.log(`Image URL: ${imageUrl}`);
        } else {
          // Use a random restaurant image if no file uploaded
          imageUrl = getRandomRestaurantImage();
          console.log(`No image uploaded for restaurant, using random restaurant image: ${imageUrl}`);
        }
      } else if (req.body.type === 'museum') {
        if (req.file) {
          // Create a proper URL to the uploaded file if user uploaded one
          const filename = req.file.filename;
          imageUrl = `/uploads/place-images/${filename}`;
          console.log(`Museum image uploaded: ${filename}`);
          console.log(`Image URL: ${imageUrl}`);
        } else {
          // Use a random museum image if no file uploaded
          imageUrl = getRandomMuseumImage();
          console.log(`No image uploaded for museum, using random museum image: ${imageUrl}`);
        }
      } else {
        // For other types, still allow file uploads
        if (req.file) {
          const filename = req.file.filename;
          imageUrl = `/uploads/place-images/${filename}`;
        } else {
          imageUrl = getRandomPlaygroundImage(); // Default fallback
        }
      }
      
      // Parse features if they were sent as a JSON string (from FormData)
      let features = [];
      if (req.body.features) {
        try {
          if (typeof req.body.features === 'string') {
            features = JSON.parse(req.body.features);
          } else if (Array.isArray(req.body.features)) {
            features = req.body.features;
          }
        } catch (e) {
          console.error("Error parsing features JSON:", e);
        }
      }
      
      // Auto-geocode coordinates if they are 0 or missing but address is provided
      let latitude = parseFloat(req.body.latitude) || 0;
      let longitude = parseFloat(req.body.longitude) || 0;
      
      if ((latitude === 0 || longitude === 0) && req.body.address) {
        console.log(`Auto-geocoding address: ${req.body.address}`);
        const coords = await geocodeAddress(req.body.address);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
          console.log(`Geocoded coordinates: ${latitude}, ${longitude}`);
        }
      }
      
      // Create a new place object
      const placeData = {
        name: req.body.name,
        type: req.body.type,
        description: req.body.description || "",
        address: req.body.address || "",
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        imageUrl: imageUrl,
        features: features,
      };
      
      try {
        // Validate the place data against the schema
        insertPlaceSchema.parse(placeData);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          const readableError = fromZodError(validationError);
          return res.status(400).json({ error: readableError.message });
        }
        throw validationError;
      }
      
      // Save the place
      const newPlace = await storage.createPlace(placeData);
      
      res.status(201).json(newPlace);
    } catch (error) {
      console.error("Error creating place with image:", error);
      res.status(500).json({ error: "Failed to create place with image" });
    }
  });
  
  // Rate a place
  app.post("/api/places/:id/rate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const placeId = parseInt(req.params.id);
      const { rating } = req.body;
      const userId = req.user!.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      await storage.ratePlace(placeId, userId, rating);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rating place:", error);
      res.status(500).json({ error: "Failed to rate place" });
    }
  });

  // Get place rating statistics
  app.get("/api/places/:id/rating", async (req: Request, res: Response) => {
    try {
      const placeId = parseInt(req.params.id);
      const rating = await storage.getPlaceRating(placeId);
      res.json(rating);
    } catch (error) {
      console.error("Error fetching place rating:", error);
      res.status(500).json({ error: "Failed to fetch place rating" });
    }
  });

  // Get user's rating for a specific place
  app.get("/api/places/:id/user-rating", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const placeId = parseInt(req.params.id);
      const userId = req.user!.id;
      const userRating = await storage.getUserRating(placeId, userId);
      res.json(userRating);
    } catch (error) {
      console.error("Error fetching user rating:", error);
      res.status(500).json({ error: "Failed to fetch user rating" });
    }
  });

  // Get individual place details
  app.get("/api/places/:id", async (req, res) => {
    try {
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) {
        return res.status(400).json({ error: "Invalid place ID" });
      }
      
      const place = await storage.getPlaceById(placeId);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }
      
      res.json(place);
    } catch (err) {
      console.error("Error fetching place details:", err);
      res.status(500).json({ error: "Failed to fetch place details" });
    }
  });

  // Simple test endpoint with no authentication
  app.get("/api/test", (req, res) => {
    res.json({ message: "Test endpoint works!" });
  });

  // Test email endpoint for admins
  app.post("/api/admin/test-email", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      if (user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email address is required" });
      }

      const { sendTestEmail } = await import('./email-service');
      const success = await sendTestEmail(email);
      
      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  });
  
  // Endpoint to provide environment variables needed on the frontend
  app.get("/api/env", (req, res) => {
    res.json({
      OPEN_WEATHER_API_KEY: process.env.OPEN_WEATHER_API_KEY,
      VAPID_PUBLIC_KEY: getVapidPublicKey()
    });
  });
  
  // Delete place by name (for maintenance) - no auth required for maintenance
  // Update a place (playground or restaurant)
  app.patch("/api/places/:id", isAuthenticated, upload.single('placeImage'), async (req: Request, res: Response) => {
    try {
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) {
        return res.status(400).json({ error: "Invalid place ID" });
      }
      
      // Get the existing place to ensure it exists
      const existingPlace = await storage.getPlaces({ 
        // Using empty filters to get all places
      }).then(places => places.find(p => p.id === placeId));
      
      if (!existingPlace) {
        return res.status(404).json({ error: "Place not found" });
      }
      
      // Prepare the update data
      const updateData: Partial<typeof existingPlace> = {};
      
      // Only update fields that are provided
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.address) updateData.address = req.body.address;
      
      // Handle latitude and longitude if provided and not empty
      if (req.body.latitude && req.body.latitude.trim() !== '') {
        updateData.latitude = req.body.latitude;
      }
      
      if (req.body.longitude && req.body.longitude.trim() !== '') {
        updateData.longitude = req.body.longitude;
      }
      
      // Handle features if provided
      if (req.body.features) {
        try {
          if (typeof req.body.features === 'string') {
            updateData.features = JSON.parse(req.body.features);
          } else if (Array.isArray(req.body.features)) {
            updateData.features = req.body.features;
          }
        } catch (e) {
          console.error("Error parsing features JSON:", e);
        }
      }
      
      // Handle image upload if provided
      if (req.file) {
        const filename = req.file.filename;
        
        // Verify the file exists to prevent broken images
        const fullPath = path.join(process.cwd(), 'uploads', 'place-images', filename);
        if (fs.existsSync(fullPath)) {
          updateData.imageUrl = `/uploads/place-images/${filename}`;
          console.log(`Updated place image: ${filename}`);
          console.log(`New image URL: ${updateData.imageUrl}`);
        } else {
          console.error(`[ERROR] Update failed - File not found at ${fullPath}`);
          return res.status(500).json({ error: "Image update failed - please try again" });
        }
      }
      
      // Update the place
      const updatedPlace = await storage.updatePlace(placeId, updateData);
      
      res.json(updatedPlace);
    } catch (error) {
      console.error("Error updating place:", error);
      res.status(500).json({ error: "Failed to update place" });
    }
  });

  // Update all playgrounds to use random images
  app.post("/api/playgrounds/update-all-images", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get all playground places
      const allPlaces = await storage.getPlaces({ type: 'playground' });
      const playgrounds = allPlaces.filter(place => place.type === 'playground');
      
      if (!playgrounds.length) {
        return res.status(404).json({ message: "No playgrounds found to update" });
      }
      
      // Update each playground with a random image
      const updateResults = await Promise.all(
        playgrounds.map(async playground => {
          const randomImageUrl = getRandomPlaygroundImage();
          console.log(`Updating playground ${playground.id} (${playground.name}) with new image: ${randomImageUrl}`);
          
          return await storage.updatePlace(playground.id, {
            imageUrl: randomImageUrl,
          });
        })
      );
      
      res.status(200).json({ 
        message: `Successfully updated ${updateResults.length} playgrounds with random images`,
        updated: updateResults.length,
        playgrounds: updateResults
      });
    } catch (error) {
      console.error("Error updating playground images:", error);
      res.status(500).json({ error: "Failed to update playground images" });
    }
  });

  app.delete("/api/places/by-name/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      if (!name) {
        return res.status(400).json({ error: "Place name is required" });
      }
      
      console.log(`Attempting to delete place with name: ${name}`);
      
      // Get all places from storage
      const allPlaces = await storage.getPlaces({});
      
      // Find places that match the name (case-insensitive)
      const matchingPlaces = allPlaces.filter(place => 
        place.name.toLowerCase() === name.toLowerCase()
      );
      
      if (matchingPlaces.length === 0) {
        return res.status(404).json({ message: "No matching places found" });
      }
      
      // Delete each matching place - first remove from favorites
      const deletionResults = await Promise.all(
        matchingPlaces.map(async place => {
          try {
            // First delete all references in user_favorites table
            const { userFavorites } = await import("@shared/schema");
            await db
              .delete(userFavorites)
              .where(eq(userFavorites.placeId, place.id));
              
            console.log(`Removed place ${place.id} (${place.name}) from user favorites`);
            
            // Then delete the place itself
            const deleted = await db
              .delete(places)
              .where(eq(places.id, place.id))
              .returning();
            
            return {
              id: place.id,
              name: place.name,
              deleted: deleted.length > 0
            };
          } catch (err) {
            console.error(`Error deleting place ${place.id} (${place.name}):`, err);
            return {
              id: place.id,
              name: place.name,
              deleted: false,
              error: (err as Error).message
            };
          }
        })
      );
      
      res.json({ 
        message: `Deleted ${deletionResults.filter(r => r.deleted).length} places`, 
        details: deletionResults 
      });
    } catch (error) {
      console.error("Error deleting places by name:", error);
      res.status(500).json({ error: "Failed to delete places" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // WebSocket Server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Client connections and their associated user IDs
  const clients = new Map<WebSocket, { userId: number | null }>();
  
  wss.on('connection', (ws) => {
    // Initially, the connection is not authenticated
    clients.set(ws, { userId: null });
    
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication message
        if (data.type === 'authenticate') {
          if (data.token) {
            // In a real app, you would verify the token here
            // For now, we'll trust the user ID sent by the client
            clients.set(ws, { userId: data.userId });
            ws.send(JSON.stringify({
              type: 'authenticated',
              success: true
            }));
          }
        }
        // Handle get_messages request
        else if (data.type === 'get_messages') {
          const clientInfo = clients.get(ws);
          if (!clientInfo || !clientInfo.userId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not authenticated'
            }));
            return;
          }
          
          try {
            // Get the chat to verify the user is a participant
            const chat = await storage.getChatById(data.chatId);
            if (!chat || !chat.participants.some((p: any) => p.id === clientInfo.userId)) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'You do not have access to this chat'
              }));
              return;
            }
            
            // Calculate the date one week ago for message expiration
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            // Get messages for this chat, limited to the last week
            const messages = await db
              .select()
              .from(chatMessages)
              .where(
                and(
                  eq(chatMessages.chatId, data.chatId),
                  gte(chatMessages.sentAt, oneWeekAgo)
                )
              )
              .orderBy(asc(chatMessages.sentAt));
            
            // Get sender details for all messages
            const messagesWithSenders = await Promise.all(
              messages.map(async (message) => {
                const [sender] = await db
                  .select({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    profileImage: users.profileImage
                  })
                  .from(users)
                  .where(eq(users.id, message.senderId));
                
                return {
                  ...message,
                  sender
                };
              })
            );
            
            // Send all messages to the client
            ws.send(JSON.stringify({
              type: 'initial_messages',
              chatId: data.chatId,
              messages: messagesWithSenders
            }));
          } catch (err) {
            console.error('Error fetching chat messages:', err);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to fetch messages'
            }));
          }
        }
        // Handle chat message
        else if (data.type === 'send_message') {
          const clientInfo = clients.get(ws);
          if (!clientInfo || !clientInfo.userId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not authenticated'
            }));
            return;
          }
          
          try {
            console.log("Received chat message:", data);
            
            // Store message in database
            const savedMessage = await storage.sendMessage(
              data.chatId,
              clientInfo.userId,
              data.content
            );
            
            console.log("Saved message:", savedMessage);
            
            // Broadcast to all connected clients who are participants of this chat
            for (const [client, info] of Array.from(clients.entries())) {
              if (client.readyState === WebSocket.OPEN && info.userId) {
                // Check if this user is a participant in the chat
                const chat = await storage.getChatById(data.chatId);
                if (chat && chat.participants.some((p: any) => p.id === info.userId)) {
                  console.log("Sending message to user:", info.userId);
                  client.send(JSON.stringify({
                    type: 'message',
                    message: savedMessage
                  }));
                }
              }
            }
          } catch (err) {
            console.error('Error processing chat message:', err);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to process message'
            }));
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to Papa-Hi chat server'
    }));
  });

  return httpServer;
}
