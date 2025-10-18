import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, unique } from "drizzle-orm/pg-core";
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
  role: text("role").default('user').notNull(), // 'user', 'admin'
  lastLogin: timestamp("last_login"),
});

// Community Posts schema
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  category: text("category").default("general"), // "parenting-tips", "activities", "health", "general"
  hashtags: text("hashtags").array().default([]),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Community Comments schema  
export const communityComments = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentCommentId: integer("parent_comment_id"),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Community Reactions schema
export const communityReactions = pgTable("community_reactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").references(() => communityPosts.id, { onDelete: "cascade" }),
  commentId: integer("comment_id").references(() => communityComments.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(), // "like", "love", "helpful", "funny"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserPostReaction: unique().on(table.userId, table.postId),
  uniqueUserCommentReaction: unique().on(table.userId, table.commentId),
}));

// Community Mentions schema
export const communityMentions = pgTable("community_mentions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => communityPosts.id, { onDelete: "cascade" }),
  commentId: integer("comment_id").references(() => communityComments.id, { onDelete: "cascade" }),
  mentionedUserId: integer("mentioned_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mentioningUserId: integer("mentioning_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dad Matches schema - tracks potential matches between dads
export const dadMatches = pgTable("dad_matches", {
  id: serial("id").primaryKey(),
  dadId1: integer("dad_id_1").notNull().references(() => users.id, { onDelete: "cascade" }),
  dadId2: integer("dad_id_2").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchScore: integer("match_score").notNull(), // 0-100 based on compatibility
  distanceKm: integer("distance_km"), // Distance between users in kilometers
  commonAgeRanges: jsonb("common_age_ranges"), // Array of age ranges where children overlap
  matchStatus: text("match_status").default("pending").notNull(), // pending, accepted, declined, expired
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Matches expire after 30 days
}, (table) => ({
  // Ensure no duplicate matches between same users
  uniqueDadPair: unique().on(table.dadId1, table.dadId2),
}));

// Match Preferences schema - user preferences for matching
export const matchPreferences = pgTable("match_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  maxDistanceKm: integer("max_distance_km").default(20), // Max distance for matches in km
  ageFlexibility: integer("age_flexibility").default(2), // +/- years for age matching
  isEnabled: boolean("is_enabled").default(true),
  lastMatchRun: timestamp("last_match_run"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define user relations
export const usersRelations = relations(users, ({ many }) => ({
  createdPlaydates: many(playdates),
  playdateParticipations: many(playdateParticipants),
  favorites: many(userFavorites),
  communityPosts: many(communityPosts),
  communityComments: many(communityComments),
  communityReactions: many(communityReactions),
  mentionsReceived: many(communityMentions, { relationName: "mentionedUser" }),
  mentionsGiven: many(communityMentions, { relationName: "mentioningUser" }),
  matchesAsDad1: many(dadMatches, { relationName: "dad1Matches" }),
  matchesAsDad2: many(dadMatches, { relationName: "dad2Matches" }),
  matchPreferences: many(matchPreferences),
}));

// Community Posts relations
export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(communityComments),
  reactions: many(communityReactions),
  mentions: many(communityMentions, { relationName: "postMentions" }),
}));

// Community Comments relations
export const communityCommentsRelations = relations(communityComments, ({ one, many }) => ({
  post: one(communityPosts, {
    fields: [communityComments.postId],
    references: [communityPosts.id],
  }),
  author: one(users, {
    fields: [communityComments.authorId],
    references: [users.id],
  }),
  replies: many(communityComments),
  reactions: many(communityReactions),
  mentions: many(communityMentions, { relationName: "commentMentions" }),
}));

// Community Reactions relations
export const communityReactionsRelations = relations(communityReactions, ({ one }) => ({
  user: one(users, {
    fields: [communityReactions.userId],
    references: [users.id],
  }),
  post: one(communityPosts, {
    fields: [communityReactions.postId],
    references: [communityPosts.id],
  }),
  comment: one(communityComments, {
    fields: [communityReactions.commentId],
    references: [communityComments.id],
  }),
}));

// Community Mentions relations
export const communityMentionsRelations = relations(communityMentions, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityMentions.postId],
    references: [communityPosts.id],
    relationName: "postMentions",
  }),
  comment: one(communityComments, {
    fields: [communityMentions.commentId],
    references: [communityComments.id],
    relationName: "commentMentions",
  }),
  mentionedUser: one(users, {
    fields: [communityMentions.mentionedUserId],
    references: [users.id],
    relationName: "mentionedUser",
  }),
  mentioningUser: one(users, {
    fields: [communityMentions.mentioningUserId],
    references: [users.id],
    relationName: "mentioningUser",
  }),
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
  childrenInfo: true,
});

// Playdate schema
export const playdates = pgTable("playdates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  latitude: text("latitude").default("0"),
  longitude: text("longitude").default("0"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  maxParticipants: integer("max_participants").default(5).notNull(),
  cost: text("cost").default("free"), // "free", "paid", or specific amount like "€5 per child"
  isRecurring: boolean("is_recurring").default(false),
  recurringEndDate: timestamp("recurring_end_date"),
  recurringType: text("recurring_type").default("none"), // "none", "daily", "weekly", "monthly"
  parentPlaydateId: integer("parent_playdate_id"), // For recurring instances, points to the original
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
  latitude: true,
  longitude: true,
  startTime: true,
  endTime: true,
  maxParticipants: true,
  cost: true,
  isRecurring: true,
  recurringType: true,
  recurringEndDate: true,
  parentPlaydateId: true,
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
  type: text("type").notNull(), // 'restaurant', 'playground', or 'museum'
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

// Community schema insert and types
export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEdited: true,
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEdited: true,
  likesCount: true,
});

