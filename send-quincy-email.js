import { sendWelcomeEmail } from './server/email-service.js';

async function sendEmailToQuincy() {
  try {
    console.log('Sending welcome email to Quincy Jones...');
    
    const result = await sendWelcomeEmail({
      to: 'collins@virtualweb.us',
      firstName: 'Quincy',
      username: 'Quincy'
    });
    
    if (result) {
      console.log('Welcome email sent successfully to Quincy!');
    } else {
      console.log('Failed to send welcome email to Quincy');
    }
  } catch (error) {
    console.error('Error sending email to Quincy:', error);
  }
}

sendEmailToQuincy();