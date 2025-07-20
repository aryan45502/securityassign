const express = require("express");
const router = express.Router();

const {
    placeOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
} = require("../controllers/orderController");

const { protect, admin } = require("../middleware/auth");

// ✅ USER Routes
router.post("/", protect, placeOrder);
router.get("/my-orders", protect, getUserOrders);

// ✅ ADMIN Routes
router.get("/", protect, admin, getAllOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);

module.exports = router;
