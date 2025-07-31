const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({ 
    message: 'Webhook service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 