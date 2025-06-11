import { sendNotificationToUser } from './server/push-notifications';

async function testPushNotifications() {
  console.log('Testing push notification system...');
  
  try {
    // Test sending notification to user ID 78 (joash)
    await sendNotificationToUser(78, {
      title: "PaPa-Hi Test Melding",
      body: "Dit is een test melding van het push notification systeem!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: {
        type: "test",
        url: "/"
      },
      actions: [
        {
          action: "view",
          title: "Bekijken"
        }
      ]
    });
    
    console.log('✅ Push notification sent successfully');
    
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
  }
}

testPushNotifications();