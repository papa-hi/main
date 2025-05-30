# Email and Push Notification Setup

## Email Notifications with Outlook

### 1. Generate App Password for Outlook
1. Go to https://account.microsoft.com/security
2. Sign in with your Outlook account
3. Click on "Advanced security options"
4. Under "App passwords", click "Create a new app password"
5. Name it "PaPa-Hi Notifications"
6. Copy the generated password (you'll need this for SMTP_PASSWORD)

### 2. Configure Environment Variables
Add these to your `.env` file:

```env
# Outlook SMTP Configuration
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_app_password_from_step_1
SMTP_FROM=your_email@outlook.com
```

### 3. Generate VAPID Keys for Push Notifications
Run this command to generate the required keys:

```bash
node generate-vapid-keys.js
```

Add the output to your `.env` file:
```env
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_EMAIL=mailto:your_email@outlook.com
```

## Features

### Email Notifications
- **Playdate Reminders**: Automatic emails sent 24 hours before playdates
- **Playdate Updates**: Notifications when playdate details change
- **New Participants**: Alerts when someone joins your playdate

### Push Notifications
- **Browser Notifications**: Real-time updates in your browser
- **Works Offline**: Notifications delivered even when the app is closed
- **User Control**: Easy enable/disable in profile settings

## Testing
Once configured, you can:
1. Create a test playdate for tomorrow
2. Use the "Test Notification" button in your profile
3. Check that email notifications are working

## Troubleshooting

### Email Issues
- Verify your Outlook app password is correct
- Check that two-factor authentication is enabled on your Outlook account
- Ensure SMTP settings match exactly

### Push Notification Issues
- Make sure HTTPS is enabled (required for push notifications)
- Check browser notification permissions
- Verify VAPID keys are properly generated

## Security Notes
- App passwords are safer than using your main password
- VAPID keys should be kept secret
- All notification data is processed securely