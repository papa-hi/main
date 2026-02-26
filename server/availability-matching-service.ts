import { db } from "./db";
import { 
  users, 
  userAvailability, 
  availabilityMatches,
  matchPreferences,
  type User,
  type UserAvailability,
  type AvailabilityMatch,
  TIME_SLOTS,
  type TimeSlot,
  type DayOfWeek
} from "@shared/schema";
import { eq, and, or, sql, ne, isNull, inArray } from "drizzle-orm";
import { calculateDistance, getCityCoordinates } from "./dad-matching-service";

interface SharedSlot {
  dayOfWeek: number;
  timeSlot: TimeSlot;
}

interface AvailabilityMatchCandidate {
  user: User;
  sharedSlots: SharedSlot[];
  distance: number;
  matchScore: number;
  childrenCompatibility: number;
}

export async function setUserAvailability(
  userId: number,
  availability: Array<{ dayOfWeek: DayOfWeek; timeSlot: TimeSlot; notes?: string }>
): Promise<{ success: boolean; matchesCount: number }> {
  
  await db
    .delete(userAvailability)
    .where(eq(userAvailability.userId, userId));

  if (availability.length > 0) {
    await db.insert(userAvailability).values(
      availability.map(slot => ({
        userId,
        dayOfWeek: slot.dayOfWeek,
        timeSlot: slot.timeSlot,
        recurrenceType: 'weekly' as const,
        isActive: true,
        notes: slot.notes,
      }))
    );
  }

  const matchesCreated = await calculateAvailabilityMatches(userId);

  await recalculateMatchesForAffectedUsers(userId);

  if (availability.length > 0) {
    try {
      const { sendAvailabilitySetupConfirmation } = await import("./availability-match-notifications");
      await sendAvailabilitySetupConfirmation(userId, availability.length, matchesCreated);
    } catch (error) {
      console.error(`Failed to send setup confirmation: ${error}`);
    }
  }

  return {
    success: true,
    matchesCount: matchesCreated,
  };
}

export async function getUserAvailability(userId: number): Promise<UserAvailability[]> {
  return await db
    .select()
    .from(userAvailability)
    .where(
      and(
        eq(userAvailability.userId, userId),
        eq(userAvailability.isActive, true)
      )
    )
    .orderBy(userAvailability.dayOfWeek, userAvailability.timeSlot);
}

export async function toggleAvailabilitySlot(
  userId: number,
  dayOfWeek: DayOfWeek,
  timeSlot: TimeSlot
): Promise<boolean> {
  
  const [existing] = await db
    .select()
    .from(userAvailability)
    .where(
      and(
        eq(userAvailability.userId, userId),
        eq(userAvailability.dayOfWeek, dayOfWeek),
        eq(userAvailability.timeSlot, timeSlot)
      )
    );

  if (existing) {
    await db
      .update(userAvailability)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(userAvailability.id, existing.id));
    
    return !existing.isActive;
  } else {
    await db.insert(userAvailability).values({
      userId,
      dayOfWeek,
      timeSlot,
      recurrenceType: 'weekly',
      isActive: true,
    });
    
    return true;
  }
}

async function findAvailabilityMatchCandidates(userId: number): Promise<AvailabilityMatchCandidate[]> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.city) {
    return [];
  }

  const userSlots = await getUserAvailability(userId);
  if (userSlots.length === 0) {
    return [];
  }

  const [prefs] = await db
    .select()
    .from(matchPreferences)
    .where(eq(matchPreferences.userId, userId));
  
  const maxDistance = prefs?.maxDistanceKm || 20;
  const ageFlexibility = prefs?.ageFlexibility || 2;

  const userCoords = getCityCoordinates(user.city);
  if (!userCoords) {
    return [];
  }

  const overlappingUsers = await db
    .selectDistinct({
      userId: userAvailability.userId,
    })
    .from(userAvailability)
    .where(
      and(
        ne(userAvailability.userId, userId),
        eq(userAvailability.isActive, true),
        or(
          ...userSlots.map(slot =>
            and(
              eq(userAvailability.dayOfWeek, slot.dayOfWeek),
              eq(userAvailability.timeSlot, slot.timeSlot)
            )
          )
        )
      )
    );

  const overlappingUserIds = overlappingUsers.map(u => u.userId);
  
  if (overlappingUserIds.length === 0) {
    return [];
  }

  const potentialMatches = await db
    .select()
    .from(users)
    .where(
      and(
        inArray(users.id, overlappingUserIds),
        isNull(users.role)
      )
    );

  const candidates: AvailabilityMatchCandidate[] = [];

  for (const otherUser of potentialMatches) {
    if (!otherUser.city) continue;

    const otherCoords = getCityCoordinates(otherUser.city);
    if (!otherCoords) continue;

    const distance = calculateDistance(
      userCoords.lat, userCoords.lon,
      otherCoords.lat, otherCoords.lon
    );

    if (distance > maxDistance) continue;

    const otherUserSlots = await getUserAvailability(otherUser.id);

    const sharedSlots: SharedSlot[] = [];
    for (const slot of userSlots) {
      const hasMatch = otherUserSlots.some(
        otherSlot =>
          otherSlot.dayOfWeek === slot.dayOfWeek &&
          otherSlot.timeSlot === slot.timeSlot
      );
      if (hasMatch) {
        sharedSlots.push({
          dayOfWeek: slot.dayOfWeek,
          timeSlot: slot.timeSlot as TimeSlot,
        });
      }
    }

    if (sharedSlots.length === 0) continue;

    let childrenCompatibility = 0;
    if (
      user.childrenInfo && 
      Array.isArray(user.childrenInfo) &&
      otherUser.childrenInfo && 
      Array.isArray(otherUser.childrenInfo)
    ) {
      const userChildren = user.childrenInfo as Array<{ age: number }>;
      const otherChildren = otherUser.childrenInfo as Array<{ age: number }>;
      
      for (const child1 of userChildren) {
        for (const child2 of otherChildren) {
          if (Math.abs(child1.age - child2.age) <= ageFlexibility) {
            childrenCompatibility += 1;
          }
        }
      }
    }

    const matchScore = calculateAvailabilityMatchScore(
      sharedSlots.length,
      distance,
      maxDistance,
      childrenCompatibility
    );

    candidates.push({
      user: otherUser as User,
      sharedSlots,
      distance: Math.round(distance),
      matchScore,
      childrenCompatibility,
    });
  }

  return candidates.sort((a, b) => b.matchScore - a.matchScore);
}

