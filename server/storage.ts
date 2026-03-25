import {
  User, InsertUser, users,
  Playdate, playdates,
  Place, places,
  userFavorites,
  playdateParticipants,
  Chat, ChatMessage, InsertChat, InsertChatMessage,
  chats, chatParticipants, chatMessages,
  UserActivity, InsertUserActivity, userActivity,
  PageView, InsertPageView, pageViews,
  FeatureUsage, InsertFeatureUsage, featureUsage,
  AdminLog, InsertAdminLog, adminLogs,
  Rating, InsertRating, ratings,
  communityPosts, communityComments, communityReactions,
  PasswordResetToken, InsertPasswordResetToken, passwordResetTokens,
  FamilyEvent, InsertFamilyEvent, familyEvents,
  userAvailability,
  ConsentRecord, consentRecords,
  EmailChangeRequest, emailChangeRequests,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, desc, sql, asc, count, gte, lte, max, isNull, isNotNull, not, ne, inArray, like, or, type SQL } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  getFeaturedUser(excludeUserId?: number): Promise<User | undefined>;
  
  // Password reset methods
  createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  
  // Admin methods
  getAdminUsers(options?: { limit?: number; offset?: number }): Promise<{ users: User[]; total: number }>;
  setUserRole(userId: number, role: string): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getUserStats(): Promise<{
    total: number;
    newLastWeek: number;
    activeLastMonth: number;
    totalPlaydates: number;
    newPlaydatesLastMonth: number;
    totalPlaces: number;
    newPlacesLastMonth: number;
  }>;
  
  // Analytics methods
  logUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  logPageView(pageView: InsertPageView): Promise<PageView>;
  logFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage>;
  logAdminAction(log: InsertAdminLog): Promise<AdminLog>;
  getRecentUserActivity(options?: { limit?: number; offset?: number }): Promise<{ activity: UserActivity[]; total: number }>;
  getUserActivityStats(days?: number): Promise<{
    totalActions: number;
    uniqueUsers: number;
    topActions: { action: string; count: number }[];
    activityByDay: { date: string; count: number }[];
    activeUsers: { userId: number; username: string; firstName: string; lastName: string; activityCount: number }[];
  }>;
  getTopPages(days?: number): Promise<{ path: string, count: number }[]>;
  getFeatureUsageStats(days?: number): Promise<{ feature: string, count: number }[]>;
  getAdminLogs(options?: { limit?: number; offset?: number }): Promise<{ logs: AdminLog[]; total: number }>;
  
  // Playdate methods
  getUpcomingPlaydates(): Promise<Playdate[]>;
  getPastPlaydates(): Promise<Playdate[]>;
  getUserPlaydates(userId: number): Promise<Playdate[]>;
  getPlaydateById(id: number): Promise<Playdate | undefined>;
  createPlaydate(playdate: any): Promise<Playdate>;
  updatePlaydate(id: number, playdate: Partial<Playdate>): Promise<Playdate>;
  deletePlaydate(id: number): Promise<boolean>;
  joinPlaydate(userId: number, playdateId: number): Promise<boolean>;
  leavePlaydate(userId: number, playdateId: number): Promise<boolean>;
  
  // Places methods
  getPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]>;
  getPlaceById(id: number): Promise<Place | undefined>;
  getNearbyPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]>;
  getUserFavoritePlaces(userId: number): Promise<Place[]>;
  addFavoritePlace(userId: number, placeId: number): Promise<any>;
  removeFavoritePlace(userId: number, placeId: number): Promise<boolean>;
  createPlace(place: any): Promise<Place>;
  updatePlace(id: number, placeData: Partial<Place>): Promise<Place>;
  deletePlace(id: number): Promise<boolean>;
  
  // Rating methods
  ratePlace(placeId: number, userId: number, rating: number): Promise<void>;
  getPlaceRating(placeId: number): Promise<{ averageRating: number; totalRatings: number }>;
  getUserRating(placeId: number, userId: number): Promise<number | null>;
  
  // Chat methods
  getChats(userId: number): Promise<Chat[]>;
  getChatById(chatId: number): Promise<Chat | undefined>;
  createChat(participants: number[]): Promise<Chat>;
  getChatMessages(chatId: number, limit?: number, offset?: number): Promise<ChatMessage[]>;
  sendMessage(chatId: number, senderId: number, content: string): Promise<ChatMessage>;
  
  // Community posts methods
  getCommunityPosts(options?: { limit?: number; offset?: number; category?: string; search?: string; hashtag?: string; userId?: number }): Promise<any[]>;
  getCommunityPostById(postId: number): Promise<any | undefined>;
  deleteCommunityPost(postId: number): Promise<boolean>;
  
  // Family Events methods
  getEvents(options?: { latitude?: number; longitude?: number; category?: string; upcoming?: boolean }): Promise<FamilyEvent[]>;
  getEventById(id: number): Promise<FamilyEvent | undefined>;
  createEvent(event: InsertFamilyEvent): Promise<FamilyEvent>;
  updateEvent(id: number, event: Partial<FamilyEvent>): Promise<FamilyEvent>;
  deleteEvent(id: number): Promise<boolean>;
  
  getTotalUnreadCount(userId: number): Promise<number>;
  markChatAsRead(chatId: number, userId: number): Promise<void>;

  // Optimized methods for scheduled tasks
  getUsersWithIncompleteProfiles(): Promise<{ id: number; firstName: string; username: string; email: string; missingFields: string[] }[]>;
  getUsersInCity(city: string): Promise<{ id: number; email: string; firstName: string }[]>;

  // GDPR consent records
  recordConsent(data: { userId: number; consentType: string; granted: boolean; policyVersion: string; ipHash: string | null }): Promise<ConsentRecord>;
  getLatestConsents(userId: number): Promise<ConsentRecord[]>;
  getAllConsents(userId: number): Promise<ConsentRecord[]>;

  // Email change verification
  createEmailChangeRequest(userId: number, newEmail: string, token: string, expiresAt: Date): Promise<EmailChangeRequest>;
  getEmailChangeRequestByToken(token: string): Promise<EmailChangeRequest | undefined>;
  markEmailChangeUsed(id: number): Promise<void>;
}

// MemStorage (in-memory implementation) lives in tests/helpers/mem-storage.ts
// and is never imported here. Only DatabaseStorage is used in production.

export class DatabaseStorage implements IStorage {
  // Admin methods
  async getAdminUsers(options?: { limit?: number; offset?: number }): Promise<{ users: User[]; total: number }> {
    // Defensive: ensure positive integers
    const limit = Math.min(Math.max(1, options?.limit || 50), 200);
    const offset = Math.max(0, options?.offset || 0);
    
    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(users);
    const totalCount = countResult[0]?.count ?? 0;
    
    // Get paginated users
    const result = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
      
    const usersWithTypedChildren = result.map(user => ({
      ...user,
      childrenInfo: user.childrenInfo as { name: string; age: number }[] | undefined,
    }));
    
    return {
      users: usersWithTypedChildren,
      total: Number(totalCount)
    };
  }
  
