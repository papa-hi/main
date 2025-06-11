import { sendWelcomeEmail } from './server/email-service';

async function testEmailAfterRestart() {
  console.log('Testing email after server restart...');
  
  const result = await sendWelcomeEmail({
    to: 'Collins@virtualweb.us',
    firstName: 'Collins',
    username: 'Lidede'
  });
  
  console.log('Email test result after restart:', result);
  
  // Also test the HTML generation directly
  const fs = require('fs');
  const emailModule = require('./server/email-service');
  
  // Generate a sample HTML to verify animations are included
  const htmlContent = emailModule.generateWelcomeEmailHTML?.('Collins', 'Lidede') || 'Function not found';
  
  if (typeof htmlContent === 'string' && htmlContent.includes('animation:')) {
    console.log('✅ HTML contains animations');
  } else {
    console.log('❌ HTML does not contain animations');
  }
  
  if (typeof htmlContent === 'string' && htmlContent.includes('Varela Round')) {
    console.log('✅ HTML contains Varela Round font');
  } else {
    console.log('❌ HTML does not contain Varela Round font');
  }
  
  // Save a sample for inspection
  if (typeof htmlContent === 'string') {
    fs.writeFileSync('sample-email.html', htmlContent);
    console.log('📄 Sample email saved as sample-email.html');
  }
}

testEmailAfterRestart();