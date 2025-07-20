const Order = require("../models/Order");

exports.placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;

    // ✅ Validate required fields
    if (!items || items.length === 0 || !totalAmount || !shippingAddress) {
      return res.status(400).json({ message: "Missing required order fields." });
    }

    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      totalAmount,
      paymentStatus: "Pending", // optional, in schema default too
      orderStatus: "Pending",   // optional, in schema default too
    });

    await order.save();

    return res.status(201).json(order); // ✅ Respond with order object
  } catch (err) {
    console.error("❌ Order creation error:", err);
    return res.status(500).json({ message: "Failed to place order", error: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate("items.config");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to get orders", error: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user").populate("items.config");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all orders", error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: req.body.status },
      { new: true }
    );
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
};
