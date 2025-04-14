import { 
  User, InsertUser, users, 
  Playdate, playdates, 
  Place, places,
  userFavorites
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  getFeaturedUser(): Promise<User | undefined>;
  
  // Playdate methods
  getUpcomingPlaydates(): Promise<Playdate[]>;
  getPastPlaydates(): Promise<Playdate[]>;
  getUserPlaydates(userId: number): Promise<Playdate[]>;
  createPlaydate(playdate: any): Promise<Playdate>;
  deletePlaydate(id: number): Promise<boolean>;
  
  // Places methods
  getPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]>;
  getNearbyPlaces(options: { latitude?: number, longitude?: number, type?: string }): Promise<Place[]>;
  getUserFavoritePlaces(userId: number): Promise<Place[]>;
  addFavoritePlace(userId: number, placeId: number): Promise<any>;
  removeFavoritePlace(userId: number, placeId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private playdates: Map<number, Playdate>;
  private places: Map<number, Place>;
  private favorites: Map<string, boolean>; // userId-placeId composite key
  
  private userIdCounter: number;
  private playdateIdCounter: number;
  private placeIdCounter: number;

  constructor() {
    this.users = new Map();
    this.playdates = new Map();
    this.places = new Map();
    this.favorites = new Map();
    this.userIdCounter = 1;
    this.playdateIdCounter = 1;
    this.placeIdCounter = 1;
    
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
}

export const storage = new MemStorage();
