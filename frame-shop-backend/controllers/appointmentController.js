// Medical appointment scheduling with conflict resolution and security
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, consultationType, symptoms } = req.body;
    
    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ message: "Doctor not found or inactive" });
    }
    
    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot: timeSlot,
      status: { $in: ["scheduled", "confirmed"] }
    });
    
    if (existingAppointment) {
      return res.status(409).json({ message: "Time slot already booked" });
    }
    
    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      consultationType,
      symptoms,
      consultationFee: doctor.consultationFee
    });
    
    await appointment.save();
    await appointment.populate(['patient', 'doctor']);
    
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Failed to book appointment", error: err.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor')
      .sort({ appointmentDate: -1 });
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Failed to get appointments", error: err.message });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.params.doctorId })
      .populate('patient')
      .sort({ appointmentDate: -1 });
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Failed to get doctor appointments", error: err.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes, prescription } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        notes: notes || undefined,
        prescription: prescription || undefined 
      },
      { new: true }
    ).populate(['patient', 'doctor']);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Failed to update appointment", error: err.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Check if user owns this appointment or is admin
    if (appointment.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to cancel this appointment" });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel appointment", error: err.message });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    // Get doctor's time slots
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    // Get booked appointments for that day
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: new Date(date),
      status: { $in: ["scheduled", "confirmed"] }
    }).select('timeSlot');
    
    const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);
    
    // Generate available time slots (simplified)
    const timeSlots = [
      "09:00-09:30", "09:30-10:00", "10:00-10:30", "10:30-11:00",
      "11:00-11:30", "11:30-12:00", "14:00-14:30", "14:30-15:00",
      "15:00-15:30", "15:30-16:00", "16:00-16:30", "16:30-17:00"
    ];
    
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));
    
    res.status(200).json(availableSlots);
  } catch (err) {
    res.status(500).json({ message: "Failed to get available slots", error: err.message });
  }
};
