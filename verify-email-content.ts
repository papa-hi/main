import { generateWelcomeEmailHTML } from './server/email-service';

function verifyEmailContent() {
  console.log('Verifying email HTML content...');
  
  const htmlContent = generateWelcomeEmailHTML('Collins', 'Lidede');
  
  // Check for key animation elements
  const hasAnimations = htmlContent.includes('animation:');
  const hasVarelaFont = htmlContent.includes('Varela Round');
  const hasSVGAnimations = htmlContent.includes('<animate');
  const hasFloatingHearts = htmlContent.includes('floating-hearts');
  const hasBounceIn = htmlContent.includes('bounce-in');
  const hasSlideIn = htmlContent.includes('slide-in');
  const hasPulse = htmlContent.includes('pulse');
  
  console.log('Animation checks:');
  console.log('- CSS animations:', hasAnimations ? '✅' : '❌');
  console.log('- Varela Round font:', hasVarelaFont ? '✅' : '❌');
  console.log('- SVG animations:', hasSVGAnimations ? '✅' : '❌');
  console.log('- Floating hearts:', hasFloatingHearts ? '✅' : '❌');
  console.log('- Bounce-in effect:', hasBounceIn ? '✅' : '❌');
  console.log('- Slide-in effect:', hasSlideIn ? '✅' : '❌');
  console.log('- Pulse effect:', hasPulse ? '✅' : '❌');
  
  if (hasAnimations && hasVarelaFont && hasSVGAnimations) {
    console.log('\n✅ Email template contains all expected animations');
  } else {
    console.log('\n❌ Email template is missing some animations');
  }
  
  // Save the content to a file for inspection
  const fs = require('fs');
  fs.writeFileSync('current-email-template.html', htmlContent);
  console.log('\n📄 Current email template saved to current-email-template.html');
  
  return htmlContent;
}

verifyEmailContent();