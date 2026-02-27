import { db } from "./db";
import { users, dadMatches, matchPreferences, type User, type DadMatch, type MatchPreferences } from "@shared/schema";
import { eq, and, or, sql, ne, isNull } from "drizzle-orm";
// We'll implement notifications inline for now

interface ChildInfo {
  name: string;
  age: number;
}

interface MatchCandidate {
  user: User;
  distance?: number;
  commonAgeRanges: Array<{ minAge: number; maxAge: number; overlap: number }>;
  matchScore: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * Get coordinates for a city using a simple mapping
 * In production, this would use a geocoding service
 */
export function getCityCoordinates(city: string): { lat: number; lon: number } | null {
  // Netherlands major cities coordinates
  const cityCoords: Record<string, { lat: number; lon: number }> = {
    'amsterdam': { lat: 52.3676, lon: 4.9041 },
    'rotterdam': { lat: 51.9244, lon: 4.4777 },
    'den haag': { lat: 52.0705, lon: 4.3007 },
    'utrecht': { lat: 52.0907, lon: 5.1214 },
    'eindhoven': { lat: 51.4416, lon: 5.4697 },
    'tilburg': { lat: 51.5555, lon: 5.0913 },
    'groningen': { lat: 53.2194, lon: 6.5665 },
    'almere': { lat: 52.3508, lon: 5.2647 },
    'breda': { lat: 51.5719, lon: 4.7683 },
    'nijmegen': { lat: 51.8426, lon: 5.8518 },
    'haarlem': { lat: 52.3809, lon: 4.6368 },
    'arnhem': { lat: 51.9851, lon: 5.8987 },
    'zaanstad': { lat: 52.4391, lon: 4.8282 },
    'haarlemmermeer': { lat: 52.3048, lon: 4.6890 },
    'apeldoorn': { lat: 52.2112, lon: 5.9699 },
    'enschede': { lat: 52.2215, lon: 6.8937 },
    'leiden': { lat: 52.1601, lon: 4.4970 },
    'maastricht': { lat: 50.8514, lon: 5.6909 },
  };

  const normalizedCity = city.toLowerCase().trim();
  return cityCoords[normalizedCity] || null;
}

/**
 * Find common age ranges between two users' children
 */
function findCommonAgeRanges(
  children1: ChildInfo[], 
  children2: ChildInfo[], 
  ageFlexibility: number = 2
): Array<{ minAge: number; maxAge: number; overlap: number }> {
  const commonRanges: Array<{ minAge: number; maxAge: number; overlap: number }> = [];

  for (const child1 of children1) {
    for (const child2 of children2) {
      const age1 = child1.age;
      const age2 = child2.age;
      
      // Check if ages are within flexibility range
      if (Math.abs(age1 - age2) <= ageFlexibility) {
        const minAge = Math.min(age1, age2);
        const maxAge = Math.max(age1, age2);
        const overlap = ageFlexibility - Math.abs(age1 - age2);
        
        commonRanges.push({
          minAge,
          maxAge,
          overlap
        });
      }
    }
  }

  return commonRanges;
}

/**
 * Calculate match score based on distance and age compatibility
 */
function calculateMatchScore(distance: number, commonAgeRanges: Array<{ overlap: number }>): number {
  // Distance score (closer = higher score)
  const maxDistance = 50; // km
  const distanceScore = Math.max(0, (maxDistance - distance) / maxDistance * 50);
  
  // Age compatibility score
  const maxOverlap = 2; // max age flexibility
  const ageScore = commonAgeRanges.reduce((sum, range) => {
    return sum + (range.overlap / maxOverlap * 50);
  }, 0);
  
  return Math.min(100, Math.round(distanceScore + ageScore));
}

/**
 * Get or create match preferences for a user
 */
async function getMatchPreferences(userId: number): Promise<MatchPreferences> {
  const [existing] = await db
    .select()
    .from(matchPreferences)
    .where(eq(matchPreferences.userId, userId));

  if (existing) {
    return existing;
  }

  // Create default preferences
  const [newPrefs] = await db
    .insert(matchPreferences)
    .values({
      userId,
      maxDistanceKm: 20,
      ageFlexibility: 2,
      isEnabled: true,
    })
    .returning();

  return newPrefs;
}

/**
 * Find potential matches for a user
 */
async function findMatchCandidates(userId: number): Promise<MatchCandidate[]> {
  // Get user and their preferences
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.city || !user.childrenInfo || !Array.isArray(user.childrenInfo)) {
    return [];
  }

