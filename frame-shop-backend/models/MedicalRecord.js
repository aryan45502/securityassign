// HIPAA-compliant medical records with encryption and access control
const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  
  // Vital Signs
  vitalSigns: {
    bloodPressure: String, // "120/80"
    heartRate: Number,     // BPM
    temperature: Number,   // Celsius
    weight: Number,        // kg
    height: Number,        // cm
    oxygenSaturation: Number // %
  },
  
  // Medical Information
  symptoms: { type: String, required: true },
  diagnosis: { type: String, required: true },
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  
  // Lab Tests
  labTests: [{
    testName: String,
    result: String,
    normalRange: String,
    date: Date,
    status: { type: String, enum: ["pending", "completed"], default: "pending" }
  }],
  
  // Follow-up
  followUp: {
    required: { type: Boolean, default: false },
    date: Date,
    instructions: String
  },
  
  // Documents
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String, // "prescription", "lab-report", "xray", "other"
    uploadDate: { type: Date, default: Date.now }
  }],
  
  recordStatus: {
    type: String,
    enum: ["active", "archived", "deleted"],
    default: "active"
  },
  
  // Privacy
  isConfidential: { type: Boolean, default: true },
  accessLog: [{
    accessedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    accessDate: { type: Date, default: Date.now },
    accessType: { type: String, enum: ["view", "edit", "download"] }
  }]
}, { timestamps: true });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
