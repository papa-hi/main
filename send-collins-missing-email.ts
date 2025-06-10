import { sendWelcomeEmail } from './server/email-service.js';

async function sendCollinsWelcomeEmail() {
  console.log('Sending missing welcome email to Collins...');
  
  const success = await sendWelcomeEmail({
    to: 'collins@sisterschools.eu',
    firstName: 'Collins',
    username: 'google_j6AfW1OD'
  });
  
  if (success) {
    console.log('Welcome email successfully sent to Collins');
  } else {
    console.log('Failed to send welcome email to Collins');
  }
}

sendCollinsWelcomeEmail();