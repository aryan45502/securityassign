// Secure webhook handling with signature verification and fraud prevention
const Stripe = require("stripe");

// Initialize Stripe only if the secret key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
}

const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

exports.handleStripeWebhook = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    console.error("❌ Stripe not configured - webhook ignored");
    return res.status(200).json({ received: true, warning: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  console.log("🎯 Webhook received, processing...");
  console.log("📋 Headers:", req.headers);
  console.log("🔍 Body type:", typeof req.body);
  console.log("📏 Body length:", req.body ? req.body.length : 'undefined');

  try {
    // Construct the event using the raw body
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook signature verified successfully");
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    console.error("🔧 Webhook secret exists:", !!process.env.STRIPE_WEBHOOK_SECRET);
    console.error("🔧 Signature:", sig);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("🎯 Webhook event received:", event.type);

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const userEmail = session.metadata?.userEmail || session.customer_email;
    const totalAmount = session.metadata?.totalAmount;

    console.log("🎯 Processing checkout completion:");
    console.log("- Order ID:", orderId);
    console.log("- User email:", userEmail);
    console.log("- Total amount:", totalAmount);
    console.log("- Session ID:", session.id);

    if (!orderId) {
      console.error("❌ No orderId found in metadata");
      return res.status(200).json({ received: true, warning: "Missing orderId" });
    }

    if (!userEmail) {
      console.error("❌ No user email found");
      return res.status(200).json({ received: true, warning: "Missing user email" });
    }

    try {
      let order = null;

      // Try to find and update order in database
      try {
        console.log("🔍 Looking for order in database...");
        order = await Order.findByIdAndUpdate(
          orderId,
          {
            paymentStatus: "Paid",
            orderStatus: "Processing",
            stripeSessionId: session.id,
          },
          { new: true }
        ).populate("user").populate("items.config");

        if (order) {
          console.log("✅ Order found and updated in database");
        } else {
          console.log("⚠️ Order not found in database with ID:", orderId);
        }
      } catch (dbError) {
        console.error("⚠️ Database error when updating order:", dbError.message);
      }

      // Prepare email content
      let emailHtml;
      let emailSubject = `🎨 Order Confirmation #${orderId} - Frame Shop`;

      if (order && order.items && order.items.length > 0) {
        console.log("📧 Preparing detailed email with order items");

        const itemsList = order.items
          .map((item) => {
            const name = item.config?.configName || "Custom Frame";
            const dimensions = item.config?.width && item.config?.height
              ? `${item.config.width}x${item.config.height}"`
              : "Custom Size";
            const matting = item.config?.matting ? "with matting" : "no matting";
            return `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">${name}</div>
                  <div style="color: #6b7280; font-size: 14px;">${dimensions} • ${matting}</div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #059669;">
                  ₹${item.price.toFixed(2)}
                </td>
              </tr>
            `;
          })
          .join("");

        emailHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎨 Frame Shop</h1>
                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Premium Custom Framing</p>
              </div>

              <!-- Success Message -->
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 0;">
                <div style="display: flex; align-items: center;">
                  <div style="background-color: #10b981; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
                  </div>
                  <div>
                    <h2 style="color: #065f46; margin: 0; font-size: 18px; font-weight: 600;">Payment Successful!</h2>
                    <p style="color: #047857; margin: 4px 0 0 0; font-size: 14px;">Your order has been confirmed and is being processed.</p>
                  </div>
                </div>
              </div>

              <!-- Order Details -->
              <div style="padding: 30px 20px;">
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                  <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Order Summary</h3>
                  <div style="background-color: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <thead>
                        <tr style="background-color: #f3f4f6;">
                          <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #d1d5db;">Item</th>
                          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #d1d5db;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsList}
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Order Info -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 24px; color: white;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Order Number</p>
                      <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600;">#${orderId}</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Total Amount</p>
                      <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700;">₹${order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 16px;">
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">Status</p>
                    <div style="background-color: rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 12px; display: inline-block; margin-top: 4px;">
                      <span style="font-weight: 600; font-size: 14px;">🎯 ${order.orderStatus}</span>
                    </div>
                  </div>
                </div>

                <!-- Next Steps -->
                <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-top: 24px; border-left: 4px solid #f59e0b;">
                  <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📦 What's Next?</h4>
                  <ul style="color: #b45309; margin: 0; padding-left: 18px; line-height: 1.6;">
                    <li>Your frames are being crafted with care</li>
                    <li>We'll send you tracking information once shipped</li>
                    <li>Expected delivery: 5-7 business days</li>
                  </ul>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #374151; padding: 30px 20px; text-align: center;">
                <p style="color: #d1d5db; margin: 0 0 12px 0; font-size: 16px;">Thank you for choosing Frame Shop!</p>
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                  Questions? Reply to this email or contact our support team.
                </p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #4b5563;">
                  <p style="color: #6b7280; margin: 0; font-size: 12px;">
                    © 2024 Frame Shop. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        console.log("📧 Preparing fallback email without detailed order items");

        emailHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">🎨 Frame Shop</h1>
                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Premium Custom Framing</p>
              </div>

              <!-- Success Message -->
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 0;">
                <div style="display: flex; align-items: center;">
                  <div style="background-color: #10b981; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
                  </div>
                  <div>
                    <h2 style="color: #065f46; margin: 0; font-size: 18px; font-weight: 600;">Payment Successful!</h2>
                    <p style="color: #047857; margin: 4px 0 0 0; font-size: 14px;">Your order has been confirmed and is being processed.</p>
                  </div>
                </div>
              </div>

              <!-- Order Details -->
              <div style="padding: 30px 20px;">
                <!-- Order Info -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 24px; color: white;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Order Number</p>
                      <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600;">#${orderId}</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Total Amount</p>
                      <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700;">₹${parseFloat(totalAmount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 16px;">
                    <p style="margin: 0; opacity: 0.9; font-size: 14px;">Status</p>
                    <div style="background-color: rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 12px; display: inline-block; margin-top: 4px;">
                      <span style="font-weight: 600; font-size: 14px;">🎯 Processing</span>
                    </div>
                  </div>
                </div>

                <!-- Next Steps -->
                <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-top: 24px; border-left: 4px solid #f59e0b;">
                  <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📦 What's Next?</h4>
                  <ul style="color: #b45309; margin: 0; padding-left: 18px; line-height: 1.6;">
                    <li>Your frames are being crafted with care</li>
                    <li>We'll send you tracking information once shipped</li>
                    <li>Expected delivery: 5-7 business days</li>
                  </ul>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #374151; padding: 30px 20px; text-align: center;">
                <p style="color: #d1d5db; margin: 0 0 12px 0; font-size: 16px;">Thank you for choosing Frame Shop!</p>
                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                  Questions? Reply to this email or contact our support team.
                </p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #4b5563;">
                  <p style="color: #6b7280; margin: 0; font-size: 12px;">
                    © 2024 Frame Shop. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      }

      // Send the email
      console.log("📤 Attempting to send confirmation email...");
      const emailResult = await sendEmail(userEmail, emailSubject, emailHtml);

      if (emailResult.success) {
        console.log("✅ Confirmation email sent successfully to:", userEmail);
      } else {
        console.error("❌ Failed to send confirmation email:", emailResult.error);
        console.error("📋 Email result details:", emailResult);
      }

    } catch (err) {
      console.error("❌ Error processing checkout completion:", err.message);
      console.error("❌ Full error stack:", err.stack);
    }
  }

  // Always respond to Stripe to confirm receipt
  console.log("✅ Sending acknowledgment to Stripe");
  res.status(200).json({ received: true });
};
