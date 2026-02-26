import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./email-service";
import { sendNotificationToUser } from "./push-notifications";
import { getDayName, getTimeSlotDisplay } from "./availability-matching-service";

interface SharedSlot {
  dayOfWeek: number;
  timeSlot: string;
}

interface AvailabilityMatchCandidate {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city: string | null;
    childrenInfo: Array<{ name: string; age: number }> | null;
  };
  sharedSlots: SharedSlot[];
  distance: number;
  matchScore: number;
  childrenCompatibility: number;
}

/**
 * Send email notification about new availability match
 */
export async function sendAvailabilityMatchNotificationEmail(
  userId: number,
  matchedUserId: number,
  candidate: AvailabilityMatchCandidate
): Promise<boolean> {
  try {
    // Get user details
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.error(`User ${userId} not found for availability match notification`);
      return false;
    }

    const matchedUser = candidate.user;
    const distance = candidate.distance || 0;
    const sharedSlots = candidate.sharedSlots;

    // Generate shared time slots text
    const timeSlotsText = sharedSlots.map(slot => {
      const dayName = getDayName(slot.dayOfWeek as any);
      const timeSlotDisplay = getTimeSlotDisplay(slot.timeSlot as any);
      return `${dayName} ${timeSlotDisplay.split(' ')[0]}`; // e.g., "Wednesday Morning"
    }).join(', ');

    // Get next occurrence of first shared slot
    const nextSlot = sharedSlots[0];
    const nextDayName = getDayName(nextSlot.dayOfWeek as any);
    const nextTimeDisplay = getTimeSlotDisplay(nextSlot.timeSlot as any);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #4F46E5;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">
            📅 Nieuwe Beschikbaarheids Match!
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Hallo ${user.firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Geweldig nieuws! <strong>${matchedUser.firstName} ${matchedUser.lastName}</strong> 
            uit ${matchedUser.city} heeft dezelfde vrije tijden als jij ingesteld op PaPa-Hi. 
            Dit is een perfecte kans om een playdate te plannen!
          </p>

          <!-- Shared Times Highlight -->
          <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 25px; border-radius: 15px; color: white; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">📅 Jullie Gedeelde Tijden</h3>
            
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 10px; margin-bottom: 15px;">
              ${sharedSlots.map(slot => {
                const day = getDayName(slot.dayOfWeek as any);
                const time = getTimeSlotDisplay(slot.timeSlot as any);
                return `
                  <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 18px; font-weight: bold;">${day}</span>
                    <span style="font-size: 14px; opacity: 0.9;">${time}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
              <p style="margin: 0 0 8px 0;"><strong>📍 Afstand:</strong> ${distance} km</p>
              <p style="margin: 0 0 8px 0;"><strong>🎯 Match Score:</strong> ${candidate.matchScore}%</p>
              <p style="margin: 0;"><strong>👶 Gemeenschappelijke leeftijden:</strong> ${candidate.childrenCompatibility} kinderen</p>
            </div>
          </div>

          <!-- Next Available Time -->
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400E; margin: 0 0 10px 0; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 10px;">⏰</span>
              Aanstaande Kans
            </h4>
            <p style="color: #78350F; margin: 0; font-size: 16px;">
              <strong>${nextDayName}</strong> ${nextTimeDisplay.toLowerCase()} - 
              Jullie zijn beide beschikbaar!
            </p>
          </div>

          <!-- Children Info -->
          ${matchedUser.childrenInfo && matchedUser.childrenInfo.length > 0 ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Kinderen van ${matchedUser.firstName}:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${matchedUser.childrenInfo.map(child => 
                `<span style="background: #4F46E5; color: white; padding: 5px 12px; border-radius: 20px; font-size: 14px;">
                  ${child.name} (${child.age} jaar)
                </span>`
              ).join('')}
            </div>
          </div>
          ` : ''}

          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Omdat jullie beide ${timeSlotsText} hebben aangegeven als beschikbaar, 
            is dit het perfecte moment om een playdate te plannen. 
            Neem contact op met ${matchedUser.firstName} en maak een afspraak!
          </p>

          <!-- CTA Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://papa-hi.com/matches" 
               style="background: linear-gradient(135deg, #4F46E5, #7C3AED); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      margin: 0 5px 10px 5px;
                      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">
              Bekijk Match
            </a>
            <a href="https://papa-hi.com/playdates/create?match=${matchedUserId}&day=${nextSlot.dayOfWeek}&slot=${nextSlot.timeSlot}" 
               style="background: #10B981; 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      margin: 0 5px 10px 5px;
                      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
              Stel Playdate Voor
            </a>
          </div>

          <!-- Quick Tip -->
          <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1E40AF; font-size: 14px;">
              💡 <strong>Tip:</strong> Stuur een snel bericht om kennis te maken en stel een specifieke tijd voor. 
              De meeste vaders reageren binnen 24 uur!
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding: 20px 0; text-align: center; color: #888; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">
            PaPa-Hi - Verbind Nederlandse vaders op het juiste moment
          </p>
          <p style="margin: 0;">
            <a href="https://papa-hi.com/dad-days" style="color: #4F46E5;">Bewerk je Dad Days</a> | 
            <a href="https://papa-hi.com" style="color: #4F46E5;">papa-hi.com</a>
          </p>
        </div>
      </div>
    `;

    const emailText = `
Hallo ${user.firstName}!

Geweldig nieuws! ${matchedUser.firstName} ${matchedUser.lastName} uit ${matchedUser.city} heeft dezelfde vrije tijden als jij.

Jullie Gedeelde Tijden:
${sharedSlots.map(slot => {
  const day = getDayName(slot.dayOfWeek as any);
  const time = getTimeSlotDisplay(slot.timeSlot as any);
  return `- ${day} ${time}`;
}).join('\n')}

Match Details:
- Afstand: ${distance} km
- Match Score: ${candidate.matchScore}%
- Gemeenschappelijke leeftijden: ${candidate.childrenCompatibility} kinderen

${matchedUser.childrenInfo && matchedUser.childrenInfo.length > 0 ? 
  `Kinderen van ${matchedUser.firstName}: ${matchedUser.childrenInfo.map(child => `${child.name} (${child.age} jaar)`).join(', ')}` 
  : ''}

Aanstaande Kans:
${nextDayName} ${nextTimeDisplay.toLowerCase()} - Jullie zijn beide beschikbaar!

Log in op PaPa-Hi om contact te maken met ${matchedUser.firstName} en plan een playdate.

Bezoek: https://papa-hi.com/matches

Met vriendelijke groet,
Het PaPa-Hi Team
    `;

    const success = await sendEmail({
      to: user.email,
      firstName: user.firstName,
      username: user.username,
      subject: `📅 ${matchedUser.firstName} is vrij op ${timeSlotsText}!`,
      htmlContent: emailHtml,
      textContent: emailText
    });

    if (success) {
      console.log(`Availability match email sent to ${user.email} about match with ${matchedUser.firstName}`);
    } else {
      console.error(`Failed to send availability match email to ${user.email}`);
    }

    return success;
  } catch (error) {
    console.error('Error sending availability match email:', error);
    return false;
  }
}

/**
 * Send push notification about new availability match
 */
export async function sendAvailabilityMatchPushNotification(
  userId: number,
  matchedUserId: number,
  candidate: AvailabilityMatchCandidate
): Promise<void> {
  try {
    const matchedUser = candidate.user;
    const distance = candidate.distance || 0;
    const firstSlot = candidate.sharedSlots[0];
    const dayName = getDayName(firstSlot.dayOfWeek as any);
    const timeName = getTimeSlotDisplay(firstSlot.timeSlot as any).split(' ')[0]; // Just "Morning", "Afternoon", etc.

    await sendNotificationToUser(userId, {
      title: "📅 Nieuwe Beschikbaarheids Match!",
      body: `${matchedUser.firstName} is ook vrij op ${dayName} ${timeName} (${distance}km)`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "availability_match",
        matchedUserId: matchedUserId,
        matchScore: candidate.matchScore,
        distance: distance,
        sharedSlots: JSON.stringify(candidate.sharedSlots),
        url: "/matches"
      },
      actions: [
        {
          action: "view_match",
          title: "Bekijk Match",
          icon: "/icon-192x192.png"
        },
        {
          action: "create_playdate",
          title: "Plan Playdate",
          icon: "/icon-192x192.png"
        },
        {
          action: "dismiss",
          title: "Later",
        }
      ]
    });

    console.log(`Availability match push notification sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending availability match push notification to user ${userId}:`, error);
  }
}

/**
 * Send weekly digest email with upcoming availability matches
 */
export async function sendWeeklyAvailabilityDigest(
  userId: number,
  weekOverview: Array<{
    dayOfWeek: number;
    dayName: string;
    timeSlot: string;
    timeSlotDisplay: string;
    nextOccurrence: Date;
    matchesCount: number;
    topMatches: Array<{
      id: number;
      firstName: string;
      lastName: string;
      profileImage: string | null;
      distanceKm: number;
      matchScore: number;
    }>;
  }>
): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.error(`User ${userId} not found for weekly digest`);
      return false;
    }

    const totalMatches = weekOverview.reduce((sum, day) => sum + day.matchesCount, 0);
    
    if (totalMatches === 0) {
      return false; // Don't send digest if no matches
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #4F46E5;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 28px;">
            📅 Je Week Overzicht
          </h1>
          <p style="color: #666; margin: 10px 0 0 0;">
            ${totalMatches} playdate mogelijkheden deze week!
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Hallo ${user.firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hier is jouw playdate planning voor de komende week. 
            We hebben ${totalMatches} vaders gevonden die vrij zijn op dezelfde momenten als jij!
          </p>

          <!-- Week Overview -->
          ${weekOverview.slice(0, 5).map(slot => `
            <div style="background: white; border: 2px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <!-- Day Header -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #E5E7EB;">
                <div>
                  <h3 style="margin: 0; color: #1F2937; font-size: 18px;">${slot.dayName}</h3>
                  <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 14px;">${slot.timeSlotDisplay}</p>
                </div>
                <div style="background: #4F46E5; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                  ${slot.matchesCount} ${slot.matchesCount === 1 ? 'vader' : 'vaders'}
                </div>
              </div>

              <!-- Top Matches -->
              ${slot.topMatches.length > 0 ? `
                <div style="margin-top: 15px;">
                  <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">Dichtbij:</p>
                  ${slot.topMatches.map(match => `
                    <div style="display: flex; align-items: center; padding: 10px; background: #F9FAFB; border-radius: 8px; margin-bottom: 8px;">
                      <div style="width: 40px; height: 40px; border-radius: 50%; background: #4F46E5; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">
                        ${match.firstName.charAt(0)}
                      </div>
                      <div style="flex: 1;">
                        <p style="margin: 0; font-weight: 600; color: #1F2937;">${match.firstName} ${match.lastName}</p>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: #6B7280;">${match.distanceKm}km afstand</p>
                      </div>
                      <div style="background: #10B981; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                        ${match.matchScore}%
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Quick Action -->
              <div style="margin-top: 15px;">
                <a href="https://papa-hi.com/matches?day=${slot.dayOfWeek}&slot=${slot.timeSlot}"
                   style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Bekijk Alle ${slot.matchesCount} ${slot.matchesCount === 1 ? 'Match' : 'Matches'} →
                </a>
              </div>
            </div>
          `).join('')}

          ${weekOverview.length > 5 ? `
            <p style="text-align: center; color: #6B7280; font-size: 14px; margin: 20px 0;">
              En nog ${weekOverview.length - 5} andere tijden met matches...
            </p>
          ` : ''}

          <!-- Weekly Tip -->
          <div style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); padding: 20px; border-radius: 12px; margin: 30px 0;">
            <h4 style="margin: 0 0 10px 0; color: #92400E; display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 10px;">💡</span>
              Tip van de Week
            </h4>
            <p style="margin: 0; color: #78350F; line-height: 1.6;">
              De meeste playdates worden op <strong>woensdag en zaterdag</strong> gepland. 
              Stuur vandaag nog een bericht naar een vader en verhoog je kans op een leuke week!
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://papa-hi.com/matches"
               style="background: linear-gradient(135deg, #4F46E5, #7C3AED); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">
              Bekijk Al Je Matches
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding: 20px 0; text-align: center; color: #888; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">
            PaPa-Hi - Je wekelijkse playdate planning
          </p>
          <p style="margin: 0;">
            <a href="https://papa-hi.com/dad-days" style="color: #4F46E5;">Bewerk je Dad Days</a> | 
            <a href="https://papa-hi.com/settings/notifications" style="color: #4F46E5;">Notificatie voorkeuren</a>
          </p>
        </div>
      </div>
    `;

    const emailText = `
Hallo ${user.firstName}!

Je Week Overzicht - ${totalMatches} playdate mogelijkheden!

${weekOverview.slice(0, 5).map(slot => `
${slot.dayName} ${slot.timeSlotDisplay}
${slot.matchesCount} ${slot.matchesCount === 1 ? 'vader' : 'vaders'} beschikbaar

${slot.topMatches.length > 0 ? 
  `Dichtbij:\n${slot.topMatches.map(m => `- ${m.firstName} ${m.lastName} (${m.distanceKm}km)`).join('\n')}`
  : ''}

Bekijk: https://papa-hi.com/matches?day=${slot.dayOfWeek}&slot=${slot.timeSlot}
`).join('\n---\n')}

Log in op PaPa-Hi om al je matches te bekijken en playdates te plannen.

Bezoek: https://papa-hi.com/matches

Met vriendelijke groet,
Het PaPa-Hi Team
    `;

    const success = await sendEmail({
      to: user.email,
      firstName: user.firstName,
      username: user.username,
      subject: `📅 Je Week Overzicht: ${totalMatches} Playdate Kansen!`,
      htmlContent: emailHtml,
      textContent: emailText
    });

    if (success) {
      console.log(`Weekly availability digest sent to ${user.email}`);
    } else {
      console.error(`Failed to send weekly digest to ${user.email}`);
    }

    return success;
  } catch (error) {
    console.error('Error sending weekly availability digest:', error);
    return false;
  }
}

/**
 * Send notification when user first sets up availability
 */
export async function sendAvailabilitySetupConfirmation(
  userId: number,
  slotsCount: number,
  matchesCount: number
): Promise<void> {
  try {
    await sendNotificationToUser(userId, {
      title: "✅ Dad Days Ingesteld!",
      body: matchesCount > 0 
        ? `Super! ${matchesCount} vaders delen jouw beschikbaarheid.`
        : `Je hebt ${slotsCount} tijden toegevoegd. We zoeken naar matches!`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "availability_setup",
        slotsCount,
        matchesCount,
        url: matchesCount > 0 ? "/matches" : "/dad-days"
      }
    });

    console.log(`Availability setup confirmation sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending setup confirmation to user ${userId}:`, error);
  }
}

/**
 * Generic email sending wrapper (matches your existing pattern)
 */
async function sendEmail(params: {
  to: string;
  firstName: string;
  username: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<boolean> {
  try {
    // Use your actual email service here
    console.log(`EMAIL TO: ${params.to}`);
    console.log(`SUBJECT: ${params.subject}`);
    console.log(`CONTENT: ${params.textContent}`);
    
    // In production, implement actual email sending
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}