export const insertCommunityReactionSchema = createInsertSchema(communityReactions).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityMentionSchema = createInsertSchema(communityMentions).omit({
  id: true,
  createdAt: true,
});

export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;
export type InsertCommunityReaction = z.infer<typeof insertCommunityReactionSchema>;
export type InsertCommunityMention = z.infer<typeof insertCommunityMentionSchema>;

export type CommunityPost = typeof communityPosts.$inferSelect & {
  author: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    username: string;
  };
  comments: CommunityComment[];
  reactions: CommunityReaction[];
  _count: {
    comments: number;
    reactions: number;
  };
};

export type CommunityComment = typeof communityComments.$inferSelect & {
  author: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    username: string;
  };
  replies: CommunityComment[];
  reactions: CommunityReaction[];
  _count: {
    replies: number;
    reactions: number;
  };
};

export type CommunityReaction = typeof communityReactions.$inferSelect & {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
};

export type CommunityMention = typeof communityMentions.$inferSelect;

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

// Image storage table for persistent uploads
export const imageStorage = pgTable("image_storage", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  dataBase64: text("data_base64").notNull(), // Store as base64 string
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  category: text("category").notNull(), // 'profile' or 'place'
});

// Image storage relations
export const imageStorageRelations = relations(imageStorage, ({ one }) => ({
  uploader: one(users, {
    fields: [imageStorage.uploadedBy],
    references: [users.id],
  }),
}));

// Image storage schemas
export const insertImageSchema = createInsertSchema(imageStorage).pick({
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
  dataBase64: true,
  uploadedBy: true,
  category: true,
});

export type InsertImage = z.infer<typeof insertImageSchema>;
export type StoredImage = typeof imageStorage.$inferSelect;

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

// Analytics tables for admin dashboard
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // login, logout, view_profile, create_playdate, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: jsonb("details"), // Additional data specific to the action
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  path: text("path").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  duration: integer("duration"), // Time spent on page in seconds
  referrer: text("referrer"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  feature: text("feature").notNull(), // chat, map, playdates, etc.
  action: text("action").notNull(), // view, create, update, delete
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: jsonb("details"),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // user_edit, user_delete, etc.
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
});

export const userActivitySchema = createInsertSchema(userActivity).pick({
  userId: true,
  action: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export const pageViewsSchema = createInsertSchema(pageViews).pick({
  userId: true,
  path: true,
  duration: true,
  referrer: true,
  ipAddress: true,
  userAgent: true,
});

export const featureUsageSchema = createInsertSchema(featureUsage).pick({
  userId: true,
  feature: true,
  action: true,
  details: true,
});

export const adminLogsSchema = createInsertSchema(adminLogs).pick({
  adminId: true,
  action: true,
  details: true,
  ipAddress: true,
});

export type InsertUserActivity = z.infer<typeof userActivitySchema>;
export type InsertPageView = z.infer<typeof pageViewsSchema>;
export type InsertFeatureUsage = z.infer<typeof featureUsageSchema>;
export type InsertAdminLog = z.infer<typeof adminLogsSchema>;

export type UserActivity = typeof userActivity.$inferSelect;
export type PageView = typeof pageViews.$inferSelect;
export type FeatureUsage = typeof featureUsage.$inferSelect;
export type AdminLog = typeof adminLogs.$inferSelect;

// Simple ratings schema - just ratings, no reviews
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  placeId: integer("place_id").notNull().references(() => places.id),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure one rating per user per place
  uniqueUserPlace: unique().on(table.userId, table.placeId),
}));

// Define ratings relations
export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [ratings.placeId],
    references: [places.id],
  }),
}));

// Update places relations to include ratings
export const placesRelationsWithRatings = relations(places, ({ many }) => ({
  favorites: many(userFavorites),
  ratings: many(ratings),
}));

// Create insert schema for ratings
export const insertRatingSchema = createInsertSchema(ratings).pick({
  placeId: true,
  rating: true,
});

// Rating type definitions
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

// Dad Matches schema types
export const insertDadMatchSchema = createInsertSchema(dadMatches).omit({
  id: true,
  createdAt: true,
  notificationSent: true,
});

export const insertMatchPreferencesSchema = createInsertSchema(matchPreferences).omit({
  id: true,
  updatedAt: true,
  lastMatchRun: true,
});

export type InsertDadMatch = z.infer<typeof insertDadMatchSchema>;
export type InsertMatchPreferences = z.infer<typeof insertMatchPreferencesSchema>;
export type DadMatch = typeof dadMatches.$inferSelect & {
  dad1: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImage' | 'city' | 'childrenInfo'>;
  dad2: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImage' | 'city' | 'childrenInfo'>;
};
export type MatchPreferences = typeof matchPreferences.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
  used: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
}, (table) => ({
  uniqueUserEndpoint: unique().on(table.userId, table.endpoint),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).pick({
  userId: true,
  endpoint: true,
  p256dhKey: true,
  authKey: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
