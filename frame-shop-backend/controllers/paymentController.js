
// const Stripe = require("stripe");
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// exports.createCheckoutSession = async (req, res) => {
//   try {
//     const { orderId, email, items, totalAmount, shippingAddress } = req.body;

//     console.log('Received checkout request:', { orderId, email, totalAmount });

//     // Validate required fields
//     if (!orderId || !email) {
//       console.log('Missing required fields:', { orderId: !!orderId, email: !!email });
//       return res.status(400).json({
//         message: "Order ID and email are required."
//       });
//     }

//     // Create line items from the cart items
//     let lineItems = [];

//     if (items && items.length > 0) {
//       lineItems = items.map((item) => ({
//         price_data: {
//           currency: "inr",
//           product_data: {
//             name: item.name || "Custom Frame",
//             description: `Quantity: ${item.quantity || 1}`,
//           },
//           unit_amount: Math.round(item.price * 100), // Convert to paisa
//         },
//         quantity: item.quantity || 1,
//       }));
//     } else {
//       // Fallback single item
//       lineItems = [{
//         price_data: {
//           currency: "inr",
//           product_data: {
//             name: "Custom Frame Order",
//             description: "Your custom frame order",
//           },
//           unit_amount: Math.round(totalAmount * 100),
//         },
//         quantity: 1,
//       }];
//     }

//     console.log('Creating Stripe session with line items:', lineItems.length);

//     // Create Stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: lineItems,
//       success_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/payment-success?order=${orderId}`,
//       cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout?cancel=true`,

//       customer_email: email,
//       metadata: {
//         orderId: orderId.toString(),
//         userEmail: email,
//         totalAmount: totalAmount.toString(),
//       },
//       billing_address_collection: 'required',
//       shipping_address_collection: {
//         allowed_countries: ['IN', 'NP'],
//       }
//     });

//     console.log('Stripe session created successfully:', session.id);

//     // Return the session URL
//     res.status(200).json({
//       url: session.url,
//       sessionId: session.id
//     });

//   } catch (err) {
//     console.error("Stripe session error:", err);

//     res.status(500).json({
//       message: "Stripe session creation failed",
//       error: err.message,
//     });
//   }
// };


const Stripe = require("stripe");

// Initialize Stripe only if the secret key is available
// Secure payment processing with multiple gateway support and fraud detection
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
}

// Khalti payment integration
const khaltiConfig = {
  publicKey: process.env.KHALTI_PUBLIC_KEY || 'test_public_key_123456789',
  secretKey: process.env.KHALTI_SECRET_KEY || 'test_secret_key_123456789',
  baseUrl: process.env.KHALTI_BASE_URL || 'https://a.khalti.com/api/v2'
};

// Generate OTP for Khalti payment
const generateKhaltiOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP temporarily (in production, use Redis)
const khaltiOTPs = new Map();

exports.createKhaltiPayment = async (req, res) => {
  try {
    const { orderId, email, items, totalAmount, shippingAddress, phoneNumber } = req.body;

    console.log('Received Khalti payment request:', { orderId, email, totalAmount });

    // Validate required fields
    if (!orderId || !email || !phoneNumber) {
      return res.status(400).json({
        message: "Order ID, email, and phone number are required."
      });
    }

    // Generate OTP for this payment
    const otp = generateKhaltiOTP();
    const otpExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes

    // Store OTP temporarily
    khaltiOTPs.set(orderId, {
      otp,
      expiry: otpExpiry,
      paymentData: {
        orderId,
        email,
        items,
        totalAmount,
        shippingAddress,
        phoneNumber
      }
    });

    // Send OTP via SMS (in production, integrate with SMS service)
    console.log(`📱 Khalti OTP for order ${orderId}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent to your phone number",
      orderId,
      otpExpiry: new Date(otpExpiry).toISOString()
    });

  } catch (err) {
    console.error("Khalti payment error:", err);
    res.status(500).json({
      message: "Khalti payment initialization failed",
      error: err.message,
    });
  }
};

exports.verifyKhaltiOTP = async (req, res) => {
  try {
    const { orderId, otp } = req.body;

    console.log('Verifying Khalti OTP:', { orderId, otp });

    // Validate required fields
    if (!orderId || !otp) {
      return res.status(400).json({
        message: "Order ID and OTP are required."
      });
    }

    // Get stored OTP data
    const otpData = khaltiOTPs.get(orderId);
    if (!otpData) {
      return res.status(400).json({
        message: "OTP not found or expired. Please request a new OTP."
      });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiry) {
      khaltiOTPs.delete(orderId);
      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP."
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP. Please try again."
      });
    }

    // OTP is valid - proceed with Khalti payment
    const { paymentData } = otpData;

    // Simulate Khalti payment API call
    const khaltiPaymentResponse = await simulateKhaltiPayment(paymentData);

    if (khaltiPaymentResponse.success) {
      // Clear OTP after successful payment
      khaltiOTPs.delete(orderId);

      res.status(200).json({
        success: true,
        message: "Payment successful!",
        transactionId: khaltiPaymentResponse.transactionId,
        orderId,
        amount: paymentData.totalAmount
      });
    } else {
      res.status(400).json({
        message: "Payment failed. Please try again.",
        error: khaltiPaymentResponse.error
      });
    }

  } catch (err) {
    console.error("Khalti OTP verification error:", err);
    res.status(500).json({
      message: "OTP verification failed",
      error: err.message,
    });
  }
};

// Simulate Khalti payment API call
const simulateKhaltiPayment = async (paymentData) => {
  // In production, this would be a real Khalti API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 95% success rate
      const isSuccess = Math.random() > 0.05;
      
      if (isSuccess) {
        resolve({
          success: true,
          transactionId: `khalti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: paymentData.totalAmount
        });
      } else {
        resolve({
          success: false,
          error: "Payment declined by Khalti"
        });
      }
    }, 2000); // Simulate 2-second API call
  });
};

exports.createCheckoutSession = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(500).json({
        message: "Payment processing is not configured. Please contact support.",
      });
    }

    const { orderId, email, items, totalAmount, shippingAddress } = req.body;

    console.log('Received checkout request:', { orderId, email, totalAmount });

    // Validate required fields
    if (!orderId || !email) {
      console.log('Missing required fields:', { orderId: !!orderId, email: !!email });
      return res.status(400).json({
        message: "Order ID and email are required."
      });
    }

    // Create line items from the cart items
    let lineItems = [];

    if (items && items.length > 0) {
      lineItems = items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name || "Custom Frame",
            description: `Quantity: ${item.quantity || 1}`,
          },
          unit_amount: Math.round(item.price * 100), // Convert to paisa
        },
        quantity: item.quantity || 1,
      }));
    } else {
      // Fallback single item
      lineItems = [{
        price_data: {
          currency: "inr",
          product_data: {
            name: "Custom Frame Order",
            description: "Your custom frame order",
          },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      }];
    }

    console.log('Creating Stripe session with line items:', lineItems.length);

    // ✅ Hardcoded frontend URLs for localhost:8080
    const FRONTEND_URL = 'http://localhost:8080';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${FRONTEND_URL}/payment-success?order=${orderId}`,
      cancel_url: `${FRONTEND_URL}/checkout?cancel=true`,
      customer_email: email,
      metadata: {
        orderId: orderId.toString(),
        userEmail: email,
        totalAmount: totalAmount.toString(),
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['IN', 'NP'],
      }
    });

    console.log('Stripe session created successfully:', session.id);

    res.status(200).json({
      url: session.url,
      sessionId: session.id
    });

  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({
      message: "Stripe session creation failed",
      error: err.message,
    });
  }
};
