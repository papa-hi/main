const webpush = require('web-push');

// Generate VAPID keys for push notifications
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Generated VAPID Keys for Push Notifications:');
console.log('=============================================');
console.log('Add these to your .env file:');
console.log('');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_EMAIL=mailto:your_email@outlook.com`);
console.log('');
console.log('Make sure to replace "your_email@outlook.com" with your actual email address.');