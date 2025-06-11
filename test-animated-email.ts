import { sendWelcomeEmail } from './server/email-service';

async function testAnimatedEmail() {
  console.log('Testing complete animated welcome email...');
  
  const result = await sendWelcomeEmail({
    to: 'Collins@virtualweb.us',
    firstName: 'Collins',
    username: 'testuser'
  });
  
  console.log('Animated email test result:', result);
  
  if (result) {
    console.log('✅ Animated welcome email sent successfully!');
    console.log('📧 Features included:');
    console.log('   - Bouncing logo animation');
    console.log('   - Floating colorful circles');
    console.log('   - Animated playground scene with family figures');
    console.log('   - Sliding welcome title');
    console.log('   - Staggered feature icon animations');
    console.log('   - Pulsing CTA button');
    console.log('   - Animated footer playground illustration');
    console.log('   - Moving swing, seesaw, and children');
    console.log('   - Floating hearts and interactive elements');
  } else {
    console.log('❌ Failed to send animated email');
  }
}

testAnimatedEmail();