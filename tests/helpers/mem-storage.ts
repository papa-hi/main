/**
 * In-memory storage implementation — FOR TESTS ONLY.
 *
 * This class is intentionally kept out of server/storage.ts so it can never
 * be accidentally instantiated in production. It implements IStorage with
 * Maps instead of a real database, and stubs out methods that aren't
 * needed for unit/integration testing.
 *
 * Usage in tests:
 *   import { MemStorage } from "../helpers/mem-storage";
 *   vi.mock("../../server/storage", () => ({ storage: new MemStorage() }));
 */

import type { IStorage } from "../../server/storage";
import type { User, InsertUser, Playdate, Place } from "../../shared/schema";

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private playdates: Map<number, Playdate>;
  private places: Map<number, Place>;
  private favorites: Map<string, boolean>;
  private chats: Map<number, any>;
  private messages: Map<number, any[]>;
  private chatParticipants: Map<number, number[]>;

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

    this.initializeSampleData();
  }

  private initializeSampleData() {
    const user1: User = {
      id: this.userIdCounter++,
      username: "thomas",
      password: "hashed_password",
      firstName: "Thomas",
      lastName: "de Vries",
      email: "thomas@example.com",
      phoneNumber: "+31612345678",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      bio: "Vader van Noah (6) en Eva (4).",
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
      bio: "Vader van Noah (6) en Eva (4).",
      city: "Amsterdam",
      createdAt: new Date(),
      favoriteLocations: ["Artis Zoo", "NEMO Science Museum", "Vondelpark", "Boerderij Meerzicht"]
    };

    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 14);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    const playdate1: Playdate = {
      id: this.playdateIdCounter++,
      title: "Speelmiddag met Noah & Liam",
      description: "Een gezellige middag in het park met onze kinderen.",
      location: "Speeltuin Amstelpark",
      startTime: new Date(nextWeek.setHours(14, 0)),
      endTime: new Date(nextWeek.setHours(17, 0)),
      creatorId: 1,
      maxParticipants: 5,
      createdAt: new Date(),
      participants: [
        { id: 1, firstName: "Thomas", lastName: "de Vries", profileImage: "" },
        { id: 2, firstName: "Martijn", lastName: "van der Berg", profileImage: "" },
      ]
    };

    const playdate2: Playdate = {
      id: this.playdateIdCounter++,
      title: "Vaderdag Picknick",
      description: "Picknick ter gelegenheid van vaderdag.",
      location: "Vondelpark, Amsterdam",
      startTime: new Date(nextMonth.setHours(12, 0)),
      endTime: new Date(nextMonth.setHours(15, 0)),
      creatorId: 2,
      maxParticipants: 10,
      createdAt: new Date(),
      participants: [
        { id: 1, firstName: "Thomas", lastName: "de Vries", profileImage: "" },
        { id: 2, firstName: "Martijn", lastName: "van der Berg", profileImage: "" },
      ]
    };

    this.playdates.set(playdate1.id, playdate1);
    this.playdates.set(playdate2.id, playdate2);

    const place1: Place = {
      id: this.placeIdCounter++,
      name: "Speeltuin Amstelpark",
      type: "playground",
      description: "Grote speeltuin met diverse speeltoestellen.",
      address: "Amstelpark 8, Amsterdam",
      latitude: "52.3343",
      longitude: "4.8924",
      imageUrl: "",
      rating: 49,
      reviewCount: 214,
      features: ["Toiletten", "Kiosk"],
      createdAt: new Date(),
      distance: 500,
      isSaved: true
    };

    this.places.set(place1.id, place1);
    this.favorites.set(`1-${place1.id}`, true);

    const chatId1 = this.chatIdCounter++;
    this.chats.set(chatId1, { id: chatId1, createdAt: new Date(), updatedAt: new Date() });
    this.chatParticipants.set(chatId1, [1, 2]);
    this.messages.set(chatId1, [
      { id: this.messageIdCounter++, chatId: chatId1, senderId: 1, content: "Hoi!", sentAt: new Date(), isRead: true },
    ]);
  }

  // ── User methods ────────────────────────────────────────────────────────────

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
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
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...userData };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getFeaturedUser(excludeUserId?: number): Promise<User | undefined> {
    const all = Array.from(this.users.values());
    const candidates = excludeUserId ? all.filter(u => u.id !== excludeUserId) : all;
    const pool = candidates.length > 0 ? candidates : all;
    if (pool.length === 0) return undefined;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ── Playdate methods ────────────────────────────────────────────────────────

  async getUpcomingPlaydates(): Promise<Playdate[]> {
    const now = new Date();
    return Array.from(this.playdates.values())
      .filter(p => new Date(p.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async getPastPlaydates(): Promise<Playdate[]> {
    const now = new Date();
    return Array.from(this.playdates.values())
      .filter(p => new Date(p.startTime) < now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getUserPlaydates(userId: number): Promise<Playdate[]> {
    return Array.from(this.playdates.values())
      .filter(p => p.creatorId === userId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async createPlaydate(playdateData: any): Promise<Playdate> {
    const id = this.playdateIdCounter++;
    const creator = this.users.get(playdateData.creatorId);
    const participants = creator
      ? [{ id: creator.id, firstName: creator.firstName, lastName: creator.lastName, profileImage: creator.profileImage || "" }]
      : [];
    const playdate: Playdate = { ...playdateData, id, createdAt: new Date(), participants };
    this.playdates.set(id, playdate);
    return playdate;
  }

  async getPlaydateById(id: number): Promise<Playdate | undefined> {
    return this.playdates.get(id);
  }

  async updatePlaydate(id: number, playdateData: Partial<Playdate>): Promise<Playdate> {
    const playdate = this.playdates.get(id);
    if (!playdate) throw new Error("Playdate not found");
    const updated: Playdate = {
      ...playdate, ...playdateData,
      participants: playdateData.participants || playdate.participants,
    };
    this.playdates.set(id, updated);
    return updated;
  }

  async deletePlaydate(id: number): Promise<boolean> {
    return this.playdates.delete(id);
  }

  async joinPlaydate(userId: number, playdateId: number): Promise<boolean> {
    const playdate = this.playdates.get(playdateId);
    if (!playdate) throw new Error(`Playdate ${playdateId} not found`);
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    if (playdate.participants.some(p => p.id === userId)) return true;
    if (playdate.participants.length >= playdate.maxParticipants) throw new Error("At capacity");
    playdate.participants.push({ id: user.id, firstName: user.firstName, lastName: user.lastName, profileImage: user.profileImage || "" });
    this.playdates.set(playdateId, playdate);
    return true;
  }

  async leavePlaydate(userId: number, playdateId: number): Promise<boolean> {
    const playdate = this.playdates.get(playdateId);
    if (!playdate) throw new Error(`Playdate ${playdateId} not found`);
    const updated = playdate.participants.filter(p => p.id !== userId);
    if (updated.length === playdate.participants.length) return false;
    this.playdates.set(playdateId, { ...playdate, participants: updated });
    return true;
  }

  // ── Places methods ──────────────────────────────────────────────────────────

  async getPlaces(options: { latitude?: number; longitude?: number; type?: string }): Promise<Place[]> {
    let places = Array.from(this.places.values());
    if (options.type) {
      if (options.type === "restaurants") places = places.filter(p => p.type === "restaurant");
      else if (options.type === "playgrounds") places = places.filter(p => p.type === "playground");
    }
    return options.latitude && options.longitude
      ? places.sort((a, b) => a.distance - b.distance)
      : places.sort((a, b) => b.rating - a.rating);
  }

  async getNearbyPlaces(options: { latitude?: number; longitude?: number; type?: string }): Promise<Place[]> {
    let places = Array.from(this.places.values());
    if (options.type && options.type !== "all") places = places.filter(p => p.type === options.type);
    return places.sort((a, b) => a.distance - b.distance).slice(0, 4);
  }

  async getUserFavoritePlaces(userId: number): Promise<Place[]> {
    return Array.from(this.places.values()).filter(p => this.favorites.has(`${userId}-${p.id}`));
  }

  async addFavoritePlace(userId: number, placeId: number): Promise<any> {
    if (!this.places.get(placeId)) throw new Error("Place not found");
    this.favorites.set(`${userId}-${placeId}`, true);
    return { userId, placeId };
  }

  async removeFavoritePlace(userId: number, placeId: number): Promise<boolean> {
    return this.favorites.delete(`${userId}-${placeId}`);
  }

  async createPlace(placeData: any): Promise<Place> {
    const id = this.placeIdCounter++;
    const place: Place = { ...placeData, id, rating: placeData.rating || 45, reviewCount: placeData.reviewCount || 0, createdAt: new Date(), distance: 0, isSaved: false };
    this.places.set(id, place);
    return place;
  }

  async updatePlace(id: number, placeData: Partial<Place>): Promise<Place> {
    const place = this.places.get(id);
    if (!place) throw new Error(`Place ${id} not found`);
    const updated: Place = { ...place, ...placeData, id: place.id, createdAt: place.createdAt, distance: place.distance, isSaved: place.isSaved };
    this.places.set(id, updated);
    return updated;
  }

  async deletePlace(id: number): Promise<boolean> {
    for (const key of this.favorites.keys()) {
      if (key.endsWith(`-${id}`)) this.favorites.delete(key);
    }
    return this.places.delete(id);
  }

  // ── Chat methods ────────────────────────────────────────────────────────────

  async getChats(userId: number): Promise<any[]> {
    const result: any[] = [];
    for (const [chatId, chat] of this.chats.entries()) {
      const participants = this.chatParticipants.get(chatId) || [];
      if (!participants.includes(userId)) continue;
      const participantsDetails = participants
        .map(pid => { const u = this.users.get(pid); return u ? { id: u.id, firstName: u.firstName, lastName: u.lastName, profileImage: u.profileImage } : null; })
        .filter(Boolean);
      const msgs = this.messages.get(chatId) || [];
      const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      const unreadCount = msgs.filter(m => !m.isRead && m.senderId !== userId).length;
      result.push({ ...chat, participants: participantsDetails, lastMessage, unreadCount });
    }
    return result.sort((a, b) => {
      const ta = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const tb = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return tb - ta;
    });
  }

  async getChatById(chatId: number): Promise<any | undefined> {
    const chat = this.chats.get(chatId);
    if (!chat) return undefined;
    const participants = (this.chatParticipants.get(chatId) || [])
      .map(pid => { const u = this.users.get(pid); return u ? { id: u.id, firstName: u.firstName, lastName: u.lastName, profileImage: u.profileImage } : null; })
      .filter(Boolean);
    return { ...chat, participants };
  }

  async createChat(participants: number[]): Promise<any> {
    const invalid = participants.filter(id => !this.users.has(id));
    if (invalid.length > 0) throw new Error(`Users not found: ${invalid.join(", ")}`);
    const chatId = this.chatIdCounter++;
    const now = new Date();
    const chat = { id: chatId, createdAt: now, updatedAt: now };
    this.chats.set(chatId, chat);
    this.chatParticipants.set(chatId, [...participants]);
    this.messages.set(chatId, []);
    const participantsDetails = participants.map(pid => { const u = this.users.get(pid)!; return { id: u.id, firstName: u.firstName, lastName: u.lastName, profileImage: u.profileImage }; });
    return { ...chat, participants: participantsDetails, unreadCount: 0 };
  }

  async getChatMessages(chatId: number, limit = 50, offset = 0): Promise<any[]> {
    if (!this.chats.get(chatId)) throw new Error(`Chat ${chatId} not found`);
    const sorted = [...(this.messages.get(chatId) || [])].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
    return sorted.slice(offset, offset + limit).map(msg => {
      const sender = this.users.get(msg.senderId);
      return { ...msg, sender: sender ? { id: sender.id, firstName: sender.firstName, lastName: sender.lastName, profileImage: sender.profileImage } : null };
    });
  }

  async sendMessage(chatId: number, senderId: number, content: string): Promise<any> {
    if (!this.chats.get(chatId)) throw new Error(`Chat ${chatId} not found`);
    const user = this.users.get(senderId);
    if (!user) throw new Error(`User ${senderId} not found`);
    const participants = this.chatParticipants.get(chatId) || [];
    if (!participants.includes(senderId)) throw new Error(`User ${senderId} not in chat ${chatId}`);
    const message = { id: this.messageIdCounter++, chatId, senderId, content, sentAt: new Date(), isRead: false };
    const msgs = this.messages.get(chatId) || [];
    msgs.push(message);
    this.messages.set(chatId, msgs);
    this.chats.set(chatId, { ...this.chats.get(chatId), updatedAt: new Date() });
    return { ...message, sender: { id: user.id, firstName: user.firstName, lastName: user.lastName, profileImage: user.profileImage } };
  }

  // ── Stub methods (not meaningful for in-memory; return safe empty values) ──

  async getUsersWithIncompleteProfiles(): Promise<{ id: number; firstName: string; username: string; email: string; missingFields: string[] }[]> {
    return [];
  }

  async getUsersInCity(_city: string): Promise<{ id: number; email: string; firstName: string }[]> {
    return [];
  }

  async getTotalUnreadCount(_userId: number): Promise<number> {
    return 0;
  }

  async markChatAsRead(_chatId: number, _userId: number): Promise<void> {}
}
