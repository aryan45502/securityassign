const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    config: { type: mongoose.Schema.Types.ObjectId, ref: "FrameConfig", required: true },
    price: { type: Number, required: true }
  }],
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
  },
  paymentStatus: { type: String, default: "Pending" },
  orderStatus: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  totalAmount: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
