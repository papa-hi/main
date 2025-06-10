import { sendWelcomeEmail } from './server/email-service.js';

async function sendUnityWelcome() {
  console.log('Sending welcome email to Unity...');
  
  const success = await sendWelcomeEmail({
    to: 'unityeasta212@gmail.com',
    firstName: 'Unity',
    username: 'google_uYSlF1h2'
  });
  
  console.log('Email send result:', success);
}

sendUnityWelcome();