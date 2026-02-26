import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendNotificationToUser } from "./push-notifications";

interface AvailabilityMatchCandidate {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    city: string | null;
  };
  sharedSlots: Array<{ dayOfWeek: number; timeSlot: string }>;
  matchScore: number;
  distanceKm?: number;
}

function getDayName(dayOfWeek: number): string {
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  return days[dayOfWeek] || 'Onbekend';
}

function getTimeSlotDisplay(timeSlot: string): string {
  const slots: Record<string, string> = {
    morning: 'Ochtend',
    afternoon: 'Middag',
    evening: 'Avond',
    allday: 'Hele dag',
  };
  return slots[timeSlot] || timeSlot;
}

export async function sendAvailabilityMatchNotificationEmail(
  userId: number,
  matchedUserId: number,
  candidate: AvailabilityMatchCandidate
): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.error(`User ${userId} not found for availability match notification`);
      return false;
    }

    const matchedUser = candidate.user;
    const distance = candidate.distanceKm || 0;

    const sharedSlotsText = candidate.sharedSlots
      .map(slot => `${getDayName(slot.dayOfWeek)} ${getTimeSlotDisplay(slot.timeSlot)}`)
      .join(', ');

    const sharedSlotsHtml = candidate.sharedSlots
      .map(slot =>
        `<span style="background: #FF6B35; color: white; padding: 5px 12px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 4px;">
          ${getDayName(slot.dayOfWeek)} ${getTimeSlotDisplay(slot.timeSlot)}
        </span>`
      )
      .join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #FF6B35;">
          <h1 style="color: #FF6B35; margin: 0; font-size: 28px;">
            📅 Nieuwe Beschikbaarheid Match!
          </h1>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Hallo ${user.firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Geweldig nieuws! <strong>${matchedUser.firstName} ${matchedUser.lastName}</strong> uit ${matchedUser.city || 'Nederland'}
            is op dezelfde momenten beschikbaar als jij. Plan samen een playdate!
          </p>

          <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 25px; border-radius: 15px; color: white; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Match Details</h3>
            
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
              <p style="margin: 0 0 8px 0;"><strong>📍 Afstand:</strong> ${Math.round(distance)} km</p>
              <p style="margin: 0 0 8px 0;"><strong>🎯 Match Score:</strong> ${candidate.matchScore}%</p>
              <p style="margin: 0;"><strong>📅 Gedeelde momenten:</strong> ${candidate.sharedSlots.length}</p>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Gedeelde beschikbare momenten:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${sharedSlotsHtml}
            </div>
          </div>

          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Log in op PaPa-Hi om ${matchedUser.firstName} te bekijken en een playdate te plannen!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://papa-hi.com/dad-days" 
               style="background: linear-gradient(135deg, #FF6B35, #F7931E); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);">
              Bekijk Beschikbaarheid
            </a>
          </div>
        </div>

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

Geweldig nieuws! We hebben een beschikbaarheid match voor je gevonden op PaPa-Hi.

Match Details:
- Naam: ${matchedUser.firstName} ${matchedUser.lastName}
- Locatie: ${matchedUser.city || 'Nederland'} (${Math.round(distance)} km)
- Match Score: ${candidate.matchScore}%
- Gedeelde momenten: ${sharedSlotsText}

Log in op PaPa-Hi om ${matchedUser.firstName} te bekijken en een playdate te plannen!

Bezoek: https://papa-hi.com/dad-days

Met vriendelijke groet,
Het PaPa-Hi Team
    `;

    console.log(`AVAILABILITY MATCH EMAIL TO: ${user.email}`);
    console.log(`SUBJECT: 📅 Nieuwe Beschikbaarheid Match met ${matchedUser.firstName}!`);
    console.log(`CONTENT: ${emailText}`);

    try {
      const { Resend } = await import('resend');
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
          from: 'PaPa-Hi <papa@papa-hi.com>',
          to: [user.email],
          subject: `📅 Nieuwe Beschikbaarheid Match met ${matchedUser.firstName}!`,
          html: emailHtml,
          text: emailText,
          headers: {
            'X-Entity-Ref-ID': `availability-match-${Date.now()}`,
          }
        });
        if (error) {
          console.error('Resend error for availability match email:', error);
          return false;
        }
        console.log(`Availability match email sent to ${user.email} about match with ${matchedUser.firstName}`);
        return true;
      }
    } catch (e) {
      console.log('Resend not available, email logged to console');
    }

    return true;
  } catch (error) {
    console.error('Error sending availability match email:', error);
    return false;
  }
}

export async function sendAvailabilityMatchPushNotification(
  userId: number,
  matchedUserId: number,
  candidate: AvailabilityMatchCandidate
): Promise<void> {
  try {
    const matchedUser = candidate.user;
    const distance = candidate.distanceKm || 0;
    const slotCount = candidate.sharedSlots.length;

    await sendNotificationToUser(userId, {
      title: "📅 Nieuwe Beschikbaarheid Match!",
      body: `${matchedUser.firstName} uit ${matchedUser.city || 'Nederland'} (${Math.round(distance)}km) is ${slotCount} keer tegelijk beschikbaar!`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "availability_match",
        matchedUserId: matchedUserId,
        matchScore: candidate.matchScore,
        distance: distance,
        url: "/dad-days"
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

    console.log(`Availability match push notification sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending availability match push notification to user ${userId}:`, error);
  }
}

export async function sendAvailabilitySetupConfirmation(
  userId: number,
  slotCount: number
): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.error(`User ${userId} not found for availability setup confirmation`);
      return false;
    }

    await sendNotificationToUser(userId, {
      title: "✅ Beschikbaarheid Opgeslagen!",
      body: `Je hebt ${slotCount} tijdslot${slotCount !== 1 ? 'en' : ''} ingesteld. We zoeken nu matches voor je!`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "availability_setup",
        url: "/dad-days"
      },
      actions: [
        {
          action: "view",
          title: "Bekijk Kalender",
          icon: "/icon-192x192.png"
        }
      ]
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #FF6B35;">
          <h1 style="color: #FF6B35; margin: 0; font-size: 28px;">
            ✅ Beschikbaarheid Ingesteld!
          </h1>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Hallo ${user.firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Je hebt je beschikbaarheid succesvol ingesteld op PaPa-Hi. 
            We hebben <strong>${slotCount} tijdslot${slotCount !== 1 ? 'en' : ''}</strong> opgeslagen in je kalender.
          </p>

          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 25px; border-radius: 15px; color: white; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Wat gebeurt er nu?</h3>
            <ul style="padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">We zoeken automatisch naar vaders die op dezelfde momenten beschikbaar zijn</li>
              <li style="margin-bottom: 8px;">Je ontvangt een melding zodra we een match vinden</li>
              <li>Je kunt je beschikbaarheid altijd aanpassen in de Dad Days kalender</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://papa-hi.com/dad-days" 
               style="background: linear-gradient(135deg, #FF6B35, #F7931E); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);">
              Bekijk Kalender
            </a>
          </div>
        </div>

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

Je hebt je beschikbaarheid succesvol ingesteld op PaPa-Hi.
We hebben ${slotCount} tijdslot${slotCount !== 1 ? 'en' : ''} opgeslagen in je kalender.

Wat gebeurt er nu?
- We zoeken automatisch naar vaders die op dezelfde momenten beschikbaar zijn
- Je ontvangt een melding zodra we een match vinden
- Je kunt je beschikbaarheid altijd aanpassen in de Dad Days kalender

Bezoek: https://papa-hi.com/dad-days

Met vriendelijke groet,
Het PaPa-Hi Team
    `;

    console.log(`AVAILABILITY SETUP EMAIL TO: ${user.email}`);
    console.log(`SUBJECT: ✅ Beschikbaarheid Ingesteld op PaPa-Hi`);

    try {
      const { Resend } = await import('resend');
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
          from: 'PaPa-Hi <papa@papa-hi.com>',
          to: [user.email],
          subject: '✅ Beschikbaarheid Ingesteld op PaPa-Hi',
          html: emailHtml,
          text: emailText,
          headers: {
            'X-Entity-Ref-ID': `availability-setup-${Date.now()}`,
          }
        });
        if (error) {
          console.error('Resend error for availability setup email:', error);
          return false;
        }
        console.log(`Availability setup confirmation email sent to ${user.email}`);
        return true;
      }
    } catch (e) {
      console.log('Resend not available, email logged to console');
    }

    return true;
  } catch (error) {
    console.error('Error sending availability setup confirmation:', error);
    return false;
  }
}
