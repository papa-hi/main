import { db } from "./db";
import { playdates, familyEvents, playdateParticipants } from "@shared/schema";
import { lt, and, isNull, isNotNull, inArray } from "drizzle-orm";

const NINETY_DAYS_IN_MS = 90 * 24 * 60 * 60 * 1000;
const TWELVE_MONTHS_IN_MS = 365 * 24 * 60 * 60 * 1000;

export class CleanupService {
  async archiveOldItems(): Promise<{ archivedPlaydates: number; archivedEvents: number }> {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - NINETY_DAYS_IN_MS);
    
    console.log(`[CLEANUP] Archiving playdates and events older than ${ninetyDaysAgo.toISOString()}`);
    
    const archivedPlaydates = await db.update(playdates)
      .set({ archivedAt: now })
      .where(
        and(
          lt(playdates.endTime, ninetyDaysAgo),
          isNull(playdates.archivedAt)
        )
      )
      .returning();
    
    const archivedEvents = await db.update(familyEvents)
      .set({ archivedAt: now })
      .where(
        and(
          lt(familyEvents.endDate, ninetyDaysAgo),
          isNull(familyEvents.archivedAt)
        )
      )
      .returning();
    
    console.log(`[CLEANUP] Archived ${archivedPlaydates.length} playdates and ${archivedEvents.length} events`);
    
    return {
      archivedPlaydates: archivedPlaydates.length,
      archivedEvents: archivedEvents.length
    };
  }
  
  async deleteOldArchivedItems(): Promise<{ deletedPlaydates: number; deletedEvents: number }> {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getTime() - TWELVE_MONTHS_IN_MS);
    
    console.log(`[CLEANUP] Deleting archived items older than ${twelveMonthsAgo.toISOString()}`);
    
    const oldArchivedPlaydates = await db.select({ id: playdates.id })
      .from(playdates)
      .where(
        and(
          isNotNull(playdates.archivedAt),
          lt(playdates.archivedAt, twelveMonthsAgo)
        )
      );
    
    if (oldArchivedPlaydates.length > 0) {
      const playdateIds = oldArchivedPlaydates.map((p: { id: number }) => p.id);
      
      await db.delete(playdateParticipants)
        .where(
          inArray(playdateParticipants.playdateId, playdateIds)
        );
      
      await db.delete(playdates)
        .where(inArray(playdates.id, playdateIds));
    }
    
    const deletedEvents = await db.delete(familyEvents)
      .where(
        and(
          isNotNull(familyEvents.archivedAt),
          lt(familyEvents.archivedAt, twelveMonthsAgo)
        )
      )
      .returning();
    
    console.log(`[CLEANUP] Deleted ${oldArchivedPlaydates.length} playdates and ${deletedEvents.length} events`);
    
    return {
      deletedPlaydates: oldArchivedPlaydates.length,
      deletedEvents: deletedEvents.length
    };
  }
  
  async runFullCleanup(): Promise<{
    archived: { archivedPlaydates: number; archivedEvents: number };
    deleted: { deletedPlaydates: number; deletedEvents: number };
  }> {
    console.log('[CLEANUP] Starting full cleanup process...');
    
    const archived = await this.archiveOldItems();
    const deleted = await this.deleteOldArchivedItems();
    
    console.log('[CLEANUP] Cleanup process completed', { archived, deleted });
    
    return { archived, deleted };
  }
}

export const cleanupService = new CleanupService();
