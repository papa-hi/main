import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  city: text("city"),
  badge: text("badge"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  favoriteLocations: text("favorite_locations").array(),
  childrenInfo: jsonb("children_info"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  profileImage: true,
  bio: true,
  city: true,
});

// Playdate schema
export const playdates = pgTable("playdates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  creatorId: integer("creator_id").notNull(),
  maxParticipants: integer("max_participants").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlaydateSchema = createInsertSchema(playdates).pick({
  title: true,
  description: true,
  location: true,
  startTime: true,
  endTime: true,
  maxParticipants: true,
});

// Playdate participants schema
export const playdateParticipants = pgTable("playdate_participants", {
  id: serial("id").primaryKey(),
  playdateId: integer("playdate_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Places schema
export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'restaurant' or 'playground'
  description: text("description"),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: integer("rating").default(0).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  features: text("features").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlaceSchema = createInsertSchema(places).pick({
  name: true,
  type: true,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  imageUrl: true,
  features: true,
});

// User favorites schema
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  placeId: integer("place_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect & {
  childrenInfo?: { name: string; age: number }[];
};

export type InsertPlaydate = z.infer<typeof insertPlaydateSchema>;
export type Playdate = typeof playdates.$inferSelect & {
  participants: { id: number; firstName: string; lastName: string; profileImage: string }[];
};

export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof places.$inferSelect & {
  distance: number;
  isSaved: boolean;
};
