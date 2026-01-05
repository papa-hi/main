import { storage } from './storage';
import { sendProfileReminderEmail } from './email-service';

interface IncompleteUser {
  id: number;
  firstName: string;
  username: string;
  email: string;
  missingFields: string[];
}

/**
 * Identifies users with incomplete profiles using optimized SQL query
 * This replaces the previous approach that loaded all users into memory
 */
async function findUsersWithIncompleteProfiles(): Promise<IncompleteUser[]> {
  try {
    console.log('Finding users with incomplete profiles (optimized SQL query)...');
    
    // Use optimized storage method that filters at database level
    const incompleteUsers = await storage.getUsersWithIncompleteProfiles();

    console.log(`Found ${incompleteUsers.length} users with incomplete profiles`);
    return incompleteUsers;
  } catch (error) {
    console.error('Error finding incomplete profiles:', error);
    return [];
  }
}

/**
 * Sends profile reminder emails to users with incomplete profiles
 */
async function sendProfileReminders(): Promise<void> {
  try {
    console.log('Starting weekly profile reminder process...');
    
    const incompleteUsers = await findUsersWithIncompleteProfiles();
    
    if (incompleteUsers.length === 0) {
      console.log('No users found with incomplete profiles');
      return;
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const user of incompleteUsers) {
      try {
        console.log(`Sending profile reminder to ${user.firstName} (${user.email})`);
        console.log(`Missing fields: ${user.missingFields.join(', ')}`);

        const success = await sendProfileReminderEmail({
          to: user.email,
          firstName: user.firstName,
          username: user.username,
          missingFields: user.missingFields
        });

        if (success) {
          emailsSent++;
          
          // Log this activity for admin tracking
          await storage.logUserActivity({
            userId: user.id,
            action: 'profile_reminder_sent',
            details: JSON.stringify({
              missingFields: user.missingFields,
              emailSent: true,
              reminderType: 'weekly_profile_completion'
            }),
            ipAddress: 'system',
            userAgent: 'profile-reminder-scheduler'
          });
        } else {
          emailsFailed++;
          console.warn(`Failed to send profile reminder to ${user.email}`);
        }

        // Add a small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        emailsFailed++;
        console.error(`Error sending reminder to ${user.email}:`, error);
      }
    }

    console.log(`Profile reminder process completed:`);
    console.log(`- Total incomplete profiles: ${incompleteUsers.length}`);
    console.log(`- Emails sent successfully: ${emailsSent}`);
    console.log(`- Emails failed: ${emailsFailed}`);

  } catch (error) {
    console.error('Error in profile reminder process:', error);
  }
}

/**
 * Runs the profile reminder scheduler
 * This function should be called weekly
 */
export async function runWeeklyProfileReminders(): Promise<void> {
  console.log('='.repeat(50));
  console.log('WEEKLY PROFILE REMINDER SCHEDULER');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  await sendProfileReminders();

  console.log('='.repeat(50));
  console.log('WEEKLY PROFILE REMINDER COMPLETED');
  console.log(`Finished at: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
}

/**
 * Test function to check incomplete profiles without sending emails
 */
export async function testProfileCompletionCheck(): Promise<void> {
  console.log('Testing profile completion checker...');
  
  const incompleteUsers = await findUsersWithIncompleteProfiles();
  
  console.log(`Found ${incompleteUsers.length} users with incomplete profiles:`);
  
  incompleteUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.firstName} (${user.username})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Missing: ${user.missingFields.join(', ')}`);
    console.log('');
  });
}

// Export the scheduler for manual testing and scheduling
export { sendProfileReminders, findUsersWithIncompleteProfiles };