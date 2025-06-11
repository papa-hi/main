import { sendWelcomeEmail } from './server/email-service';

async function sendUpdatedLidedeEmail() {
  console.log('Sending updated Gmail-compatible email to Collins Lidede...');
  
  const result = await sendWelcomeEmail({
    to: 'Lidede@collinslidede.com',
    firstName: 'Collins',
    username: 'Lidede'
  });
  
  if (result) {
    console.log('Updated email sent successfully to Collins Lidede');
    console.log('This version uses CSS animations and emojis instead of SVG');
    console.log('Should display properly in Gmail, Outlook, and other email clients');
  } else {
    console.log('Failed to send updated email');
  }
}

sendUpdatedLidedeEmail();