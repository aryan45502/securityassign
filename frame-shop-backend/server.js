
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Stripe Webhook route (must come BEFORE body parsers)
// Fixed: Use express.raw with proper configuration
app.use("/api/payments/webhook", express.raw({
  type: "application/json",
  limit: "50mb"
}));

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Test route
app.get("/", (req, res) => {
  res.send("🎯 Frame Shop API is running...");
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/frames", require("./routes/frameRoutes"));
app.use("/api/configs", require("./routes/frameConfigRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes")); // includes /webhook and /checkout-session
app.use('/api/contact', contactRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

// Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION 🔥", err.message);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("🔧 Environment variables check:");
  console.log("- RESEND_API_KEY:", !!process.env.RESEND_API_KEY);
  console.log("- FROM_EMAIL:", process.env.FROM_EMAIL);
  console.log("- STRIPE_WEBHOOK_SECRET:", !!process.env.STRIPE_WEBHOOK_SECRET);
});

