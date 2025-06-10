import { Resend } from 'resend';

async function testEmailDirect() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('Testing direct email send to papa@papa-hi.com...');
    
    const { data, error } = await resend.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: ['papa@papa-hi.com'],
      subject: 'Direct Test Email',
      html: '<h1>Direct Test</h1><p>This is a direct test email to verify Resend configuration.</p>',
      text: 'Direct Test - This is a direct test email to verify Resend configuration.',
    });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success:', data);
    }
  } catch (error) {
    console.error('Exception:', error);
  }
}

testEmailDirect();