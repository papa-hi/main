import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    // Check current permission first
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      // Direct approach for modern browsers including Android Chrome
      if (typeof Notification.requestPermission === 'function') {
        const permission = await Notification.requestPermission();
        return permission;
      } else {
        throw new Error('Notifications not supported');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Shorter timeout for mobile devices
      const timeoutDuration = /Android/i.test(navigator.userAgent) ? 5000 : 10000;
      const permissionTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Permission request timed out after ${timeoutDuration/1000} seconds`)), timeoutDuration);
      });

      const permissionRequest = requestPermission();
      const permission = await Promise.race([permissionRequest, permissionTimeout]);
      
      if (permission !== 'granted') {
        const errorMsg = permission === 'denied' 
          ? 'Notifications were blocked. Please enable them in your browser settings.' 
          : 'Permission was not granted for notifications';
        setError(errorMsg);
        setLoading(false);
        return false;
      }

      // Get VAPID public key from server
      const envResponse = await fetch('/api/env');
      if (!envResponse.ok) {
        throw new Error('Failed to get server configuration');
      }
      
      const envData = await envResponse.json();
      const vapidPublicKey = envData.VAPID_PUBLIC_KEY || 'BLslB1PkERhUIoQhTLjwpQdp5p3KK0ZqGhLuJxIJhLLWWCdaJPvGw_KEFOgO5pfTk7Fg_Dt97wqxl9DH2IUzmCg';

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Add timeout for service worker ready with fallback for Android devices
      const swTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Service worker ready timeout')), 3000);
      });

      let registration;
      try {
        registration = await Promise.race([navigator.serviceWorker.ready, swTimeout]);
      } catch (error) {
        // Fallback: Register service worker manually for Android devices
        registration = await navigator.serviceWorker.register('/service-worker.js');
        await registration.update();
        
        // Wait for it to become ready
        const readyTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Manual registration timeout')), 5000);
        });
        
        registration = await Promise.race([navigator.serviceWorker.ready, readyTimeout]);
      }
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send subscription to server (wrap in subscription object as expected by server)
      const subscriptionData = {
        subscription: {
          endpoint: pushSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
          }
        }
      };

      await apiRequest('POST', '/api/push/subscribe', subscriptionData);

      setSubscription(pushSubscription);
      setIsSubscribed(true);
      setLoading(false);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to notifications';
      setError(errorMessage);
      setLoading(false);
      return false;
    } finally {
      // Ensure loading is always reset
      setLoading(false);
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false;

    setLoading(true);
    setError(null);

    try {
      await subscription.unsubscribe();
      
      // Remove subscription from server
      await apiRequest('POST', '/api/push/unsubscribe', { endpoint: subscription.endpoint });

      setSubscription(null);
      setIsSubscribed(false);
      setLoading(false);
      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      setLoading(false);
      return false;
    }
  };

  const sendTestNotification = async (): Promise<boolean> => {
    try {
      await apiRequest('POST', '/api/push/test');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test notification');
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}