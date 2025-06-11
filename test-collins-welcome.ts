import { sendWelcomeEmail } from './server/email-service';

async function testCollinsWelcome() {
  console.log('Testing welcome email to Collins...');
  
  const result = await sendWelcomeEmail({
    to: 'clidede@akamai.com',
    firstName: 'Collins',
    username: 'rentgari'
  });
  
  console.log('Email test result:', result);
}

testCollinsWelcome();