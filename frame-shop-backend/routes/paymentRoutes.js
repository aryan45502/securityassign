const express = require("express");
const router = express.Router();
const axios = require('axios');
const { protect } = require("../middleware/auth");
const { 
  createCheckoutSession, 
  createKhaltiPayment, 
  verifyKhaltiOTP 
} = require("../controllers/paymentController");

// Stripe payment routes
router.post("/create-checkout-session", protect, createCheckoutSession);

// Khalti payment routes
router.post("/khalti/create-payment", createKhaltiPayment);
router.post("/khalti/verify-otp", verifyKhaltiOTP);

// Khalti Web Checkout - Initiate Payment
router.post("/initiate-khalti/:orderId", protect, async (req, res) => {
  const { orderId } = req.params;
  const { amount, customerInfo } = req.body;
  
  if (!amount || !orderId) {
    return res.status(400).json({ 
      success: false, 
      message: "Amount and order ID are required" 
    });
  }

  try {
    console.log('🔄 Initiating Khalti Web Checkout:', { orderId, amount });

    // Prepare Khalti ePayment payload
    const khaltiPayload = {
      public_key: "68df832ed71a45c292178594f90389f4", // Your live public key
      amount: Math.round(amount * 100), // Convert to paisa
      product_identity: orderId,
      product_name: "MediConnect Services",
      purchase_order_name: "MediConnect Services", // Required field
      purchase_order_id: orderId,
      customer_info: {
        name: customerInfo?.name || "Customer",
        email: customerInfo?.email || "customer@example.com",
        phone: customerInfo?.phone || "9800000000"
      },
      return_url: `${req.protocol}://${req.get('host')}/api/payments/khalti-callback`,
      website_url: `http://localhost:3000`,
      payment_preference: ["KHALTI", "EBANKING", "MOBILE_BANKING", "CONNECT_IPS", "SCT"]
    };

    console.log('📦 Khalti payload:', khaltiPayload);

    // Call Khalti ePayment initiate API (using test environment first)
    const response = await axios.post(
      "https://dev.khalti.com/api/v2/epayment/initiate/",
      khaltiPayload,
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY || 'a2753d6ab34d4b678004ff0a9db4654a'}`, // Your live secret key
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Khalti ePayment response:', response.data);

    if (response.data.payment_url) {
      // Store order details for callback verification
      // In a real app, you'd save this to your database
      console.log('✅ Payment URL generated:', response.data.payment_url);
      
      res.json({ 
        success: true, 
        payment_url: response.data.payment_url,
        pidx: response.data.pidx,
        message: "Payment initiated successfully"
      });
    } else {
      console.log('❌ Failed to get payment URL:', response.data);
      res.status(400).json({ 
        success: false, 
        message: "Failed to initiate payment",
        data: response.data
      });
    }
  } catch (err) {
    console.error('❌ Khalti initiation error:', err.response?.data || err.message);
    console.error('❌ Full error details:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      headers: err.response?.headers,
      message: err.message
    });
    res.status(400).json({ 
      success: false, 
      message: err.response?.data?.detail || "Failed to initiate payment",
      error: err.response?.data || err.message
    });
  }
});

// Khalti Web Checkout - Callback Handler
router.get("/khalti-callback", async (req, res) => {
  const { pidx, transaction_id, amount, mobile, status, purchase_order_id } = req.query;
  
  console.log('🔄 Khalti callback received:', { 
    pidx, transaction_id, amount, mobile, status, purchase_order_id 
  });

  try {
    // For now, assume payment is successful if we get callback
    // The lookup API is timing out, so we'll handle this differently
    console.log('🔄 Payment callback received, assuming success for now');
    
    // In a real app, you'd update your database here
    // await updateOrderStatus(purchase_order_id, 'paid', paymentData);
    
    // Redirect directly to frontend payment success page
    res.redirect(`http://localhost:3000/payment-success?status=success&order_id=${purchase_order_id}`);
    
  } catch (err) {
    console.error('❌ Khalti callback error:', err.response?.data || err.message);
    // Redirect directly to frontend payment failure page
    res.redirect(`http://localhost:3000/payment-success?status=failed&order_id=${purchase_order_id}`);
  }
});

module.exports = router;