function calculateAvailabilityMatchScore(
  sharedSlotsCount: number,
  distance: number,
  maxDistance: number,
  childrenCompatibility: number
): number {
  const slotsScore = Math.min(sharedSlotsCount * 10, 40);
  const distanceScore = Math.max(0, ((maxDistance - distance) / maxDistance) * 30);
  const childrenScore = Math.min(childrenCompatibility * 5, 20);
  const activityBonus = Math.min(sharedSlotsCount * 2, 10);

  return Math.round(slotsScore + distanceScore + childrenScore + activityBonus);
}

export async function calculateAvailabilityMatches(userId: number): Promise<number> {
  console.log(`Calculating availability matches for user ${userId}`);

  const candidates = await findAvailabilityMatchCandidates(userId);
  console.log(`Found ${candidates.length} availability match candidates for user ${userId}`);

  const existingMatches = await db
    .select({ matchedUserId: availabilityMatches.matchedUserId })
    .from(availabilityMatches)
    .where(eq(availabilityMatches.userId, userId));
  
  const existingMatchedUserIds = new Set(existingMatches.map(m => m.matchedUserId));

  await db
    .delete(availabilityMatches)
    .where(eq(availabilityMatches.userId, userId));

  let matchesCreated = 0;
  const newMatches: AvailabilityMatchCandidate[] = [];

  for (const candidate of candidates) {
    try {
      await db.insert(availabilityMatches).values({
        userId,
        matchedUserId: candidate.user.id,
        sharedSlots: candidate.sharedSlots,
        matchScore: candidate.matchScore,
        distanceKm: candidate.distance.toString(),
        calculatedAt: new Date(),
      });
      matchesCreated++;

      if (!existingMatchedUserIds.has(candidate.user.id)) {
        newMatches.push(candidate);
      }
    } catch (error) {
      console.error(`Failed to create availability match: ${error}`);
    }
  }

  for (const candidate of newMatches.slice(0, 3)) {
    try {
      const { sendAvailabilityMatchNotificationEmail, sendAvailabilityMatchPushNotification } = await import("./availability-match-notifications");
      await Promise.all([
        sendAvailabilityMatchNotificationEmail(userId, candidate.user.id, candidate),
        sendAvailabilityMatchPushNotification(userId, candidate.user.id, candidate)
      ]);
      console.log(`Sent availability match notifications for user ${userId} <-> ${candidate.user.id}`);
    } catch (error) {
      console.error(`Failed to send availability match notification: ${error}`);
    }
  }

  console.log(`Created ${matchesCreated} availability matches for user ${userId}, ${newMatches.length} new matches`);
  return matchesCreated;
}

async function recalculateMatchesForAffectedUsers(userId: number): Promise<void> {
  const userSlots = await getUserAvailability(userId);
  
  if (userSlots.length === 0) {
    return;
  }

  const affectedUsers = await db
    .selectDistinct({
      userId: userAvailability.userId,
    })
    .from(userAvailability)
    .where(
      and(
        ne(userAvailability.userId, userId),
        eq(userAvailability.isActive, true),
        or(
          ...userSlots.map(slot =>
            and(
              eq(userAvailability.dayOfWeek, slot.dayOfWeek),
              eq(userAvailability.timeSlot, slot.timeSlot)
            )
          )
        )
      )
    );

  const affectedUserIds = affectedUsers.slice(0, 10).map(u => u.userId);
  
  for (const affectedUserId of affectedUserIds) {
    try {
      await calculateAvailabilityMatches(affectedUserId);
    } catch (error) {
      console.error(`Failed to recalculate matches for user ${affectedUserId}: ${error}`);
    }
  }
}

