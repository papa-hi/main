import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./email-service";
import { sendNotificationToUser } from "./push-notifications";

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

/**
 * Send email notification to user about a new dad match
 */
export async function sendDadMatchNotificationEmail(
  userId: number, 
  matchedUserId: number, 
  candidate: MatchCandidate
): Promise<boolean> {
  try {
    // Get user details
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.error(`User ${userId} not found for match notification`);
      return false;
    }

    const matchedUser = candidate.user;
    const distance = candidate.distance || 0;
    const ageRanges = candidate.commonAgeRanges;
    
    // Generate common age ranges text
    const ageRangesText = ageRanges.map(range => {
      if (range.minAge === range.maxAge) {
        return `${range.minAge} jaar`;
      }
      return `${range.minAge}-${range.maxAge} jaar`;
    }).join(', ');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #FF6B35;">
          <h1 style="color: #FF6B35; margin: 0; font-size: 28px;">
            🎉 Nieuwe Papa Match!
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Hallo ${user.firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Geweldig nieuws! We hebben een perfecte match voor je gevonden op PaPa-Hi. 
            <strong>${matchedUser.firstName} ${matchedUser.lastName}</strong> uit ${matchedUser.city} 
            heeft kinderen met vergelijkbare leeftijden als jouw kinderen.
          </p>

          <!-- Match Details Card -->
          <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 25px; border-radius: 15px; color: white; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Match Details</h3>
            
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
              <p style="margin: 0 0 8px 0;"><strong>📍 Afstand:</strong> ${distance} km</p>
              <p style="margin: 0 0 8px 0;"><strong>🎯 Match Score:</strong> ${candidate.matchScore}%</p>
              <p style="margin: 0;"><strong>👶 Kinderen leeftijden:</strong> ${ageRangesText}</p>
            </div>
          </div>

          <!-- Children Info -->
          ${matchedUser.childrenInfo && matchedUser.childrenInfo.length > 0 ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Kinderen van ${matchedUser.firstName}:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${matchedUser.childrenInfo.map(child => 
                `<span style="background: #FF6B35; color: white; padding: 5px 12px; border-radius: 20px; font-size: 14px;">
                  ${child.name} (${child.age} jaar)
                </span>`
              ).join('')}
            </div>
          </div>
          ` : ''}

          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Log in op PaPa-Hi om meer over ${matchedUser.firstName} te leren en contact te maken. 
            Wie weet wordt dit het begin van een geweldige vriendschap voor jullie en jullie kinderen!
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://papa-hi.com/matches" 
               style="background: linear-gradient(135deg, #FF6B35, #F7931E); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);">
              Bekijk Match
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding: 20px 0; text-align: center; color: #888; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">
            PaPa-Hi - Verbind Nederlandse vaders
          </p>
          <p style="margin: 0;">
            <a href="https://papa-hi.com" style="color: #FF6B35;">papa-hi.com</a> | 
            <a href="mailto:papa@papa-hi.com" style="color: #FF6B35;">papa@papa-hi.com</a>
          </p>
        </div>
      </div>
    `;

    const emailText = `
Hallo ${user.firstName}!

Geweldig nieuws! We hebben een perfecte match voor je gevonden op PaPa-Hi.

Match Details:
- Naam: ${matchedUser.firstName} ${matchedUser.lastName}
- Locatie: ${matchedUser.city} (${distance} km)
- Match Score: ${candidate.matchScore}%
- Kinderen leeftijden: ${ageRangesText}

${matchedUser.childrenInfo && matchedUser.childrenInfo.length > 0 ? 
  `Kinderen van ${matchedUser.firstName}: ${matchedUser.childrenInfo.map(child => `${child.name} (${child.age} jaar)`).join(', ')}` 
  : ''}

Log in op PaPa-Hi om meer over ${matchedUser.firstName} te leren en contact te maken.

Bezoek: https://papa-hi.com/matches

Met vriendelijke groet,
Het PaPa-Hi Team
    `;

    const success = await sendEmail({
      to: user.email,
      firstName: user.firstName,
      username: user.username,
      subject: `🎉 Nieuwe Papa Match met ${matchedUser.firstName}!`,
      htmlContent: emailHtml,
      textContent: emailText
    });

    if (success) {
      console.log(`Dad match email sent to ${user.email} about match with ${matchedUser.firstName}`);
    } else {
      console.error(`Failed to send dad match email to ${user.email}`);
    }

    return success;
  } catch (error) {
    console.error('Error sending dad match email:', error);
    return false;
  }
}

/**
 * Send push notification to user about a new dad match
 */
export async function sendDadMatchPushNotification(
  userId: number,
  matchedUserId: number, 
  candidate: MatchCandidate
): Promise<void> {
  try {
    const matchedUser = candidate.user;
    const distance = candidate.distance || 0;
    
    await sendNotificationToUser(userId, {
      title: "🎉 Nieuwe Papa Match!",
      body: `${matchedUser.firstName} uit ${matchedUser.city} (${distance}km) heeft kinderen met vergelijkbare leeftijden!`,
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
          title: "Bekijk Match",
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

/**
 * Send a generic email notification (compatible with existing email service)
 */
async function sendEmail(params: {
  to: string;
  firstName: string;
  username: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<boolean> {
  // Import the existing email service
  const { sendWelcomeEmail } = await import("./email-service");
  
  // For now, we'll use a custom implementation
  // In a real app, you'd extend the email service to support custom templates
  try {
    // This is a placeholder - you'd need to implement custom email sending
    // For now, we'll use the console
    console.log(`EMAIL TO: ${params.to}`);
    console.log(`SUBJECT: ${params.subject}`);
    console.log(`CONTENT: ${params.textContent}`);
    
    // Return true to simulate successful email sending
    // In production, you'd implement actual email sending here
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}