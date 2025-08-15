const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK'yı initialize et
const serviceAccount = require('../config/firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'fal-ai-app-9abda'
  });
  console.log('✅ Firebase Admin SDK initialized');
}

const messaging = admin.messaging();

/**
 * Topic'e bildirim gönder (tüm kullanıcılara)
 */
async function sendToTopic(topic, title, body, data = {}, imageUrl = null) {
  try {
    const message = {
      topic: topic,
      notification: {
        title: title,
        body: body,
        ...(imageUrl && { imageUrl: imageUrl })
      },
      data: {
        ...data,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default_channel',
          icon: '@mipmap/ic_launcher'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            alert: {
              title: title,
              body: body
            }
          }
        }
      }
    };

    const response = await messaging.send(message);
    console.log('✅ FCM Topic message sent successfully:', response);
    
    return {
      success: true,
      messageId: response,
      topic: topic
    };
  } catch (error) {
    console.error('❌ FCM Topic message failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Belirli token'a bildirim gönder
 */
async function sendToToken(token, title, body, data = {}, imageUrl = null) {
  try {
    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
        ...(imageUrl && { imageUrl: imageUrl })
      },
      data: {
        ...data,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default_channel'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await messaging.send(message);
    console.log('✅ FCM Token message sent successfully:', response);
    
    return {
      success: true,
      messageId: response,
      token: token.substring(0, 20) + '...'
    };
  } catch (error) {
    console.error('❌ FCM Token message failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Multiple tokens'a bildirim gönder
 */
async function sendToMultipleTokens(tokens, title, body, data = {}, imageUrl = null) {
  try {
    const message = {
      tokens: tokens,
      notification: {
        title: title,
        body: body,
        ...(imageUrl && { imageUrl: imageUrl })
      },
      data: {
        ...data,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default_channel'
        }
      }
    };

    const response = await messaging.sendMulticast(message);
    console.log('✅ FCM Multicast sent:', response.successCount, 'success,', response.failureCount, 'failed');
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    console.error('❌ FCM Multicast failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Topic subscription
 */
async function subscribeToTopic(tokens, topic) {
  try {
    const response = await messaging.subscribeToTopic(tokens, topic);
    console.log(`✅ Successfully subscribed to topic ${topic}:`, response.successCount);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error('❌ Topic subscription failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  messaging,
  sendToTopic,
  sendToToken,
  sendToMultipleTokens,
  subscribeToTopic
};