export async function getAvailabilityMatches(userId: number): Promise<Array<{
  match: AvailabilityMatch;
  user: User;
}>> {
  const matches = await db
    .select({
      match: availabilityMatches,
      user: users,
    })
    .from(availabilityMatches)
    .innerJoin(users, eq(users.id, availabilityMatches.matchedUserId))
    .where(eq(availabilityMatches.userId, userId))
    .orderBy(sql`${availabilityMatches.matchScore} DESC`);

  return matches as Array<{ match: AvailabilityMatch; user: User }>;
}

export async function getMatchesForSlot(
  userId: number,
  dayOfWeek: DayOfWeek,
  timeSlot: TimeSlot
): Promise<Array<{
  match: AvailabilityMatch;
  user: User;
}>> {
  const allMatches = await getAvailabilityMatches(userId);

  return allMatches.filter(({ match }) => {
    const sharedSlots = match.sharedSlots as SharedSlot[];
    return sharedSlots.some(
      slot => slot.dayOfWeek === dayOfWeek && slot.timeSlot === timeSlot
    );
  });
}

export async function getSlotStatistics(
  userId: number,
  dayOfWeek: DayOfWeek,
  timeSlot: TimeSlot
): Promise<{
  availableDadsCount: number;
  averageDistanceKm: number;
  newThisWeek: number;
  popularityRank: number;
  message: string;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.city) {
    return {
      availableDadsCount: 0,
      averageDistanceKm: 0,
      newThisWeek: 0,
      popularityRank: 0,
      message: 'Location required for statistics',
    };
  }

  const userCoords = getCityCoordinates(user.city);
  if (!userCoords) {
    return {
      availableDadsCount: 0,
      averageDistanceKm: 0,
      newThisWeek: 0,
      popularityRank: 0,
      message: 'Location coordinates not found',
    };
  }

  const usersWithSlot = await db
    .select({
      userId: userAvailability.userId,
      city: users.city,
      createdAt: userAvailability.createdAt,
    })
    .from(userAvailability)
    .innerJoin(users, eq(users.id, userAvailability.userId))
    .where(
      and(
        eq(userAvailability.dayOfWeek, dayOfWeek),
        eq(userAvailability.timeSlot, timeSlot),
        eq(userAvailability.isActive, true),
        ne(userAvailability.userId, userId)
      )
    );

  let totalDistance = 0;
  let validUsers = 0;
  let newThisWeek = 0;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const slotUser of usersWithSlot) {
    if (!slotUser.city) continue;
    
    const coords = getCityCoordinates(slotUser.city);
    if (!coords) continue;

    const distance = calculateDistance(
      userCoords.lat, userCoords.lon,
      coords.lat, coords.lon
    );

    if (distance <= 20) {
      validUsers++;
      totalDistance += distance;
      
      if (slotUser.createdAt && slotUser.createdAt > oneWeekAgo) {
        newThisWeek++;
      }
    }
  }

  const averageDistanceKm = validUsers > 0 ? Math.round(totalDistance / validUsers) : 0;

  const popularityRank = validUsers > 10 ? 1 : validUsers > 5 ? 2 : 3;

  let message = '';
  if (validUsers === 0) {
    message = 'Be the first! Other dads will join soon.';
  } else if (validUsers >= 10) {
    message = 'Very popular time slot in your area!';
  } else if (validUsers >= 5) {
    message = 'Growing popularity - great time to connect!';
  } else {
    message = 'A few dads are available - help grow this time slot!';
  }

  return {
    availableDadsCount: validUsers,
    averageDistanceKm,
    newThisWeek,
    popularityRank,
    message,
  };
}

export function getNextOccurrence(dayOfWeek: DayOfWeek): Date {
  const today = new Date();
  const currentDay = today.getDay();
  
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  
  return nextDate;
}

export function getDayName(dayOfWeek: DayOfWeek): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

export function getTimeSlotDisplay(timeSlot: TimeSlot): string {
  const displays = {
    [TIME_SLOTS.MORNING]: 'Morning (7am - 12pm)',
    [TIME_SLOTS.AFTERNOON]: 'Afternoon (12pm - 5pm)',
    [TIME_SLOTS.EVENING]: 'Evening (5pm - 8pm)',
    [TIME_SLOTS.ALLDAY]: 'All Day (Flexible)',
  };
  return displays[timeSlot] || timeSlot;
}
