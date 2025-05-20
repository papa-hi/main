import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

// Define user relations
export const usersRelations = relations(users, ({ many }) => ({
  createdPlaydates: many(playdates),
  playdateParticipations: many(playdateParticipants),
  favorites: many(userFavorites),
}));

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
  creatorId: integer("creator_id").notNull().references(() => users.id),
  maxParticipants: integer("max_participants").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define playdate relations
export const playdatesRelations = relations(playdates, ({ one, many }) => ({
  creator: one(users, {
    fields: [playdates.creatorId],
    references: [users.id],
  }),
  participants: many(playdateParticipants),
}));

// Create the schema with standard validation
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
  playdateId: integer("playdate_id").notNull().references(() => playdates.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Define playdate participants relations
export const playdateParticipantsRelations = relations(playdateParticipants, ({ one }) => ({
  playdate: one(playdates, {
    fields: [playdateParticipants.playdateId],
    references: [playdates.id],
  }),
  user: one(users, {
    fields: [playdateParticipants.userId],
    references: [users.id],
  }),
}));

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

// Define places relations
export const placesRelations = relations(places, ({ many }) => ({
  favorites: many(userFavorites),
}));

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
  userId: integer("user_id").notNull().references(() => users.id),
  placeId: integer("place_id").notNull().references(() => places.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define user favorites relations
export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [userFavorites.placeId],
    references: [places.id],
  }),
}));

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect & {
  childrenInfo?: { name: string; age: number }[];
};

export type InsertPlaydate = z.infer<typeof insertPlaydateSchema>;
export type Playdate = typeof playdates.$inferSelect & {
  participants: { id: number; firstName: string; lastName: string; profileImage: string | null }[];
};

export type InsertPlace = z.infer<typeof insertPlaceSchema>;
export type Place = typeof places.$inferSelect & {
  distance: number;
  isSaved: boolean;
};

// Chat schema
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat participants schema
export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Chat messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: varchar("content", { length: 2000 }).notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
});

// Define chat and participants relations
export const chatsRelations = relations(chats, ({ many }) => ({
  participants: many(chatParticipants),
  messages: many(chatMessages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(chats, {
    fields: [chatParticipants.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, {
    fields: [chatMessages.chatId],
    references: [chats.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// Update user relations to include chats
export const userRelationsWithChats = relations(users, ({ many }) => ({
  chatParticipations: many(chatParticipants),
}));

// Create schemas for inserting chat data
export const insertChatSchema = createInsertSchema(chats);
export const insertChatParticipantSchema = createInsertSchema(chatParticipants).pick({
  chatId: true,
  userId: true,
});
export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  chatId: true,
  senderId: true,
  content: true,
});

// Chat type definitions
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect & {
  participants: { 
    id: number; 
    firstName: string; 
    lastName: string; 
    profileImage: string | null 
  }[];
  lastMessage?: {
    id: number;
    content: string;
    sentAt: Date;
    senderId: number;
    senderName: string;
  };
  unreadCount: number;
};

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect & {
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
  };
};
