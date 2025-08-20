               
const webpush = require('web-push');

// Configure VAPID details
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { subscription, payload, options = {} } = JSON.parse(event.body);

    // Validate required fields
    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing subscription data',
          required: 'subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth'
        }),
      };
    }

    // Default notification options
    const notificationOptions = {
      TTL: options.ttl || 86400, // 24 hours
      urgency: options.urgency || 'normal',
      ...options
    };

    // Send the notification
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      notificationOptions
    );

    console.log('Push notification sent successfully:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      status: result.statusCode,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true, 
        status: result.statusCode,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Push notification error:', error);

    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.statusCode === 410) {
      statusCode = 410;
      errorMessage = 'Subscription has expired or is invalid';
    } else if (error.statusCode === 413) {
      statusCode = 413;
      errorMessage = 'Payload too large';
    } else if (error.statusCode === 429) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
    }

    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