  const preferences = await getMatchPreferences(userId);
  if (!preferences.isEnabled) {
    return [];
  }

  const userCoords = getCityCoordinates(user.city);
  if (!userCoords) {
    console.log(`Could not find coordinates for city: ${user.city}`);
    return [];
  }

  // Get other users with children and location info
  const potentialMatches = await db
    .select()
    .from(users)
    .where(
      and(
        ne(users.id, userId),
        isNull(users.role) // Only regular users, not admins
      )
    );

  // OPTIMIZATION: Get all existing matches for this user in ONE query (prevents N+1)
  const existingMatches = await db
    .select()
    .from(dadMatches)
    .where(
      or(
        eq(dadMatches.dadId1, userId),
        eq(dadMatches.dadId2, userId)
      )
    );

  // Create a Set of matched user IDs for fast lookup
  const matchedUserIds = new Set<number>();
  existingMatches.forEach(match => {
    matchedUserIds.add(match.dadId1 === userId ? match.dadId2 : match.dadId1);
  });

  const candidates: MatchCandidate[] = [];

  for (const otherUser of potentialMatches) {
    // Skip if match already exists (fast Set lookup instead of database query)
    if (matchedUserIds.has(otherUser.id)) {
      continue;
    }

    if (!otherUser.city || !otherUser.childrenInfo || !Array.isArray(otherUser.childrenInfo)) {
      continue;
    }

    const otherCoords = getCityCoordinates(otherUser.city);
    if (!otherCoords) {
      continue;
    }

    const distance = calculateDistance(
      userCoords.lat, userCoords.lon,
      otherCoords.lat, otherCoords.lon
    );

    // Check if within distance preference
    if (distance > (preferences.maxDistanceKm || 20)) {
      continue;
    }

    // Find common age ranges
    const commonAgeRanges = findCommonAgeRanges(
      user.childrenInfo as ChildInfo[],
      otherUser.childrenInfo as ChildInfo[],
      preferences.ageFlexibility || 2
    );

    // Skip if no age compatibility
    if (commonAgeRanges.length === 0) {
      continue;
    }

    const matchScore = calculateMatchScore(distance, commonAgeRanges);

    candidates.push({
      user: otherUser as User,
      distance: Math.round(distance),
      commonAgeRanges,
      matchScore
    });
  }

