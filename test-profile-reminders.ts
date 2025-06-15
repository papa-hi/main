import { testProfileCompletionCheck, runWeeklyProfileReminders } from './server/profile-reminder-scheduler';

/**
 * Test script to check profile completion and optionally send reminders
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check':
      console.log('Checking for incomplete profiles...');
      await testProfileCompletionCheck();
      break;
      
    case 'send':
      console.log('Sending profile reminder emails...');
      await runWeeklyProfileReminders();
      break;
      
    default:
      console.log('Profile Reminder System');
      console.log('Usage:');
      console.log('  npm run test:profile-reminders check  - Check for incomplete profiles');
      console.log('  npm run test:profile-reminders send   - Send reminder emails');
      console.log('');
      console.log('Examples:');
      console.log('  tsx test-profile-reminders.ts check');
      console.log('  tsx test-profile-reminders.ts send');
      break;
  }
}

main().catch(console.error);