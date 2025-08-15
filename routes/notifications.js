const express = require('express');
const router = express.Router();
const { sendToTopic, sendToToken, sendToMultipleTokens } = require('../utils/firebase');
const { authenticateAPIKey, validateNotificationRequest, validateTokenRequest } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateAPIKey);

/**
 * POST /api/notifications/admin
 * Tüm kullanıcılara admin duyurusu gönder
 */
router.post('/admin', validateNotificationRequest, async (req, res) => {
  try {
    const { title, message, imageUrl, data = {} } = req.body;
    
    console.log('📢 Admin announcement request:', { title, message });
    
    const result = await sendToTopic(
      'admin_announcements',
      title,
      message,
      {
        type: 'admin_announcement',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...data
      },
      imageUrl
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Admin announcement sent successfully',
        data: {
          messageId: result.messageId,
          topic: result.topic,
          title: title,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send admin announcement',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Admin announcement error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/promotion
 * Promosyon bildirimi gönder
 */
router.post('/promotion', validateNotificationRequest, async (req, res) => {
  try {
    const { title, message, promoCode, imageUrl, data = {} } = req.body;
    
    console.log('🎉 Promotion notification request:', { title, message, promoCode });
    
    const result = await sendToTopic(
      'promotions',
      title,
      message,
      {
        type: 'promotion',
        promoCode: promoCode || '',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        route: '/store',
        ...data
      },
      imageUrl
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Promotion notification sent successfully',
        data: {
          messageId: result.messageId,
          topic: result.topic,
          promoCode: promoCode || null,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send promotion notification',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Promotion notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/fortune
 * Belirli kullanıcıya fal hazır bildirimi gönder
 */
router.post('/fortune', [validateNotificationRequest, validateTokenRequest], async (req, res) => {
  try {
    const { token, fortuneType, fortuneId, data = {} } = req.body;
    
    const title = getFortuneTitle(fortuneType);
    const message = 'Falınız yorumlandı! Hemen görmek için tıklayın.';
    
    console.log('🔮 Fortune ready notification:', { fortuneType, fortuneId, token: token.substring(0, 20) + '...' });
    
    const result = await sendToToken(
      token,
      title,
      message,
      {
        type: 'fortune_ready',
        fortuneType: fortuneType || 'general',
        fortuneId: fortuneId || 'unknown',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        route: '/fortune_detail',
        ...data
      }
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Fortune ready notification sent successfully',
        data: {
          messageId: result.messageId,
          fortuneType: fortuneType,
          fortuneId: fortuneId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send fortune ready notification',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Fortune ready notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/user
 * Belirli kullanıcıya özel bildirim gönder
 */
router.post('/user', [validateNotificationRequest, validateTokenRequest], async (req, res) => {
  try {
    const { token, title, message, imageUrl, data = {} } = req.body;
    
    console.log('👤 User notification request:', { title, message, token: token.substring(0, 20) + '...' });
    
    const result = await sendToToken(
      token,
      title,
      message,
      {
        type: 'user_notification',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...data
      },
      imageUrl
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'User notification sent successfully',
        data: {
          messageId: result.messageId,
          title: title,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send user notification',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ User notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/test
 * Test bildirimi gönder
 */
router.post('/test', async (req, res) => {
  try {
    const { token } = req.body;
    
    const title = '🧪 Test Bildirimi';
    const message = 'Node.js Backend + Firebase Admin SDK ile bildirim sistemi çalışıyor!';
    
    console.log('🧪 Test notification request');
    
    let result;
    
    if (token) {
      // Specific token'a gönder
      result = await sendToToken(
        token,
        title,
        message,
        {
          type: 'test',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      );
    } else {
      // Tüm kullanıcılara gönder
      result = await sendToTopic(
        'all_users',
        title,
        message,
        {
          type: 'test',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      );
    }
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully',
        data: {
          messageId: result.messageId,
          target: token ? 'specific_token' : 'all_users',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test notification',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Test notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Helper function - Fortune type'a göre başlık
function getFortuneTitle(fortuneType) {
  switch (fortuneType?.toLowerCase()) {
    case 'kahve':
    case 'coffee':
      return '☕ Kahve Falınız Hazır!';
    case 'ask':
    case 'love':
      return '💕 Aşk Falınız Hazır!';
    case 'gunluk':
    case 'daily':
      return '📅 Günlük Falınız Hazır!';
    case 'genel':
    case 'general':
      return '🔮 Genel Falınız Hazır!';
    case 'tarot':
      return '🃏 Tarot Falınız Hazır!';
    case 'numerology':
      return '🔢 Numeroloji Falınız Hazır!';
    default:
      return '🔮 Falınız Hazır!';
  }
}

module.exports = router;
