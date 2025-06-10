import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailData {
  to: string;
  firstName: string;
  username: string;
}

export async function sendWelcomeEmail({ to, firstName, username }: WelcomeEmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: 'PaPa-Hi <welcome@papa-hi.app>',
      to: [to],
      subject: 'Welcome to PaPa-Hi! 🎉',
      html: generateWelcomeEmailHTML(firstName, username),
      text: generateWelcomeEmailText(firstName, username),
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }

    console.log('Welcome email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

function generateWelcomeEmailHTML(firstName: string, username: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to PaPa-Hi!</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #ff6b35;
          margin-bottom: 10px;
        }
        .welcome-title {
          color: #2c3e50;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content {
          color: #555;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .features {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .feature-item {
          margin: 10px 0;
          display: flex;
          align-items: center;
        }
        .feature-icon {
          color: #ff6b35;
          margin-right: 10px;
          font-size: 18px;
        }
        .cta-button {
          display: inline-block;
          background-color: #ff6b35;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #888;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PaPa-Hi</div>
          <h1 class="welcome-title">Welcome to PaPa-Hi, ${firstName}! 🎉</h1>
        </div>
        
        <div class="content">
          <p>Hi <strong>${firstName}</strong>,</p>
          
          <p>Welcome to PaPa-Hi! We're thrilled to have you join our community of Dutch parents who are making it easier to connect, discover family-friendly places, and organize playdates.</p>
          
          <p>Your account (<strong>${username}</strong>) is now ready, and you can start exploring everything PaPa-Hi has to offer:</p>
          
          <div class="features">
            <div class="feature-item">
              <span class="feature-icon">🏰</span>
              <span>Discover amazing playgrounds, restaurants, and museums</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📍</span>
              <span>Find family-friendly places near you</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">👨‍👩‍👧‍👦</span>
              <span>Organize playdates with other families</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">⭐</span>
              <span>Rate and review places you visit</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💬</span>
              <span>Connect with other parents in your area</span>
            </div>
          </div>
          
          <p>Ready to get started? Log in to your account and begin exploring!</p>
          
          <center>
            <a href="${process.env.NODE_ENV === 'production' ? 'https://papa-hi.app' : 'http://localhost:5000'}" class="cta-button">
              Start Exploring PaPa-Hi
            </a>
          </center>
          
          <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
          
          <p>Happy exploring!<br>
          The PaPa-Hi Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent because you created an account with PaPa-Hi.</p>
          <p>© 2025 PaPa-Hi. Made with ❤️ for Dutch families.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateWelcomeEmailText(firstName: string, username: string): string {
  return `
Welcome to PaPa-Hi, ${firstName}! 🎉

Hi ${firstName},

Welcome to PaPa-Hi! We're thrilled to have you join our community of Dutch parents who are making it easier to connect, discover family-friendly places, and organize playdates.

Your account (${username}) is now ready, and you can start exploring everything PaPa-Hi has to offer:

🏰 Discover amazing playgrounds, restaurants, and museums
📍 Find family-friendly places near you  
👨‍👩‍👧‍👦 Organize playdates with other families
⭐ Rate and review places you visit
💬 Connect with other parents in your area

Ready to get started? Log in to your account and begin exploring!

Visit: ${process.env.NODE_ENV === 'production' ? 'https://papa-hi.app' : 'http://localhost:5000'}

If you have any questions or need help getting started, feel free to reach out to our support team.

Happy exploring!
The PaPa-Hi Team

---
This email was sent because you created an account with PaPa-Hi.
© 2025 PaPa-Hi. Made with ❤️ for Dutch families.
  `;
}

export async function sendTestEmail(to: string): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'PaPa-Hi <test@papa-hi.app>',
      to: [to],
      subject: 'Test Email from PaPa-Hi',
      html: '<h1>Test Email</h1><p>This is a test email from PaPa-Hi to verify email functionality.</p>',
      text: 'Test Email - This is a test email from PaPa-Hi to verify email functionality.',
    });

    if (error) {
      console.error('Error sending test email:', error);
      return false;
    }

    console.log('Test email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send test email:', error);
    return false;
  }
}