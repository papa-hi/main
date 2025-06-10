import { Resend } from 'resend';

async function testSimpleEmail() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  console.log('Testing simple email delivery to collins@virtualweb.us...');
  
  try {
    const result = await resend.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: 'collins@virtualweb.us',
      subject: 'PaPa-Hi Email Delivery Test',
      text: `
Hello Collins,

This is a test email to verify email delivery from PaPa-Hi.

If you receive this email, our email system is working correctly.

Best regards,
PaPa-Hi Team

Time sent: ${new Date().toISOString()}
      `,
      html: `
        <h2>PaPa-Hi Email Delivery Test</h2>
        <p>Hello Collins,</p>
        <p>This is a test email to verify email delivery from PaPa-Hi.</p>
        <p>If you receive this email, our email system is working correctly.</p>
        <p>Best regards,<br>PaPa-Hi Team</p>
        <p><small>Time sent: ${new Date().toISOString()}</small></p>
      `
    });
    
    if (result.error) {
      console.error('Email send failed:', result.error);
    } else {
      console.log('Email sent successfully!');
      console.log('Email ID:', result.data?.id);
      console.log('Check your inbox and spam folder for the test email.');
    }
    
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testSimpleEmail();