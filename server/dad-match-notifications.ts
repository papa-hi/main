import { Resend } from "resend";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendNotificationToUser } from "./push-notifications";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

interface MatchCandidate {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city: string | null;
    childrenInfo: Array<{ name: string; age: number }> | null;
  };
  distance?: number;
  commonAgeRanges: Array<{ minAge: number; maxAge: number; overlap: number }>;
  matchScore: number;
}

export async function sendDadMatchNotificationEmail(
  userId: number,
  matchedUserId: number,
  candidate: MatchCandidate
): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.error(`User ${userId} not found for match notification`);
      return false;
    }

    const matchedUser = candidate.user;
    const distance = candidate.distance || 0;
    const ageRanges = candidate.commonAgeRanges;

    const ageRangesText = ageRanges.map(range => {
      if (range.minAge === range.maxAge) {
        return `${range.minAge} yr`;
      }
      return `${range.minAge}-${range.maxAge} yr`;
    }).join(', ');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Dad Match</title>
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
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 20px;
            text-align: center;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 0 5px 10px 5px;
          }
          .cta-button-green {
            display: inline-block;
            background: #10B981;
            color: white !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 0 5px 10px 5px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">PaPa-Hi</div>
          </div>

          <h1 class="title">New Dad Match!</h1>

          <p>Hi ${user.firstName},</p>

          <p>Great news! We found a perfect match for you on PaPa-Hi.
            <strong>${matchedUser.firstName} ${matchedUser.lastName}</strong>${matchedUser.city ? ` from ${matchedUser.city}` : ''}
            has children with similar ages to yours.</p>

          <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 25px; border-radius: 12px; color: white; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Match Details</h3>

            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
              <p style="margin: 0 0 8px 0;"><strong>Distance:</strong> ${distance} km</p>
              <p style="margin: 0 0 8px 0;"><strong>Match Score:</strong> ${candidate.matchScore}%</p>
              <p style="margin: 0;"><strong>Children's Ages:</strong> ${ageRangesText}</p>
            </div>
          </div>

          ${matchedUser.childrenInfo && matchedUser.childrenInfo.length > 0 ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">${matchedUser.firstName}'s Children:</h4>
            <div>
              ${matchedUser.childrenInfo.map(child =>
                `<span style="background: #FF6B35; color: white; padding: 5px 12px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 3px;">
                  ${child.name} (${child.age} yr)
                </span>`
              ).join('')}
            </div>
          </div>
          ` : ''}

          <p>Log in to PaPa-Hi to learn more about ${matchedUser.firstName} and connect.
            This could be the start of a great friendship for you and your kids!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://papa-hi.com/matches" class="cta-button">
              View Match
            </a>
            <a href="https://papa-hi.com/messages" class="cta-button-green">
              Send Message
            </a>
          </div>

          <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1E40AF; font-size: 14px;">
              <strong>Tip:</strong> Send a quick message to introduce yourself and your family. 
              Most dads respond within 24 hours!
            </p>
          </div>

          <div class="footer">
            <p>PaPa-Hi - Connecting Fathers, Building Communities</p>
            <p>
              <a href="https://papa-hi.com" style="color: #FF6B35;">papa-hi.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Hi ${user.firstName},

Great news! We found a perfect match for you on PaPa-Hi.

Match Details:
- Name: ${matchedUser.firstName} ${matchedUser.lastName}
- Location: ${matchedUser.city || 'Unknown'} (${distance} km)
- Match Score: ${candidate.matchScore}%
- Children's Ages: ${ageRangesText}

${matchedUser.childrenInfo && matchedUser.childrenInfo.length > 0 ?
  `${matchedUser.firstName}'s Children: ${matchedUser.childrenInfo.map(child => `${child.name} (${child.age} yr)`).join(', ')}`
  : ''}

Log in to PaPa-Hi to learn more about ${matchedUser.firstName} and connect.

Visit: https://papa-hi.com/matches

Best regards,
The PaPa-Hi Team
    `;

    const resendClient = getResendClient();

    if (!resendClient) {
      console.log(`[Dad Match Email] To: ${user.email}`);
      console.log(`[Dad Match Email] Subject: New Dad Match with ${matchedUser.firstName}!`);
      return true;
    }

    const { error } = await resendClient.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: [user.email],
      subject: `New Dad Match with ${matchedUser.firstName}!`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Dad match email send error:', error);
      return false;
    }

    console.log(`Dad match email sent to ${user.email} about match with ${matchedUser.firstName}`);
    return true;
  } catch (error) {
    console.error('Error sending dad match email:', error);
    return false;
  }
}

export async function sendDadMatchPushNotification(
  userId: number,
  matchedUserId: number,
  candidate: MatchCandidate
): Promise<void> {
  try {
    const matchedUser = candidate.user;
    const distance = candidate.distance || 0;

    await sendNotificationToUser(userId, {
      title: "New Dad Match!",
      body: `${matchedUser.firstName} from ${matchedUser.city} (${distance}km) has children with similar ages!`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "dad_match",
        matchedUserId: matchedUserId,
        matchScore: candidate.matchScore,
        distance: distance,
        url: "/matches"
      },
      actions: [
        {
          action: "view_match",
          title: "View Match",
          icon: "/icon-192x192.png"
        },
        {
          action: "send_message",
          title: "Send Message",
          icon: "/icon-192x192.png"
        },
        {
          action: "dismiss",
          title: "Later",
        }
      ]
    });

    console.log(`Dad match push notification sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending dad match push notification to user ${userId}:`, error);
  }
}
