import { db } from "./db";
import { users, playdates, playdateParticipants, places, userFavorites } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");
  
  try {
    // Clean up existing data
    await db.delete(userFavorites);
    await db.delete(playdateParticipants);
    await db.delete(playdates);
    await db.delete(places);
    await db.delete(users);
    
    console.log("🧹 Cleaned up existing data");
    
    // Seed users
    const [user1] = await db.insert(users).values({
      username: "thomas",
      password: "hashed_password", // In production, use bcrypt to hash passwords
      firstName: "Thomas",
      lastName: "de Vries",
      email: "thomas@example.com",
      phoneNumber: "+31612345678",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      bio: "Vader van Noah (6) en Eva (4). Ik werk als ontwerper en ben in mijn vrije tijd graag buiten met de kinderen. We houden van fietsen, zwemmen en natuur ontdekken. Altijd op zoek naar nieuwe speeltuinen en kinderboerderijen!",
      city: "Amsterdam",
      favoriteLocations: ["Artis Zoo", "NEMO Science Museum", "Vondelpark", "Boerderij Meerzicht"],
      childrenInfo: JSON.stringify([
        { name: "Noah", age: 6 },
        { name: "Eva", age: 4 }
      ])
    }).returning();
    
    const [user2] = await db.insert(users).values({
      username: "martijn",
      password: "hashed_password",
      firstName: "Martijn",
      lastName: "van der Berg",
      email: "martijn@example.com",
      phoneNumber: "+31623456789",
      profileImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
      bio: "Vader van Liam (5) en Sophie (3). Ik werk als software-ontwikkelaar en hou van technologie, maar ook van buiten zijn met de kinderen.",
      city: "Amsterdam",
      favoriteLocations: ["Artis Zoo", "NEMO Science Museum", "Vondelpark", "Boerderij Meerzicht"],
      childrenInfo: JSON.stringify([
        { name: "Liam", age: 5 },
        { name: "Sophie", age: 3 }
      ])
    }).returning();
    
    console.log(`👤 Created ${2} users`);
    
    // Create dates for playdates
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 14);
    
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    
    // Seed playdates
    const [playdate1] = await db.insert(playdates).values({
      title: "Speelmiddag met Noah & Liam",
      description: "Een gezellige middag in het park met onze kinderen. Neem wat snacks mee!",
      location: "Speeltuin Amstelpark",
      startTime: new Date(nextWeek.setHours(14, 0)),
      endTime: new Date(nextWeek.setHours(17, 0)),
      creatorId: user1.id,
      maxParticipants: 5,
    }).returning();
    
    const [playdate2] = await db.insert(playdates).values({
      title: "Vaderdag Picknick",
      description: "Picknick ter gelegenheid van vaderdag. Iedereen neemt wat te eten mee.",
      location: "Vondelpark, Amsterdam",
      startTime: new Date(nextMonth.setHours(12, 0)),
      endTime: new Date(nextMonth.setHours(15, 0)),
      creatorId: user2.id,
      maxParticipants: 10,
    }).returning();
    
    const [playdate3] = await db.insert(playdates).values({
      title: "Zwemmen in buitenzwembad",
      description: "Lekker zwemmen met de kinderen in het buitenzwembad.",
      location: "Sloterparkbad, Amsterdam",
      startTime: new Date(pastDate.setHours(10, 0)),
      endTime: new Date(pastDate.setHours(12, 0)),
      creatorId: user1.id,
      maxParticipants: 6,
    }).returning();
    
    console.log(`🎮 Created ${3} playdates`);
    
    // Seed playdate participants
    await db.insert(playdateParticipants).values([
      { playdateId: playdate1.id, userId: user1.id },
      { playdateId: playdate1.id, userId: user2.id },
      { playdateId: playdate2.id, userId: user1.id },
      { playdateId: playdate2.id, userId: user2.id },
      { playdateId: playdate3.id, userId: user1.id },
    ]);
    
    console.log(`👪 Added participants to playdates`);
    
    // Seed places
    const [place1] = await db.insert(places).values({
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
    }).returning();
    
    const [place2] = await db.insert(places).values({
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
    }).returning();
    
    const [place3] = await db.insert(places).values({
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
    }).returning();
    
    const [place4] = await db.insert(places).values({
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
    }).returning();
    
    const [place5] = await db.insert(places).values({
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
    }).returning();
    
    const [place6] = await db.insert(places).values({
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
    }).returning();
    
    console.log(`🏛️ Created ${6} places`);
    
    // Seed user favorites
    await db.insert(userFavorites).values([
      { userId: user1.id, placeId: place1.id },
      { userId: user1.id, placeId: place3.id },
      { userId: user1.id, placeId: place6.id },
      { userId: user2.id, placeId: place2.id },
      { userId: user2.id, placeId: place4.id },
    ]);
    
    console.log(`❤️ Created favorite places`);
    
    console.log("✅ Database seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
  
  process.exit(0);
}

seed();