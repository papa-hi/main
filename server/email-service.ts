import { Resend } from 'resend';

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return null;
  }
  
  if (!resend) {
    resend = new Resend(apiKey);
  }
  
  return resend;
}

interface WelcomeEmailData {
  to: string;
  firstName: string;
  username: string;
}

export async function sendWelcomeEmail({ to, firstName, username }: WelcomeEmailData): Promise<boolean> {
  try {
    const resendClient = getResendClient();
    
    if (!resendClient) {
      console.warn('RESEND_API_KEY is not configured - skipping welcome email');
      console.log(`Welcome email would be sent to: ${to}`);
      console.log('Subject: Welcome to PaPa-Hi! 🎉');
      console.log('Content: Professional welcome email with app overview');
      return true; // Return success but don't actually send
    }

    // Send emails when RESEND_API_KEY is configured
    console.log(`Sending welcome email to: ${to}`);

    const { data, error } = await resendClient.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: [to],
      subject: 'Welcome to PaPa-Hi! 🎉',
      html: generateWelcomeEmailHTML(firstName, username),
      text: generateWelcomeEmailText(firstName, username),
      headers: {
        'X-Entity-Ref-ID': `welcome-${Date.now()}`,
        'X-Priority': '1',
        'Importance': 'high'
      }
    });

    if (error) {
      console.error('❌ RESEND ERROR: Failed to send welcome email:', error);
      console.log(`📧 EMAIL FAILURE: ${to} - ${error.message || 'Unknown error'}`);
      
      // Handle common Resend validation errors gracefully
      if (error.message && (
        error.message.includes('Invalid `to` field') ||
        error.message.includes('You can only send testing emails') ||
        error.message.includes('verify a domain')
      )) {
        console.log('🚫 DOMAIN RESTRICTION: Email blocked by Resend validation');
        console.log('⚠️  Registration continues without email delivery');
        return false; // Return false to indicate email failure
      }
      
      console.log('💥 SMTP FAILURE: Technical error sending email');
      return false;
    }

    console.log('Welcome email sent successfully:', data?.id);
    console.log('Email details:', { from: 'papa@papa-hi.com', to, subject: 'Welcome to PaPa-Hi! 🎉' });
    console.log('Check your spam folder and email delivery status in Resend dashboard');
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export function generateWelcomeEmailHTML(firstName: string, username: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to PaPa-Hi!</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');
        body {
          font-family: 'Varela Round', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
          font-family: 'Varela Round', sans-serif;
          font-size: 32px;
          font-weight: bold;
          color: #ff6b35;
          margin-bottom: 10px;
        }
        .welcome-title {
          font-family: 'Varela Round', sans-serif;
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
          animation: pulse 2s infinite;
          transition: transform 0.3s ease;
        }
        .cta-button:hover {
          transform: scale(1.05);
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #888;
          font-size: 14px;
        }
        .welcome-animation {
          text-align: center;
          margin: 30px 0;
          position: relative;
        }
        .playground-scene {
          position: relative;
          height: 100px;
          margin: 20px 0;
          text-align: center;
        }
        .floating-circle {
          position: absolute;
          font-size: 24px;
          animation: float 3s ease-in-out infinite;
        }
        .circle-1 {
          left: 10%;
          animation-delay: 0s;
        }
        .circle-2 {
          left: 30%;
          animation-delay: 0.5s;
        }
        .circle-3 {
          left: 60%;
          animation-delay: 1s;
        }
        .circle-4 {
          left: 80%;
          animation-delay: 1.5s;
        }
        .playground-elements {
          margin-top: 60px;
        }
        .playground-emoji {
          font-size: 28px;
          margin: 0 10px;
          display: inline-block;
        }
        .swing {
          animation: bounce 2s ease-in-out infinite;
        }
        .seesaw {
          animation: seesaw 3s ease-in-out infinite;
        }
        .slide {
          animation: pulse 2.5s ease-in-out infinite;
        }
        .bounce-in {
          animation: bounceIn 1.5s ease-out;
        }
        .slide-in {
          animation: slideIn 1s ease-out;
        }
        .pulse {
          animation: pulse 2s infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        @keyframes seesaw {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          75% { transform: rotate(-10deg); }
        }
        .feature-icon {
          color: #ff6b35;
          margin-right: 10px;
          font-size: 18px;
          animation: bounceIn 1s ease-out;
          animation-delay: calc(var(--delay) * 0.2s);
        }
        .footer-animation {
          text-align: center;
          margin: 20px 0;
        }
        .footer-emoji {
          font-size: 32px;
          margin: 0 8px;
          display: inline-block;
        }
        .family-row {
          text-align: center;
        }
        .family-emoji {
          font-size: 28px;
          margin: 0 15px;
          display: inline-block;
          animation: bounce 2s ease-in-out infinite;
        }
        .heart-emoji {
          font-size: 24px;
          color: #ff6b35;
          animation: pulse 1.5s ease-in-out infinite;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo bounce-in">PaPa-Hi</div>
          <div class="welcome-animation">
            <div class="playground-scene">
              <div class="floating-circle circle-1">🎈</div>
              <div class="floating-circle circle-2">⭐</div>
              <div class="floating-circle circle-3">🎪</div>
              <div class="floating-circle circle-4">🎠</div>
              <div class="playground-elements">
                <span class="playground-emoji swing">🛝</span>
                <span class="playground-emoji seesaw">🎪</span>
                <span class="playground-emoji slide">🏰</span>
              </div>
            </div>
          </div>
          <h1 class="welcome-title slide-in">Welcome to PaPa-Hi, ${firstName}! 🎉</h1>
        </div>
        
        <div class="content">
          <p>Hi <strong>${firstName}</strong>,</p>
          
          <p>Welcome to PaPa-Hi! We're thrilled to have you join our community of Dutch parents who are making it easier to connect, discover family-friendly places, and organize playdates.</p>
          
          <p>Your account (<strong>${username}</strong>) is now ready, and you can start exploring everything PaPa-Hi has to offer:</p>
          
          <div class="features">
            <div class="feature-item">
              <span class="feature-icon" style="--delay: 1">🏰</span>
              <span>Discover amazing playgrounds, restaurants, and museums</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon" style="--delay: 2">📍</span>
              <span>Find family-friendly places near you</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon" style="--delay: 3">👨‍👩‍👧‍👦</span>
              <span>Organize playdates with other families</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon" style="--delay: 4">⭐</span>
              <span>Rate and review places you visit</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon" style="--delay: 5">💬</span>
              <span>Connect with other parents in your area</span>
            </div>
          </div>
          
          <p>Ready to get started? Log in to your account and begin exploring!</p>
          
          <center>
            <a href="https://papa-hi.com" class="cta-button">
              Start Exploring PaPa-Hi
            </a>
          </center>
          
          <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
          
          <p>Happy exploring!<br>
          The PaPa-Hi Team</p>
        </div>
        
        <div class="footer">
          <div class="footer-playground" style="margin-bottom: 20px;">
            <div class="footer-animation">
              <span class="footer-emoji bounce" style="animation-delay: 0s;">🏰</span>
              <span class="footer-emoji float" style="animation-delay: 0.5s;">🎪</span>
              <span class="footer-emoji pulse" style="animation-delay: 1s;">🎠</span>
              <span class="footer-emoji bounce" style="animation-delay: 1.5s;">🛝</span>
              <span class="footer-emoji float" style="animation-delay: 2s;">⭐</span>
            </div>
            <div class="family-row" style="margin-top: 15px;">
              <span class="family-emoji" style="animation-delay: 0.2s;">👨‍👩‍👧‍👦</span>
              <span class="heart-emoji" style="animation-delay: 0.8s;">❤️</span>
              <span class="family-emoji" style="animation-delay: 1.4s;">👨‍👩‍👧‍👦</span>
            </div>
          </div>
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

Visit: https://papa-hi.com

If you have any questions or need help getting started, feel free to reach out to our support team.

Happy exploring!
The PaPa-Hi Tribe

---
This email was sent because you created an account with PaPa-Hi.
© 2025 PaPa-Hi. Made with ❤️ for Dutch families.
  `;
}

export async function sendTestEmail(to: string): Promise<boolean> {
  try {
    const resendClient = getResendClient();
    
    if (!resendClient) {
      console.warn('RESEND_API_KEY is not configured - cannot send test email');
      return false;
    }

    const { data, error } = await resendClient.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
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