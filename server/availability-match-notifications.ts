import { Resend } from "resend";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendNotificationToUser } from "./push-notifications";
import { getDayName, getTimeSlotDisplay } from "./availability-matching-service";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

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

async function sendAvailabilityEmail(params: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<boolean> {
  try {
    const resendClient = getResendClient();

    if (!resendClient) {
      console.log(`[Availability Email] To: ${params.to}`);
      console.log(`[Availability Email] Subject: ${params.subject}`);
      return true;
    }

    const { error } = await resendClient.emails.send({
      from: "PaPa-Hi <papa@papa-hi.com>",
      to: [params.to],
      subject: params.subject,
      html: params.htmlContent,
      text: params.textContent,
    });

    if (error) {
      console.error("Availability email send error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Availability email error:", error);
    return false;
  }
}

export async function sendAvailabilityMatchNotificationEmail(
  userId: number,
  matchedUserId: number,
  candidate: AvailabilityMatchCandidate
): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return false;

    const matchedUser = candidate.user;
    const distance = candidate.distance || 0;
    const sharedSlots = candidate.sharedSlots;

    const timeSlotsText = sharedSlots
      .map((slot) => {
        const dayName = getDayName(slot.dayOfWeek as any);
        const timeSlotDisplay = getTimeSlotDisplay(slot.timeSlot as any);
        return `${dayName} ${timeSlotDisplay.split(" ")[0]}`;
      })
      .join(", ");

    const nextSlot = sharedSlots[0];
    const nextDayName = getDayName(nextSlot.dayOfWeek as any);
    const nextTimeDisplay = getTimeSlotDisplay(nextSlot.timeSlot as any);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Availability Match</title>
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

          <h1 class="title">New Availability Match!</h1>

          <p>Hi ${user.firstName},</p>
          
          <p>Great news! <strong>${matchedUser.firstName} ${matchedUser.lastName}</strong> 
            ${matchedUser.city ? `from ${matchedUser.city}` : ""} has the same free times as you on PaPa-Hi. 
            This is a perfect opportunity to plan a playdate!</p>

          <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 25px; border-radius: 12px; color: white; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Your Shared Times</h3>
            
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 10px; margin-bottom: 15px;">
              ${sharedSlots
                .map((slot) => {
                  const day = getDayName(slot.dayOfWeek as any);
                  const time = getTimeSlotDisplay(slot.timeSlot as any);
                  return `
                  <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                    <span style="font-size: 18px; font-weight: bold;">${day}</span>
                    <span style="font-size: 14px; opacity: 0.9; float: right;">${time}</span>
                  </div>
                `;
                })
                .join("")}
            </div>

            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
              <p style="margin: 0 0 8px 0;"><strong>Distance:</strong> ${distance} km</p>
              <p style="margin: 0 0 8px 0;"><strong>Match Score:</strong> ${candidate.matchScore}%</p>
              <p style="margin: 0;"><strong>Compatible Children:</strong> ${candidate.childrenCompatibility}</p>
            </div>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400E; margin: 0 0 10px 0;">Upcoming Opportunity</h4>
            <p style="color: #78350F; margin: 0; font-size: 16px;">
              <strong>${nextDayName}</strong> ${nextTimeDisplay.toLowerCase()} — 
              You're both available!
            </p>
          </div>

          ${
            matchedUser.childrenInfo && matchedUser.childrenInfo.length > 0
              ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">${matchedUser.firstName}'s Children:</h4>
            <div>
              ${matchedUser.childrenInfo
                .map(
                  (child) =>
                    `<span style="background: #FF6B35; color: white; padding: 5px 12px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 3px;">
                  ${child.name} (${child.age} yr)
                </span>`
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://papa-hi.com/matches" class="cta-button">
              View Match
            </a>
            <a href="https://papa-hi.com/playdates/create?match=${matchedUserId}&day=${nextSlot.dayOfWeek}&slot=${nextSlot.timeSlot}" class="cta-button-green">
              Suggest Playdate
            </a>
          </div>

          <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1E40AF; font-size: 14px;">
              <strong>Tip:</strong> Send a quick message to introduce yourself and suggest a specific time. 
              Most dads respond within 24 hours!
            </p>
          </div>

          <div class="footer">
            <p>PaPa-Hi - Connecting Fathers, Building Communities</p>
            <p>
              <a href="https://papa-hi.com/dad-days" style="color: #FF6B35;">Edit your Dad Days</a> | 
              <a href="https://papa-hi.com" style="color: #FF6B35;">papa-hi.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Hi ${user.firstName},

Great news! ${matchedUser.firstName} ${matchedUser.lastName}${matchedUser.city ? ` from ${matchedUser.city}` : ""} has the same free times as you.

Your Shared Times:
${sharedSlots
  .map((slot) => {
    const day = getDayName(slot.dayOfWeek as any);
    const time = getTimeSlotDisplay(slot.timeSlot as any);
    return `- ${day} ${time}`;
  })
  .join("\n")}

Match Details:
- Distance: ${distance} km
- Match Score: ${candidate.matchScore}%
- Compatible Children: ${candidate.childrenCompatibility}

Upcoming Opportunity:
${nextDayName} ${nextTimeDisplay.toLowerCase()} — You're both available!

Visit: https://papa-hi.com/matches

Best regards,
The PaPa-Hi Team
    `;

    const success = await sendAvailabilityEmail({
      to: user.email,
      subject: `${matchedUser.firstName} is free on ${timeSlotsText}!`,
      htmlContent: emailHtml,
      textContent: emailText,
    });

    if (success) {
      console.log(
        `Availability match email sent to ${user.email} about match with ${matchedUser.firstName}`
      );
    }

    return success;
  } catch (error) {
    console.error("Error sending availability match email:", error);
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
    const distance = candidate.distance || 0;
    const firstSlot = candidate.sharedSlots[0];
    const dayName = getDayName(firstSlot.dayOfWeek as any);
    const timeName = getTimeSlotDisplay(firstSlot.timeSlot as any).split(" ")[0];

    await sendNotificationToUser(userId, {
      title: "New Availability Match!",
      body: `${matchedUser.firstName} is also free on ${dayName} ${timeName} (${distance}km)`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "availability_match",
        matchedUserId: matchedUserId,
        matchScore: candidate.matchScore,
        distance: distance,
        sharedSlots: JSON.stringify(candidate.sharedSlots),
        url: "/matches",
      },
      actions: [
        {
          action: "view_match",
          title: "View Match",
          icon: "/icon-192x192.png",
        },
        {
          action: "create_playdate",
          title: "Plan Playdate",
          icon: "/icon-192x192.png",
        },
        {
          action: "dismiss",
          title: "Later",
        },
      ],
    });

    console.log(
      `Availability match push notification sent to user ${userId}`
    );
  } catch (error) {
    console.error(
      `Error sending availability match push notification to user ${userId}:`,
      error
    );
  }
}

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
    if (!user) return false;

    const totalMatches = weekOverview.reduce(
      (sum, day) => sum + day.matchesCount,
      0
    );

    if (totalMatches === 0) return false;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Weekly Overview</title>
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
            margin-bottom: 5px;
            text-align: center;
          }
          .subtitle {
            color: #666;
            margin: 10px 0 0 0;
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
          }
          .slot-button {
            display: inline-block;
            background: #FF6B35;
            color: white !important;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
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

          <h1 class="title">Your Weekly Overview</h1>
          <p class="subtitle">${totalMatches} playdate opportunities this week!</p>

          <div style="padding: 30px 0;">
            <p>Hi ${user.firstName},</p>
            
            <p>Here's your playdate schedule for the coming week. 
              We found ${totalMatches} dads who are free at the same times as you!</p>

            ${weekOverview
              .filter((slot) => slot.matchesCount > 0)
              .slice(0, 5)
              .map(
                (slot) => `
              <div style="background: white; border: 2px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #E5E7EB;">
                  <div>
                    <h3 style="margin: 0; color: #1F2937; font-size: 18px; display: inline-block;">${slot.dayName}</h3>
                    <span style="background: #FF6B35; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; float: right;">
                      ${slot.matchesCount} ${slot.matchesCount === 1 ? "dad" : "dads"}
                    </span>
                  </div>
                  <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 14px;">${slot.timeSlotDisplay}</p>
                </div>

                ${
                  slot.topMatches.length > 0
                    ? `
                  <div style="margin-top: 10px;">
                    <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">Nearby:</p>
                    ${slot.topMatches
                      .map(
                        (match) => `
                      <div style="padding: 10px; background: #F9FAFB; border-radius: 8px; margin-bottom: 8px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #FF6B35; color: white; display: inline-block; text-align: center; line-height: 32px; font-weight: bold; margin-right: 10px; vertical-align: middle;">
                          ${match.firstName.charAt(0)}
                        </div>
                        <span style="font-weight: 600; color: #1F2937; vertical-align: middle;">${match.firstName} ${match.lastName}</span>
                        <span style="font-size: 12px; color: #6B7280; vertical-align: middle;"> · ${match.distanceKm}km</span>
                        <span style="background: #10B981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; float: right; margin-top: 6px;">
                          ${match.matchScore}%
                        </span>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }

                <div style="margin-top: 15px;">
                  <a href="https://papa-hi.com/matches?day=${slot.dayOfWeek}&slot=${slot.timeSlot}" class="slot-button">
                    View Matches →
                  </a>
                </div>
              </div>
            `
              )
              .join("")}

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://papa-hi.com/dad-days" class="cta-button">
                Edit Your Dad Days
              </a>
            </div>
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

Your Weekly Overview - ${totalMatches} playdate opportunities!

${weekOverview
  .filter((slot) => slot.matchesCount > 0)
  .map(
    (slot) =>
      `${slot.dayName} ${slot.timeSlotDisplay}: ${slot.matchesCount} dads available`
  )
  .join("\n")}

Visit: https://papa-hi.com/matches

Best regards,
The PaPa-Hi Team
    `;

    return await sendAvailabilityEmail({
      to: user.email,
      subject: `Your Weekly Overview: ${totalMatches} Playdate Opportunities!`,
      htmlContent: emailHtml,
      textContent: emailText,
    });
  } catch (error) {
    console.error("Error sending weekly availability digest:", error);
    return false;
  }
}

export async function sendAvailabilitySetupConfirmation(
  userId: number,
  slotsCount: number,
  matchesCount: number
): Promise<void> {
  try {
    await sendNotificationToUser(userId, {
      title: "Dad Days Set Up!",
      body:
        matchesCount > 0
          ? `Great! ${matchesCount} dads share your availability.`
          : `You've added ${slotsCount} time slots. We're searching for matches!`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "availability_setup",
        slotsCount,
        matchesCount,
        url: matchesCount > 0 ? "/matches" : "/dad-days",
      },
    });

    console.log(`Availability setup confirmation sent to user ${userId}`);
  } catch (error) {
    console.error(
      `Error sending setup confirmation to user ${userId}:`,
      error
    );
  }
}
