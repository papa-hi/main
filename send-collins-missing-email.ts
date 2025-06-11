import { sendWelcomeEmail } from './server/email-service';

async function sendCollinsWelcomeEmail() {
  console.log('Sending welcome email to Collins with alternative approach...');
  
  // Try with a different subject and enhanced content
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const result = await resend.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: 'clidede@akamai.com',
      subject: 'Welcome to PaPa-Hi - Collins Lidede',
      text: `
Dear Collins,

Welcome to PaPa-Hi! Your account has been successfully created.

Username: rentgari
Email: clidede@akamai.com

You can now:
- Discover family-friendly places in your area
- Connect with other parents
- Organize playdates
- Rate and review locations

Visit: https://papa-hi.com to get started.

Best regards,
The PaPa-Hi Team

This email was sent because you registered for a PaPa-Hi account.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to PaPa-Hi, Collins!</h1>
          <p>Your account has been successfully created.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Account Details:</h3>
            <p><strong>Username:</strong> rentgari</p>
            <p><strong>Email:</strong> clidede@akamai.com</p>
          </div>
          
          <h3>What you can do now:</h3>
          <ul>
            <li>Discover family-friendly places in your area</li>
            <li>Connect with other parents</li>
            <li>Organize playdates</li>
            <li>Rate and review locations</li>
          </ul>
          
          <p style="margin: 30px 0;">
            <a href="https://papa-hi.com" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Get Started
            </a>
          </p>
          
          <p style="color: #666; font-size: 12px;">
            This email was sent because you registered for a PaPa-Hi account.
          </p>
        </div>
      `
    });
    
    if (result.error) {
      console.error('Failed to send email:', result.error);
    } else {
      console.log('Email sent successfully with ID:', result.data?.id);
      console.log('Please check your email (including spam folder)');
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendCollinsWelcomeEmail();