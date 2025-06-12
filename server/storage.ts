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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private playdates: Map<number, Playdate>;
  private places: Map<number, Place>;
  private favorites: Map<string, boolean>; // userId-placeId composite key
  private chats: Map<number, any>; // Using any for now to avoid type errors
  private messages: Map<number, any[]>; // Using any for now to avoid type errors
  private chatParticipants: Map<number, number[]>; // chatId -> [userId1, userId2, ...]
  
  private userIdCounter: number;
  private playdateIdCounter: number;
  private placeIdCounter: number;
  private chatIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.playdates = new Map();
    this.places = new Map();
    this.favorites = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.chatParticipants = new Map();
    this.userIdCounter = 1;
    this.playdateIdCounter = 1;
    this.placeIdCounter = 1;
    this.chatIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample users
    const user1: User = {
      id: this.userIdCounter++,
      username: "thomas",
      password: "hashed_password", // In real app, this would be properly hashed
      firstName: "Thomas",
      lastName: "de Vries",
      email: "thomas@example.com",
      phoneNumber: "+31612345678",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      bio: "Vader van Noah (6) en Eva (4). Ik werk als ontwerper en ben in mijn vrije tijd graag buiten met de kinderen. We houden van fietsen, zwemmen en natuur ontdekken. Altijd op zoek naar nieuwe speeltuinen en kinderboerderijen!",
      city: "Amsterdam",
      createdAt: new Date(),
      favoriteLocations: ["Artis Zoo", "NEMO Science Museum", "Vondelpark", "Boerderij Meerzicht"]
    };
    
    const user2: User = {
      id: this.userIdCounter++,
      username: "martijn",
      password: "hashed_password",
      firstName: "Martijn",
      lastName: "van der Berg",
      email: "martijn@example.com",
      phoneNumber: "+31623456789",
      profileImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      bio: "Vader van Noah (6) en Eva (4). Ik werk als ontwerper en ben in mijn vrije tijd graag buiten met de kinderen. We houden van fietsen, zwemmen en natuur ontdekken. Altijd op zoek naar nieuwe speeltuinen en kinderboerderijen!",
      city: "Amsterdam",
      createdAt: new Date(),
      favoriteLocations: ["Artis Zoo", "NEMO Science Museum", "Vondelpark", "Boerderij Meerzicht"]
    };
    
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    
    // Sample playdates
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 14);
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    
    const playdate1: Playdate = {
      id: this.playdateIdCounter++,
      title: "Speelmiddag met Noah & Liam",
      description: "Een gezellige middag in het park met onze kinderen. Neem wat snacks mee!",
      location: "Speeltuin Amstelpark",
      startTime: new Date(nextWeek.setHours(14, 0)),
      endTime: new Date(nextWeek.setHours(17, 0)),
      creatorId: 1,
      maxParticipants: 5,
      createdAt: new Date(),
      participants: [
        { id: 1, firstName: "Thomas", lastName: "de Vries", profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 2, firstName: "Martijn", lastName: "van der Berg", profileImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 3, firstName: "Erik", lastName: "Bakker", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 4, firstName: "Pieter", lastName: "Jansen", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" }
      ]
    };
    
    const playdate2: Playdate = {
      id: this.playdateIdCounter++,
      title: "Vaderdag Picknick",
      description: "Picknick ter gelegenheid van vaderdag. Iedereen neemt wat te eten mee.",
      location: "Vondelpark, Amsterdam",
      startTime: new Date(nextMonth.setHours(12, 0)),
      endTime: new Date(nextMonth.setHours(15, 0)),
      creatorId: 2,
      maxParticipants: 10,
      createdAt: new Date(),
      participants: [
        { id: 1, firstName: "Thomas", lastName: "de Vries", profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 2, firstName: "Martijn", lastName: "van der Berg", profileImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 3, firstName: "Erik", lastName: "Bakker", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 5, firstName: "Joost", lastName: "Visser", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 6, firstName: "Willem", lastName: "Smit", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 7, firstName: "Jan", lastName: "van Dijk", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 8, firstName: "Kees", lastName: "Meijer", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" }
      ]
    };
    
    const playdate3: Playdate = {
      id: this.playdateIdCounter++,
      title: "Zwemmen in buitenzwembad",
      description: "Lekker zwemmen met de kinderen in het buitenzwembad.",
      location: "Sloterparkbad, Amsterdam",
      startTime: new Date(pastDate.setHours(10, 0)),
      endTime: new Date(pastDate.setHours(12, 0)),
      creatorId: 1,
      maxParticipants: 6,
      createdAt: new Date(pastDate.setDate(pastDate.getDate() - 7)),
      participants: [
        { id: 1, firstName: "Thomas", lastName: "de Vries", profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 3, firstName: "Erik", lastName: "Bakker", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" },
        { id: 5, firstName: "Joost", lastName: "Visser", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=36&h=36&q=80" }
      ]
    };
    
    this.playdates.set(playdate1.id, playdate1);
    this.playdates.set(playdate2.id, playdate2);
    this.playdates.set(playdate3.id, playdate3);
    
    // Sample places
    const place1: Place = {
      id: this.placeIdCounter++,
      name: "Pancake Paradise",
      type: "restaurant",
      description: "Kindvriendelijk pannenkoekenrestaurant met speelhoek en geweldige pannenkoeken.",
      address: "Prinsengracht 85, Amsterdam",
      latitude: "52.3673",
      longitude: "4.8828",
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80",
      rating: 48,
      reviewCount: 126,
      features: ["Kinderstoel", "Speelhoek"],
      createdAt: new Date(),
      distance: 1200,
      isSaved: true
    };
    
    const place2: Place = {
      id: this.placeIdCounter++,
      name: "Kindercafé Vrolijk",
      type: "restaurant",
      description: "Gezellig kindercafé met heerlijke koffie voor ouders en lekkere snacks voor kinderen.",
      address: "Overtoom 142, Amsterdam",
      latitude: "52.3621",
      longitude: "4.8778",
      imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80",
      rating: 45,
      reviewCount: 87,
      features: ["Kinderstoel", "Verschoontafel"],
      createdAt: new Date(),
      distance: 1800,
      isSaved: false
    };
    
    const place3: Place = {
      id: this.placeIdCounter++,
      name: "Speeltuin Amstelpark",
      type: "playground",
      description: "Grote speeltuin met diverse speeltoestellen voor verschillende leeftijden.",
      address: "Amstelpark 8, Amsterdam",
      latitude: "52.3343",
      longitude: "4.8924",
      imageUrl: "https://images.unsplash.com/photo-1680099567302-d1e26339a2ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80",
      rating: 49,
      reviewCount: 214,
      features: ["Toiletten", "Kiosk"],
      createdAt: new Date(),
      distance: 500,
      isSaved: true
    };
    
    const place4: Place = {
      id: this.placeIdCounter++,
      name: "Vondelpark Speeltuin",
      type: "playground",
      description: "Speeltuin in het populaire Vondelpark met diverse klim- en speeltoestellen.",
      address: "Vondelpark 3, Amsterdam",
      latitude: "52.3580",
      longitude: "4.8686",
      imageUrl: "https://images.unsplash.com/photo-1547861749-0df4321e275e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80",
      rating: 47,
      reviewCount: 156,
      features: ["Toiletten", "Water speel"],
      createdAt: new Date(),
      distance: 2100,
      isSaved: false
    };
    
    const place5: Place = {
      id: this.placeIdCounter++,
      name: "Restaurant De Kindervriend",
      type: "restaurant",
      description: "Familierestaurant met uitgebreid kindermenu en indoor speelruimte.",
      address: "Javastraat 23, Amsterdam",
      latitude: "52.3645",
      longitude: "4.9443",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80",
      rating: 46,
      reviewCount: 103,
      features: ["Kindermenu", "Speelruimte", "Kinderstoel"],
      createdAt: new Date(),
      distance: 2500,
      isSaved: false
    };
    
    const place6: Place = {
      id: this.placeIdCounter++,
      name: "NEMO-dak Speeltuin",
      type: "playground",
      description: "Unieke speeltuin op het dak van het NEMO Science Museum met waterpartijen.",
      address: "Oosterdok, Amsterdam",
      latitude: "52.3738",
      longitude: "4.9123",
      imageUrl: "https://images.unsplash.com/photo-1632944968416-50a875746d0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=160&q=80",
      rating: 48,
      reviewCount: 167,
      features: ["Uitzicht", "Water speel", "Picknickplekken"],
      createdAt: new Date(),
      distance: 3200,
      isSaved: true
    };
    
    this.places.set(place1.id, place1);
    this.places.set(place2.id, place2);
    this.places.set(place3.id, place3);
    this.places.set(place4.id, place4);
    this.places.set(place5.id, place5);
    this.places.set(place6.id, place6);
    
    // Set up some favorite places for user1
    this.favorites.set(`1-${place1.id}`, true);
    this.favorites.set(`1-${place3.id}`, true);
    this.favorites.set(`1-${place6.id}`, true);
    
    // Sample chats
    const chatId1 = this.chatIdCounter++;
    const chat1 = {
      id: chatId1,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date(Date.now() - 3600000)   // 1 hour ago
    };
    
    // Chat between user1 and user2
    this.chats.set(chatId1, chat1);
    this.chatParticipants.set(chatId1, [1, 2]);
    
    // Sample messages for chat1
    const messages1 = [
      {
        id: this.messageIdCounter++,
        chatId: chatId1,
        senderId: 1,
        content: "Hoi Martijn! Hoe gaat het met jullie?",
        sentAt: new Date(Date.now() - 86400000 + 3600000), // 1 day ago + 1 hour
        isRead: true
      },
      {
        id: this.messageIdCounter++,
        chatId: chatId1,
        senderId: 2,
        content: "Hey Thomas! Alles goed hier, we hebben net een fijne dag in het park gehad. En met jullie?",
        sentAt: new Date(Date.now() - 86400000 + 7200000), // 1 day ago + 2 hours
        isRead: true
      },
      {
        id: this.messageIdCounter++,
        chatId: chatId1,
        senderId: 1,
        content: "Ook goed! Ik vroeg me af of jullie zin hebben om dit weekend naar Artis te gaan?",
        sentAt: new Date(Date.now() - 43200000), // 12 hours ago
        isRead: true
      },
      {
        id: this.messageIdCounter++,
        chatId: chatId1,
        senderId: 2,
        content: "Dat klinkt leuk! Laten we zaterdagochtend gaan, dan is het meestal rustiger.",
        sentAt: new Date(Date.now() - 3600000), // 1 hour ago
        isRead: false
      }
    ];
    
    this.messages.set(chatId1, messages1);
  }

  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }
  
  async getFeaturedUser(): Promise<User | undefined> {
    // For demo purposes, just return the second user as featured
    return this.users.get(2);
  }

  // Playdate methods
  async getUpcomingPlaydates(): Promise<Playdate[]> {
    const now = new Date();
    return Array.from(this.playdates.values())
      .filter(playdate => new Date(playdate.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
  
  async getPastPlaydates(): Promise<Playdate[]> {
    const now = new Date();
    return Array.from(this.playdates.values())
      .filter(playdate => new Date(playdate.startTime) < now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
  
  async getUserPlaydates(userId: number): Promise<Playdate[]> {
    return Array.from(this.playdates.values())
      .filter(playdate => playdate.creatorId === userId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
  
  async createPlaydate(playdateData: any): Promise<Playdate> {
    const id = this.playdateIdCounter++;
    
    // Create a dummy participant list with just the creator
    const creator = this.users.get(playdateData.creatorId);
    const participants = [];
    
    if (creator) {
      participants.push({
        id: creator.id,
        firstName: creator.firstName,
        lastName: creator.lastName,
        profileImage: creator.profileImage || ""
      });
    }
    
    const playdate: Playdate = {
      ...playdateData,
      id,
      createdAt: new Date(),
      participants
    };
    
    this.playdates.set(id, playdate);
    return playdate;
  }
  
  async getPlaydateById(id: number): Promise<Playdate | undefined> {
    return this.playdates.get(id);
  }
  
  async updatePlaydate(id: number, playdateData: Partial<Playdate>): Promise<Playdate> {
    const playdate = this.playdates.get(id);
    if (!playdate) {
      throw new Error("Playdate not found");
    }
    
    // Create an updated playdate with the new data
    const updatedPlaydate: Playdate = {
      ...playdate,
      ...playdateData,
      // Don't override the participants array with an empty one
      participants: playdateData.participants || playdate.participants
    };
    
    this.playdates.set(id, updatedPlaydate);
    return updatedPlaydate;
  }
  
  async deletePlaydate(id: number): Promise<boolean> {
    return this.playdates.delete(id);
  }

  // Places methods
  async getPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]> {
    let places = Array.from(this.places.values());
    
    // Filter by type if specified
    if (options.type) {
      if (options.type === "restaurants") {
        places = places.filter(place => place.type === "restaurant");
      } else if (options.type === "playgrounds") {
        places = places.filter(place => place.type === "playground");
      }
    }
    
    // Sort by distance if coordinates provided
    if (options.latitude && options.longitude) {
      places.sort((a, b) => a.distance - b.distance);
    } else {
      places.sort((a, b) => b.rating - a.rating);
    }
    
    return places;
  }
  
  async getNearbyPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]> {
    let places = Array.from(this.places.values());
    
    // Filter by type if specified
    if (options.type && options.type !== "all") {
      places = places.filter(place => place.type === options.type);
    }
    
    // Sort by distance
    places.sort((a, b) => a.distance - b.distance);
    
    // Limit to 4 nearest places
    return places.slice(0, 4);
  }
  
  async getUserFavoritePlaces(userId: number): Promise<Place[]> {
    return Array.from(this.places.values()).filter(place => {
      const key = `${userId}-${place.id}`;
      return this.favorites.has(key);
    });
  }
  
  async addFavoritePlace(userId: number, placeId: number): Promise<any> {
    const place = this.places.get(placeId);
    if (!place) {
      throw new Error("Place not found");
    }
    
    const key = `${userId}-${placeId}`;
    this.favorites.set(key, true);
    
    return { userId, placeId };
  }
  
  async removeFavoritePlace(userId: number, placeId: number): Promise<boolean> {
    const key = `${userId}-${placeId}`;
    return this.favorites.delete(key);
  }
  
  async createPlace(placeData: any): Promise<Place> {
    const id = this.placeIdCounter++;
    
    // Create a new place with the provided data
    const place: Place = {
      ...placeData,
      id,
      rating: placeData.rating || 45,  // Default rating if not provided
      reviewCount: placeData.reviewCount || 0,  // Default review count
      createdAt: new Date(),
      distance: 0,  // This will be calculated when queried with coordinates
      isSaved: false
    };
    
    this.places.set(id, place);
    return place;
  }
  
  async updatePlace(id: number, placeData: Partial<Place>): Promise<Place> {
    const place = this.places.get(id);
    
    if (!place) {
      throw new Error(`Place with id ${id} not found`);
    }
    
    // Update only the provided fields
    const updatedPlace: Place = {
      ...place,
      ...placeData,
      // Don't update these fields
      id: place.id,
      createdAt: place.createdAt,
      // These fields might come from the request but should be preserved
      distance: place.distance,
      isSaved: place.isSaved
    };
    
    // Update in storage
    this.places.set(id, updatedPlace);
    
    return updatedPlace;
  }

  async deletePlace(id: number): Promise<boolean> {
    // Remove any favorites for this place
    for (const [key] of this.favorites) {
      if (key.endsWith(`-${id}`)) {
        this.favorites.delete(key);
      }
    }
    
    // Delete the place
    return this.places.delete(id);
  }
  
  // Chat methods
  async getChats(userId: number): Promise<any[]> {
    const userChats: any[] = [];
    
    // For each chat, check if the user is a participant
    for (const [chatId, chat] of this.chats.entries()) {
      const participants = this.chatParticipants.get(chatId) || [];
      
      if (participants.includes(userId)) {
        // Get the other participants' details
        const participantsDetails = participants.map(participantId => {
          const user = this.users.get(participantId);
          if (user) {
            return {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImage: user.profileImage
            };
          }
          return null;
        }).filter(Boolean);
        
        // Get the last message for this chat
        const chatMessages = this.messages.get(chatId) || [];
        const lastMessage = chatMessages.length > 0 
          ? chatMessages[chatMessages.length - 1] 
          : undefined;
        
        // Calculate unread count for this user
        const unreadCount = chatMessages.filter(msg => 
          !msg.isRead && msg.senderId !== userId
        ).length;
        
        // Get sender name for the last message if it exists
        let lastMessageWithSender;
        if (lastMessage) {
          const sender = this.users.get(lastMessage.senderId);
          lastMessageWithSender = {
            ...lastMessage,
            senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown'
          };
        }
        
        userChats.push({
          ...chat,
          participants: participantsDetails,
          lastMessage: lastMessageWithSender,
          unreadCount
        });
      }
    }
    
    // Sort chats by last message time (newest first)
    return userChats.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return timeB - timeA;
    });
  }
  
  async getChatById(chatId: number): Promise<any | undefined> {
    const chat = this.chats.get(chatId);
    if (!chat) return undefined;
    
    const participants = this.chatParticipants.get(chatId) || [];
    const participantsDetails = participants.map(participantId => {
      const user = this.users.get(participantId);
      if (user) {
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage
        };
      }
      return null;
    }).filter(Boolean);
    
    return {
      ...chat,
      participants: participantsDetails
    };
  }
  
  async createChat(participants: number[]): Promise<any> {
    // Verify all participants exist
    const invalidParticipants = participants.filter(id => !this.users.has(id));
    if (invalidParticipants.length > 0) {
      throw new Error(`Users with ids ${invalidParticipants.join(', ')} do not exist`);
    }
    
    const chatId = this.chatIdCounter++;
    const now = new Date();
    
    // Create chat
    const chat = {
      id: chatId,
      createdAt: now,
      updatedAt: now
    };
    
    this.chats.set(chatId, chat);
    this.chatParticipants.set(chatId, [...participants]);
    this.messages.set(chatId, []);
    
    // Return chat with participants
    const participantsDetails = participants.map(participantId => {
      const user = this.users.get(participantId);
      return {
        id: user!.id,
        firstName: user!.firstName,
        lastName: user!.lastName,
        profileImage: user!.profileImage
      };
    });
    
    return {
      ...chat,
      participants: participantsDetails,
      unreadCount: 0
    };
  }
  
  async getChatMessages(chatId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error(`Chat with id ${chatId} does not exist`);
    }
    
    const messages = this.messages.get(chatId) || [];
    
    // Sort messages by time (oldest first)
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );
    
    // Apply pagination
    const paginatedMessages = sortedMessages.slice(offset, offset + limit);
    
    // Add sender information to each message
    return paginatedMessages.map(message => {
      const sender = this.users.get(message.senderId);
      return {
        ...message,
        sender: sender ? {
          id: sender.id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          profileImage: sender.profileImage
        } : null
      };
    });
  }
  
  async sendMessage(chatId: number, senderId: number, content: string): Promise<any> {
    const chat = this.chats.get(chatId);
    if (!chat) {
      throw new Error(`Chat with id ${chatId} does not exist`);
    }
    
    const user = this.users.get(senderId);
    if (!user) {
      throw new Error(`User with id ${senderId} does not exist`);
    }
    
    const participants = this.chatParticipants.get(chatId) || [];
    if (!participants.includes(senderId)) {
      throw new Error(`User with id ${senderId} is not a participant in chat ${chatId}`);
    }
    
    const messageId = this.messageIdCounter++;
    const now = new Date();
    
    const message = {
      id: messageId,
      chatId,
      senderId,
      content,
      sentAt: now,
      isRead: false
    };
    
    // Add message to chat's messages
    const chatMessages = this.messages.get(chatId) || [];
    chatMessages.push(message);
    this.messages.set(chatId, chatMessages);
    
    // Update chat's updatedAt time
    this.chats.set(chatId, {
      ...chat,
      updatedAt: now
    });
    
    // Return with sender info
    return {
      ...message,
      sender: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage
      }
    };
  }
  
  async deleteUser(id: number): Promise<boolean> {
    console.log(`[MemStorage] Starting deletion of user with ID ${id}`);
    
    try {
      // First remove the user from all playdates they're participating in
      for (const [playdateId, playdate] of this.playdates.entries()) {
        const updatedParticipants = playdate.participants.filter(p => p.id !== id);
        
        if (updatedParticipants.length !== playdate.participants.length) {
          // User was a participant, update the playdate
          this.playdates.set(playdateId, {
            ...playdate,
            participants: updatedParticipants
          });
        }
      }
      
      // Delete playdates created by the user
      const playdatesToDelete: number[] = [];
      for (const [playdateId, playdate] of this.playdates.entries()) {
        if (playdate.participants[0]?.id === id) {
          // User is the creator (first participant), mark for deletion
          playdatesToDelete.push(playdateId);
        }
      }
      
      // Delete the marked playdates
      for (const playdateId of playdatesToDelete) {
        this.playdates.delete(playdateId);
      }
      
      // Remove user's favorite places
      // Format of key is "${userId}-${placeId}"
      for (const key of this.favorites.keys()) {
        if (key.startsWith(`${id}-`)) {
          this.favorites.delete(key);
        }
      }
      
      // Handle chats and messages
      // Find all chats the user participates in
      const userChats: number[] = [];
      for (const [chatId, participants] of this.chatParticipants.entries()) {
        if (participants.includes(id)) {
          userChats.push(chatId);
        }
      }
      
      // For each chat, remove messages sent by the user and update participants
      for (const chatId of userChats) {
        // Update messages
        const chatMessages = this.messages.get(chatId) || [];
        const updatedMessages = chatMessages.filter(msg => msg.senderId !== id);
        this.messages.set(chatId, updatedMessages);
        
        // Update participants
        const participants = this.chatParticipants.get(chatId) || [];
        const updatedParticipants = participants.filter(userId => userId !== id);
        
        if (updatedParticipants.length === 0) {
          // No participants left, delete the chat entirely
          this.chatParticipants.delete(chatId);
          this.messages.delete(chatId);
          this.chats.delete(chatId);
        } else {
          // Update with remaining participants
          this.chatParticipants.set(chatId, updatedParticipants);
        }
      }
      
      // Finally delete the user
      const result = this.users.delete(id);
      console.log(`[MemStorage] User deletion result: ${result}`);
      return result;
    } catch (error) {
      console.error(`[MemStorage] Error deleting user:`, error);
      return false;
    }
  }
  
  async joinPlaydate(userId: number, playdateId: number): Promise<boolean> {
    const playdate = this.playdates.get(playdateId);
    if (!playdate) {
      throw new Error(`Playdate with id ${playdateId} does not exist`);
    }
    
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with id ${userId} does not exist`);
    }
    
    // Check if user is already a participant
    const isParticipant = playdate.participants.some(p => p.id === userId);
    if (isParticipant) {
      return true; // User is already a participant
    }
    
    // Check if playdate is at max capacity
    if (playdate.participants.length >= playdate.maxParticipants) {
      throw new Error(`Playdate with id ${playdateId} is at max capacity`);
    }
    
    // Add user to participants
    playdate.participants.push({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage || ""
    });
    
    this.playdates.set(playdateId, playdate);
    return true;
  }
  
  async leavePlaydate(userId: number, playdateId: number): Promise<boolean> {
    const playdate = this.playdates.get(playdateId);
    if (!playdate) {
      throw new Error(`Playdate with id ${playdateId} does not exist`);
    }
    
    // Remove user from participants
    const updatedParticipants = playdate.participants.filter(p => p.id !== userId);
    
    // If user is not a participant, return false
    if (updatedParticipants.length === playdate.participants.length) {
      return false;
    }
    
    // Update playdate
    this.playdates.set(playdateId, {
      ...playdate,
      participants: updatedParticipants
    });
    
    return true;
  }
}

export class DatabaseStorage implements IStorage {
  // Admin methods
  async getAdminUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result.map(user => ({
      ...user,
      childrenInfo: user.childrenInfo as { name: string; age: number }[] | undefined,
    }));
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
  
  async getUserStats(): Promise<{ total: number, newLastWeek: number, activeLastMonth: number }> {
    // Get total users
    const [{ count: total }] = await db
      .select({ count: count() })
      .from(users);
      
    // Get users created in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [{ count: newLastWeek }] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, oneWeekAgo));
      
    // Get users who logged in in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const [{ count: activeLastMonth }] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastLogin, oneMonthAgo));
      
    return {
      total: Number(total) || 0,
      newLastWeek: Number(newLastWeek) || 0,
      activeLastMonth: Number(activeLastMonth) || 0
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
  
  async getRecentUserActivity(limit: number = 100): Promise<UserActivity[]> {
    const result = await db
      .select()
      .from(userActivity)
      .orderBy(desc(userActivity.timestamp))
      .limit(limit);
      
    return result;
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
  
  async getAdminLogs(limit: number = 100): Promise<AdminLog[]> {
    const result = await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.timestamp))
      .limit(limit);
      
    return result;
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
    let query = db.select().from(users);
    
    if (filters) {
      if (filters.searchQuery) {
        const searchTerm = `%${filters.searchQuery}%`;
        query = query.where(
          sql`(${users.firstName} ILIKE ${searchTerm} OR 
               ${users.lastName} ILIKE ${searchTerm} OR 
               ${users.username} ILIKE ${searchTerm} OR
               ${users.bio} ILIKE ${searchTerm})`
        );
      }
      
      if (filters.city) {
        query = query.where(eq(users.city, filters.city));
      }
      
      // For child age filtering, we'd need to parse the JSON array in childrenInfo
      // This is a simplified version that works if childrenInfo is stored properly
      if (filters.childAgeRange && filters.childAgeRange.length === 2) {
        const [minAge, maxAge] = filters.childAgeRange;
        // This would need a more complex query with JSONB operations
        // For simplicity, we'll return all users and filter in memory
        // In a real implementation, this would be a database query
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.offset(filters.offset);
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
  
  async getFeaturedUser(): Promise<User | undefined> {
    // For demo purposes, just return a random user as featured
    const [user] = await db
      .select()
      .from(users)
      .limit(1);
    return user || undefined;
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
    
    let query = db
      .select()
      .from(playdates)
      .where(gt(playdates.startTime, now));
    
    if (filters) {
      if (filters.searchQuery) {
        const searchTerm = `%${filters.searchQuery}%`;
        query = query.where(
          sql`(${playdates.title} ILIKE ${searchTerm} OR 
               ${playdates.description} ILIKE ${searchTerm} OR 
               ${playdates.location} ILIKE ${searchTerm})`
        );
      }
      
      if (filters.startDateMin) {
        query = query.where(gte(playdates.startTime, filters.startDateMin));
      }
      
      if (filters.startDateMax) {
        query = query.where(lte(playdates.startTime, filters.startDateMax));
      }
      
      if (filters.location) {
        const locationTerm = `%${filters.location}%`;
        query = query.where(sql`${playdates.location} ILIKE ${locationTerm}`);
      }
      
      if (filters.maxParticipants) {
        query = query.where(lte(playdates.maxParticipants, filters.maxParticipants));
      }
      
      if (filters.creatorId) {
        query = query.where(eq(playdates.creatorId, filters.creatorId));
      }
      
      // The hasAvailableSpots filter needs a subquery count of participants
      // We'll do this filtering in memory for simplicity
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.offset(filters.offset);
      }
    }
    
    query = query.orderBy(asc(playdates.startTime));
    
    const playdatesData = await query;
    
    // Load participants for each playdate
    const result: Playdate[] = [];
    
    for (const playdate of playdatesData) {
      const participants = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage
        })
        .from(playdateParticipants)
        .innerJoin(users, eq(playdateParticipants.userId, users.id))
        .where(eq(playdateParticipants.playdateId, playdate.id));
      
      // Filter by available spots if requested
      if (filters?.hasAvailableSpots && participants.length >= playdate.maxParticipants) {
        continue; // Skip this playdate as it's full
      }
      
      result.push({
        ...playdate,
        participants
      });
    }
    
    return result;
  }
  
  async getPastPlaydates(): Promise<Playdate[]> {
    const now = new Date();
    
    const playdatesData = await db
      .select()
      .from(playdates)
      .where(lt(playdates.startTime, now))
      .orderBy(desc(playdates.startTime));
    
    // Load participants for each playdate
    const result: Playdate[] = [];
    
    for (const playdate of playdatesData) {
      const participants = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage
        })
        .from(playdateParticipants)
        .innerJoin(users, eq(playdateParticipants.userId, users.id))
        .where(eq(playdateParticipants.playdateId, playdate.id));
      
      result.push({
        ...playdate,
        participants
      });
    }
    
    return result;
  }
  
  async getUserPlaydates(userId: number): Promise<Playdate[]> {
    const playdatesData = await db
      .select()
      .from(playdates)
      .where(eq(playdates.creatorId, userId))
      .orderBy(asc(playdates.startTime));
    
    // Load participants for each playdate
    const result: Playdate[] = [];
    
    for (const playdate of playdatesData) {
      const participants = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage
        })
        .from(playdateParticipants)
        .innerJoin(users, eq(playdateParticipants.userId, users.id))
        .where(eq(playdateParticipants.playdateId, playdate.id));
      
      result.push({
        ...playdate,
        participants
      });
    }
    
    return result;
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
      
      // Then delete the playdate
      const result = await tx
        .delete(playdates)
        .where(eq(playdates.id, id));
      
      return result.rowCount > 0;
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
    let query = db
      .select()
      .from(places);
    
    // Filter by type if specified
    if (options.type) {
      if (options.type === "restaurants") {
        query = query.where(eq(places.type, "restaurant"));
      } else if (options.type === "playgrounds") {
        query = query.where(eq(places.type, "playground"));
      } else if (options.type !== "all") {
        query = query.where(eq(places.type, options.type));
      }
    }
    
    // Search by name, description, or address
    if (options.searchQuery) {
      const searchTerm = `%${options.searchQuery}%`;
      query = query.where(
        sql`(${places.name} ILIKE ${searchTerm} OR 
             ${places.description} ILIKE ${searchTerm} OR 
             ${places.address} ILIKE ${searchTerm})`
      );
    }
    
    // Filter by minimum rating
    if (options.minRating) {
      query = query.where(gte(places.rating, options.minRating));
    }
    
    // Filter by features (array contains operations)
    // This would normally be done with a PostgreSQL array contains operator
    // For simplicity, we'll fetch all places and filter in memory
    
    // Apply sorting
    if (options.sortBy) {
      if (options.sortBy === 'name') {
        query = options.sortOrder === 'desc' 
          ? query.orderBy(desc(places.name)) 
          : query.orderBy(asc(places.name));
      } else {
        // Default to rating
        query = options.sortOrder === 'asc' 
          ? query.orderBy(asc(places.rating)) 
          : query.orderBy(desc(places.rating));
      }
    } else {
      // Default sort by rating descending
      query = query.orderBy(desc(places.rating));
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
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
          latitude: parseFloat(place.latitude) || 0,
          longitude: parseFloat(place.longitude) || 0,
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
    
    // Convert string coordinates to numbers for map compatibility
    return {
      ...place,
      latitude: parseFloat(place.latitude) || 0,
      longitude: parseFloat(place.longitude) || 0
    };
  }
  
  async getNearbyPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]> {
    // In a real app, you'd use PostGIS or similar to calculate distances
    // For this demo, we'll just return places sorted by rating
    let query = db
      .select()
      .from(places);
    
    // Filter by type if specified
    if (options.type && options.type !== "all") {
      query = query.where(eq(places.type, options.type));
    }
    
    // For now, we'll just use the rating for ordering
    query = query.orderBy(desc(places.rating)).limit(4);
    
    const placesData = await query;
    
    // Add placeholder distance and isSaved properties
    return placesData.map(place => ({
      ...place,
      distance: Math.floor(Math.random() * 5000), // Random distance for demo
      isSaved: Math.random() > 0.5 // Random saved status for demo
    }));
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
      ));
    
    return result.rowCount! > 0;
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
    
    if (placeData.imageUrl !== undefined) updateData.image_url = placeData.imageUrl;
    if (placeData.features !== undefined) updateData.features = placeData.features;
    
    // Update the place
    const [updatedPlace] = await db
      .update(places)
      .set(updateData)
      .where(eq(places.id, id))
      .returning();
    
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
    // Get all chats where the user is a participant
    const userChats = await db
      .select({
        chatId: chatParticipants.chatId
      })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, userId));
    
    const result: Chat[] = [];
    
    for (const { chatId } of userChats) {
      // Get the chat details
      const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId));
      
      if (!chat) continue;
      
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
      
      // Get the last message for this chat
      const [lastMessage] = await db
        .select({
          id: chatMessages.id,
          content: chatMessages.content,
          sentAt: chatMessages.sentAt,
          senderId: chatMessages.senderId,
          senderName: users.firstName
        })
        .from(chatMessages)
        .innerJoin(users, eq(chatMessages.senderId, users.id))
        .where(eq(chatMessages.chatId, chatId))
        .orderBy(desc(chatMessages.sentAt))
        .limit(1);
      
      // Count unread messages
      const [{ unreadCount }] = await db
        .select({
          unreadCount: count()
        })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.chatId, chatId),
            not(eq(chatMessages.senderId, userId)), // Not sent by the current user
            eq(chatMessages.isRead, false) // Not read yet
          )
        );
      
      // Add this chat to the result
      result.push({
        ...chat,
        participants,
        lastMessage,
        unreadCount: Number(unreadCount || 0)
      });
    }
    
    // Sort chats by last message time (newest first)
    result.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return b.lastMessage.sentAt.getTime() - a.lastMessage.sentAt.getTime();
      }
      return a.lastMessage ? -1 : b.lastMessage ? 1 : 0;
    });
    
    return result;
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
    // Get messages for the chat, ordered by sentAt
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(asc(chatMessages.sentAt))
      .limit(limit)
      .offset(offset);
    
    // For each message, get the sender details
    const result: ChatMessage[] = [];
    
    for (const message of messages) {
      const [sender] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage
        })
        .from(users)
        .where(eq(users.id, message.senderId));
      
      result.push({
        ...message,
        sender
      });
    }
    
    return result;
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
            .where(eq(users.id, id));
          
          const success = result.rowCount ? result.rowCount > 0 : true;
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
      );
    
    return result.rowCount ? result.rowCount > 0 : true;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
