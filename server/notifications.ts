import nodemailer from 'nodemailer';
import webpush from 'web-push';
import { db } from './db';
import { users, playdates } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Email configuration using Nodemailer with SMTP
const createEmailTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return null;
};

// Web Push configuration
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Email templates
const createPlaydateReminderEmail = (playdate: any, userName: string) => {
  const playdateDate = new Date(playdate.startTime).toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    subject: `Herinnering: Playdate "${playdate.title}" morgen`,
    html: `
      <h2>Playdate Herinnering</h2>
      <p>Hallo ${userName},</p>
      <p>Dit is een herinnering dat je morgen een playdate hebt:</p>
      
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>${playdate.title}</h3>
        <p><strong>Wanneer:</strong> ${playdateDate}</p>
        <p><strong>Waar:</strong> ${playdate.location}</p>
        ${playdate.description ? `<p><strong>Beschrijving:</strong> ${playdate.description}</p>` : ''}
      </div>
      
      <p>We zien je daar!</p>
      <p>Het PaPa-Hi! team</p>
    `,
    text: `
      Playdate Herinnering
      
      Hallo ${userName},
      
      Dit is een herinnering dat je morgen een playdate hebt:
      
      ${playdate.title}
      Wanneer: ${playdateDate}
      Waar: ${playdate.location}
      ${playdate.description ? `Beschrijving: ${playdate.description}` : ''}
      
      We zien je daar!
      Het PaPa-Hi! team
    `
  };
};

const createPlaydateUpdateEmail = (playdate: any, userName: string, updateType: string) => {
  const playdateDate = new Date(playdate.startTime).toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let updateMessage = '';
  switch (updateType) {
    case 'cancelled':
      updateMessage = 'Deze playdate is geannuleerd.';
      break;
    case 'updated':
      updateMessage = 'De details van deze playdate zijn bijgewerkt.';
      break;
    case 'new_participant':
      updateMessage = 'Er heeft zich een nieuwe deelnemer aangemeld!';
      break;
    default:
      updateMessage = 'Er is een update voor deze playdate.';
  }

  return {
    subject: `Update: Playdate "${playdate.title}"`,
    html: `
      <h2>Playdate Update</h2>
      <p>Hallo ${userName},</p>
      <p>${updateMessage}</p>
      
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>${playdate.title}</h3>
        <p><strong>Wanneer:</strong> ${playdateDate}</p>
        <p><strong>Waar:</strong> ${playdate.location}</p>
        ${playdate.description ? `<p><strong>Beschrijving:</strong> ${playdate.description}</p>` : ''}
      </div>
      
      <p>Controleer de app voor meer details.</p>
      <p>Het PaPa-Hi! team</p>
    `,
    text: `
      Playdate Update
      
      Hallo ${userName},
      
      ${updateMessage}
      
      ${playdate.title}
      Wanneer: ${playdateDate}
      Waar: ${playdate.location}
      ${playdate.description ? `Beschrijving: ${playdate.description}` : ''}
      
      Controleer de app voor meer details.
      Het PaPa-Hi! team
    `
  };
};

// Send email notification
export const sendEmailNotification = async (
  email: string, 
  subject: string, 
  html: string, 
  text: string
) => {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    console.log('Email transporter not configured, skipping email notification');
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html,
      text,
    });
    
    console.log(`Email notification sent to ${email}: ${subject}`);
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
};

// Send push notification
export const sendPushNotification = async (
  subscription: any,
  title: string,
  body: string,
  data?: any
) => {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('VAPID keys not configured, skipping push notification');
    return false;
  }

  try {
    const payload = JSON.stringify({
      title,
      body,
      data,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });

    await webpush.sendNotification(subscription, payload);
    console.log(`Push notification sent: ${title}`);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

// Send playdate reminder (24 hours before)
export const sendPlaydateReminder = async (playdateId: number) => {
  try {
    // Get playdate with participants
    const playdate = await db.query.playdates.findFirst({
      where: eq(playdates.id, playdateId),
      with: {
        participants: {
          with: {
            user: true
          }
        }
      }
    });

    if (!playdate) {
      console.error(`Playdate not found: ${playdateId}`);
      return;
    }

    // Send notifications to all participants
    for (const participant of playdate.participants) {
      const user = participant.user;
      const emailTemplate = createPlaydateReminderEmail(playdate, user.firstName);
      
      // Send email notification
      if (user.email) {
        await sendEmailNotification(
          user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text
        );
      }

      // Send push notification if user has subscription
      // TODO: Implement push subscription storage and retrieval
    }

    console.log(`Sent reminders for playdate: ${playdate.title}`);
  } catch (error) {
    console.error('Error sending playdate reminder:', error);
  }
};

// Send playdate update notification
export const sendPlaydateUpdate = async (
  playdateId: number, 
  updateType: 'cancelled' | 'updated' | 'new_participant'
) => {
  try {
    // Get playdate with participants
    const playdate = await db.query.playdates.findFirst({
      where: eq(playdates.id, playdateId),
      with: {
        participants: {
          with: {
            user: true
          }
        }
      }
    });

    if (!playdate) {
      console.error(`Playdate not found: ${playdateId}`);
      return;
    }

    // Send notifications to all participants
    for (const participant of playdate.participants) {
      const user = participant.user;
      const emailTemplate = createPlaydateUpdateEmail(playdate, user.firstName, updateType);
      
      // Send email notification
      if (user.email) {
        await sendEmailNotification(
          user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text
        );
      }

      // Send push notification if user has subscription
      // TODO: Implement push subscription storage and retrieval
    }

    console.log(`Sent update notifications for playdate: ${playdate.title} (${updateType})`);
  } catch (error) {
    console.error('Error sending playdate update:', error);
  }
};

// Generate VAPID keys for push notifications
export const generateVapidKeys = () => {
  return webpush.generateVAPIDKeys();
};