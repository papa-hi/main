import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { playdates, places, insertPlaydateSchema, insertPlaceSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";

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
  
  // put application routes here
  // prefix all routes with /api

  // User routes
  app.get("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      // Get the authenticated user
      const user = req.user;
      
      // Format the response to match the expected structure
      const userWithoutPassword = { ...user };
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
      
      // Remove sensitive fields that shouldn't be updated directly
      const updateData = { ...req.body };
      delete updateData.password; // Password should be updated through a dedicated endpoint
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Remove password from response
      const userWithoutPassword = { ...updatedUser };
      delete userWithoutPassword.password;
      
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/users/me/favorite-places", async (req, res) => {
    try {
      // In a real app, we would use the authenticated user ID
      const userId = 1;
      const favoritePlaces = await storage.getUserFavoritePlaces(userId);
      res.json(favoritePlaces);
    } catch (err) {
      console.error("Error fetching favorite places:", err);
      res.status(500).json({ message: "Failed to fetch favorite places" });
    }
  });

  app.get("/api/users/me/playdates", async (req, res) => {
    try {
      // In a real app, we would use the authenticated user ID
      const userId = 1;
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

  app.post("/api/playdates", async (req, res) => {
    try {
      // Validate request body
      const validPlaydate = insertPlaydateSchema.parse(req.body);
      
      // In a real app, we would use the authenticated user ID
      const creatorId = 1;
      
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

  app.delete("/api/playdates/:id", async (req, res) => {
    try {
      const playdateId = parseInt(req.params.id);
      if (isNaN(playdateId)) {
        return res.status(400).json({ message: "Invalid playdate ID" });
      }
      
      // In a real app, we would ensure the user owns this playdate
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

  app.post("/api/places/:id/favorite", async (req, res) => {
    try {
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) {
        return res.status(400).json({ message: "Invalid place ID" });
      }
      
      // In a real app, we would use the authenticated user ID
      const userId = 1;
      
      const favorite = await storage.addFavoritePlace(userId, placeId);
      res.status(201).json(favorite);
    } catch (err) {
      console.error("Error adding favorite place:", err);
      res.status(500).json({ message: "Failed to add favorite place" });
    }
  });

  app.delete("/api/places/:id/favorite", async (req, res) => {
    try {
      const placeId = parseInt(req.params.id);
      if (isNaN(placeId)) {
        return res.status(400).json({ message: "Invalid place ID" });
      }
      
      // In a real app, we would use the authenticated user ID
      const userId = 1;
      
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
