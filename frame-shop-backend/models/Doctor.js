const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  qualification: { type: String, required: true },
  experience: { type: Number, required: true }, // years of experience
  profileImage: { type: String },
  consultationFee: { type: Number, required: true }, // consultation fee in currency
  rating: { type: Number, default: 4.5, min: 1, max: 5 },
  about: { type: String, default: 'Experienced medical professional' },
  availability: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  timeSlots: [{
    startTime: String, // "09:00"
    endTime: String,   // "17:00"
  }],
  hospital: { type: String, required: true },
  city: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);
