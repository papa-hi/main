import webpush from 'web-push';
import { db } from './db';
import { pushSubscriptions, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// VAPID keys for push notifications
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BLslB1PkERhUIoQhTLjwpQdp5p3KK0ZqGhLuJxIJhLLWWCdaJPvGw_KEFOgO5pfTk7Fg_Dt97wqxl9DH2IUzmCg',
  privateKey: process.env.VAPID_PRIVATE_KEY || '4POhzv8wNe-mUNaPznu6aTn25kZ7wmLaus323F02M7Q'
};

// Configure web-push
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:admin@papa-hi.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function sendNotificationToUser(userId: number, payload: NotificationPayload): Promise<void> {
  try {
    // Get all push subscriptions for the user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    // Send notification to all user's devices
    const notificationPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dhKey,
            auth: subscription.authKey
          }
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );

        // Update last used timestamp
        await db
          .update(pushSubscriptions)
          .set({ lastUsed: new Date() })
          .where(eq(pushSubscriptions.id, subscription.id));

        console.log(`Push notification sent successfully to user ${userId}`);
      } catch (error) {
        console.error(`Failed to send push notification to subscription ${subscription.id}:`, error);
        
        // If the subscription is invalid, remove it
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, subscription.id));
          console.log(`Removed invalid push subscription ${subscription.id}`);
        }
      }
    });

    await Promise.allSettled(notificationPromises);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
}

export async function sendPlaydateReminder(userId: number, playdateTitle: string, startTime: Date): Promise<void> {
  const timeUntil = Math.round((startTime.getTime() - Date.now()) / (1000 * 60)); // minutes
  
  let body: string;
  if (timeUntil <= 30) {
    body = `Your playdate "${playdateTitle}" starts in ${timeUntil} minutes!`;
  } else if (timeUntil <= 60) {
    body = `Your playdate "${playdateTitle}" starts in 1 hour!`;
  } else {
    const hours = Math.round(timeUntil / 60);
    body = `Your playdate "${playdateTitle}" starts in ${hours} hours!`;
  }

  await sendNotificationToUser(userId, {
    title: 'Playdate Reminder',
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      type: 'playdate_reminder',
      playdateTitle,
      startTime: startTime.toISOString()
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      }
    ]
  });
}

export async function sendPlaydateUpdate(userId: number, playdateTitle: string, updateType: 'cancelled' | 'modified' | 'new_participant'): Promise<void> {
  let title: string;
  let body: string;

  switch (updateType) {
    case 'cancelled':
      title = 'Playdate Cancelled';
      body = `The playdate "${playdateTitle}" has been cancelled.`;
      break;
    case 'modified':
      title = 'Playdate Updated';
      body = `The playdate "${playdateTitle}" has been updated. Check the new details.`;
      break;
    case 'new_participant':
      title = 'New Playdate Participant';
      body = `Someone new joined your playdate "${playdateTitle}"!`;
      break;
  }

  await sendNotificationToUser(userId, {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      type: 'playdate_update',
      updateType,
      playdateTitle
    },
    actions: [
      {
        action: 'view',
        title: 'View Playdate'
      }
    ]
  });
}

export async function sendNewCommunityPostNotification(
  authorId: number,
  authorName: string,
  postTitle: string,
  postId: number,
  category?: string
): Promise<void> {
  try {
    // Get all users with push subscriptions (excluding the author and admin users)
    const usersWithSubscriptions = await db
      .selectDistinct({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions)
      .leftJoin(users, eq(pushSubscriptions.userId, users.id))
      .where(eq(users.role, 'user'));

    // Extract unique user IDs and filter out the post author
    const userIdSet = new Set(usersWithSubscriptions.map(u => u.userId));
    const uniqueUserIds = Array.from(userIdSet);
    const notifyUserIds = uniqueUserIds.filter(id => id !== authorId);

    if (notifyUserIds.length === 0) {
      console.log('No users to notify about new community post');
      return;
    }

    // Construct notification message
    const categoryText = category ? ` in ${category}` : '';
    const body = postTitle 
      ? `${authorName} posted "${postTitle}"${categoryText}` 
      : `${authorName} shared a new post${categoryText}`;

    // Send notification to all eligible users
    const notificationPromises = notifyUserIds.map(userId =>
      sendNotificationToUser(userId, {
        title: 'New Community Post',
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: {
          type: 'new_community_post',
          postId,
          authorId,
          category
        },
        actions: [
          {
            action: 'view',
            title: 'View Post'
          }
        ]
      })
    );

    await Promise.allSettled(notificationPromises);
    console.log(`Sent new post notifications to ${notifyUserIds.length} users`);
  } catch (error) {
    console.error('Error sending new community post notifications:', error);
    // Don't throw - we don't want notification failures to break post creation
  }
}

export async function generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  return webpush.generateVAPIDKeys();
}

export function getVapidPublicKey(): string {
  return vapidKeys.publicKey;
}