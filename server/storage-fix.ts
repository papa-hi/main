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
  Rating, InsertRating, ratings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, desc, sql, asc, count, gte, lte, max, isNull, not, inArray } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  getFeaturedUser(): Promise<User | undefined>;
  
  // Admin methods
  getAdminUsers(): Promise<User[]>;
  setUserRole(userId: number, role: string): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getUserStats(): Promise<{ total: number, newLastWeek: number, activeLastMonth: number }>;
  
  // Analytics methods
  logUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  logPageView(pageView: InsertPageView): Promise<PageView>;
  logFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage>;
  logAdminAction(log: InsertAdminLog): Promise<AdminLog>;
  getRecentUserActivity(limit?: number): Promise<UserActivity[]>;
  getTopPages(days?: number): Promise<{ path: string, count: number }[]>;
  getFeatureUsageStats(days?: number): Promise<{ feature: string, count: number }[]>;
  getAdminLogs(limit?: number): Promise<AdminLog[]>;
  
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
}

export class DatabaseStorage implements IStorage {
  // Admin methods
  async getAdminUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(user => ({
      ...user,
      childrenInfo: user.childrenInfo as { name: string; age: number }[] | undefined,
    })) as User[];
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
    } as User;
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.role, role));
      
    return result.map(user => ({
      ...user,
      childrenInfo: user.childrenInfo as { name: string; age: number }[] | undefined,
    })) as User[];
  }
  
  async getUserStats(): Promise<{ total: number, newLastWeek: number, activeLastMonth: number }> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [totalResult] = await db.select({ count: count() }).from(users);
    const [newLastWeekResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, oneWeekAgo));
    const [activeLastMonthResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        isNull(users.lastLogin) === false,
        gte(users.lastLogin, oneMonthAgo)
      ));
    
    return {
      total: totalResult.count,
      newLastWeek: newLastWeekResult.count,
      activeLastMonth: activeLastMonthResult.count
    };
  }

  // Analytics methods
  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [result] = await db
      .insert(userActivity)
      .values(activity)
      .returning();
    return result as UserActivity;
  }

  async logPageView(pageView: InsertPageView): Promise<PageView> {
    const [result] = await db
      .insert(pageViews)
      .values(pageView)
      .returning();
    return result as PageView;
  }

  async logFeatureUsage(usage: InsertFeatureUsage): Promise<FeatureUsage> {
    const [result] = await db
      .insert(featureUsage)
      .values(usage)
      .returning();
    return result as FeatureUsage;
  }

  async logAdminAction(log: InsertAdminLog): Promise<AdminLog> {
    const [result] = await db
      .insert(adminLogs)
      .values(log)
      .returning();
    return result as AdminLog;
  }

  async getRecentUserActivity(limit: number = 100): Promise<UserActivity[]> {
    const result = await db
      .select()
      .from(userActivity)
      .orderBy(desc(userActivity.timestamp))
      .limit(limit);
    return result as UserActivity[];
  }

  async getTopPages(days: number = 7): Promise<{ path: string, count: number }[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await db
      .select({
        path: pageViews.path,
        count: count()
      })
      .from(pageViews)
      .where(gte(pageViews.timestamp, cutoffDate))
      .groupBy(pageViews.path)
      .orderBy(desc(count()));
    
    return result.map(row => ({ path: row.path, count: Number(row.count) }));
  }

  async getFeatureUsageStats(days: number = 7): Promise<{ feature: string, count: number }[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await db
      .select({
        feature: featureUsage.feature,
        count: count()
      })
      .from(featureUsage)
      .where(gte(featureUsage.timestamp, cutoffDate))
      .groupBy(featureUsage.feature)
      .orderBy(desc(count()));
    
    return result.map(row => ({ feature: row.feature, count: Number(row.count) }));
  }

  async getAdminLogs(limit: number = 100): Promise<AdminLog[]> {
    const result = await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.timestamp))
      .limit(limit);
    return result as AdminLog[];
  }

  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
      
    if (!result) return undefined;
    
    return {
      ...result,
      childrenInfo: result.childrenInfo as { name: string; age: number }[] | undefined,
    } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
      
    if (!result) return undefined;
    
    return {
      ...result,
      childrenInfo: result.childrenInfo as { name: string; age: number }[] | undefined,
    } as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
      
    if (!result) return undefined;
    
    return {
      ...result,
      childrenInfo: result.childrenInfo as { name: string; age: number }[] | undefined,
    } as User;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(user => ({
      ...user,
      childrenInfo: user.childrenInfo as { name: string; age: number }[] | undefined,
    })) as User[];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        phoneNumber: insertUser.phoneNumber || null,
        profileImage: insertUser.profileImage || null,
        bio: insertUser.bio || null,
        city: insertUser.city || null,
        badge: null,
        favoriteLocations: []
      })
      .returning();
      
    return {
      ...user,
      childrenInfo: user.childrenInfo as { name: string; age: number }[] | undefined,
    } as User;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
      
    return {
      ...updatedUser,
      childrenInfo: updatedUser.childrenInfo as { name: string; age: number }[] | undefined,
    } as User;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  async getFeaturedUser(): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.role, 'user'))
      .limit(1);
      
    if (!result) return undefined;
    
    return {
      ...result,
      childrenInfo: result.childrenInfo as { name: string; age: number }[] | undefined,
    } as User;
  }

  async getUpcomingPlaydates(): Promise<Playdate[]> {
    const result = await db
      .select()
      .from(playdates)
      .where(gte(playdates.startTime, new Date()))
      .orderBy(asc(playdates.startTime));
    return result as Playdate[];
  }

  async getPastPlaydates(): Promise<Playdate[]> {
    const result = await db
      .select()
      .from(playdates)
      .where(lt(playdates.endTime, new Date()))
      .orderBy(desc(playdates.startTime));
    return result as Playdate[];
  }

  async getUserPlaydates(userId: number): Promise<Playdate[]> {
    const result = await db
      .select()
      .from(playdates)
      .where(eq(playdates.creatorId, userId))
      .orderBy(desc(playdates.startTime));
    return result as Playdate[];
  }

  async getPlaydateById(id: number): Promise<Playdate | undefined> {
    const [result] = await db
      .select()
      .from(playdates)
      .where(eq(playdates.id, id));
    return result as Playdate | undefined;
  }

  async updatePlaydate(id: number, playdateData: Partial<Playdate>): Promise<Playdate> {
    const [updatedPlaydate] = await db
      .update(playdates)
      .set(playdateData)
      .where(eq(playdates.id, id))
      .returning();
    return updatedPlaydate as Playdate;
  }

  async createPlaydate(playdateData: any): Promise<Playdate> {
    const [playdate] = await db
      .insert(playdates)
      .values(playdateData)
      .returning();
    return playdate as Playdate;
  }

  async deletePlaydate(id: number): Promise<boolean> {
    const result = await db
      .delete(playdates)
      .where(eq(playdates.id, id));
    return (result as any).rowCount > 0;
  }

  async getPlaces(options: { 
    latitude?: number, 
    longitude?: number, 
    type?: string 
  }): Promise<Place[]> {
    let query = db.select().from(places);
    
    if (options.type) {
      query = query.where(eq(places.type, options.type)) as any;
    }
    
    const result = await query;
    return result as Place[];
  }

  async getPlaceById(id: number): Promise<Place | undefined> {
    const [result] = await db
      .select()
      .from(places)
      .where(eq(places.id, id));
    return result as Place | undefined;
  }

  async getNearbyPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]> {
    return this.getPlaces(options);
  }

  async getUserFavoritePlaces(userId: number): Promise<Place[]> {
    const result = await db
      .select({
        id: places.id,
        name: places.name,
        type: places.type,
        description: places.description,
        latitude: places.latitude,
        longitude: places.longitude,
        address: places.address,
        imageUrl: places.imageUrl,
        rating: places.rating,
        createdAt: places.createdAt
      })
      .from(userFavorites)
      .innerJoin(places, eq(userFavorites.placeId, places.id))
      .where(eq(userFavorites.userId, userId));
    
    return result as Place[];
  }

  async addFavoritePlace(userId: number, placeId: number): Promise<any> {
    const [result] = await db
      .insert(userFavorites)
      .values({ userId, placeId })
      .returning();
    return result;
  }

  async removeFavoritePlace(userId: number, placeId: number): Promise<boolean> {
    const result = await db
      .delete(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.placeId, placeId)
      ));
    return (result as any).rowCount > 0;
  }

  async createPlace(placeData: any): Promise<Place> {
    const [place] = await db
      .insert(places)
      .values(placeData)
      .returning();
    return place as Place;
  }

  async updatePlace(id: number, placeData: Partial<Place>): Promise<Place> {
    const [updatedPlace] = await db
      .update(places)
      .set(placeData)
      .where(eq(places.id, id))
      .returning();
    return updatedPlace as Place;
  }

  async deletePlace(id: number): Promise<boolean> {
    const result = await db
      .delete(places)
      .where(eq(places.id, id));
    return (result as any).rowCount > 0;
  }

  async ratePlace(placeId: number, userId: number, rating: number): Promise<void> {
    await db
      .insert(ratings)
      .values({ placeId, userId, rating })
      .onConflictDoUpdate({
        target: [ratings.placeId, ratings.userId],
        set: { rating, updatedAt: new Date() }
      });

    await this.updatePlaceRatingFromRatings(placeId);
  }

  async getPlaceRating(placeId: number): Promise<{ averageRating: number; totalRatings: number }> {
    const [result] = await db
      .select({
        averageRating: sql<number>`AVG(${ratings.rating})`,
        totalRatings: sql<string>`COUNT(*)`
      })
      .from(ratings)
      .where(eq(ratings.placeId, placeId));

    return {
      averageRating: result?.averageRating || 0,
      totalRatings: parseInt(result?.totalRatings || "0")
    };
  }

  async getUserRating(placeId: number, userId: number): Promise<number | null> {
    const [result] = await db
      .select({ rating: ratings.rating })
      .from(ratings)
      .where(and(
        eq(ratings.placeId, placeId),
        eq(ratings.userId, userId)
      ));

    return result?.rating || null;
  }

  private async updatePlaceRatingFromRatings(placeId: number): Promise<void> {
    const ratingData = await this.getPlaceRating(placeId);
    await db
      .update(places)
      .set({ rating: ratingData.averageRating })
      .where(eq(places.id, placeId));
  }

  async getChats(userId: number): Promise<Chat[]> {
    const result = await db
      .select()
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .where(eq(chatParticipants.userId, userId));
    
    return result.map(r => r.chats) as Chat[];
  }

  async getChatById(chatId: number): Promise<Chat | undefined> {
    const [result] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));
    return result as Chat | undefined;
  }

  async createChat(participants: number[]): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values({})
      .returning();

    for (const userId of participants) {
      await db
        .insert(chatParticipants)
        .values({ chatId: chat.id, userId });
    }

    return chat as Chat;
  }

  async getChatMessages(chatId: number, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const result = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
    
    return result as ChatMessage[];
  }

  async sendMessage(chatId: number, senderId: number, content: string): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({ chatId, senderId, content })
      .returning();
    
    return message as ChatMessage;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return (result as any).rowCount > 0;
  }

  async joinPlaydate(userId: number, playdateId: number): Promise<boolean> {
    const [result] = await db
      .insert(playdateParticipants)
      .values({ userId, playdateId })
      .returning();
    return !!result;
  }

  async leavePlaydate(userId: number, playdateId: number): Promise<boolean> {
    const result = await db
      .delete(playdateParticipants)
      .where(and(
        eq(playdateParticipants.userId, userId),
        eq(playdateParticipants.playdateId, playdateId)
      ));
    return (result as any).rowCount > 0;
  }
}

export const storage = new DatabaseStorage();