import { sendWelcomeEmail } from './server/email-service.js';

async function sendNewUserWelcome() {
  console.log('Sending welcome email to new user collins (lidedecba@gmail.com)...');
  
  const success = await sendWelcomeEmail({
    to: 'lidedecba@gmail.com',
    firstName: 'collins',
    username: 'google_DyIqjMiW'
  });
  
  if (success) {
    console.log('Welcome email successfully sent');
  } else {
    console.log('Failed to send welcome email');
  }
}

sendNewUserWelcome();