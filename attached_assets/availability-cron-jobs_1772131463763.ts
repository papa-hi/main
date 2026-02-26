import cron from 'node-cron';
import { db } from './db';
import { users, userAvailability } from '@shared/schema';
import { eq, isNull, sql } from 'drizzle-orm';
import { calculateAvailabilityMatches } from './availability-matching-service';
import { sendWeeklyAvailabilityDigest } from './availability-match-notifications';

/**
 * Setup all availability-related cron jobs
 */
export function setupAvailabilityCronJobs() {
  console.log('Setting up availability matching cron jobs...');

  // Job 1: Nightly match calculation (2am every day)
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running nightly availability match calculation...');
    await runNightlyMatchCalculation();
  });

  // Job 2: Weekly digest (Sunday evening at 6pm)
  cron.schedule('0 18 * * 0', async () => {
    console.log('[CRON] Sending weekly availability digests...');
    await sendWeeklyDigests();
  });

  // Job 3: Day-before reminders (Every day at 8pm for tomorrow's matches)
  cron.schedule('0 20 * * *', async () => {
    console.log('[CRON] Sending day-before availability reminders...');
    await sendDayBeforeReminders();
  });

  console.log('✅ Availability cron jobs scheduled:');
  console.log('   - Nightly match calculation: Daily at 2:00 AM');
  console.log('   - Weekly digest: Sundays at 6:00 PM');
  console.log('   - Day-before reminders: Daily at 8:00 PM');
}

/**
 * Run nightly match calculation for all users with availability
 */
async function runNightlyMatchCalculation(): Promise<void> {
  try {
    // Get all users who have availability set
    const usersWithAvailability = await db
      .selectDistinct({ 
        userId: userAvailability.userId,
        firstName: users.firstName 
      })
      .from(userAvailability)
      .innerJoin(users, eq(users.id, userAvailability.userId))
      .where(
        and(
          eq(userAvailability.isActive, true),
          isNull(users.role) // Regular users only
        )
      );

    console.log(`Found ${usersWithAvailability.length} users with availability to recalculate`);

    let processed = 0;
    let totalMatches = 0;

    for (const { userId, firstName } of usersWithAvailability) {
      try {
        const matchesCreated = await calculateAvailabilityMatches(userId);
        totalMatches += matchesCreated;
        processed++;

        if (matchesCreated > 0) {
          console.log(`  ✓ ${firstName} (${userId}): ${matchesCreated} matches`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to calculate matches for user ${userId}:`, error);
      }

      // Small delay to avoid overwhelming the database
      if (processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[CRON] Nightly calculation complete: ${totalMatches} matches for ${processed} users`);
  } catch (error) {
    console.error('[CRON] Error in nightly match calculation:', error);
  }
}

/**
 * Send weekly availability digest to all users
 */
async function sendWeeklyDigests(): Promise<void> {
  try {
    // Import the overview function
    const { getAvailabilityOverview } = await import('./availability-routes-helpers');

    // Get all users who have availability set
    const usersWithAvailability = await db
      .selectDistinct({ userId: userAvailability.userId })
      .from(userAvailability)
      .where(eq(userAvailability.isActive, true));

    console.log(`Sending weekly digest to ${usersWithAvailability.length} users`);

    let sent = 0;
    let skipped = 0;

    for (const { userId } of usersWithAvailability) {
      try {
        // Get overview for this user
        const overview = await getAvailabilityOverview(userId);

        // Skip if no matches
        if (!overview || overview.totalPotentialMatches === 0) {
          skipped++;
          continue;
        }

        // Send digest
        const success = await sendWeeklyAvailabilityDigest(userId, overview.overview);
        
        if (success) {
          sent++;
          console.log(`  ✓ Digest sent to user ${userId}`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`  ✗ Failed to send digest to user ${userId}:`, error);
        skipped++;
      }

      // Rate limiting
      if (sent % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[CRON] Weekly digest complete: ${sent} sent, ${skipped} skipped`);
  } catch (error) {
    console.error('[CRON] Error sending weekly digests:', error);
  }
}

/**
 * Send reminders for tomorrow's availability matches
 */
async function sendDayBeforeReminders(): Promise<void> {
  try {
    const { sendNotificationToUser } = await import('./push-notifications');
    const { getAvailabilityOverview } = await import('./availability-routes-helpers');

    // Get tomorrow's day of week (0 = Sunday, 1 = Monday, etc.)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay();

    // Get all users who have availability tomorrow
    const usersAvailableTomorrow = await db
      .selectDistinct({ userId: userAvailability.userId })
      .from(userAvailability)
      .where(
        and(
          eq(userAvailability.dayOfWeek, tomorrowDayOfWeek),
          eq(userAvailability.isActive, true)
        )
      );

    console.log(`Found ${usersAvailableTomorrow.length} users available tomorrow`);

    let sent = 0;

    for (const { userId } of usersAvailableTomorrow) {
      try {
        // Get their overview to check if they have matches tomorrow
        const overview = await getAvailabilityOverview(userId);
        
        if (!overview) continue;

        // Find tomorrow's slots
        const tomorrowSlots = overview.overview.filter(
          slot => slot.dayOfWeek === tomorrowDayOfWeek
        );

        if (tomorrowSlots.length === 0 || tomorrowSlots.every(s => s.matchesCount === 0)) {
          continue; // No matches tomorrow
        }

        // Calculate total matches for tomorrow
        const totalTomorrowMatches = tomorrowSlots.reduce(
          (sum, slot) => sum + slot.matchesCount, 
          0
        );

        // Get the day name
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayNamesNL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
        const dayName = dayNamesNL[tomorrowDayOfWeek];

        // Send reminder notification
        await sendNotificationToUser(userId, {
          title: `📅 Morgen: ${totalTomorrowMatches} ${totalTomorrowMatches === 1 ? 'Vader' : 'Vaders'} Beschikbaar`,
          body: `${dayName} heb je ${totalTomorrowMatches} playdate mogelijkheden in je buurt!`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: {
            type: 'day_before_reminder',
            dayOfWeek: tomorrowDayOfWeek,
            matchesCount: totalTomorrowMatches,
            url: '/matches'
          },
          actions: [
            {
              action: 'view_matches',
              title: 'Bekijk Matches',
              icon: '/icon-192x192.png'
            },
            {
              action: 'dismiss',
              title: 'Sluiten'
            }
          ]
        });

        sent++;
        console.log(`  ✓ Reminder sent to user ${userId} (${totalTomorrowMatches} matches)`);
      } catch (error) {
        console.error(`  ✗ Failed to send reminder to user ${userId}:`, error);
      }

      // Rate limiting
      if (sent % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`[CRON] Day-before reminders complete: ${sent} sent`);
  } catch (error) {
    console.error('[CRON] Error sending day-before reminders:', error);
  }
}

/**
 * Helper function to get availability overview (extracted for reuse)
 * This should be moved to a shared helpers file
 */
async function getAvailabilityOverview(userId: number) {
  const { getUserAvailability, getAvailabilityMatches, getNextOccurrence, getDayName, getTimeSlotDisplay } = 
    await import('./availability-matching-service');

  const availability = await getUserAvailability(userId);
  const allMatches = await getAvailabilityMatches(userId);

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
        distanceKm: parseFloat(match.distanceKm || '0'),
        matchScore: match.matchScore || 0,
      })),
    });
  }

  overview.sort((a, b) => 
    a.nextOccurrence.getTime() - b.nextOccurrence.getTime()
  );

  return {
    overview,
    totalSlots: overview.length,
    totalPotentialMatches: allMatches.length,
  };
}

// Export for use in other files
export { getAvailabilityOverview };
