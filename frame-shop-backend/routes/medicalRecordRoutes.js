// HIPAA-compliant medical records routes with strict access control
const express = require("express");
const router = express.Router();
const medicalRecordController = require("../controllers/medicalRecordController");
const { protect, admin } = require("../middleware/auth");

// Protected routes for patients
router.get("/my-records", protect, medicalRecordController.getPatientRecords);
router.get("/:id", protect, medicalRecordController.getMedicalRecordById);

// Doctor routes
router.post("/create", protect, medicalRecordController.createMedicalRecord);
router.put("/:id", protect, medicalRecordController.updateMedicalRecord);
router.post("/:id/lab-results", protect, medicalRecordController.addLabResult);
router.get("/patient/:patientId", protect, medicalRecordController.getPatientRecords);

// Admin routes
router.get("/", protect, admin, medicalRecordController.getAllRecords);

module.exports = router;
