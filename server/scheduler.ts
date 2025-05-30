import { CronJob } from 'cron';
import { db } from './db';
import { playdates } from '@shared/schema';
import { gte, lte, and } from 'drizzle-orm';
import { sendPlaydateReminder } from './notifications';

// Check for playdates that need reminders (24 hours before start time)
export const setupPlaydateReminders = () => {
  // Run every hour to check for upcoming playdates
  const reminderJob = new CronJob('0 * * * *', async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Find playdates starting in 24-25 hours
      const upcomingPlaydates = await db
        .select()
        .from(playdates)
        .where(
          and(
            gte(playdates.startTime, in24Hours),
            lte(playdates.startTime, in25Hours)
          )
        );

      console.log(`Found ${upcomingPlaydates.length} playdates needing reminders`);

      // Send reminders for each playdate
      for (const playdate of upcomingPlaydates) {
        try {
          await sendPlaydateReminder(playdate.id);
          console.log(`Sent reminder for playdate: ${playdate.title}`);
        } catch (error) {
          console.error(`Failed to send reminder for playdate ${playdate.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  });

  reminderJob.start();
  console.log('Playdate reminder scheduler started');
  
  return reminderJob;
};