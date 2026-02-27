import cron from "node-cron";
import { db } from "./db";
import { users, userAvailability } from "@shared/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import {
  calculateAvailabilityMatches,
  getUserAvailability,
  getAvailabilityMatches,
  getNextOccurrence,
  getDayName,
  getTimeSlotDisplay,
} from "./availability-matching-service";
import { sendWeeklyAvailabilityDigest } from "./availability-match-notifications";
import { sendNotificationToUser } from "./push-notifications";

export function setupAvailabilityCronJobs() {
  console.log("Setting up availability matching cron jobs...");

  cron.schedule("0 2 * * *", async () => {
    console.log("[CRON] Running nightly availability match calculation...");
    await runNightlyMatchCalculation();
  });

  cron.schedule("30 2 * * *", async () => {
    console.log("[CRON] Running nightly dad profile match calculation...");
    await runNightlyDadMatchCalculation();
  });

  cron.schedule("0 18 * * 0", async () => {
    console.log("[CRON] Sending weekly availability digests...");
    await sendWeeklyDigests();
  });

  cron.schedule("0 20 * * *", async () => {
    console.log("[CRON] Sending day-before availability reminders...");
    await sendDayBeforeReminders();
  });

  console.log("Availability cron jobs scheduled:");
  console.log("   - Nightly availability match calculation: Daily at 2:00 AM");
  console.log("   - Nightly dad profile match calculation: Daily at 2:30 AM");
  console.log("   - Weekly digest: Sundays at 6:00 PM");
  console.log("   - Day-before reminders: Daily at 8:00 PM");
}

async function runNightlyMatchCalculation(): Promise<void> {
  try {
    const usersWithAvailability = await db
      .selectDistinct({
        userId: userAvailability.userId,
      })
      .from(userAvailability)
      .innerJoin(users, eq(users.id, userAvailability.userId))
      .where(eq(userAvailability.isActive, true));

    console.log(
      `Found ${usersWithAvailability.length} users with availability to recalculate`
    );

    let processed = 0;
    let totalMatches = 0;

    for (const { userId } of usersWithAvailability) {
      try {
        const matchesCreated = await calculateAvailabilityMatches(userId);
        totalMatches += matchesCreated;
        processed++;

        if (matchesCreated > 0) {
          console.log(`  [CRON] User ${userId}: ${matchesCreated} matches`);
        }
      } catch (error) {
        console.error(
          `  [CRON] Failed to calculate matches for user ${userId}:`,
          error
        );
      }

      if (processed % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `[CRON] Nightly calculation complete: ${totalMatches} matches for ${processed} users`
    );
  } catch (error) {
    console.error("[CRON] Error in nightly match calculation:", error);
  }
}

async function runNightlyDadMatchCalculation(): Promise<void> {
  try {
    const { runDadMatchingForAllUsers } = await import("./dad-matching-service");
    const result = await runDadMatchingForAllUsers();
    console.log(
      `[CRON] Nightly dad match calculation complete: ${result.totalMatches} matches for ${result.usersProcessed} users`
    );
  } catch (error) {
    console.error("[CRON] Error in nightly dad match calculation:", error);
  }
}

async function getAvailabilityOverview(userId: number) {
  const availability = await getUserAvailability(userId);
  const allMatches = await getAvailabilityMatches(userId);

  const overview = [];

  for (const slot of availability) {
    const matchesForSlot = allMatches.filter(({ match }) => {
      const sharedSlots = match.sharedSlots as Array<{
        dayOfWeek: number;
        timeSlot: string;
      }>;
      return sharedSlots.some(
        (s) =>
          s.dayOfWeek === slot.dayOfWeek && s.timeSlot === slot.timeSlot
      );
    });

    overview.push({
      dayOfWeek: slot.dayOfWeek,
      dayName: getDayName(slot.dayOfWeek as any),
      timeSlot: slot.timeSlot,
      timeSlotDisplay: getTimeSlotDisplay(slot.timeSlot as any),
      nextOccurrence: getNextOccurrence(slot.dayOfWeek as any),
      matchesCount: matchesForSlot.length,
      topMatches: matchesForSlot.slice(0, 3).map(({ user, match }) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        distanceKm: parseFloat(match.distanceKm || "0"),
        matchScore: match.matchScore || 0,
      })),
    });
  }

  overview.sort(
    (a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime()
  );

  return {
    overview,
    totalSlots: overview.length,
    totalPotentialMatches: allMatches.length,
  };
}

async function sendWeeklyDigests(): Promise<void> {
  try {
    const usersWithAvailability = await db
      .selectDistinct({ userId: userAvailability.userId })
      .from(userAvailability)
      .where(eq(userAvailability.isActive, true));

    console.log(
      `Sending weekly digest to ${usersWithAvailability.length} users`
    );

    let sent = 0;
    let skipped = 0;

    for (const { userId } of usersWithAvailability) {
      try {
        const overview = await getAvailabilityOverview(userId);

        if (!overview || overview.totalPotentialMatches === 0) {
          skipped++;
          continue;
        }

        const success = await sendWeeklyAvailabilityDigest(
          userId,
          overview.overview
        );

        if (success) {
          sent++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(
          `  [CRON] Failed to send digest to user ${userId}:`,
          error
        );
        skipped++;
      }

      if (sent % 10 === 0 && sent > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(
      `[CRON] Weekly digest complete: ${sent} sent, ${skipped} skipped`
    );
  } catch (error) {
    console.error("[CRON] Error sending weekly digests:", error);
  }
}

async function sendDayBeforeReminders(): Promise<void> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay();

    const usersAvailableTomorrow = await db
      .selectDistinct({ userId: userAvailability.userId })
      .from(userAvailability)
      .where(
        and(
          eq(userAvailability.dayOfWeek, tomorrowDayOfWeek),
          eq(userAvailability.isActive, true)
        )
      );

    console.log(
      `Found ${usersAvailableTomorrow.length} users available tomorrow`
    );

    let sent = 0;

    for (const { userId } of usersAvailableTomorrow) {
      try {
        const overview = await getAvailabilityOverview(userId);

        if (!overview) continue;

        const tomorrowSlots = overview.overview.filter(
          (slot) => slot.dayOfWeek === tomorrowDayOfWeek
        );

        if (
          tomorrowSlots.length === 0 ||
          tomorrowSlots.every((s) => s.matchesCount === 0)
        ) {
          continue;
        }

        const totalTomorrowMatches = tomorrowSlots.reduce(
          (sum, slot) => sum + slot.matchesCount,
          0
        );

        const dayName = getDayName(tomorrowDayOfWeek as any);

        await sendNotificationToUser(userId, {
          title: `Tomorrow: ${totalTomorrowMatches} ${totalTomorrowMatches === 1 ? "Dad" : "Dads"} Available`,
          body: `${dayName} you have ${totalTomorrowMatches} playdate opportunities nearby!`,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          data: {
            type: "day_before_reminder",
            dayOfWeek: tomorrowDayOfWeek,
            matchesCount: totalTomorrowMatches,
            url: "/matches",
          },
          actions: [
            {
              action: "view_matches",
              title: "View Matches",
              icon: "/icon-192x192.png",
            },
            {
              action: "dismiss",
              title: "Dismiss",
            },
          ],
        });

        sent++;
      } catch (error) {
        console.error(
          `  [CRON] Failed to send reminder to user ${userId}:`,
          error
        );
      }

      if (sent % 10 === 0 && sent > 0) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    console.log(`[CRON] Day-before reminders complete: ${sent} sent`);
  } catch (error) {
    console.error("[CRON] Error sending day-before reminders:", error);
  }
}
