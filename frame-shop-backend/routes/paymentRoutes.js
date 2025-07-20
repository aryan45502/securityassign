const express = require("express");
const router = express.Router();

const { createCheckoutSession } = require("../controllers/paymentController");
const { handleStripeWebhook } = require("../controllers/webhookController");

// ✅ Removed `protect` to allow guest checkout

// Test route
router.get("/test", (req, res) => {
    res.json({ message: "Payments route active ✅" });
});

// ✅ Allow checkout without login
router.post("/create-checkout-session", createCheckoutSession);

// Webhook (no JSON parser)
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

module.exports = router;
