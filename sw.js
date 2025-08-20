// Listen for push notifications from your Netlify function
self.addEventListener('push', function(event) {
    // Default notification data
    let data = {
        title: 'Google Meet',
        body: 'Your meeting is starting now',
        icon: '/icon-192.png',
        badge: '/badge-72.png'
    };
    
    // Parse notification data if provided
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.error('Error parsing push data:', e);
        }
    }
    
    // Configure notification appearance and behavior
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        data: data.data,
        actions: [
            { action: 'join', title: 'Join Meeting' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        requireInteraction: true,  // Notification stays until user interacts
        tag: 'meeting-notification'  // Replace previous notifications with same tag
    };
    
    // Display the notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
    // Close the notification
    event.notification.close();
    
    // If user clicked "Join Meeting", open the meeting URL
    if (event.action === 'join' && event.notification.data.meetingUrl) {
        event.waitUntil(
            clients.openWindow(event.notification.data.meetingUrl)
        );
    }
});
