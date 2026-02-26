import { Router } from "express";
import { z } from "zod";
import {
  setUserAvailability,
  getUserAvailability,
  toggleAvailabilitySlot,
  getAvailabilityMatches,
  getMatchesForSlot,
  getSlotStatistics,
  calculateAvailabilityMatches,
  getNextOccurrence,
  getDayName,
  getTimeSlotDisplay,
} from "../services/availability-matching-service";
import { TIME_SLOTS, DAYS_OF_WEEK, type TimeSlot, type DayOfWeek } from "@shared/schema";

const router = Router();

// Validation schemas
const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'allday']),
  notes: z.string().optional(),
});

const setAvailabilitySchema = z.object({
  availability: z.array(availabilitySlotSchema),
});

const slotQuerySchema = z.object({
  day: z.string().transform(Number),
  slot: z.enum(['morning', 'afternoon', 'evening', 'allday']),
});

/**
 * GET /api/availability
 * Get current user's availability schedule
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const availability = await getUserAvailability(userId);

    res.json({
      success: true,
      availability: availability.map(slot => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        dayName: getDayName(slot.dayOfWeek as DayOfWeek),
        timeSlot: slot.timeSlot,
        timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot as TimeSlot),
        isActive: slot.isActive,
        notes: slot.notes,
        nextOccurrence: getNextOccurrence(slot.dayOfWeek as DayOfWeek),
      })),
    });
  } catch (error) {
    console.error("Error getting user availability:", error);
    res.status(500).json({ error: "Failed to get availability" });
  }
});

/**
 * POST /api/availability
 * Set or update user's availability schedule
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validatedData = setAvailabilitySchema.parse(req.body);

    const result = await setUserAvailability(
      userId,
      validatedData.availability as Array<{
        dayOfWeek: DayOfWeek;
        timeSlot: TimeSlot;
        notes?: string;
      }>
    );

    res.json({
      success: true,
      message: result.matchesCount > 0 
        ? `${result.matchesCount} dads match your schedule!` 
        : "Availability saved! We'll notify you when dads match your schedule.",
      matchesCount: result.matchesCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error setting user availability:", error);
    res.status(500).json({ error: "Failed to set availability" });
  }
});

/**
 * POST /api/availability/toggle
 * Toggle a specific time slot on/off
 */
router.post("/toggle", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { dayOfWeek, timeSlot } = req.body;

    if (
      typeof dayOfWeek !== 'number' || 
      dayOfWeek < 0 || 
      dayOfWeek > 6 ||
      !['morning', 'afternoon', 'evening', 'allday'].includes(timeSlot)
    ) {
      return res.status(400).json({ error: "Invalid day or time slot" });
    }

    const isActive = await toggleAvailabilitySlot(
      userId,
      dayOfWeek as DayOfWeek,
      timeSlot as TimeSlot
    );

    // Recalculate matches
    await calculateAvailabilityMatches(userId);

    res.json({
      success: true,
      isActive,
      message: isActive ? "Time slot added!" : "Time slot removed",
    });
  } catch (error) {
    console.error("Error toggling availability slot:", error);
    res.status(500).json({ error: "Failed to toggle slot" });
  }
});

/**
 * GET /api/availability/matches
 * Get all availability matches for current user
 */
router.get("/matches", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matches = await getAvailabilityMatches(userId);

    res.json({
      success: true,
      totalMatches: matches.length,
      matches: matches.map(({ match, user }) => ({
        matchId: match.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          city: user.city,
          childrenInfo: user.childrenInfo,
        },
        sharedSlots: (match.sharedSlots as Array<{dayOfWeek: number, timeSlot: string}>).map(slot => ({
          dayOfWeek: slot.dayOfWeek,
          dayName: getDayName(slot.dayOfWeek as DayOfWeek),
          timeSlot: slot.timeSlot,
          timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot as TimeSlot),
          nextOccurrence: getNextOccurrence(slot.dayOfWeek as DayOfWeek),
        })),
        matchScore: match.matchScore,
        distanceKm: parseFloat(match.distanceKm || '0'),
        calculatedAt: match.calculatedAt,
      })),
    });
  } catch (error) {
    console.error("Error getting availability matches:", error);
    res.status(500).json({ error: "Failed to get matches" });
  }
});

