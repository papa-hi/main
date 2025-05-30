import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    permission: 'default'
  });

  useEffect(() => {
    // Detect if running in WebView vs full browser
    const isWebView = navigator.userAgent.includes('wv') || 
                     navigator.userAgent.includes('WebView') ||
                     (window as any).navigator?.standalone === false;
    const hasNotification = 'Notification' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    
    // In WebView, notifications are usually restricted
    const isSupported = hasNotification && hasServiceWorker && !isWebView;
    
    console.log('Push notification support check:', {
      hasNotification,
      hasServiceWorker,
      hasPushManager,
      isWebView,
      isSupported,
      userAgent: navigator.userAgent.substring(0, 100)
    });
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission: hasNotification ? Notification.permission : 'denied'
    }));

    if (isSupported && user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSubscribed: !!subscription
      }));
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    try {
      // For mobile devices, we need to be more explicit about requesting permission
      if ('Notification' in window && Notification.permission === 'default') {
        // On mobile, the permission request might not show a popup immediately
        // We need to trigger it from a user gesture
        const permission = await Notification.requestPermission();
        setState(prev => ({ ...prev, permission }));
        return permission;
      }
      
      const currentPermission = Notification.permission;
      setState(prev => ({ ...prev, permission: currentPermission }));
      return currentPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      const currentPermission = Notification.permission;
      setState(prev => ({ ...prev, permission: currentPermission }));
      return currentPermission;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    console.log('Subscribe attempt started', { isSupported: state.isSupported, hasUser: !!user });
    
    if (!state.isSupported || !user) {
      console.error('Push notifications not supported or user not authenticated');
      return false;
    }

    console.log('Setting loading state to true');
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check browser compatibility first
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers not supported');
      }

      if (!('PushManager' in window)) {
        throw new Error('Push messaging not supported');
      }

      // Request permission if not granted with timeout
      console.log('Requesting notification permission, current permission:', state.permission);
      
      let permission = state.permission;
      if (state.permission === 'default') {
        try {
          // Set a timeout for the permission request
          const permissionPromise = requestPermission();
          const timeoutPromise = new Promise<NotificationPermission>((_, reject) => 
            setTimeout(() => reject(new Error('Permission request timeout')), 10000)
          );
          
          permission = await Promise.race([permissionPromise, timeoutPromise]);
        } catch (error) {
          console.log('Permission request failed or timed out:', error);
          setState(prev => ({ ...prev, isLoading: false }));
          toast({
            title: "Permission Required",
            description: "Please enable notifications manually in your browser settings. Look for the notification icon in your address bar or browser menu.",
            variant: "destructive",
          });
          return false;
        }
      }
      
      console.log('Permission result:', permission);
      
      if (permission !== 'granted') {
        console.log('Permission not granted, exiting');
        setState(prev => ({ ...prev, permission, isLoading: false }));
        toast({
          title: "Permission Required",
          description: "Please allow notifications to receive playdate reminders.",
          variant: "destructive",
        });
        return false;
      }

      // Get service worker registration
      console.log('Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready');

      // Get VAPID public key from server
      console.log('Fetching VAPID public key...');
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) {
        throw new Error('Failed to get VAPID public key');
      }
      
      const { publicKey } = await response.json();
      console.log('Got VAPID public key');
      
      if (!publicKey) {
        throw new Error('VAPID public key not configured on server');
      }

      // Subscribe to push notifications
      console.log('Subscribing to push notifications...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      console.log('Push subscription successful');

      // Send subscription to server
      console.log('Sending subscription to server...');
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription to server');
      }
      console.log('Subscription saved to server');

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false
      }));

      toast({
        title: "Notifications Enabled",
        description: "You'll now receive playdate reminders and updates!",
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      
      let errorMessage = "Failed to enable notifications. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "The request timed out. Please check your connection and try again.";
        } else if (error.message.includes('not supported')) {
          errorMessage = "Your browser doesn't support push notifications.";
        } else if (error.message.includes('Permission')) {
          errorMessage = "Please allow notifications in your browser settings.";
        }
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      // Ensure loading state is always reset
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false
      }));

      toast({
        title: "Notifications Disabled",
        description: "You'll no longer receive push notifications.",
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Unsubscribe Failed",
        description: "Failed to disable notifications. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission
  };
}

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}