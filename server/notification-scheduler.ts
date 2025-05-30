import { db } from './db';
import { playdates, playdateParticipants, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendPlaydateReminder, sendPlaydateUpdate } from './push-notifications';

// Schedule reminders for a playdate
export async function schedulePlaydateReminders(playdateId: number): Promise<void> {
  try {
    // Get playdate details
    const [playdate] = await db
      .select()
      .from(playdates)
      .where(eq(playdates.id, playdateId));

    if (!playdate) {
      console.error(`Playdate ${playdateId} not found`);
      return;
    }

    // Get all participants
    const participants = await db
      .select({
        userId: playdateParticipants.userId,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(playdateParticipants)
      .innerJoin(users, eq(playdateParticipants.userId, users.id))
      .where(eq(playdateParticipants.playdateId, playdateId));

    const playdateTime = new Date(playdate.startTime);
    const now = new Date();
    
    // Calculate reminder times
    const oneHourBefore = new Date(playdateTime.getTime() - 60 * 60 * 1000);
    const thirtyMinutesBefore = new Date(playdateTime.getTime() - 30 * 60 * 1000);

    // Schedule 1-hour reminder
    if (oneHourBefore > now) {
      setTimeout(async () => {
        for (const participant of participants) {
          await sendPlaydateReminder(participant.userId, playdate.title, playdateTime);
        }
      }, oneHourBefore.getTime() - now.getTime());
    }

    // Schedule 30-minute reminder
    if (thirtyMinutesBefore > now) {
      setTimeout(async () => {
        for (const participant of participants) {
          await sendPlaydateReminder(participant.userId, playdate.title, playdateTime);
        }
      }, thirtyMinutesBefore.getTime() - now.getTime());
    }

    console.log(`Scheduled reminders for playdate: ${playdate.title}`);
  } catch (error) {
    console.error('Error scheduling playdate reminders:', error);
  }
}

// Send notifications when a new participant joins
export async function notifyNewParticipant(playdateId: number, newParticipantId: number): Promise<void> {
  try {
    // Get playdate details
    const [playdate] = await db
      .select()
      .from(playdates)
      .where(eq(playdates.id, playdateId));

    if (!playdate) {
      console.error(`Playdate ${playdateId} not found`);
      return;
    }

    // Get existing participants (excluding the new one)
    const existingParticipants = await db
      .select({
        userId: playdateParticipants.userId,
      })
      .from(playdateParticipants)
      .where(eq(playdateParticipants.playdateId, playdateId));

    // Notify existing participants about the new joiner
    for (const participant of existingParticipants) {
      if (participant.userId !== newParticipantId) {
        await sendPlaydateUpdate(participant.userId, playdate.title, 'new_participant');
      }
    }

    console.log(`Notified participants about new joiner for playdate: ${playdate.title}`);
  } catch (error) {
    console.error('Error notifying about new participant:', error);
  }
}

// Send notifications when a playdate is cancelled
export async function notifyPlaydateCancelled(playdateId: number): Promise<void> {
  try {
    // Get playdate details
    const [playdate] = await db
      .select()
      .from(playdates)
      .where(eq(playdates.id, playdateId));

    if (!playdate) {
      console.error(`Playdate ${playdateId} not found`);
      return;
    }

    // Get all participants
    const participants = await db
      .select({
        userId: playdateParticipants.userId,
      })
      .from(playdateParticipants)
      .where(eq(playdateParticipants.playdateId, playdateId));

    // Notify all participants about cancellation
    for (const participant of participants) {
      await sendPlaydateUpdate(participant.userId, playdate.title, 'cancelled');
    }

    console.log(`Notified participants about cancellation of playdate: ${playdate.title}`);
  } catch (error) {
    console.error('Error notifying about playdate cancellation:', error);
  }
}

// Send notifications when a playdate is modified
export async function notifyPlaydateModified(playdateId: number): Promise<void> {
  try {
    // Get playdate details
    const [playdate] = await db
      .select()
      .from(playdates)
      .where(eq(playdates.id, playdateId));

    if (!playdate) {
      console.error(`Playdate ${playdateId} not found`);
      return;
    }

    // Get all participants
    const participants = await db
      .select({
        userId: playdateParticipants.userId,
      })
      .from(playdateParticipants)
      .where(eq(playdateParticipants.playdateId, playdateId));

    // Notify all participants about the modification
    for (const participant of participants) {
      await sendPlaydateUpdate(participant.userId, playdate.title, 'modified');
    }

    console.log(`Notified participants about modification of playdate: ${playdate.title}`);
  } catch (error) {
    console.error('Error notifying about playdate modification:', error);
  }
}