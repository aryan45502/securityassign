const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleDoctors = [
  {
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    qualification: "MD, FACC",
    experience: 15,
    consultationFee: 2500,
    rating: 4.9,
    about: "Expert cardiologist with 15+ years of experience in cardiovascular medicine and interventional cardiology.",
    hospital: "Tribhuvan University Teaching Hospital",
    city: "Kathmandu",
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    timeSlots: [
      { startTime: "09:00", endTime: "17:00" }
    ]
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Neurology",
    qualification: "MD, PhD",
    experience: 12,
    consultationFee: 3000,
    rating: 4.8,
    about: "Neurologist specializing in brain disorders, stroke care, and neurodegenerative diseases.",
    hospital: "Nepal Medical College",
    city: "Kathmandu",
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false
    },
    timeSlots: [
      { startTime: "10:00", endTime: "16:00" }
    ]
  },
  {
    name: "Dr. Priya Sharma",
    specialty: "Pediatrics",
    qualification: "MBBS, MD",
    experience: 8,
    consultationFee: 1800,
    rating: 4.7,
    about: "Dedicated pediatrician providing comprehensive care for children from newborns to adolescents.",
    hospital: "Kanti Children's Hospital",
    city: "Kathmandu",
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    timeSlots: [
      { startTime: "08:00", endTime: "18:00" }
    ]
  },
  {
    name: "Dr. Rajesh Gupta",
    specialty: "Orthopedics",
    qualification: "MS Orthopedics",
    experience: 20,
    consultationFee: 2200,
    rating: 4.6,
    about: "Orthopedic surgeon specializing in joint replacement, sports injuries, and bone disorders.",
    hospital: "Bir Hospital",
    city: "Kathmandu",
    availability: {
      monday: true,
      tuesday: true,
      wednesday: false,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false
    },
    timeSlots: [
      { startTime: "09:00", endTime: "15:00" }
    ]
  },
  {
    name: "Dr. Lisa Wong",
    specialty: "Dermatology",
    qualification: "MD Dermatology",
    experience: 10,
    consultationFee: 2000,
    rating: 4.8,
    about: "Dermatologist expert in skin conditions, cosmetic procedures, and dermatologic surgery.",
    hospital: "Civil Service Hospital",
    city: "Kathmandu",
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    timeSlots: [
      { startTime: "10:00", endTime: "16:00" }
    ]
  },
  {
    name: "Dr. Ramesh Patel",
    specialty: "General Medicine",
    qualification: "MBBS, MD",
    experience: 18,
    consultationFee: 1500,
    rating: 4.5,
    about: "General physician providing primary healthcare and managing common medical conditions.",
    hospital: "Patan Hospital",
    city: "Lalitpur",
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    },
    timeSlots: [
      { startTime: "08:00", endTime: "20:00" }
    ]
  }
];

const seedDoctors = async () => {
  try {
    // Clear existing doctors
    await Doctor.deleteMany({});
    console.log('🗑️ Cleared existing doctors');

    // Insert sample doctors
    await Doctor.insertMany(sampleDoctors);
    console.log('✅ Sample doctors added successfully!');
    
    console.log(`📊 Total doctors in database: ${sampleDoctors.length}`);
    
    // Display summary
    console.log('\n🏥 MediConnect Doctor Directory:');
    sampleDoctors.forEach((doctor, index) => {
      console.log(`${index + 1}. Dr. ${doctor.name} - ${doctor.specialty} (रू ${doctor.consultationFee})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDoctors(); 