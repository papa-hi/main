import { sendWelcomeEmail } from './server/email-service.js';

async function sendLidedecWelcome() {
  console.log('Sending welcome email to lidedec@hotmail.com...');
  
  const success = await sendWelcomeEmail({
    to: 'lidedec@hotmail.com',
    firstName: 'Lidede',
    username: 'jose'
  });
  
  if (success) {
    console.log('Welcome email successfully sent');
  } else {
    console.log('Failed to send welcome email');
  }
}

sendLidedecWelcome();