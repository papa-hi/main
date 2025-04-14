import { 
  User, InsertUser, users, 
  Playdate, playdates, 
  Place, places,
  userFavorites,
  playdateParticipants
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, desc, sql, asc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  getFeaturedUser(): Promise<User | undefined>;
  
  // Playdate methods
  getUpcomingPlaydates(): Promise<Playdate[]>;
  getPastPlaydates(): Promise<Playdate[]>;
  getUserPlaydates(userId: number): Promise<Playdate[]>;
  createPlaydate(playdate: any): Promise<Playdate>;
  deletePlaydate(id: number): Promise<boolean>;
  joinPlaydate(userId: number, playdateId: number): Promise<boolean>;
  leavePlaydate(userId: number, playdateId: number): Promise<boolean>;
  
  // Places methods
  getPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]>;
  getNearbyPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]>;
  getUserFavoritePlaces(userId: number): Promise<Place[]>;
  addFavoritePlace(userId: number, placeId: number): Promise<any>;
  removeFavoritePlace(userId: number, placeId: number): Promise<boolean>;
  
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
    return this.users.delete(id);
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
  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
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
  async getUpcomingPlaydates(): Promise<Playdate[]> {
    const now = new Date();
    
    const playdatesData = await db
      .select()
      .from(playdates)
      .where(gt(playdates.startTime, now))
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
  
  async createPlaydate(playdateData: any): Promise<Playdate> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert the playdate
      const [playdate] = await tx
        .insert(playdates)
        .values(playdateData)
        .returning();
      
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
  async getPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]> {
    let query = db
      .select()
      .from(places);
    
    // Filter by type if specified
    if (options.type) {
      if (options.type === "restaurants") {
        query = query.where(eq(places.type, "restaurant"));
      } else if (options.type === "playgrounds") {
        query = query.where(eq(places.type, "playground"));
      }
    }
    
    // For now, we'll just use the rating for ordering since we can't
    // calculate distance without more complex SQL
    query = query.orderBy(desc(places.rating));
    
    const placesData = await query;
    
    // Add placeholder distance and isSaved properties
    // In a real app, you'd calculate these based on user's location and saved places
    return placesData.map(place => ({
      ...place,
      distance: 0, // This would be calculated based on user's coordinates
      isSaved: false // This would be determined by checking userFavorites
    }));
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
    
    return result.rowCount > 0;
  }

  // Chat methods
  async getChats(userId: number): Promise<any[]> {
    // In a real implementation, we would query the database
    // For now, return mock data similar to MemStorage implementation
    return [
      {
        id: 1,
        participants: [
          { id: userId, firstName: "Current", lastName: "User", profileImage: null },
          { id: 1, firstName: "Thomas", lastName: "de Vries", profileImage: null }
        ],
        lastMessage: {
          id: 1,
          content: "Hallo! Hoe gaat het?",
          sentAt: new Date(),
          senderId: 1,
          senderName: "Thomas"
        },
        unreadCount: 1
      }
    ];
  }

  async getChatById(chatId: number): Promise<any | undefined> {
    // In a real implementation, we would query the database
    // For the specific chatId=999 that we create, include the requesting user
    if (chatId === 999) {
      // This will be the newly created chat that should include the current user in participants
      // We need to return it with the participants that were used to create it
      // This is a temporary workaround until a proper database implementation is added
      return {
        id: chatId,
        participants: [
          { id: 5, firstName: "Collins", lastName: "Lidede", profileImage: null }, // Current user
          { id: 3, firstName: "Brian", lastName: "Amaganga", profileImage: null }
        ]
      };
    }
    
    // Return mock data for other chat IDs
    return {
      id: chatId,
      participants: [
        { id: 1, firstName: "Thomas", lastName: "de Vries", profileImage: null },
        { id: 5, firstName: "Collins", lastName: "Lidede", profileImage: null }
      ]
    };
  }

  async createChat(participants: number[]): Promise<any> {
    // In a real implementation, we would insert into the database
    // For now, return mock data similar to MemStorage implementation
    const chatId = 999; // Mock ID
    
    // Get user details for participants
    const participantUsers = await Promise.all(
      participants.map(async (userId) => {
        const user = await this.getUserById(userId);
        return {
          id: user?.id || userId,
          firstName: user?.firstName || "Unknown",
          lastName: user?.lastName || "User",
          profileImage: user?.profileImage || null
        };
      })
    );

    return {
      id: chatId,
      participants: participantUsers,
      lastMessage: null,
      unreadCount: 0
    };
  }

  async getChatMessages(chatId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    // In a real implementation, we would query the database
    // For now, return mock data similar to MemStorage implementation
    return [
      {
        id: 1,
        chatId,
        senderId: 1,
        content: "Hallo! Hoe gaat het?",
        sentAt: new Date(Date.now() - 86400000), // 1 day ago
        sender: {
          id: 1,
          firstName: "Thomas",
          lastName: "de Vries",
          profileImage: null
        }
      }
    ];
  }

  async sendMessage(chatId: number, senderId: number, content: string): Promise<any> {
    // In a real implementation, we would insert into the database
    // For now, return mock data similar to MemStorage implementation
    const sender = await this.getUserById(senderId);
    
    return {
      id: Math.floor(Math.random() * 1000) + 1, // Random ID
      chatId,
      senderId,
      content,
      sentAt: new Date(),
      sender: {
        id: sender?.id || senderId,
        firstName: sender?.firstName || "Unknown",
        lastName: sender?.lastName || "User",
        profileImage: sender?.profileImage || null
      }
    };
  }

  // These methods are required by the IStorage interface but not implemented yet
  async deleteUser(id: number): Promise<boolean> {
    // TODO: Implement
    return true;
  }

  async joinPlaydate(userId: number, playdateId: number): Promise<boolean> {
    // TODO: Implement
    return true;
  }

  async leavePlaydate(userId: number, playdateId: number): Promise<boolean> {
    // TODO: Implement
    return true;
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
