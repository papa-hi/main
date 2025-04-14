import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { playdates, places, insertPlaydateSchema, insertPlaceSchema, User as SelectUser } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { upload, getFileUrl, deleteProfileImage } from "./upload";
import path from "path";

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
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

  app.get("/api/users/featured", async (req, res) => {
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

  const httpServer = createServer(app);

  return httpServer;
}