/**
 * GET /api/availability/matches/slot?day=2&slot=morning
 * Get matches for a specific time slot
 */
router.get("/matches/slot", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = slotQuerySchema.parse(req.query);
    const dayOfWeek = validated.day as DayOfWeek;
    const timeSlot = validated.slot as TimeSlot;

    const matches = await getMatchesForSlot(userId, dayOfWeek, timeSlot);
    const nextDate = getNextOccurrence(dayOfWeek);

    res.json({
      success: true,
      dayOfWeek,
      dayName: getDayName(dayOfWeek),
      timeSlot,
      timeSlotDisplay: getTimeSlotDisplay(timeSlot),
      nextOccurrence: nextDate,
      totalMatches: matches.length,
      matches: matches.map(({ match, user }) => ({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          city: user.city,
          childrenInfo: user.childrenInfo,
        },
        matchScore: match.matchScore,
        distanceKm: parseFloat(match.distanceKm || '0'),
        sharedSlots: match.sharedSlots,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }
    console.error("Error getting matches for slot:", error);
    res.status(500).json({ error: "Failed to get slot matches" });
  }
});

/**
 * GET /api/availability/stats/slot?day=2&slot=morning
 * Get statistics for a time slot (for social proof)
 */
router.get("/stats/slot", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = slotQuerySchema.parse(req.query);
    const dayOfWeek = validated.day as DayOfWeek;
    const timeSlot = validated.slot as TimeSlot;

    const stats = await getSlotStatistics(userId, dayOfWeek, timeSlot);

    res.json({
      success: true,
      dayOfWeek,
      dayName: getDayName(dayOfWeek),
      timeSlot,
      timeSlotDisplay: getTimeSlotDisplay(timeSlot),
      ...stats,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }
    console.error("Error getting slot statistics:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
});

/**
 * POST /api/availability/recalculate
 * Manually trigger match recalculation (for testing/admin)
 */
router.post("/recalculate", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matchesCreated = await calculateAvailabilityMatches(userId);

    res.json({
      success: true,
      matchesCreated,
      message: `Found ${matchesCreated} matches based on your availability`,
    });
  } catch (error) {
    console.error("Error recalculating matches:", error);
    res.status(500).json({ error: "Failed to recalculate matches" });
  }
});

/**
 * GET /api/availability/overview
 * Get a weekly overview showing matches per day/slot
 */
router.get("/overview", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const availability = await getUserAvailability(userId);
    const allMatches = await getAvailabilityMatches(userId);

    // Group matches by day and slot
    const overview = [];
    
    for (const slot of availability) {
      const matchesForSlot = allMatches.filter(({ match }) => {
        const sharedSlots = match.sharedSlots as Array<{dayOfWeek: number, timeSlot: string}>;
        return sharedSlots.some(
          s => s.dayOfWeek === slot.dayOfWeek && s.timeSlot === slot.timeSlot
        );
      });

      overview.push({
        dayOfWeek: slot.dayOfWeek,
        dayName: getDayName(slot.dayOfWeek as DayOfWeek),
        timeSlot: slot.timeSlot,
        timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot as TimeSlot),
        nextOccurrence: getNextOccurrence(slot.dayOfWeek as DayOfWeek),
        matchesCount: matchesForSlot.length,
        topMatches: matchesForSlot.slice(0, 3).map(({ user, match }) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
          distanceKm: parseFloat(match.distanceKm || '0'),
          matchScore: match.matchScore,
        })),
      });
    }

    // Sort by next occurrence
    overview.sort((a, b) => 
      a.nextOccurrence.getTime() - b.nextOccurrence.getTime()
    );

    res.json({
      success: true,
      overview,
      totalSlots: overview.length,
      totalPotentialMatches: allMatches.length,
    });
  } catch (error) {
    console.error("Error getting availability overview:", error);
    res.status(500).json({ error: "Failed to get overview" });
  }
});

export default router;
