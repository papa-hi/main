import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailConfiguration() {
  try {
    console.log('Testing Resend configuration...');
    
    // Test 1: Check if API key is working
    const { data: domains, error: domainsError } = await resend.domains.list();
    
    if (domainsError) {
      console.error('Domain list error:', domainsError);
      return;
    }
    
    console.log('Verified domains:', domains);
    
    // Test 2: Try sending a test email
    const { data, error } = await resend.emails.send({
      from: 'PaPa-Hi <welcome@papa-hi.com>',
      to: ['papa@papa-hi.com'],
      subject: 'Configuration Test',
      html: '<h1>Configuration Test</h1><p>This is a test to verify domain configuration.</p>',
    });

    if (error) {
      console.error('Test email error:', error);
    } else {
      console.log('Test email sent successfully:', data);
    }

  } catch (error) {
    console.error('Configuration test failed:', error);
  }
}

testEmailConfiguration();