  async setUserRole(userId: number, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
      
    return {
      ...updatedUser,
      childrenInfo: updatedUser.childrenInfo as { name: string; age: number }[] | undefined,
    };
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.role, role));
      
    return result.map(user => ({
      ...user,
      childrenInfo: user.childrenInfo as { name: string; age: number }[] | undefined,
    }));
  }
  
  async getUserStats(): Promise<{
    total: number;
    newLastWeek: number;
    activeLastMonth: number;
    totalPlaydates: number;
    newPlaydatesLastMonth: number;
    totalPlaces: number;
    newPlacesLastMonth: number;
  }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Run all six counts in parallel
    const [
      totalResult,
      newLastWeekResult,
      activeLastMonthResult,
      totalPlaydatesResult,
      newPlaydatesResult,
      totalPlacesResult,
      newPlacesResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, oneWeekAgo)),
      db.select({ count: count() }).from(users).where(gte(users.lastLogin, oneMonthAgo)),
      db.select({ count: count() }).from(playdates),
      db.select({ count: count() }).from(playdates).where(gte(playdates.createdAt, oneMonthAgo)),
      db.select({ count: count() }).from(places),
      db.select({ count: count() }).from(places).where(gte(places.createdAt, oneMonthAgo)),
    ]);

    return {
      total:                  Number(totalResult[0]?.count)           || 0,
      newLastWeek:            Number(newLastWeekResult[0]?.count)     || 0,
      activeLastMonth:        Number(activeLastMonthResult[0]?.count) || 0,
      totalPlaydates:         Number(totalPlaydatesResult[0]?.count)  || 0,
      newPlaydatesLastMonth:  Number(newPlaydatesResult[0]?.count)    || 0,
      totalPlaces:            Number(totalPlacesResult[0]?.count)     || 0,
      newPlacesLastMonth:     Number(newPlacesResult[0]?.count)       || 0,
    };
  }
  
  // Analytics methods
  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [result] = await db
      .insert(userActivity)
      .values(activity)
      .returning();
      
    return result;
  }
  
  async logPageView(pageView: InsertPageView): Promise<PageView> {
    const [result] = await db
      .insert(pageViews)
      .values(pageView)
      .returning();
      
    return result;
  }
  
  async logFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage> {
    const [result] = await db
      .insert(featureUsage)
      .values(usage)
      .returning();
      
    return result;
  }
  
  async logAdminAction(log: InsertAdminLog): Promise<AdminLog> {
    const [result] = await db
      .insert(adminLogs)
      .values(log)
      .returning();
      
    return result;
  }
  
  async getRecentUserActivity(options?: { limit?: number; offset?: number }): Promise<{ activity: UserActivity[]; total: number }> {
    // Defensive: ensure positive integers
    const limit = Math.min(Math.max(1, options?.limit || 50), 200);
    const offset = Math.max(0, options?.offset || 0);
    
    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(userActivity);
    const totalCount = countResult[0]?.count ?? 0;
    
    // Get paginated activity
    const result = await db
      .select({
        id: userActivity.id,
        userId: userActivity.userId,
        action: userActivity.action,
        timestamp: userActivity.timestamp,
        details: userActivity.details,
        ipAddress: userActivity.ipAddress,
        userAgent: userActivity.userAgent,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          email: users.email,
          profileImage: users.profileImage,
        }
      })
      .from(userActivity)
      .leftJoin(users, eq(userActivity.userId, users.id))
      .orderBy(desc(userActivity.timestamp))
      .limit(limit)
      .offset(offset);
      
    return {
      activity: result as any,
      total: Number(totalCount)
    };
  }

  async getUserActivityStats(days: number = 30): Promise<{
    totalActions: number;
    uniqueUsers: number;
    topActions: { action: string; count: number }[];
    activityByDay: { date: string; count: number }[];
    activeUsers: { userId: number; username: string; firstName: string; lastName: string; activityCount: number }[];
  }> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Get total actions in period
    const totalActionsResult = await db
      .select({ count: count() })
      .from(userActivity)
      .where(gte(userActivity.timestamp, daysAgo));
    const totalActions = totalActionsResult[0]?.count ?? 0;

    // Get unique users in period
    const uniqueUsersResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${userActivity.userId})` })
      .from(userActivity)
      .where(gte(userActivity.timestamp, daysAgo));
    const uniqueUsers = uniqueUsersResult[0]?.count ?? 0;

    // Get top actions
    const topActions = await db
      .select({
        action: userActivity.action,
        count: count()
      })
      .from(userActivity)
      .where(gte(userActivity.timestamp, daysAgo))
      .groupBy(userActivity.action)
      .orderBy(desc(count()))
      .limit(10);

    // Get activity by day
    const activityByDay = await db
      .select({
        date: sql<string>`DATE(${userActivity.timestamp})`,
        count: count()
      })
      .from(userActivity)
      .where(gte(userActivity.timestamp, daysAgo))
      .groupBy(sql`DATE(${userActivity.timestamp})`)
      .orderBy(sql`DATE(${userActivity.timestamp})`);

    // Get most active users
    const activeUsers = await db
      .select({
        userId: userActivity.userId,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        activityCount: count()
      })
      .from(userActivity)
      .leftJoin(users, eq(userActivity.userId, users.id))
      .where(gte(userActivity.timestamp, daysAgo))
      .groupBy(userActivity.userId, users.username, users.firstName, users.lastName)
      .orderBy(desc(count()))
      .limit(20);

    return {
      totalActions: Number(totalActions) || 0,
      uniqueUsers: Number(uniqueUsers) || 0,
      topActions: topActions.map(item => ({ 
        action: item.action, 
        count: Number(item.count) 
      })),
      activityByDay: activityByDay.map(item => ({ 
        date: item.date, 
        count: Number(item.count) 
      })),
      activeUsers: activeUsers.map(item => ({
        userId: item.userId || 0,
        username: item.username || 'Unknown',
        firstName: item.firstName || 'Unknown',
        lastName: item.lastName || 'User',
        activityCount: Number(item.activityCount)
      }))
    };
  }
  
  async getTopPages(days: number = 7): Promise<{ path: string, count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db
      .select({
        path: pageViews.path,
        count: count()
      })
      .from(pageViews)
      .where(gte(pageViews.timestamp, startDate))
      .groupBy(pageViews.path)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
      
    return result.map(item => ({
      path: item.path,
      count: Number(item.count) || 0
    }));
  }
  
  async getFeatureUsageStats(days: number = 7): Promise<{ feature: string, count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db
      .select({
        feature: featureUsage.feature,
        count: count()
      })
      .from(featureUsage)
      .where(gte(featureUsage.timestamp, startDate))
      .groupBy(featureUsage.feature)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
      
    return result.map(item => ({
      feature: item.feature,
      count: Number(item.count) || 0
    }));
  }
  
  async getAdminLogs(options?: { limit?: number; offset?: number }): Promise<{ logs: AdminLog[]; total: number }> {
    // Defensive: ensure positive integers
    const limit = Math.min(Math.max(1, options?.limit || 50), 200);
    const offset = Math.max(0, options?.offset || 0);
    
    // Get total count
    const adminCountResult = await db
      .select({ count: count() })
      .from(adminLogs);
    const totalCount = adminCountResult[0]?.count ?? 0;
    
    // Get paginated logs
    const result = await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.timestamp))
      .limit(limit)
      .offset(offset);
      
    return {
      logs: result,
      total: Number(totalCount)
    };
  }
  
  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async getAllUsers(filters?: {
    searchQuery?: string;
    city?: string;
    childAgeRange?: [number, number];
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const conditions: SQL[] = [];
    
    if (filters) {
      if (filters.searchQuery) {
        const searchTerm = `%${filters.searchQuery}%`;
        conditions.push(
          sql`(${users.firstName} ILIKE ${searchTerm} OR 
               ${users.lastName} ILIKE ${searchTerm} OR 
               ${users.username} ILIKE ${searchTerm} OR
               ${users.bio} ILIKE ${searchTerm})`
        );
      }

      if (filters.city) {
        conditions.push(eq(users.city, filters.city));
      }

      if (filters.childAgeRange) {
        const [minAge, maxAge] = filters.childAgeRange;
        // Match users who have at least one child whose age falls in the range
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${users.childrenInfo}) AS child
            WHERE (child->>'age')::int BETWEEN ${minAge} AND ${maxAge}
          )`
        );
      }
    }
    
    let query = conditions.length > 0
      ? db.select().from(users).where(and(...conditions))
      : db.select().from(users);
    
    if (filters) {
      if (filters.limit) {
        query = query.limit(Number(filters.limit));
      }
      
      if (filters.offset) {
        query = query.offset(Number(filters.offset));
      }
    }
    
    return await query;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure optional fields are properly handled
    const userDataToInsert = {
      ...insertUser,
      phoneNumber: insertUser.phoneNumber || null,
      profileImage: insertUser.profileImage || null,
      bio: insertUser.bio || null,
      city: insertUser.city || null,
      badge: null,  // Default value for badge
      favoriteLocations: []  // Default empty array for favoriteLocations
    };

    const [user] = await db
      .insert(users)
      .values(userDataToInsert)
      .returning();
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }
  
  async getFeaturedUser(excludeUserId?: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(excludeUserId ? ne(users.id, excludeUserId) : undefined)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    // If we excluded the only user in the DB, fall back without the filter
    if (!user && excludeUserId) {
      const [fallback] = await db
        .select()
        .from(users)
        .orderBy(sql`RANDOM()`)
        .limit(1);
      return fallback ?? undefined;
    }
    return user ?? undefined;
  }

  // Password reset methods
  async createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(data)
      .returning();
    
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    
    return resetToken || undefined;
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  // Playdate methods
  async getUpcomingPlaydates(filters?: {
    searchQuery?: string;
    startDateMin?: Date;
    startDateMax?: Date;
    location?: string;
    maxParticipants?: number;
    hasAvailableSpots?: boolean;
    creatorId?: number;
    limit?: number;
    offset?: number;
  }): Promise<Playdate[]> {
    const now = new Date();
    
    const conditions: SQL[] = [gt(playdates.startTime, now), isNull(playdates.archivedAt)];
    
    if (filters) {
      if (filters.searchQuery) {
        const searchTerm = `%${filters.searchQuery}%`;
        conditions.push(
          sql`(${playdates.title} ILIKE ${searchTerm} OR 
               ${playdates.description} ILIKE ${searchTerm} OR 
               ${playdates.location} ILIKE ${searchTerm})`
        );
      }
      
      if (filters.startDateMin) {
        conditions.push(gte(playdates.startTime, filters.startDateMin));
      }
      
      if (filters.startDateMax) {
        conditions.push(lte(playdates.startTime, filters.startDateMax));
      }
      
      if (filters.location) {
        const locationTerm = `%${filters.location}%`;
        conditions.push(sql`${playdates.location} ILIKE ${locationTerm}`);
      }
      
      if (filters.maxParticipants) {
        conditions.push(lte(playdates.maxParticipants, Number(filters.maxParticipants)));
      }
      
      if (filters.creatorId) {
        conditions.push(eq(playdates.creatorId, Number(filters.creatorId)));
      }
    }
    
    let query = db
      .select()
      .from(playdates)
      .where(and(...conditions));
    
    if (filters?.limit) {
      query = query.limit(Number(filters.limit));
    }
    
    if (filters?.offset) {
      query = query.offset(Number(filters.offset));
    }
    
    query = query.orderBy(asc(playdates.startTime));
    
    const playdatesData = await query;
    
    if (playdatesData.length === 0) return [];

    const playdateIds = playdatesData.map(p => p.id);
    const allParticipants = await db
      .select({
        playdateId: playdateParticipants.playdateId,
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
      })
      .from(playdateParticipants)
      .innerJoin(users, eq(playdateParticipants.userId, users.id))
      .where(inArray(playdateParticipants.playdateId, playdateIds));

    const participantMap = new Map<number, any[]>();
    for (const p of allParticipants) {
      if (!participantMap.has(p.playdateId)) participantMap.set(p.playdateId, []);
      participantMap.get(p.playdateId)!.push({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        profileImage: p.profileImage,
      });
    }

    const result: Playdate[] = [];
    for (const playdate of playdatesData) {
      const participants = participantMap.get(playdate.id) || [];
      if (filters?.hasAvailableSpots && participants.length >= playdate.maxParticipants) {
        continue;
      }
      result.push({ ...playdate, participants });
    }
    
    return result;
  }
  
  async getPastPlaydates(): Promise<Playdate[]> {
    const now = new Date();
    
    const playdatesData = await db
      .select()
      .from(playdates)
      .where(and(lt(playdates.startTime, now), isNull(playdates.archivedAt)))
      .orderBy(desc(playdates.startTime));
    
    if (playdatesData.length === 0) return [];

    const playdateIds = playdatesData.map(p => p.id);
    const allParticipants = await db
      .select({
        playdateId: playdateParticipants.playdateId,
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
      })
      .from(playdateParticipants)
      .innerJoin(users, eq(playdateParticipants.userId, users.id))
      .where(inArray(playdateParticipants.playdateId, playdateIds));

    const participantMap = new Map<number, any[]>();
    for (const p of allParticipants) {
      if (!participantMap.has(p.playdateId)) participantMap.set(p.playdateId, []);
      participantMap.get(p.playdateId)!.push({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        profileImage: p.profileImage,
      });
    }

    return playdatesData.map(playdate => ({
      ...playdate,
      participants: participantMap.get(playdate.id) || [],
    }));
  }
  
  async getUserPlaydates(userId: number): Promise<Playdate[]> {
    const playdatesData = await db
      .select()
      .from(playdates)
      .where(and(eq(playdates.creatorId, userId), isNull(playdates.archivedAt)))
      .orderBy(asc(playdates.startTime));
    
    if (playdatesData.length === 0) return [];

    const playdateIds = playdatesData.map(p => p.id);
    const allParticipants = await db
      .select({
        playdateId: playdateParticipants.playdateId,
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
      })
      .from(playdateParticipants)
      .innerJoin(users, eq(playdateParticipants.userId, users.id))
      .where(inArray(playdateParticipants.playdateId, playdateIds));

    const participantMap = new Map<number, any[]>();
    for (const p of allParticipants) {
      if (!participantMap.has(p.playdateId)) participantMap.set(p.playdateId, []);
      participantMap.get(p.playdateId)!.push({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        profileImage: p.profileImage,
      });
    }

    return playdatesData.map(playdate => ({
      ...playdate,
      participants: participantMap.get(playdate.id) || [],
    }));
  }
  
  async getPlaydateById(id: number): Promise<Playdate | undefined> {
    const [playdate] = await db
      .select()
      .from(playdates)
      .where(eq(playdates.id, id));
    
    if (!playdate) {
      return undefined;
    }
    
    // Get participants
    const participants = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage
      })
      .from(playdateParticipants)
      .innerJoin(users, eq(playdateParticipants.userId, users.id))
      .where(eq(playdateParticipants.playdateId, id));
    
    return {
      ...playdate,
      participants
    };
  }
  
  async updatePlaydate(id: number, playdateData: Partial<Playdate>): Promise<Playdate> {
    // Prepare update data (exclude non-database fields like participants)
    const updateData: any = {};
    
    if (playdateData.title !== undefined) updateData.title = playdateData.title;
    if (playdateData.description !== undefined) updateData.description = playdateData.description;
    if (playdateData.location !== undefined) updateData.location = playdateData.location;
    if (playdateData.startTime !== undefined) updateData.startTime = playdateData.startTime;
    if (playdateData.endTime !== undefined) updateData.endTime = playdateData.endTime;
    if (playdateData.maxParticipants !== undefined) updateData.maxParticipants = playdateData.maxParticipants;
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Update the playdate
      const [updatedPlaydate] = await tx
        .update(playdates)
        .set(updateData)
        .where(eq(playdates.id, id))
        .returning();
      
      if (!updatedPlaydate) {
        throw new Error("Playdate not found");
      }
      
      // Get participants
      const participants = await tx
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage
        })
        .from(playdateParticipants)
        .innerJoin(users, eq(playdateParticipants.userId, users.id))
        .where(eq(playdateParticipants.playdateId, id));
      
      return {
        ...updatedPlaydate,
        participants
      };
    });
  }
  
  async createPlaydate(playdateData: any): Promise<Playdate> {
    // Start a transaction
    console.log("DatabaseStorage.createPlaydate called with data:", playdateData);
    
    return await db.transaction(async (tx) => {
      // Insert the playdate
      const [playdate] = await tx
        .insert(playdates)
        .values(playdateData)
        .returning();
      
      console.log("Playdate inserted with ID:", playdate.id, "and creatorId:", playdateData.creatorId);
      
      // Add the creator as a participant
      await tx
        .insert(playdateParticipants)
        .values({
          playdateId: playdate.id,
          userId: playdateData.creatorId
        });
      
      // Get the creator's info to include in the response
      const [creator] = await tx
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage
        })
        .from(users)
        .where(eq(users.id, playdateData.creatorId));
      
      console.log("Retrieved creator info:", creator);
      
      return {
        ...playdate,
        participants: [creator]
      };
    });
  }
  
  async deletePlaydate(id: number): Promise<boolean> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Delete all participants first (foreign key constraint)
      await tx
        .delete(playdateParticipants)
        .where(eq(playdateParticipants.playdateId, id));
      
      // Then delete the playdate and return the deleted row to confirm success
      const result = await tx
        .delete(playdates)
        .where(eq(playdates.id, id))
        .returning({ id: playdates.id });
      
      return result.length > 0;
    });
  }

  // Places methods
  async getPlaces(options: { 
    latitude?: number, 
    longitude?: number, 
    type?: string,
    searchQuery?: string,
    minRating?: number,
    features?: string[],
    sortBy?: 'rating' | 'distance' | 'name',
    sortOrder?: 'asc' | 'desc',
    limit?: number,
    offset?: number,
    userId?: number // To check if places are favorites
  }): Promise<Place[]> {
    const conditions: SQL[] = [];
    
    // Filter by type if specified
    if (options.type) {
      if (options.type === "restaurants") {
        conditions.push(eq(places.type, "restaurant"));
      } else if (options.type === "playgrounds") {
        conditions.push(eq(places.type, "playground"));
      } else if (options.type !== "all") {
        conditions.push(eq(places.type, options.type));
      }
    }
    
    // Search by name, description, or address
    if (options.searchQuery) {
      const searchTerm = `%${options.searchQuery}%`;
      conditions.push(
        sql`(${places.name} ILIKE ${searchTerm} OR 
             ${places.description} ILIKE ${searchTerm} OR 
             ${places.address} ILIKE ${searchTerm})`
      );
    }
    
    // Filter by minimum rating
    if (options.minRating) {
      conditions.push(gte(places.rating, Number(options.minRating)));
    }
    
    let query = conditions.length > 0
      ? db.select().from(places).where(and(...conditions))
      : db.select().from(places);
    
    // Apply sorting
    if (options.sortBy) {
      if (options.sortBy === 'name') {
        query = options.sortOrder === 'desc' 
          ? query.orderBy(desc(places.name)) 
          : query.orderBy(asc(places.name));
      } else {
        query = options.sortOrder === 'asc' 
          ? query.orderBy(asc(places.rating)) 
          : query.orderBy(desc(places.rating));
      }
    } else {
      query = query.orderBy(desc(places.rating));
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(Number(options.limit));
    }
    
    if (options.offset) {
      query = query.offset(Number(options.offset));
    }
    
    const placesData = await query;
    
    // Get user favorites if userId is provided
    let favoritePlaces: Record<number, boolean> = {};
    if (options.userId) {
      const favorites = await db
        .select({ placeId: userFavorites.placeId })
        .from(userFavorites)
        .where(eq(userFavorites.userId, options.userId));
      
      favoritePlaces = favorites.reduce((acc, { placeId }) => {
        acc[placeId] = true;
        return acc;
      }, {} as Record<number, boolean>);
    }
    
    // Add distance and isSaved properties
    // Filter by features if needed
    const result = placesData
      .filter(place => {
        if (!options.features || options.features.length === 0) {
          return true;
        }
        
        // Check if the place has all the required features
        if (!place.features) {
          return false;
        }
        
        return options.features.every(feature => 
          place.features?.includes(feature)
        );
      })
      .map(place => {
        let distance = 0;
        
        // Calculate distance if coordinates are provided
        if (options.latitude && options.longitude) {
          // For demonstration, we'll use a simplified calculation
          // In a real app, use a proper haversine formula or PostGIS
          const lat1 = parseFloat(place.latitude);
          const lon1 = parseFloat(place.longitude);
          const lat2 = options.latitude;
          const lon2 = options.longitude;
          
          // Simple Euclidean distance (for demo only - not accurate for Earth distances)
          distance = Math.sqrt(
            Math.pow((lat2 - lat1) * 111.32, 2) + 
            Math.pow((lon2 - lon1) * 111.32 * Math.cos(lat1 * (Math.PI / 180)), 2)
          ) * 1000; // Convert to meters
        }
        
        return {
          ...place,
          distance,
          isSaved: favoritePlaces[place.id] || false
        };
      });
    
    // Sort by distance if needed (this must be done after the distance calculation)
    if (options.sortBy === 'distance') {
      result.sort((a, b) => {
        return options.sortOrder === 'desc' 
          ? b.distance - a.distance 
          : a.distance - b.distance;
      });
    }
    
    return result;
  }

  async getPlaceById(id: number): Promise<Place | undefined> {
    const [place] = await db.select().from(places).where(eq(places.id, id));
    if (!place) return undefined;
    
    // Return the place as-is since coordinates are stored as text in DB
    // Frontend will handle the conversion to numbers for map display
    return place;
  }
  
  async getNearbyPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]> {
    // ~0.5° ≈ 55 km bounding box — pre-filters rows in Postgres before any JS work
    const DELTA = 0.5;
    const hasCoords = options.latitude != null && options.longitude != null;

    const conditions: SQL[] = [];

    if (options.type && options.type !== "all") {
      conditions.push(eq(places.type, options.type));
    }

    if (hasCoords) {
      const latMin = options.latitude! - DELTA;
      const latMax = options.latitude! + DELTA;
      const lonMin = options.longitude! - DELTA;
      const lonMax = options.longitude! + DELTA;
      // latitude/longitude columns are text — cast to float for comparison
      conditions.push(sql`CAST(${places.latitude} AS FLOAT) BETWEEN ${latMin} AND ${latMax}`);
      conditions.push(sql`CAST(${places.longitude} AS FLOAT) BETWEEN ${lonMin} AND ${lonMax}`);
    }

    let query = db.select().from(places);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // With coords: fetch ≤20 candidates then sort in JS; without: just fetch 4 directly
    const placesData = await query.limit(hasCoords ? 20 : 4);

    if (!hasCoords) {
      return placesData.map(place => ({
        ...place,
        features: place.features ?? [],
        distance: 0,
        isSaved: false,
      }));
    }

    // Haversine on the small candidate set only
    const R = 6371; // km
    const lat0 = options.latitude!;
    const lon0 = options.longitude!;

    const result = placesData.map(place => {
      let distance = 0;
      if (place.latitude && place.longitude) {
        const placeLat = parseFloat(place.latitude);
        const placeLon = parseFloat(place.longitude);
        const dLat = (placeLat - lat0) * Math.PI / 180;
        const dLon = (placeLon - lon0) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat0 * Math.PI / 180) *
          Math.cos(placeLat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000); // metres
      }
      return { ...place, features: place.features ?? [], distance, isSaved: false };
    });

    result.sort((a, b) => a.distance - b.distance);
    return result.slice(0, 4);
  }
  
  async getUserFavoritePlaces(userId: number): Promise<Place[]> {
    const favoritePlacesData = await db
      .select({
        ...places,
      })
      .from(userFavorites)
      .innerJoin(places, eq(userFavorites.placeId, places.id))
      .where(eq(userFavorites.userId, userId));
    
    // Add distance and isSaved properties
    return favoritePlacesData.map(place => ({
      ...place,
      distance: 0, // Would be calculated in a real app
      isSaved: true // These are all saved since they're favorites
    }));
  }
  
  async addFavoritePlace(userId: number, placeId: number): Promise<any> {
    // Check if the favorite already exists
    const [existing] = await db
      .select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.placeId, placeId)
      ));
    
    if (existing) {
      return existing; // Already exists
    }
    
    // Insert new favorite
    const [favorite] = await db
      .insert(userFavorites)
      .values({
        userId,
        placeId
      })
      .returning();
    
    return favorite;
  }
  
  async removeFavoritePlace(userId: number, placeId: number): Promise<boolean> {
    const result = await db
      .delete(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.placeId, placeId)
      ))
      .returning({ id: userFavorites.id });
    
    return result.length > 0;
  }
  
  async createPlace(placeData: any): Promise<Place> {
    // Insert the place into the database
    const [place] = await db
      .insert(places)
      .values({
        name: placeData.name,
        type: placeData.type || 'playground',
        description: placeData.description || null,
        address: placeData.address || 'No address provided',
        latitude: placeData.latitude.toString(),
        longitude: placeData.longitude.toString(),
        imageUrl: placeData.imageUrl || "https://images.unsplash.com/photo-1680099567302-d1e26339a2ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80",
        rating: placeData.rating || 45,
        reviewCount: placeData.reviewCount || 0,
        features: placeData.features || null,
      })
      .returning();
    
    // Return with distance and saved status
    return {
      ...place,
      distance: 0, // This will be calculated when queried with coordinates
      isSaved: false
    };
  }
  
  async updatePlace(id: number, placeData: Partial<Place>): Promise<Place> {
    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    
    if (placeData.name !== undefined) updateData.name = placeData.name;
    if (placeData.description !== undefined) updateData.description = placeData.description;
    if (placeData.address !== undefined) updateData.address = placeData.address;
    
    // Only update latitude and longitude if they're not undefined and not empty strings
    if (placeData.latitude !== undefined && placeData.latitude !== '') {
      updateData.latitude = placeData.latitude.toString();
    }
    
    if (placeData.longitude !== undefined && placeData.longitude !== '') {
      updateData.longitude = placeData.longitude.toString();
    }
    
    if (placeData.imageUrl !== undefined) updateData.imageUrl = placeData.imageUrl;
    if (placeData.features !== undefined) updateData.features = placeData.features;
    
    // Update the place
    await db
      .update(places)
      .set(updateData)
      .where(eq(places.id, id));
    
    // Query to get the updated place (workaround for Drizzle .returning() issue)
    const [updatedPlace] = await db
      .select()
      .from(places)
      .where(eq(places.id, id));
    
    if (!updatedPlace) {
      throw new Error(`Place with id ${id} not found`);
    }
    
    // Return with distance and saved status (these are calculated per request)
    return {
      ...updatedPlace,
      distance: placeData.distance ?? 0,
      isSaved: placeData.isSaved ?? false
    };
  }

  async deletePlace(id: number): Promise<boolean> {
    try {
      // First remove any user favorites for this place
      await db
        .delete(userFavorites)
        .where(eq(userFavorites.placeId, id));
      
      // Then delete the place
      const result = await db
        .delete(places)
        .where(eq(places.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting place:', error);
      return false;
    }
  }

  // Simple rating methods implementation
  async ratePlace(placeId: number, userId: number, rating: number): Promise<void> {
    // Use upsert logic - insert or update if already exists
    await db
      .insert(ratings)
      .values({
        placeId,
        userId,
        rating,
      })
      .onConflictDoUpdate({
        target: [ratings.userId, ratings.placeId],
        set: {
          rating,
        },
      });

    // Update place rating and count
    await this.updatePlaceRatingFromRatings(placeId);
  }

  async getPlaceRating(placeId: number): Promise<{ averageRating: number; totalRatings: number }> {
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${ratings.rating})`,
        totalRatings: sql<number>`COUNT(*)`,
      })
      .from(ratings)
      .where(eq(ratings.placeId, placeId));

    const data = result[0];
    return {
      averageRating: data?.avgRating ? Math.round(data.avgRating * 20) : 0, // Convert 1-5 to 0-100 scale
      totalRatings: data?.totalRatings || 0,
    };
  }

  async getUserRating(placeId: number, userId: number): Promise<number | null> {
    const [result] = await db
      .select({
        rating: ratings.rating,
      })
      .from(ratings)
      .where(and(eq(ratings.placeId, placeId), eq(ratings.userId, userId)));

    return result?.rating || null;
  }

  // Helper method to update place rating based on ratings
  private async updatePlaceRatingFromRatings(placeId: number): Promise<void> {
    const { averageRating, totalRatings } = await this.getPlaceRating(placeId);
    
    await db
      .update(places)
      .set({
        rating: averageRating,
        reviewCount: totalRatings,
      })
      .where(eq(places.id, placeId));
  }

  // Chat methods
  async getChats(userId: number): Promise<Chat[]> {
    const chatIds = await db
      .select({ chatId: chatParticipants.chatId })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId));

    if (chatIds.length === 0) return [];

    const ids = chatIds.map(r => Number(r.chatId));
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const allParticipants = await db
      .select({
        chatId: chatParticipants.chatId,
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(inArray(chatParticipants.chatId, ids));

    const lastMessages = await db.execute(sql`
      SELECT DISTINCT ON (cm.chat_id)
        cm.chat_id AS "chatId",
        cm.id,
        cm.content,
        cm.sent_at AS "sentAt",
        cm.sender_id AS "senderId",
        u.first_name AS "senderName"
      FROM chat_messages cm
      INNER JOIN users u ON cm.sender_id = u.id
      WHERE cm.chat_id IN (${sql.join(ids.map(id => sql`${id}::integer`), sql`, `)})
        AND cm.sent_at >= ${oneWeekAgo.toISOString()}::timestamp
      ORDER BY cm.chat_id, cm.sent_at DESC, cm.id DESC
    `);

    const unreadCounts = await db
      .select({
        chatId: chatMessages.chatId,
        count: count(),
      })
      .from(chatMessages)
      .where(
        and(
          inArray(chatMessages.chatId, ids),
          not(eq(chatMessages.senderId, userId)),
          eq(chatMessages.isRead, false),
          gte(chatMessages.sentAt, oneWeekAgo)
        )
      )
      .groupBy(chatMessages.chatId);

    const chatDetails = await db
      .select()
      .from(chats)
      .where(inArray(chats.id, ids));

    const participantMap = new Map<number, any[]>();
    for (const p of allParticipants) {
      if (!participantMap.has(p.chatId)) participantMap.set(p.chatId, []);
      participantMap.get(p.chatId)!.push({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        profileImage: p.profileImage,
      });
    }

    const lastMessageRows = lastMessages as any[];
    const lastMessageMap = new Map(lastMessageRows.map(m => [m.chatId, m]));
    const unreadMap = new Map(unreadCounts.map(u => [u.chatId, Number(u.count)]));

    return chatDetails.map(chat => ({
      ...chat,
      participants: participantMap.get(chat.id) || [],
      lastMessage: lastMessageMap.get(chat.id),
      unreadCount: unreadMap.get(chat.id) || 0,
    })).sort((a, b) => {
      const tA = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const tB = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return tB - tA;
    });
  }

  async getChatById(chatId: number): Promise<Chat | undefined> {
    // Get the chat details
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));
    
    if (!chat) return undefined;
    
    // Get all participants for this chat
    const participants = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, chatId));
    
    return {
      ...chat,
      participants,
      unreadCount: 0 // This field is only relevant for chat list
    };
  }

  async createChat(participants: number[]): Promise<Chat> {
    return await db.transaction(async (tx) => {
      // Check if a chat with these participants already exists
      // First, get all chats for the first participant
      const participantChats = await tx
        .select({ chatId: chatParticipants.chatId })
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, participants[0]));
      
      // For each chat, check if all other participants are members
      for (const { chatId } of participantChats) {
        let allParticipantsFound = true;
        
        for (let i = 1; i < participants.length; i++) {
          const [participantInChat] = await tx
            .select()
            .from(chatParticipants)
            .where(
              and(
                eq(chatParticipants.chatId, chatId),
                eq(chatParticipants.userId, participants[i])
              )
            );
          
          if (!participantInChat) {
            allParticipantsFound = false;
            break;
          }
        }
        
        // If all participants are found in this chat, return it
        if (allParticipantsFound) {
          const existingChat = await this.getChatById(chatId);
          if (existingChat) return existingChat;
        }
      }
      
      // If no existing chat was found, create a new one
      const [newChat] = await tx
        .insert(chats)
        .values({})
        .returning();
      
      // Add all participants to the chat
      for (const userId of participants) {
        await tx
          .insert(chatParticipants)
          .values({
            chatId: newChat.id,
            userId
          });
      }
      
      // Get user details for all participants
      // Use proper parameterized query with 'in' operator instead of raw SQL
      const participantDetails = await tx
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage
        })
        .from(users)
        .where(inArray(users.id, participants));
      
      console.log("Created new chat:", {
        ...newChat,
        participants: participantDetails,
        lastMessage: null,
        unreadCount: 0
      });
      
      return {
        ...newChat,
        participants: participantDetails,
        lastMessage: undefined,
        unreadCount: 0
      };
    });
  }

  async getChatMessages(chatId: number, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const rows = await db
      .select({
        id: chatMessages.id,
        chatId: chatMessages.chatId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        sentAt: chatMessages.sentAt,
        isRead: chatMessages.isRead,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        },
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(asc(chatMessages.sentAt))
      .limit(limit)
      .offset(offset);

    return rows;
  }

  async sendMessage(chatId: number, senderId: number, content: string): Promise<ChatMessage> {
    // Insert the message
    const [message] = await db
      .insert(chatMessages)
      .values({
        chatId,
        senderId,
        content,
        isRead: false
      })
      .returning();
    
    // Get the sender details
    const [sender] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage
      })
      .from(users)
      .where(eq(users.id, senderId));
    
    // Update the chat's updatedAt timestamp
    await db
      .update(chats)
      .set({
        updatedAt: new Date()
      })
      .where(eq(chats.id, chatId));
    
    return {
      ...message,
      sender
    };
  }

  // User deletion with proper error handling
  async deleteUser(id: number): Promise<boolean> {
    console.log(`[DatabaseStorage] Starting deletion of user with ID ${id}`);
    
    try {
      return await db.transaction(async (tx) => {
        try {
          // First, delete all relations to avoid foreign key constraints
          console.log(`[DatabaseStorage] Deleting user ${id}'s playdate participations`);
          await tx
            .delete(playdateParticipants)
            .where(eq(playdateParticipants.userId, id));
          
          console.log(`[DatabaseStorage] Deleting user ${id}'s favorite places`);
          // Delete user's favorite places
          await tx
            .delete(userFavorites)
            .where(eq(userFavorites.userId, id));
          
          console.log(`[DatabaseStorage] Finding user ${id}'s chats`);
          // Delete user's chat participations and messages
          const userChats = await tx
            .select({ chatId: chatParticipants.chatId })
            .from(chatParticipants)
            .where(eq(chatParticipants.userId, id));
          
          console.log(`[DatabaseStorage] Processing ${userChats.length} chats for user ${id}`);
          // For each chat, delete messages sent by user
          for (const { chatId } of userChats) {
            console.log(`[DatabaseStorage] Deleting messages from user ${id} in chat ${chatId}`);
            await tx
              .delete(chatMessages)
              .where(eq(chatMessages.senderId, id));
            
            console.log(`[DatabaseStorage] Removing user ${id} from chat ${chatId} participants`);
            // Remove user from chat participants
            await tx
              .delete(chatParticipants)
              .where(
                and(
                  eq(chatParticipants.chatId, chatId),
                  eq(chatParticipants.userId, id)
                )
              );
            
            console.log(`[DatabaseStorage] Checking if chat ${chatId} is now empty`);
            // Check if chat is now empty (no participants)
            const participantsCountResult = await tx
              .select({ count: count() })
              .from(chatParticipants)
              .where(eq(chatParticipants.chatId, chatId));
            
            if (!participantsCountResult || participantsCountResult.length === 0) {
              console.log(`[DatabaseStorage] Error: No count result returned for chat ${chatId}`);
              continue;
            }
            
            const participantCount = Number(participantsCountResult[0].count);
            console.log(`[DatabaseStorage] Chat ${chatId} has ${participantCount} participants left`);
            
            // If chat is empty, delete it
            if (participantCount === 0) {
              console.log(`[DatabaseStorage] Deleting all messages in empty chat ${chatId}`);
              // Delete all remaining messages in the chat
              await tx
                .delete(chatMessages)
                .where(eq(chatMessages.chatId, chatId));
              
              console.log(`[DatabaseStorage] Deleting empty chat ${chatId}`);
              // Delete the chat itself
              await tx
                .delete(chats)
                .where(eq(chats.id, chatId));
            }
          }
          
          console.log(`[DatabaseStorage] Finding playdates created by user ${id}`);
          // Delete playdates created by the user
          // First get all playdates created by the user
          const userPlaydates = await tx
            .select({ id: playdates.id })
            .from(playdates)
            .where(eq(playdates.creatorId, id));
          
          console.log(`[DatabaseStorage] Processing ${userPlaydates.length} playdates created by user ${id}`);
          // For each playdate, delete participants first
          for (const { id: playdateId } of userPlaydates) {
            console.log(`[DatabaseStorage] Deleting participants for playdate ${playdateId}`);
            await tx
              .delete(playdateParticipants)
              .where(eq(playdateParticipants.playdateId, playdateId));
          }
          
          console.log(`[DatabaseStorage] Deleting all playdates created by user ${id}`);
          // Then delete the playdates themselves
          await tx
            .delete(playdates)
            .where(eq(playdates.creatorId, id));
          
          console.log(`[DatabaseStorage] Finally deleting user ${id}`);
          // Finally, delete the user
          const result = await tx
            .delete(users)
            .where(eq(users.id, id))
            .returning({ id: users.id });
          
          const success = result.length > 0;
          console.log(`[DatabaseStorage] User ${id} deletion result: ${success}`);
          return success;
        } catch (txError) {
          console.error(`[DatabaseStorage] Transaction error while deleting user ${id}:`, txError);
          throw txError;
        }
      });
    } catch (error) {
      console.error(`[DatabaseStorage] Error deleting user ${id}:`, error);
      return false;
    }
  }

  async joinPlaydate(userId: number, playdateId: number): Promise<boolean> {
    try {
      // Check if the playdate exists
      const [playdate] = await db
        .select()
        .from(playdates)
        .where(eq(playdates.id, playdateId));
      
      if (!playdate) {
        throw new Error(`Playdate with id ${playdateId} does not exist`);
      }
      
      // Check if user is already a participant
      const [existing] = await db
        .select()
        .from(playdateParticipants)
        .where(
          and(
            eq(playdateParticipants.playdateId, playdateId),
            eq(playdateParticipants.userId, userId)
          )
        );
      
      if (existing) {
        // User is already a participant
        return true;
      }
      
      // Count current participants
      const result = await db
        .select({ 
          participantCount: count() 
        })
        .from(playdateParticipants)
        .where(eq(playdateParticipants.playdateId, playdateId));
      
      const participantCount = Number(result[0]?.participantCount || 0);
      
      // Check if playdate is full
      if (participantCount >= playdate.maxParticipants) {
        throw new Error(`Playdate is full (${playdate.maxParticipants} participants)`);
      }
      
      // Add user as participant
      await db
        .insert(playdateParticipants)
        .values({
          playdateId,
          userId
        });
      
      return true;
    } catch (error) {
      console.error("Error in joinPlaydate:", error);
      throw error;
    }
  }

  async leavePlaydate(userId: number, playdateId: number): Promise<boolean> {
    // Check if the playdate exists
    const [playdate] = await db
      .select()
      .from(playdates)
      .where(eq(playdates.id, playdateId));
    
    if (!playdate) {
      throw new Error(`Playdate with id ${playdateId} does not exist`);
    }
    
    // Check if user is a participant
    const [existing] = await db
      .select()
      .from(playdateParticipants)
      .where(
        and(
          eq(playdateParticipants.playdateId, playdateId),
          eq(playdateParticipants.userId, userId)
        )
      );
    
    if (!existing) {
      // User is not a participant
      return false;
    }
    
    // Remove user from participants
    const result = await db
      .delete(playdateParticipants)
      .where(
        and(
          eq(playdateParticipants.playdateId, playdateId),
          eq(playdateParticipants.userId, userId)
        )
      )
      .returning({ id: playdateParticipants.id });
    
    return result.length > 0;
  }

  // Community posts methods
  async getCommunityPosts(options?: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
    hashtag?: string;
    userId?: number;
  }): Promise<any[]> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    const conditions: SQL[] = [];
    if (options?.category) {
      conditions.push(eq(communityPosts.category, options.category));
    }
    if (options?.search) {
      conditions.push(
        or(
          like(communityPosts.title, `%${options.search}%`),
          like(communityPosts.content, `%${options.search}%`)
        )!
      );
    }
    if (options?.hashtag) {
      conditions.push(sql`${options.hashtag} = ANY(${communityPosts.hashtags})`);
    }
    if (options?.userId) {
      conditions.push(eq(communityPosts.userId, options.userId));
    }

    const posts = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        hashtags: communityPosts.hashtags,
        isEdited: communityPosts.isEdited,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        authorId: users.id,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorProfileImage: users.profileImage,
        authorUsername: users.username,
        commentCount: sql<number>`(
          SELECT COALESCE(COUNT(*), 0)::int
          FROM ${communityComments}
          WHERE ${communityComments.postId} = ${communityPosts.id}
        )`,
        reactionCount: sql<number>`(
          SELECT COALESCE(COUNT(*), 0)::int
          FROM ${communityReactions}
          WHERE ${communityReactions.postId} = ${communityPosts.id}
        )`,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return posts.map(post => ({
      id: post.id,
      userId: post.userId,
      title: post.title,
      content: post.content,
      category: post.category,
      hashtags: post.hashtags,
      isEdited: post.isEdited,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.authorId,
        firstName: post.authorFirstName,
        lastName: post.authorLastName,
        profileImage: post.authorProfileImage,
        username: post.authorUsername,
      },
      _count: {
        comments: Number(post.commentCount) || 0,
        reactions: Number(post.reactionCount) || 0,
      },
    }));
  }

  async getCommunityPostById(postId: number): Promise<any | undefined> {
    const [post] = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        title: communityPosts.title,
        content: communityPosts.content,
        category: communityPosts.category,
        hashtags: communityPosts.hashtags,
        isEdited: communityPosts.isEdited,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
          username: users.username,
        },
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, postId));

    return post || undefined;
  }

  async deleteCommunityPost(postId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(communityPosts)
        .where(eq(communityPosts.id, postId))
        .returning({ id: communityPosts.id });

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting community post:", error);
      return false;
    }
  }

  // Family Events methods
  async getEvents(options?: { latitude?: number; longitude?: number; category?: string; upcoming?: boolean }): Promise<FamilyEvent[]> {
    const now = new Date();
    
    // Build all conditions
    const conditions = [
      eq(familyEvents.isActive, true),
      isNull(familyEvents.archivedAt)
    ];
    
    // Filter by category if specified
    if (options?.category) {
      conditions.push(eq(familyEvents.category, options.category));
    }

    // Filter by upcoming events (events that haven't ended yet)
    if (options?.upcoming) {
      // Include events where:
      // - endDate exists and is >= now, OR
      // - endDate doesn't exist but startDate is >= now
      conditions.push(
        or(
          and(isNotNull(familyEvents.endDate), gte(familyEvents.endDate, now)),
          and(isNull(familyEvents.endDate), gte(familyEvents.startDate, now))
        )!
      );
    }

    const events = await db
      .select()
      .from(familyEvents)
      .where(and(...conditions))
      .orderBy(asc(familyEvents.startDate));

    // Calculate distance if coordinates provided
    if (options?.latitude && options?.longitude) {
      const eventsWithDistance = events.map(event => {
        // Only calculate distance if event has coordinates
        if (event.latitude && event.longitude) {
          const distance = this.calculateDistance(
            options.latitude!,
            options.longitude!,
            parseFloat(event.latitude),
            parseFloat(event.longitude)
          );
          return { ...event, distance };
        }
        // Return event without distance if coordinates are missing
        return { ...event, distance: undefined };
      });

      // Sort by distance (events without distance appear at the end)
      eventsWithDistance.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
      return eventsWithDistance;
    }

    return events;
  }

  async getEventById(id: number): Promise<FamilyEvent | undefined> {
    const [event] = await db
      .select()
      .from(familyEvents)
      .where(eq(familyEvents.id, id));

    return event || undefined;
  }

  async createEvent(event: InsertFamilyEvent): Promise<FamilyEvent> {
    const [newEvent] = await db
      .insert(familyEvents)
      .values(event)
      .returning();

    return newEvent;
  }

  async updateEvent(id: number, eventData: Partial<FamilyEvent>): Promise<FamilyEvent> {
    const [updatedEvent] = await db
      .update(familyEvents)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(familyEvents.id, id))
      .returning();

    if (!updatedEvent) {
      throw new Error("Event not found");
    }

    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(familyEvents)
        .where(eq(familyEvents.id, id))
        .returning({ id: familyEvents.id });

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  }

  // Helper method for distance calculation using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Optimized method to get users with incomplete profiles using SQL filtering
  async getUsersWithIncompleteProfiles(): Promise<{ id: number; firstName: string; username: string; email: string; missingFields: string[] }[]> {
    const result = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        username: users.username,
        email: users.email,
        profileImage: users.profileImage,
        bio: users.bio,
        city: users.city,
        childrenInfo: users.childrenInfo,
        availabilityCount: sql<number>`(SELECT COUNT(*) FROM ${userAvailability} WHERE ${userAvailability.userId} = ${users.id} AND ${userAvailability.isActive} = true)`.as('availability_count'),
      })
      .from(users)
      .where(
        or(
          isNull(users.profileImage),
          isNull(users.bio),
          sql`${users.bio} = ''`,
          isNull(users.city),
          sql`${users.city} = ''`,
          isNull(users.childrenInfo),
          sql`${users.childrenInfo} = '[]'::jsonb`,
          sql`(SELECT COUNT(*) FROM ${userAvailability} WHERE ${userAvailability.userId} = ${users.id} AND ${userAvailability.isActive} = true) = 0`
        )
      );

    return result.map(user => {
      const missingFields: string[] = [];
      if (!user.profileImage) missingFields.push('profileImage');
      if (!user.bio || user.bio.trim() === '') missingFields.push('bio');
      if (!user.city || user.city.trim() === '') missingFields.push('city');
      if (!user.childrenInfo || (Array.isArray(user.childrenInfo) && user.childrenInfo.length === 0)) {
        missingFields.push('childrenInfo');
      }
      if (!user.availabilityCount || user.availabilityCount === 0) {
        missingFields.push('dadDaysAvailability');
      }
      
      return {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        email: user.email,
        missingFields,
      };
    }).filter(user => user.missingFields.length > 0);
  }

  // Optimized method to get users in a specific city (for event notifications)
  async getUsersInCity(city: string): Promise<{ id: number; email: string; firstName: string }[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
      })
      .from(users)
      .where(sql`LOWER(${users.city}) LIKE LOWER(${'%' + city + '%'})`);

    return result;
  }

  async getTotalUnreadCount(userId: number): Promise<number> {
    const chatIds = await db
      .select({ chatId: chatParticipants.chatId })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId));

    if (chatIds.length === 0) return 0;

    const ids = chatIds.map(r => Number(r.chatId));
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [result] = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(
        and(
          inArray(chatMessages.chatId, ids),
          not(eq(chatMessages.senderId, userId)),
          eq(chatMessages.isRead, false),
          gte(chatMessages.sentAt, oneWeekAgo)
        )
      );

    return Number(result?.count ?? 0);
  }

  async markChatAsRead(chatId: number, userId: number): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          not(eq(chatMessages.senderId, userId)),
          eq(chatMessages.isRead, false)
        )
      );
  }

  // ── GDPR consent records ──────────────────────────────────────────────────
  async recordConsent(data: {
    userId: number;
    consentType: string;
    granted: boolean;
    policyVersion: string;
    ipHash: string | null;
  }): Promise<ConsentRecord> {
    const [record] = await db
      .insert(consentRecords)
      .values(data)
      .returning();
    return record;
  }

  async getLatestConsents(userId: number): Promise<ConsentRecord[]> {
    // Return the most recent row per consent type for this user
    const rows = await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.userId, userId))
      .orderBy(desc(consentRecords.consentedAt));

    // De-duplicate: keep only the first (latest) row per consentType
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (seen.has(r.consentType)) return false;
      seen.add(r.consentType);
      return true;
    });
  }

  async getAllConsents(userId: number): Promise<ConsentRecord[]> {
    // Full audit trail — every grant/revocation, oldest first
    return db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.userId, userId))
      .orderBy(asc(consentRecords.consentedAt));
  }

  // ── Email change verification ───────────────────────────────────────────
  async createEmailChangeRequest(userId: number, newEmail: string, token: string, expiresAt: Date): Promise<EmailChangeRequest> {
    const [row] = await db
      .insert(emailChangeRequests)
      .values({ userId, newEmail, token, expiresAt })
      .returning();
    return row;
  }

  async getEmailChangeRequestByToken(token: string): Promise<EmailChangeRequest | undefined> {
    const [row] = await db
      .select()
      .from(emailChangeRequests)
      .where(eq(emailChangeRequests.token, token));
    return row;
  }

  async markEmailChangeUsed(id: number): Promise<void> {
    await db
      .update(emailChangeRequests)
      .set({ used: true })
      .where(eq(emailChangeRequests.id, id));
  }
  // ─────────────────────────────────────────────────────────────────────────
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
