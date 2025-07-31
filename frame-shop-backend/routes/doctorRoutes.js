const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const { protect, admin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public routes
router.get("/", doctorController.getDoctors);
router.get("/specialties", doctorController.getSpecialties);
router.get("/specialty/:specialty", doctorController.getDoctorsBySpecialty);
router.get("/:id", doctorController.getDoctorById);

// Protected routes (admin only)
router.post("/", protect, admin, upload.single("profileImage"), doctorController.createDoctor);
router.put("/:id", protect, admin, upload.single("profileImage"), doctorController.updateDoctor);
router.delete("/:id", protect, admin, doctorController.deleteDoctor);

module.exports = router;
