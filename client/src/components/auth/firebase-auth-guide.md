# Setting Up Firebase Authentication for PaPa-Hi

To properly enable Google Authentication, please follow these steps:

## Step 1: Firebase Console Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (the one matching your `VITE_FIREBASE_PROJECT_ID`)
3. In the left sidebar, click on **Authentication**
4. Click on the **Sign-in method** tab
5. Find **Google** in the list of providers and click on it
6. Toggle the **Enable** switch to the ON position
7. Configure the **Project support email** (usually your email)
8. Click **Save**

## Step 2: Add Your Domain to Authorized Domains

1. While still in the Authentication section, click on the **Settings** tab
2. Scroll down to the **Authorized domains** section
3. Click **Add domain**
4. Add your Replit domain (e.g., `yourusername.replit.app`) and any other domains your app uses
5. Click **Add**

## Step 3: Ensure Your Project Settings Match

1. In the Firebase Console, click on the gear icon (⚙️) next to "Project Overview" and select **Project settings**
2. Under the **General** tab, find the **Your apps** section
3. If no app is listed, click **Add app** and select the Web platform (</>)
4. Enter a nickname for your app (e.g., "PaPa-Hi Web") and click **Register app**
5. Copy the Firebase configuration values:
   - apiKey
   - projectId
   - appId
6. Make sure these values match your Replit environment variables:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_APP_ID

After completing these steps, the Google Sign-In functionality should work correctly. If you're still having issues, please check your browser console for more specific error messages.

## Note on Firebase Free Tier Limitations

The Firebase free tier has certain limits on authentication:
- Up to 50,000 monthly active users
- Limited to 10,000 authentication calls per month

For a small to medium-sized application, this should be sufficient.