require('dotenv').config();

/**
 * API Key Authentication Middleware
 */
function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required',
      message: 'Provide API key in x-api-key header or Authorization header'
    });
  }
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  // API key valid, proceed
  next();
}

/**
 * Request validation middleware
 */
function validateNotificationRequest(req, res, next) {
  const { title, message } = req.body;
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Title is required',
      message: 'Title must be a non-empty string'
    });
  }
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message is required',
      message: 'Message must be a non-empty string'
    });
  }
  
  // Validation passed
  next();
}

/**
 * Token validation middleware
 */
function validateTokenRequest(req, res, next) {
  const { token } = req.body;
  
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Token is required',
      message: 'FCM token must be provided'
    });
  }
  
  // Token validation passed
  next();
}

module.exports = {
  authenticateAPIKey,
  validateNotificationRequest,
  validateTokenRequest
};