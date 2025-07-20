
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
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
}

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
