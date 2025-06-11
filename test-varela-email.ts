import { sendWelcomeEmail } from './server/email-service';

async function testVarelaEmail() {
  console.log('Testing updated email with Varela Round font...');
  
  const result = await sendWelcomeEmail({
    to: 'Collins@virtualweb.us',
    firstName: 'Collins',
    username: 'joash'
  });
  
  console.log('Email test result:', result);
}

testVarelaEmail();