const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { protect, admin } = require("../middleware/auth");

// Protected routes (patients can book, view their appointments)
router.post("/book", protect, appointmentController.bookAppointment);
router.get("/my-appointments", protect, appointmentController.getMyAppointments);
router.get("/available-slots", appointmentController.getAvailableSlots);
router.put("/:id/cancel", protect, appointmentController.cancelAppointment);

// Doctor routes
router.get("/doctor/:doctorId", protect, appointmentController.getDoctorAppointments);

// Admin routes
router.put("/:id/status", protect, admin, appointmentController.updateAppointmentStatus);

module.exports = router;
