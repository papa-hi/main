# URGENT: Fixing the Domain Authorization Error for PaPa-Hi

## The Exact Error
The current error you're seeing is:
```
The current domain is not authorized for OAuth operations. Add your domain (04661828-2b6e-42fa-a890-5e763456e3c1-00-u1e2637z1n45.kirk.replit.dev) to the OAuth redirect domains list in the Firebase console -> Authentication -> Settings -> Authorized domains tab.
```

## Quick Fix Steps

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (the one matching your `VITE_FIREBASE_PROJECT_ID`)
3. Click on **Authentication** in the left sidebar
4. Click on the **Settings** tab (not the Sign-in method tab)
5. Scroll down to the **Authorized domains** section
6. Click **Add domain**
7. Add your specific Replit domain: `04661828-2b6e-42fa-a890-5e763456e3c1-00-u1e2637z1n45.kirk.replit.dev`
8. Click **Add**

After this change, refresh your app and try the Google Sign-In again.

## If Google Sign-In is Not Enabled

While fixing the domain issue, also check that Google Sign-In is properly enabled:

1. In the Authentication section, click on the **Sign-in method** tab
2. Find **Google** in the list of providers and click on it
3. Toggle the **Enable** switch to the ON position
4. Configure the **Project support email** (usually your email)
5. Click **Save**

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