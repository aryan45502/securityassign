// Medical appointment scheduling model with consultation tracking
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // "10:00-10:30"
    consultationType: { 
        type: String, 
        enum: ["in-person", "video-call", "phone-call"], 
        default: "in-person" 
    },
    status: {
        type: String,
        enum: ["scheduled", "confirmed", "completed", "cancelled", "no-show"],
        default: "scheduled"
    },
    symptoms: { type: String }, // patient's symptoms description
    notes: { type: String }, // doctor's notes after consultation
    prescription: { type: String }, // prescribed medications/treatment
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },
    consultationFee: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
