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

interface ProfileReminderEmailData {
  to: string;
  firstName: string;
  username: string;
  missingFields: string[];
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
        .floating-hearts {
          animation: float 3s ease-in-out infinite;
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
        .feature-icon {
          color: #ff6b35;
          margin-right: 10px;
          font-size: 18px;
          animation: bounceIn 1s ease-out;
          animation-delay: calc(var(--delay) * 0.2s);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo bounce-in">PaPa-Hi</div>
          <div class="welcome-animation">
            <svg width="200" height="120" viewBox="0 0 200 120" class="floating-hearts">
              <circle cx="40" cy="40" r="8" fill="#ff6b35" opacity="0.8">
                <animate attributeName="cy" values="40;30;40" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="80" cy="60" r="6" fill="#ffa500" opacity="0.6">
                <animate attributeName="cy" values="60;50;60" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="120" cy="45" r="7" fill="#ff69b4" opacity="0.7">
                <animate attributeName="cy" values="45;35;45" dur="1.8s" repeatCount="indefinite"/>
              </circle>
              <circle cx="160" cy="55" r="5" fill="#32cd32" opacity="0.5">
                <animate attributeName="cy" values="55;45;55" dur="2.2s" repeatCount="indefinite"/>
              </circle>
              
              <!-- Animated playground elements -->
              <rect x="20" y="80" width="40" height="20" fill="#8B4513" rx="5">
                <animate attributeName="height" values="20;25;20" dur="3s" repeatCount="indefinite"/>
              </rect>
              <rect x="70" y="85" width="30" height="15" fill="#228B22" rx="3">
                <animate attributeName="height" values="15;18;15" dur="2.5s" repeatCount="indefinite"/>
              </rect>
              <circle cx="130" cy="90" r="10" fill="#FFD700">
                <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite"/>
              </circle>
              
              <!-- Family figures -->
              <g transform="translate(150, 75)">
                <circle cx="5" cy="5" r="3" fill="#ffdbac"/>
                <rect x="2" y="8" width="6" height="8" fill="#4169E1" rx="1"/>
                <circle cx="15" cy="5" r="3" fill="#ffdbac"/>
                <rect x="12" y="8" width="6" height="8" fill="#FF69B4" rx="1"/>
                <circle cx="25" cy="8" r="2" fill="#ffdbac"/>
                <rect x="23" y="10" width="4" height="6" fill="#32CD32" rx="1"/>
                <animateTransform attributeName="transform" type="translate" 
                  values="150,75; 148,75; 150,75" dur="4s" repeatCount="indefinite"/>
              </g>
            </svg>
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
          <div class="welcome-animation" style="margin-bottom: 20px;">
            <svg width="300" height="80" viewBox="0 0 300 80" style="animation: slideIn 2s ease-out;">
              <!-- Animated playground scene -->
              <rect x="20" y="60" width="260" height="15" fill="#90EE90" rx="8"/>
              
              <!-- Swing set -->
              <line x1="50" y1="20" x2="50" y2="60" stroke="#8B4513" stroke-width="3"/>
              <line x1="80" y1="20" x2="80" y2="60" stroke="#8B4513" stroke-width="3"/>
              <line x1="45" y1="20" x2="85" y2="20" stroke="#8B4513" stroke-width="3"/>
              <rect x="60" y="35" width="12" height="3" fill="#DEB887" rx="1">
                <animateTransform attributeName="transform" type="rotate" 
                  values="0 66 36; 15 66 36; 0 66 36; -15 66 36; 0 66 36" dur="4s" repeatCount="indefinite"/>
              </rect>
              
              <!-- Slide -->
              <polygon points="120,25 150,25 155,60 115,60" fill="#FF6347" opacity="0.8"/>
              <rect x="155" y="45" width="15" height="8" fill="#8B4513"/>
              
              <!-- Seesaw -->
              <rect x="195" y="47" width="40" height="3" fill="#DEB887" rx="1">
                <animateTransform attributeName="transform" type="rotate" 
                  values="0 215 48; 10 215 48; 0 215 48; -10 215 48; 0 215 48" dur="3s" repeatCount="indefinite"/>
              </rect>
              <rect x="213" y="50" width="4" height="8" fill="#8B4513"/>
              
              <!-- Moving children figures -->
              <g>
                <circle cx="65" cy="30" r="2" fill="#ffdbac"/>
                <rect x="63" y="32" width="4" height="6" fill="#FF69B4" rx="1"/>
                <animateTransform attributeName="transform" type="translate" 
                  values="0,0; 5,0; 0,0; -5,0; 0,0" dur="3s" repeatCount="indefinite"/>
              </g>
              
              <!-- Floating hearts -->
              <circle cx="250" cy="25" r="3" fill="#FF69B4" opacity="0.7">
                <animate attributeName="cy" values="25;15;25" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="270" cy="35" r="2" fill="#FF6B35" opacity="0.6">
                <animate attributeName="cy" values="35;25;35" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite"/>
              </circle>
            </svg>
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

export async function sendProfileReminderEmail({ to, firstName, username, missingFields }: ProfileReminderEmailData): Promise<boolean> {
  try {
    const resendClient = getResendClient();
    
    if (!resendClient) {
      console.warn('RESEND_API_KEY is not configured - skipping profile reminder email');
      console.log(`Profile reminder email would be sent to: ${to}`);
      console.log('Subject: Complete Your PaPa-Hi Profile 📝');
      console.log('Content: Reminder to complete profile fields');
      return true;
    }

    console.log(`Sending profile reminder email to: ${to}`);

    const { data, error } = await resendClient.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: [to],
      subject: 'Complete Your PaPa-Hi Profile 📝',
      html: generateProfileReminderEmailHTML(firstName, username, missingFields),
      text: generateProfileReminderEmailText(firstName, username, missingFields),
      headers: {
        'X-Entity-Ref-ID': `profile-reminder-${Date.now()}`,
        'X-Priority': '3',
        'Importance': 'normal'
      }
    });

    if (error) {
      console.error('Profile reminder email error:', error);
      return false;
    }

    console.log('Profile reminder email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Failed to send profile reminder email:', error);
    return false;
  }
}

function generateProfileReminderEmailHTML(firstName: string, username: string, missingFields: string[]): string {
  const fieldLabels: Record<string, string> = {
    'profileImage': 'Profile Photo',
    'bio': 'Bio/About Me',
    'city': 'City/Location',
    'childrenInfo': 'Children Information'
  };

  const missingFieldsList = missingFields.map(field => fieldLabels[field] || field).join(', ');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete Your Profile</title>
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
          color: #FF6B35;
          margin-bottom: 10px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .missing-fields {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PaPa-Hi</div>
          <h1>Complete Your Profile</h1>
        </div>
        
        <p>Hi ${firstName},</p>
        
        <p>We noticed your PaPa-Hi profile is missing some important information. A complete profile helps other fathers connect with you and makes it easier to organize playdates!</p>
        
        <div class="missing-fields">
          <strong>Missing Information:</strong><br>
          ${missingFieldsList}
        </div>
        
        <p>Why complete your profile?</p>
        <ul>
          <li>🤝 <strong>Better Connections:</strong> Other parents can learn about you and your family</li>
          <li>📅 <strong>More Playdates:</strong> Complete profiles get more playdate invitations</li>
          <li>🏆 <strong>Trust & Safety:</strong> Complete profiles build trust in our community</li>
          <li>📍 <strong>Local Matches:</strong> Help us connect you with nearby families</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="https://papa-hi.com/profile" class="cta-button">Complete My Profile</a>
        </div>
        
        <p>It only takes 2 minutes to complete your profile. Once done, you can:</p>
        <ul>
          <li>Browse and join exciting playdates</li>
          <li>Create your own family activities</li>
          <li>Connect with like-minded fathers</li>
          <li>Discover family-friendly places</li>
        </ul>
        
        <p>Thanks for being part of the PaPa-Hi community!</p>
        
        <p>Best regards,<br>The PaPa-Hi Team</p>
        
        <div class="footer">
          <p>PaPa-Hi - Connecting Fathers, Building Communities</p>
          <p>If you don't want to receive these reminders, <a href="https://papa-hi.com/unsubscribe">unsubscribe here</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateProfileReminderEmailText(firstName: string, username: string, missingFields: string[]): string {
  const fieldLabels: Record<string, string> = {
    'profileImage': 'Profile Photo',
    'bio': 'Bio/About Me',
    'city': 'City/Location',
    'childrenInfo': 'Children Information'
  };

  const missingFieldsList = missingFields.map(field => fieldLabels[field] || field).join(', ');

  return `
PaPa-Hi - Complete Your Profile

Hi ${firstName},

We noticed your PaPa-Hi profile is missing some important information: ${missingFieldsList}

A complete profile helps other fathers connect with you and makes it easier to organize playdates!

Why complete your profile?
• Better Connections: Other parents can learn about you and your family
• More Playdates: Complete profiles get more playdate invitations  
• Trust & Safety: Complete profiles build trust in our community
• Local Matches: Help us connect you with nearby families

Complete your profile here: https://papa-hi.com/profile

It only takes 2 minutes! Once done, you can browse playdates, create activities, and connect with other fathers.

Thanks for being part of the PaPa-Hi community!

Best regards,
The PaPa-Hi Team

---
PaPa-Hi - Connecting Fathers, Building Communities
Unsubscribe: https://papa-hi.com/unsubscribe
  `.trim();
}