  // Sort by match score (highest first)
  return candidates.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Create a dad match and send notifications
 */
async function createDadMatch(userId1: number, userId2: number, candidate: MatchCandidate): Promise<void> {
  // Ensure consistent ordering (smaller ID first)
  const [dadId1, dadId2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

  const [match] = await db
    .insert(dadMatches)
    .values({
      dadId1,
      dadId2,
      matchScore: candidate.matchScore,
      distanceKm: candidate.distance || 0,
      commonAgeRanges: candidate.commonAgeRanges,
      matchStatus: 'pending',
      expiresAt,
    })
    .returning();

  console.log(`Created dad match ${match.id} between users ${dadId1} and ${dadId2}`);

  // Send notifications to both users
  try {
    await sendDadMatchNotifications(dadId1, dadId2, candidate);
    await sendDadMatchNotifications(dadId2, dadId1, candidate);

    // Mark notifications as sent
    await db
      .update(dadMatches)
      .set({ notificationSent: true })
      .where(eq(dadMatches.id, match.id));

    console.log(`Sent notifications for match ${match.id}`);
  } catch (error) {
    console.error(`Failed to send notifications for match ${match.id}:`, error);
  }
}

/**
 * Run matching algorithm for a specific user
 */
export async function runDadMatchingForUser(userId: number): Promise<number> {
  console.log(`Running dad matching for user ${userId}`);
  
  const candidates = await findMatchCandidates(userId);
  console.log(`Found ${candidates.length} potential matches for user ${userId}`);

  let matchesCreated = 0;

  // Create matches for top candidates (limit to 3 per run to avoid spam)
  const topCandidates = candidates.slice(0, 3);
  
  for (const candidate of topCandidates) {
    try {
      await createDadMatch(userId, candidate.user.id, candidate);
      matchesCreated++;
    } catch (error) {
      console.error(`Failed to create match between ${userId} and ${candidate.user.id}:`, error);
    }
  }

  // Update last match run timestamp
  await db
    .update(matchPreferences)
    .set({ lastMatchRun: new Date() })
    .where(eq(matchPreferences.userId, userId));

  return matchesCreated;
}

/**
 * Run matching algorithm for all eligible users
 */
export async function runDadMatchingForAllUsers(): Promise<{ totalMatches: number; usersProcessed: number }> {
  console.log('Running dad matching for all users');

  // Get all users with complete profiles
  const eligibleUsers = await db
    .select()
    .from(users)
    .where(
      and(
        isNull(users.role), // Regular users only
        sql`${users.city} IS NOT NULL`,
        sql`${users.childrenInfo} IS NOT NULL`,
        sql`jsonb_array_length(${users.childrenInfo}) > 0`
      )
    );

  console.log(`Found ${eligibleUsers.length} eligible users for matching`);

  let totalMatches = 0;
  let usersProcessed = 0;

  for (const user of eligibleUsers) {
    try {
      const matchesCreated = await runDadMatchingForUser(user.id);
      totalMatches += matchesCreated;
      usersProcessed++;
      
      if (matchesCreated > 0) {
        console.log(`Created ${matchesCreated} matches for user ${user.firstName} (${user.id})`);
      }
    } catch (error) {
      console.error(`Failed to run matching for user ${user.id}:`, error);
    }
  }

  console.log(`Dad matching complete: ${totalMatches} matches created for ${usersProcessed} users`);
  
  return { totalMatches, usersProcessed };
}

/**
 * Get matches for a user
 */
export async function getUserMatches(userId: number): Promise<DadMatch[]> {
  const matches = await db
    .select({
      id: dadMatches.id,
      dadId1: dadMatches.dadId1,
      dadId2: dadMatches.dadId2,
      matchScore: dadMatches.matchScore,
      distanceKm: dadMatches.distanceKm,
      commonAgeRanges: dadMatches.commonAgeRanges,
      matchStatus: dadMatches.matchStatus,
      notificationSent: dadMatches.notificationSent,
      createdAt: dadMatches.createdAt,
      expiresAt: dadMatches.expiresAt,
      dad1: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        city: users.city,
        childrenInfo: users.childrenInfo,
      },
      dad2: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImage: users.profileImage,
        city: users.city, 
        childrenInfo: users.childrenInfo,
      }
    })
    .from(dadMatches)
    .leftJoin(users, eq(users.id, dadMatches.dadId1))
    .where(
      or(
        eq(dadMatches.dadId1, userId),
        eq(dadMatches.dadId2, userId)
      )
    )
    .orderBy(sql`${dadMatches.createdAt} DESC`);

  // Transform the data to match our DadMatch type
  return matches.map(match => ({
    ...match,
    dad1: match.dad1!,
    dad2: match.dad2!,
  })) as DadMatch[];
}

/**
 * Update match status (accept/decline)
 */
export async function updateMatchStatus(matchId: number, userId: number, status: 'accepted' | 'declined'): Promise<boolean> {
  const [match] = await db
    .select()
    .from(dadMatches)
    .where(eq(dadMatches.id, matchId));

  if (!match || (match.dadId1 !== userId && match.dadId2 !== userId)) {
    return false;
  }

  await db
    .update(dadMatches)
    .set({ matchStatus: status })
    .where(eq(dadMatches.id, matchId));

  return true;
}

/**
 * Send dad match notifications (email and push)
 */
async function sendDadMatchNotifications(userId: number, matchedUserId: number, candidate: MatchCandidate): Promise<void> {
  try {
    const { sendDadMatchNotificationEmail, sendDadMatchPushNotification } = await import("./dad-match-notifications");

    await Promise.allSettled([
      sendDadMatchNotificationEmail(userId, matchedUserId, candidate),
      sendDadMatchPushNotification(userId, matchedUserId, candidate),
    ]);

    console.log(`Dad match notifications sent to user ${userId} about match with user ${matchedUserId}`);
  } catch (error) {
    console.error('Error sending dad match notifications:', error);
  }
}