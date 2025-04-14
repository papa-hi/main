import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { playdates, places, insertPlaydateSchema, insertPlaceSchema, User as SelectUser, insertChatMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { upload, getFileUrl, deleteProfileImage } from "./upload";
import path from "path";
import { WebSocketServer, WebSocket } from 'ws';

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  // For search endpoints, we'll bypass authentication for testing purposes
  if (req.path.includes("/search")) {
    console.log("Bypassing authentication for search route:", req.path);
    return next();
  }
  
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "You must be logged in to access this resource" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Security check to prevent directory traversal
    if (req.path.includes('..')) {
      return res.status(403).send('Forbidden');
    }
    next();
  }, (req, res, next) => {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsPath, req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        next(err);
      }
    });
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

  // Get featured user
  app.get("/api/users/featured", isAuthenticated, async (req, res) => {
    try {
      const featuredUser = await storage.getFeaturedUser();
      if (!featuredUser) {
        return res.status(404).json({ message: "No featured user found" });
      }
      
      // Add some additional details
      const userWithDetails = {
        ...featuredUser,
        badge: "Actieve Papa",
        childrenInfo: [
          { name: "Noah", age: 6 },
          { name: "Eva", age: 4 }
        ],
        favoriteLocations: ["Artis Zoo", "NEMO Science Museum", "Vondelpark", "Boerderij Meerzicht"]
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
      
      // Get the current user to find the profile image (if any)
      const currentUser = await storage.getUserById(userId);
      if (currentUser?.profileImage) {
        // Extract filename from the URL if it exists
        const oldFilename = currentUser.profileImage.split('/').pop();
        if (oldFilename) {
          // Delete the profile image
          deleteProfileImage(oldFilename);
        }
      }
      
      // Delete the user
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      // Log the user out
      req.logout((err) => {
        if (err) {
          console.error("Error logging out:", err);
          return res.status(500).json({ message: "Failed to log out after deleting account" });
        }
        res.status(200).json({ message: "User account deleted successfully" });
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Failed to delete user account" });
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
        // Extract filename from the URL if it exists
        const oldFilename = currentUser.profileImage.split('/').pop();
        if (oldFilename) {
          // Delete the old profile image
          deleteProfileImage(oldFilename);
        }
      }
      
      // Update user with new profile image URL
      const filename = req.file.filename;
      const imageUrl = `/uploads/profile-images/${filename}`;
      
      const updatedUser = await storage.updateUser(userId, { profileImage: imageUrl });
      
      // Remove password from response
      const userWithoutPassword = { ...updatedUser } as Partial<SelectUser>;
      delete userWithoutPassword.password;
      
      res.json({ 
        success: true, 
        user: userWithoutPassword,
        imageUrl
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

  app.get("/api/playdates/past", async (req, res) => {
    try {
      const pastPlaydates = await storage.getPastPlaydates();
      res.json(pastPlaydates);
    } catch (err) {
      console.error("Error fetching past playdates:", err);
      res.status(500).json({ message: "Failed to fetch past playdates" });
    }
  });

  app.post("/api/playdates", isAuthenticated, async (req, res) => {
    try {
      // Validate request body
      const validPlaydate = insertPlaydateSchema.parse(req.body);
      
      // Get the authenticated user ID
      const creatorId = req.user?.id;
      
      if (!creatorId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const newPlaydate = await storage.createPlaydate({
        ...validPlaydate,
        creatorId
      });
      
      res.status(201).json(newPlaydate);
    } catch (err) {
      if (err instanceof ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating playdate:", err);
      res.status(500).json({ message: "Failed to create playdate" });
    }
  });

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
      
      // TODO: Add check to ensure user owns this playdate
      // For now, we'll just delete it without checking ownership
      
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
      res.json(placesList);
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
      res.json(nearbyPlaces);
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
        offset
      } = req.query;
      
      // Get the authenticated user ID for favorites
      const userId = req.user?.id;
      
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
  
  // Simple test endpoint with no authentication
  app.get("/api/test", (req, res) => {
    res.json({ message: "Test endpoint works!" });
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
            for (const [client, info] of clients.entries()) {
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
