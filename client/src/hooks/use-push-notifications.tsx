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
    // Check if push notifications are supported
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied'
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
    const permission = await Notification.requestPermission();
    setState(prev => ({ ...prev, permission }));
    return permission;
  };

  const subscribe = async (): Promise<boolean> => {
    if (!state.isSupported || !user) {
      console.error('Push notifications not supported or user not authenticated');
      return false;
    }

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

      // Request permission if not granted
      const permission = state.permission === 'default' ? await requestPermission() : state.permission;
      
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, permission }));
        toast({
          title: "Permission Required",
          description: "Please allow notifications to receive playdate reminders.",
          variant: "destructive",
        });
        return false;
      }

      // Get service worker registration with timeout
      const registrationPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service worker timeout')), 10000)
      );
      const registration = await Promise.race([registrationPromise, timeoutPromise]) as ServiceWorkerRegistration;

      // Get VAPID public key from server
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) {
        throw new Error('Failed to get VAPID public key');
      }
      
      const { publicKey } = await response.json();
      
      if (!publicKey) {
        throw new Error('VAPID public key not configured on server');
      }

      // Subscribe to push notifications with timeout
      const subscribePromise = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      const subscribeTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Push subscription timeout')), 15000)
      );
      const subscription = await Promise.race([subscribePromise, subscribeTimeoutPromise]) as PushSubscription;

      // Send subscription to server
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