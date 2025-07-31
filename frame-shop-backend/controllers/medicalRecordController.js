const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");

exports.createMedicalRecord = async (req, res) => {
  try {
    const { 
      appointmentId, 
      vitalSigns, 
      symptoms, 
      diagnosis, 
      prescription,
      labTests,
      followUp 
    } = req.body;

    // Verify appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: "Can only create records for completed appointments" });
    }

    const medicalRecord = new MedicalRecord({
      patient: appointment.patient,
      doctor: appointment.doctor,
      appointment: appointmentId,
      vitalSigns,
      symptoms,
      diagnosis,
      prescription,
      labTests,
      followUp,
      accessLog: [{
        accessedBy: req.user._id,
        accessType: "edit"
      }]
    });

    await medicalRecord.save();
    await medicalRecord.populate(['patient', 'doctor', 'appointment']);

    res.status(201).json(medicalRecord);
  } catch (err) {
    console.error("❌ Medical record creation error:", err);
    res.status(500).json({ message: "Failed to create medical record", error: err.message });
  }
};

exports.getPatientRecords = async (req, res) => {
  try {
    let patientId;
    
    // If user is patient, get their own records
    if (req.user.role === 'patient') {
      patientId = req.user._id;
    } 
    // If user is doctor/admin and patientId is provided
    else if (req.params.patientId) {
      patientId = req.params.patientId;
    } else {
      return res.status(400).json({ message: "Patient ID required" });
    }

    const records = await MedicalRecord.find({ 
      patient: patientId,
      recordStatus: 'active' 
    })
    .populate(['doctor', 'appointment'])
    .sort({ createdAt: -1 });

    // Log access for privacy tracking
    await MedicalRecord.updateMany(
      { patient: patientId },
      { 
        $push: { 
          accessLog: {
            accessedBy: req.user._id,
            accessType: "view"
          }
        }
      }
    );

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to get medical records", error: err.message });
  }
};

exports.getAllRecords = async (req, res) => {
  try {
    // Only admin can access all records
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const records = await MedicalRecord.find({ recordStatus: 'active' })
      .populate(['patient', 'doctor', 'appointment'])
      .sort({ createdAt: -1 });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all records", error: err.message });
  }
};

exports.updateMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    // Only the doctor who created the record or admin can update
    if (record.doctor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update this record" });
    }

    Object.keys(req.body).forEach(key => {
      if (key !== 'accessLog') { // Prevent direct manipulation of access log
        record[key] = req.body[key];
      }
    });

    // Add to access log
    record.accessLog.push({
      accessedBy: req.user._id,
      accessType: "edit"
    });

    await record.save();
    await record.populate(['patient', 'doctor', 'appointment']);

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: "Failed to update medical record", error: err.message });
  }
};

exports.getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate(['patient', 'doctor', 'appointment']);

    if (!record) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    // Check access permissions
    const canAccess = 
      req.user.role === 'admin' ||
      record.patient._id.toString() === req.user._id.toString() ||
      record.doctor._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Log access
    record.accessLog.push({
      accessedBy: req.user._id,
      accessType: "view"
    });
    await record.save();

    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: "Failed to get medical record", error: err.message });
  }
};

exports.addLabResult = async (req, res) => {
  try {
    const { testName, result, normalRange } = req.body;
    
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    record.labTests.push({
      testName,
      result,
      normalRange,
      date: new Date(),
      status: "completed"
    });

    record.accessLog.push({
      accessedBy: req.user._id,
      accessType: "edit"
    });

    await record.save();
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: "Failed to add lab result", error: err.message });
  }
};
