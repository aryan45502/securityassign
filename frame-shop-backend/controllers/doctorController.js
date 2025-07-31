const Doctor = require("../models/Doctor");

exports.createDoctor = async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Failed to create doctor profile", error: err.message });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const filter = {};
    if (req.query.specialty) {
      filter.specialty = req.query.specialty;
    }
    if (req.query.city) {
      filter.city = req.query.city;
    }
    if (req.query.hospital) {
      filter.hospital = req.query.hospital;
    }
    // Only show active doctors
    filter.isActive = true;
    
    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Failed to get doctors", error: err.message });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Failed to get doctor", error: err.message });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    // Update fields from req.body
    Object.keys(req.body).forEach(key => {
      doctor[key] = req.body[key];
    });
    // If a new profile image was uploaded, update profileImage
    if (req.file && req.file.path) {
      doctor.profileImage = req.file.path;
    }
    await doctor.save();
    res.status(200).json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Failed to update doctor profile", error: err.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Doctor profile deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete doctor", error: err.message });
  }
};

exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await Doctor.distinct("specialty");
    res.status(200).json(specialties);
  } catch (err) {
    res.status(500).json({ message: "Failed to get specialties", error: err.message });
  }
};

exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.params;
    const doctors = await Doctor.find({ 
      specialty: specialty, 
      isActive: true 
    }).sort({ rating: -1 });
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Failed to get doctors by specialty", error: err.message });
  }
};
