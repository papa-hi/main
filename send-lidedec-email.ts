import { sendWelcomeEmail } from './server/email-service';

async function sendLidedecWelcome() {
  console.log('Sending welcome email to Collins Lidede...');
  
  const result = await sendWelcomeEmail({
    to: 'Lidede@collinslidede.com',
    firstName: 'Collins',
    username: 'Lidede'
  });
  
  if (result) {
    console.log('Email sent successfully to Collins Lidede');
  } else {
    console.log('Failed to send email to Collins Lidede');
  }
}

sendLidedecWelcome();