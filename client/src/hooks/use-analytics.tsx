import { useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "./use-auth";

// Hook to track page views
export function usePageTracking() {
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user && location) {
      // Track page view
      fetch('/api/analytics/page-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: location,
          timestamp: new Date().toISOString()
        }),
      }).catch(err => console.log('Page tracking failed:', err));
    }
  }, [location, user]);
}

// Function to track feature usage
export function trackFeature(feature: string, action: string, details?: any) {
  fetch('/api/analytics/feature-usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      feature,
      action,
      details,
      timestamp: new Date().toISOString()
    }),
  }).catch(err => console.log('Feature tracking failed:', err));
}