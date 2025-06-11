import { sendWelcomeEmail } from './server/email-service';

async function testGmailCompatibleEmail() {
  console.log('Testing Gmail-compatible animated email...');
  
  const result = await sendWelcomeEmail({
    to: 'Collins@virtualweb.us',
    firstName: 'Collins',
    username: 'Lidede'
  });
  
  console.log('Gmail-compatible email test result:', result);
  
  if (result) {
    console.log('Gmail-compatible email sent successfully');
    console.log('Features included:');
    console.log('- CSS animations (no SVG)');
    console.log('- Emoji-based playground scene');
    console.log('- Bouncing, floating, and pulsing effects');
    console.log('- Staggered animation delays');
    console.log('- Family-themed footer animations');
    console.log('- Compatible with Gmail and Outlook');
  }
}

testGmailCompatibleEmail();