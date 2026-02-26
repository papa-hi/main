// ADD THESE TO YOUR EXISTING @shared/schema.ts FILE

import { pgTable, serial, integer, varchar, boolean, timestamp, jsonb, decimal, text, unique } from "drizzle-orm/pg-core";
import { users } from "./existing-schema"; // your existing schema

/**
 * User availability slots (recurring weekly schedule)
 */
export const userAvailability = pgTable("user_availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  dayOfWeek: integer("day_of_week").notNull(), // 0-6
  
  // Time slot (morning/afternoon/evening/allday)
  timeSlot: varchar("time_slot", { length: 20 }).notNull(), // 'morning' | 'afternoon' | 'evening' | 'allday'
  
  // Optional: More granular time ranges (for future)
  startTime: varchar("start_time", { length: 5 }), // "09:00"
  endTime: varchar("end_time", { length: 5 }),     // "12:00"
  
  // Recurrence pattern
  recurrenceType: varchar("recurrence_type", { length: 20 }).default("weekly"), // 'weekly' | 'biweekly'
  
  // Active/inactive (for temporary disabling)
  isActive: boolean("is_active").default(true).notNull(),
  
  // Optional notes
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: user can't have duplicate time slots
  uniqueUserSlot: unique().on(table.userId, table.dayOfWeek, table.timeSlot, table.recurrenceType)
}));

/**
 * Cached availability matches for performance
 */
export const availabilityMatches = pgTable("availability_matches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchedUserId: integer("matched_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Shared availability slots
  sharedSlots: jsonb("shared_slots").notNull(), // Array of {dayOfWeek, timeSlot}
  
  // Match quality score (0-100)
  matchScore: integer("match_score").default(0),
  
  // Distance between users
  distanceKm: decimal("distance_km", { precision: 5, scale: 2 }),
  
  // Last calculated
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one match record per user pair
  uniqueMatch: unique().on(table.userId, table.matchedUserId)
}));

// TypeScript types
export type UserAvailability = typeof userAvailability.$inferSelect;
export type NewUserAvailability = typeof userAvailability.$inferInsert;

export type AvailabilityMatch = typeof availabilityMatches.$inferSelect;
export type NewAvailabilityMatch = typeof availabilityMatches.$inferInsert;

// Enums for type safety
export const TIME_SLOTS = {
  MORNING: 'morning',      // 7am - 12pm
  AFTERNOON: 'afternoon',  // 12pm - 5pm
  EVENING: 'evening',      // 5pm - 8pm
  ALLDAY: 'allday'        // Flexible
} as const;

export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
} as const;

export type TimeSlot = typeof TIME_SLOTS[keyof typeof TIME_SLOTS];
export type DayOfWeek = typeof DAYS_OF_WEEK[keyof typeof DAYS_OF_WEEK];
