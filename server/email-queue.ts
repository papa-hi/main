import { sendWelcomeEmail } from './email-service';
import { storage } from './storage';

interface EmailQueueItem {
  userId: number;
  email: string;
  firstName: string;
  username: string;
  attempts: number;
  createdAt: Date;
}

class EmailQueue {
  private queue: EmailQueueItem[] = [];
  private processing = false;
  private maxAttempts = 3;
  private retryDelay = 5000; // 5 seconds

  async addToQueue(userId: number, email: string, firstName: string, username: string) {
    const item: EmailQueueItem = {
      userId,
      email,
      firstName,
      username,
      attempts: 0,
      createdAt: new Date()
    };
    
    this.queue.push(item);
    console.log(`📧 EMAIL QUEUE: Added ${email} to welcome email queue`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      
      try {
        console.log(`📬 EMAIL QUEUE: Processing ${item.email} (attempt ${item.attempts + 1})`);
        
        const success = await sendWelcomeEmail({
          to: item.email,
          firstName: item.firstName,
          username: item.username
        });
        
        if (success) {
          console.log(`✅ EMAIL QUEUE: Successfully sent welcome email to ${item.email}`);
        } else {
          item.attempts++;
          if (item.attempts < this.maxAttempts) {
            console.log(`🔄 EMAIL QUEUE: Retrying ${item.email} in ${this.retryDelay}ms`);
            setTimeout(() => {
              this.queue.push(item);
              if (!this.processing) {
                this.processQueue();
              }
            }, this.retryDelay);
          } else {
            console.error(`💀 EMAIL QUEUE: Failed to send welcome email to ${item.email} after ${this.maxAttempts} attempts`);
          }
        }
      } catch (error) {
        console.error(`💥 EMAIL QUEUE: Error processing ${item.email}:`, error);
        item.attempts++;
        if (item.attempts < this.maxAttempts) {
          this.queue.push(item);
        }
      }
      
      // Small delay between processing items
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.processing = false;
    console.log(`📭 EMAIL QUEUE: Queue processing completed`);
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }
}

export const emailQueue = new EmailQueue();