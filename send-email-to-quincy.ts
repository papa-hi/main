import { Resend } from 'resend';

async function sendWelcomeToQuincy() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  console.log('Sending welcome email to Quincy Jones...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: ['collins@virtualweb.us'],
      subject: 'Welcome to PaPa-Hi! 🎉',
      html: `
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">PaPa-Hi</div>
              <h1 class="welcome-title">Welcome to PaPa-Hi, Quincy! 🎉</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>Quincy</strong>,</p>
              
              <p>Welcome to PaPa-Hi! We're thrilled to have you join our community of Dutch parents who are making it easier to connect, discover family-friendly places, and organize playdates.</p>
              
              <p>Your account (<strong>Quincy</strong>) is now ready, and you can start exploring everything PaPa-Hi has to offer:</p>
              
              <ul>
                <li>🏰 Discover amazing playgrounds, restaurants, and museums</li>
                <li>📍 Find family-friendly places near you</li>
                <li>👨‍👩‍👧‍👦 Organize playdates with other families</li>
                <li>⭐ Rate and review places you visit</li>
                <li>💬 Connect with other parents in your area</li>
              </ul>
              
              <p>Ready to get started? Log in to your account and begin exploring!</p>
              
              <center>
                <a href="https://04661828-2b6e-42fa-a890-5e763456e3c1-00-u1e2637z1n45.kirk.replit.dev" class="cta-button">
                  Start Exploring PaPa-Hi
                </a>
              </center>
              
              <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
              
              <p>Happy exploring!<br>
              The PaPa-Hi Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to PaPa-Hi, Quincy! 🎉

Hi Quincy,

Welcome to PaPa-Hi! We're thrilled to have you join our community of Dutch parents who are making it easier to connect, discover family-friendly places, and organize playdates.

Your account (Quincy) is now ready, and you can start exploring everything PaPa-Hi has to offer:

🏰 Discover amazing playgrounds, restaurants, and museums
📍 Find family-friendly places near you  
👨‍👩‍👧‍👦 Organize playdates with other families
⭐ Rate and review places you visit
💬 Connect with other parents in your area

Ready to get started? Log in to your account and begin exploring!

Visit: https://04661828-2b6e-42fa-a890-5e763456e3c1-00-u1e2637z1n45.kirk.replit.dev

If you have any questions or need help getting started, feel free to reach out to our support team.

Happy exploring!
The PaPa-Hi Team

---
This email was sent because you created an account with PaPa-Hi.
© 2025 PaPa-Hi. Made with ❤️ for Dutch families.
      `
    });

    if (error) {
      console.error('Error sending welcome email to Quincy:', error);
      return false;
    }

    console.log('Welcome email sent successfully to Quincy!');
    console.log('Email ID:', data?.id);
    console.log('Email details:', { 
      from: 'papa@papa-hi.com', 
      to: 'collins@virtualweb.us', 
      subject: 'Welcome to PaPa-Hi! 🎉' 
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send welcome email to Quincy:', error);
    return false;
  }
}

sendWelcomeToQuincy();