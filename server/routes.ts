import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { playdates, places, users, chatMessages, insertPlaydateSchema, insertPlaceSchema, User as SelectUser, insertChatMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { upload, getFileUrl, deleteProfileImage } from "./upload";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from 'ws';
import { fetchNearbyPlaygrounds } from "./maps-service";
import { db } from "./db";
import { eq, and, gte, asc, count } from "drizzle-orm";
import crypto from "crypto";

// Counter to track which playground image to use next
let playgroundImageCounter = 0;

// Helper function to get a playground image with variety
function getRandomPlaygroundImage(): string {
  const playgroundImages = [
    "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1680099567302-d1e26339a2ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1572571981886-11d52968eb11?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596724878582-76f4a7a73e77?q=80&w=500&auto=format&fit=crop"
  ];
  
  // Cycle through images sequentially to ensure variety
  const selectedImage = playgroundImages[playgroundImageCounter % playgroundImages.length];
  playgroundImageCounter++;
  
  return selectedImage;
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // For search endpoints, we'll bypass authentication for testing purposes
  if (req.path.includes("/search")) {
    console.log("Bypassing authentication for search route:", req.path);
    return next();
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
  
  // Handle profile image upload during registration (no auth required)
  app.post("/api/upload/profile-image", upload.single('profileImage'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Get filename and create a simple consistent URL
      const filename = req.file.filename;
      const imageUrl = `/profile-images/${filename}`;
      
      console.log(`Profile image uploaded during registration: ${filename}`);
      console.log(`Image URL: ${imageUrl}`);
      
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
  
  // Serve profile images explicitly (to make consistent across environments)
  app.use('/profile-images', (req, res, next) => {
    // Security check to prevent directory traversal
    if (req.path.includes('..')) {
      return res.status(403).send('Forbidden');
    }
    next();
  }, (req, res, next) => {
    const profileImagesPath = path.join(process.cwd(), 'uploads', 'profile-images');
    const filePath = path.join(profileImagesPath, req.path);
    
    // Add debug logging
    console.log(`[PROFILE_IMAGE_SERVER] Request for: ${req.path}`);
    console.log(`[PROFILE_IMAGE_SERVER] Full path: ${filePath}`);
    
    // Check if file exists before sending
    if (fs.existsSync(filePath)) {
      // Set cache control headers to prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`[PROFILE_IMAGE_SERVER] Error sending file: ${err.message}`);
          next(err);
        }
      });
    } else {
      console.error(`[PROFILE_IMAGE_SERVER] File not found: ${filePath}`);
      
      // Send a default placeholder image instead of 404
      const placeholderPath = path.join(process.cwd(), 'client', 'src', 'assets', 'default-avatar.png');
      if (fs.existsSync(placeholderPath)) {
        res.sendFile(placeholderPath);
      } else {
        res.status(404).send('Profile image not found');
      }
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
      
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users for user directory
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
          profileImage: user.profileImage,
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
  
  // Get a specific user's profile by ID
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
      
      // Add some additional details if it's not already there
      if (!userWithoutSensitive.childrenInfo) {
        userWithoutSensitive.childrenInfo = [];
      }
      
      // Return user data
      res.json(userWithoutSensitive);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
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

  // Get featured user - random dad from the database
  app.get("/api/users/featured", isAuthenticated, async (req, res) => {
    try {
      // Get all users to select a random one
      const allUsers = await storage.getAllUsers();
      
      // Filter out the current logged-in user (if authenticated)
      const otherUsers = allUsers.filter(user => !req.user || user.id !== req.user.id);
      
      if (!otherUsers || otherUsers.length === 0) {
        return res.status(404).json({ message: "No featured user found" });
      }
      
      // Select a random user as the featured dad
      const randomIndex = Math.floor(Math.random() * otherUsers.length);
      const featuredUser = otherUsers[randomIndex];
      
      // Define possible favorite locations
      const possibleLocations = [
        "Artis Zoo", "NEMO Science Museum", "Vondelpark", "Boerderij Meerzicht",
        "TunFun Speelpark", "Amstelpark", "Amsterdamse Bos", "Kinderkookcafé",
        "BloemendaalSeaBeach", "Muiderslot Castle", "Pancake Farm", "Keukenhof Gardens"
      ];
      
      // Randomly select 2-4 favorite locations
      const numLocations = Math.floor(Math.random() * 3) + 2; // 2 to 4 locations
      const shuffledLocations = [...possibleLocations].sort(() => 0.5 - Math.random());
      const selectedLocations = shuffledLocations.slice(0, numLocations);
      
      // Add some additional randomized details
      const userWithDetails = {
        ...featuredUser,
        badge: "Actieve Papa",
        childrenInfo: featuredUser.childrenInfo || [
          { name: "Noah", age: Math.floor(Math.random() * 6) + 3 }
        ],
        favoriteLocations: selectedLocations
      };
      
      res.json(userWithDetails);
    } catch (err) {
      console.error("Error fetching featured user:", err);
      res.status(500).json({ message: "Failed to fetch featured user" });
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
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Get the current user to find the old profile image (if any)
      const currentUser = await storage.getUserById(userId);
      if (currentUser?.profileImage) {
        // Extract filename from the URL if it exists and it's not an external URL
        const oldFilename = currentUser.profileImage.split('/').pop();
        if (oldFilename && !currentUser.profileImage.startsWith('http')) {
          // Delete the old profile image
          deleteProfileImage(oldFilename);
        }
      }
      
      // Get filename for the uploaded file
      const filename = req.file.filename;
      
      // Use a simple, consistent format that will work across environments
      // Just store the filename directly - simplest approach
      const profileImageUrl = `/profile-images/${filename}`;
      
      console.log(`Profile image updated: ${filename}`);
      console.log(`Image stored at: ${profileImageUrl}`);
      
      // Update the user's profile with just the relative URL to the image
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

  app.get("/api/users/me/favorite-places", isAuthenticated, async (req, res) => {
    try {
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const favoritePlaces = await storage.getUserFavoritePlaces(userId);
      res.json(favoritePlaces);
    } catch (err) {
      console.error("Error fetching favorite places:", err);
      res.status(500).json({ message: "Failed to fetch favorite places" });
    }
  });

  app.get("/api/users/me/playdates", isAuthenticated, async (req, res) => {
    try {
      // Get the authenticated user ID
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userPlaydates = await storage.getUserPlaydates(userId);
      res.json(userPlaydates);
    } catch (err) {
      console.error("Error fetching user playdates:", err);
      res.status(500).json({ message: "Failed to fetch user playdates" });
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
      
      // Define an array of high-quality playground images
      const playgroundImages = [
        "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1680099567302-d1e26339a2ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1572571981886-11d52968eb11?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1596724878582-76f4a7a73e77?q=80&w=500&auto=format&fit=crop"
      ];
      
      // Select a random image from the array
      const randomImageUrl = playgroundImages[Math.floor(Math.random() * playgroundImages.length)];
      
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
      
      // Define an array of high-quality playground images
      const playgroundImages = [
        "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1680099567302-d1e26339a2ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1572571981886-11d52968eb11?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1596724878582-76f4a7a73e77?q=80&w=500&auto=format&fit=crop"
      ];
      
      // Select a random image from the array
      const imageUrl = playgroundImages[Math.floor(Math.random() * playgroundImages.length)];
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
      
      // Validate required fields
      if (!req.body.name || !req.body.latitude || !req.body.longitude || !req.body.type) {
        return res.status(400).json({ error: "Name, latitude, longitude, and type are required" });
      }
      
      // Validate type is either restaurant or playground
      if (req.body.type !== 'restaurant' && req.body.type !== 'playground') {
        return res.status(400).json({ error: "Type must be either 'restaurant' or 'playground'" });
      }
      
      // Create a new place object
      const placeData = {
        name: req.body.name,
        type: req.body.type,
        description: req.body.description || "",
        address: req.body.address || "",
        latitude: req.body.latitude.toString(),
        longitude: req.body.longitude.toString(),
        imageUrl: req.body.imageUrl || (
          req.body.type === 'restaurant' 
            ? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
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
      
      // Validate required fields
      if (!req.body.name || !req.body.latitude || !req.body.longitude || !req.body.type) {
        return res.status(400).json({ error: "Name, latitude, longitude, and type are required" });
      }
      
      // Validate type is either restaurant or playground
      if (req.body.type !== 'restaurant' && req.body.type !== 'playground') {
        return res.status(400).json({ error: "Type must be either 'restaurant' or 'playground'" });
      }
      
      // Get the uploaded image file, if any
      let imageUrl = '';
      
      // For restaurants, we still accept file uploads
      // For playgrounds, we use random images instead
      if (req.body.type === 'playground') {
        // Use a random playground image
        imageUrl = getRandomPlaygroundImage();
        console.log(`Using random playground image: ${imageUrl}`);
      } else if (req.file) {
        // Create a proper URL to the uploaded file (for restaurants)
        const filename = req.file.filename;
        imageUrl = `/uploads/place-images/${filename}`;
        console.log(`Restaurant image uploaded: ${filename}`);
        console.log(`Image URL: ${imageUrl}`);
      } else {
        // Fallback image for restaurants if no file uploaded
        imageUrl = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80";
        console.log(`No image uploaded for restaurant, using fallback image`);
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
      
      // Create a new place object
      const placeData = {
        name: req.body.name,
        type: req.body.type,
        description: req.body.description || "",
        address: req.body.address || "",
        latitude: req.body.latitude.toString(),
        longitude: req.body.longitude.toString(),
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
  
  // Simple test endpoint with no authentication
  app.get("/api/test", (req, res) => {
    res.json({ message: "Test endpoint works!" });
  });
  
  // Endpoint to provide environment variables needed on the frontend
  app.get("/api/env", (req, res) => {
    res.json({
      OPEN_WEATHER_API_KEY: process.env.OPEN_WEATHER_API_KEY
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
