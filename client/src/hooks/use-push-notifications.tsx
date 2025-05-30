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
    console.log('🔔 PUSH NOTIFICATION DEBUG: Starting subscription process');
    console.log('📱 Device:', navigator.userAgent);
    console.log('👤 User authenticated:', !!user);
    console.log('🌐 Support check:', state.isSupported);
    console.log('🔒 Current permission:', state.permission);
    
    if (!state.isSupported || !user) {
      console.error('❌ PUSH NOTIFICATION DEBUG: Not supported or user not authenticated');
      return false;
    }

    console.log('⏳ PUSH NOTIFICATION DEBUG: Setting loading state');
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission if not granted
      console.log('🔐 PUSH NOTIFICATION DEBUG: Checking permission');
      const permission = state.permission === 'default' ? await requestPermission() : state.permission;
      console.log('🔐 PUSH NOTIFICATION DEBUG: Permission result:', permission);
      
      if (permission !== 'granted') {
        console.log('❌ PUSH NOTIFICATION DEBUG: Permission denied');
        toast({
          title: "Permission Required",
          description: "Please allow notifications to receive playdate reminders.",
          variant: "destructive",
        });
        return false;
      }

      // Get service worker registration
      console.log('🔧 PUSH NOTIFICATION DEBUG: Getting service worker registration');
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ PUSH NOTIFICATION DEBUG: Service worker ready');

      // Get VAPID public key from server
      console.log('🔑 PUSH NOTIFICATION DEBUG: Fetching VAPID key');
      const response = await fetch('/api/push/vapid-public-key');
      console.log('🔑 PUSH NOTIFICATION DEBUG: VAPID response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to get VAPID public key');
      }
      
      const { publicKey } = await response.json();
      console.log('🔑 PUSH NOTIFICATION DEBUG: Got VAPID key:', publicKey ? 'Yes' : 'No');
      
      if (!publicKey) {
        throw new Error('VAPID public key not configured on server');
      }

      // Subscribe to push notifications
      console.log('📝 PUSH NOTIFICATION DEBUG: Creating browser subscription');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      console.log('✅ PUSH NOTIFICATION DEBUG: Browser subscription created');

      // Send subscription to server
      console.log('📤 PUSH NOTIFICATION DEBUG: Sending subscription to server');
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
      console.log('📤 PUSH NOTIFICATION DEBUG: Server response status:', subscribeResponse.status);

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription to server');
      }

      // Store subscription status in localStorage for mobile PWAs
      console.log('💾 PUSH NOTIFICATION DEBUG: Storing in localStorage');
      localStorage.setItem('pushNotificationEnabled', 'true');
      
      console.log('🎯 PUSH NOTIFICATION DEBUG: Setting React state');
      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        permission: 'granted'
      }));
      console.log('🎯 PUSH NOTIFICATION DEBUG: React state updated');

      toast({
        title: "Notifications Enabled",
        description: "You'll now receive playdate reminders and updates!",
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Subscription Failed",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
      
      return false;
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