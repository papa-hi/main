import { Resend } from 'resend';

async function diagnoseEmailDelivery() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  console.log('=== Email Delivery Diagnosis ===');
  
  try {
    // Check domain verification status
    console.log('1. Checking domain verification...');
    const domains = await resend.domains.list();
    console.log('Domains:', JSON.stringify(domains, null, 2));
    
    // Check recent emails sent
    console.log('\n2. Checking recent email activity...');
    const emails = await resend.emails.list({ limit: 10 });
    console.log('Recent emails:', JSON.stringify(emails, null, 2));
    
    // Test with a simple email to collins@virtualweb.us
    console.log('\n3. Testing direct email send...');
    const testResult = await resend.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: 'collins@virtualweb.us',
      subject: 'Email Delivery Test',
      text: 'This is a test email to diagnose delivery issues.',
      html: '<p>This is a test email to diagnose delivery issues.</p>'
    });
    
    console.log('Test email result:', testResult);
    
    if (testResult.error) {
      console.error('Test email failed:', testResult.error);
    } else {
      console.log('Test email sent successfully with ID:', testResult.data?.id);
    }
    
  } catch (error) {
    console.error('Diagnosis failed:', error);
  }
}

diagnoseEmailDelivery();