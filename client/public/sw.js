// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      data: data.data,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Bekijken'
        },
        {
          action: 'dismiss',
          title: 'Sluiten'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  // Handle notification dismissal if needed
  console.log('Notification closed');
});