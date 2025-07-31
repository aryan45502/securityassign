// Secure contact form routes with input validation and admin access
const express = require('express');
const router = express.Router();
const { createMessage, getAllMessages } = require('../controllers/contactController');
const { protect, admin } = require('../middleware/auth');

// Public: Send a contact message
router.post('/', createMessage);

// Admin: Get all contact messages
router.get('/', protect, admin, getAllMessages);

module.exports = router; 