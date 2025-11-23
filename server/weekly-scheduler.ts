import { runWeeklyProfileReminders } from './profile-reminder-scheduler';
import { cleanupService } from './cleanup-service';

/**
 * Simple weekly scheduler for profile reminders and database cleanup
 * This can be called from a cron job or scheduled task
 */
class WeeklyScheduler {
  private isRunning = false;
  private lastRun: Date | null = null;

  /**
   * Check if it's time to run the weekly tasks
   * Runs every Monday at 10:00 AM
   */
  private shouldRun(): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = now.getHours();

    // Run on Mondays at 10 AM
    if (dayOfWeek !== 1 || hour !== 10) {
      return false;
    }

    // Check if we already ran today
    if (this.lastRun) {
      const today = new Date().toDateString();
      const lastRunDate = this.lastRun.toDateString();
      if (today === lastRunDate) {
        return false; // Already ran today
      }
    }

    return true;
  }

  /**
   * Run the weekly profile reminders and database cleanup if it's time
   */
  async checkAndRun(): Promise<void> {
    if (this.isRunning) {
      console.log('Weekly scheduler already running, skipping...');
      return;
    }

    if (!this.shouldRun()) {
      return; // Not time to run
    }

    try {
      this.isRunning = true;
      console.log('Starting weekly tasks (profile reminders + database cleanup)...');
      
      await runWeeklyProfileReminders();
      await cleanupService.runFullCleanup();
      
      this.lastRun = new Date();
      console.log('Weekly tasks completed successfully');
      
    } catch (error) {
      console.error('Error in weekly scheduler:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Force run the weekly tasks (for testing or manual execution)
   */
  async forceRun(): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduler already running, please wait...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('Manually running weekly tasks...');
      
      await runWeeklyProfileReminders();
      await cleanupService.runFullCleanup();
      
      this.lastRun = new Date();
      console.log('Manual weekly tasks completed successfully');
      
    } catch (error) {
      console.error('Error in manual scheduler run:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the scheduler that checks every hour
   */
  start(): void {
    console.log('Starting weekly scheduler (profile reminders + database cleanup)...');
    console.log('Will check every hour and run on Mondays at 10 AM');
    
    // Check immediately
    this.checkAndRun();
    
    // Then check every hour
    setInterval(() => {
      this.checkAndRun();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; lastRun: Date | null; nextCheck: string } {
    const now = new Date();
    const nextMonday = new Date(now);
    
    // Calculate next Monday at 10 AM
    const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(10, 0, 0, 0);
    
    // If today is Monday and it's before 10 AM, next check is today
    if (now.getDay() === 1 && now.getHours() < 10) {
      nextMonday.setDate(now.getDate());
    }

    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextCheck: nextMonday.toLocaleString()
    };
  }
}

// Create and export singleton instance
export const weeklyScheduler = new WeeklyScheduler();

// Auto-start the scheduler in production
if (process.env.NODE_ENV === 'production') {
  weeklyScheduler.start();
}