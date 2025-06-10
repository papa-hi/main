import { sendWelcomeEmail } from './server/email-service.js';

async function testCollinsWelcome() {
  console.log('Testing welcome email for Collins...');
  
  const success = await sendWelcomeEmail({
    to: 'collins@sisterschools.eu',
    firstName: 'Collins',
    username: 'google_j6AfW1OD'
  });
  
  console.log('Email send result:', success);
}

testCollinsWelcome().catch(console.error);