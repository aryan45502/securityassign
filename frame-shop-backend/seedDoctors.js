const mongoose = require("mongoose");
const Doctor = require("./models/Doctor");
require("dotenv").config({ path: "./config.env" });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mediconnect");
    console.log("✅ MongoDB Connected for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const sampleDoctors = [
  {
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    qualification: "MBBS, MD (Cardiology), FACC",
    experience: 15,
    profileImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
    consultationFee: 2500,
    rating: 4.8,
    about: "Experienced cardiologist specializing in interventional cardiology and heart failure management. Committed to providing comprehensive cardiac care with the latest medical advancements.",
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
      { startTime: "09:00", endTime: "12:00" },
      { startTime: "14:00", endTime: "17:00" }
    ],
    hospital: "MediConnect Heart Institute",
    city: "Kathmandu",
    isActive: true
  },
  {
    name: "Dr. Rajesh Kumar",
    specialty: "Neurology",
    qualification: "MBBS, MD (Neurology), DM (Neurology)",
    experience: 12,
    profileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
    consultationFee: 2200,
    rating: 4.7,
    about: "Specialist in neurological disorders including stroke, epilepsy, and movement disorders. Expert in diagnostic neurology and neuroimaging.",
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
      { startTime: "10:00", endTime: "13:00" },
      { startTime: "15:00", endTime: "18:00" }
    ],
    hospital: "NeuroCare Center",
    city: "Pokhara",
    isActive: true
  },
  {
    name: "Dr. Priya Sharma",
    specialty: "Pediatrics",
    qualification: "MBBS, MD (Pediatrics), Fellowship in Pediatric Emergency",
    experience: 10,
    profileImage: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400",
    consultationFee: 1800,
    rating: 4.9,
    about: "Dedicated pediatrician with expertise in child development, vaccination, and pediatric emergency care. Passionate about children's health and well-being.",
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
      { startTime: "08:00", endTime: "12:00" },
      { startTime: "14:00", endTime: "16:00" }
    ],
    hospital: "Children's Medical Center",
    city: "Kathmandu",
    isActive: true
  },
  {
    name: "Dr. Amit Patel",
    specialty: "Orthopedics",
    qualification: "MBBS, MS (Orthopedics), Fellowship in Joint Replacement",
    experience: 18,
    profileImage: "https://images.unsplash.com/photo-1622253692010-333f2f6031d5?w=400",
    consultationFee: 2800,
    rating: 4.6,
    about: "Expert orthopedic surgeon specializing in joint replacement, sports injuries, and spine surgery. Committed to restoring mobility and quality of life.",
    availability: {
      monday: false,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    timeSlots: [
      { startTime: "09:00", endTime: "13:00" },
      { startTime: "15:00", endTime: "18:00" }
    ],
    hospital: "OrthoCare Hospital",
    city: "Lalitpur",
    isActive: true
  },
  {
    name: "Dr. Maya Thapa",
    specialty: "Dermatology",
    qualification: "MBBS, MD (Dermatology), Fellowship in Cosmetic Dermatology",
    experience: 8,
    profileImage: "https://images.unsplash.com/photo-1594824475544-3c5d3c8c8c8c?w=400",
    consultationFee: 2000,
    rating: 4.8,
    about: "Specialist in medical and cosmetic dermatology. Expert in treating skin conditions, hair disorders, and performing aesthetic procedures.",
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
      { startTime: "10:00", endTime: "14:00" },
      { startTime: "16:00", endTime: "19:00" }
    ],
    hospital: "SkinCare Clinic",
    city: "Bhaktapur",
    isActive: true
  },
  {
    name: "Dr. Suresh Tamang",
    specialty: "Psychiatry",
    qualification: "MBBS, MD (Psychiatry), Fellowship in Child Psychiatry",
    experience: 14,
    profileImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
    consultationFee: 2100,
    rating: 4.7,
    about: "Experienced psychiatrist specializing in mood disorders, anxiety, and child psychiatry. Provides compassionate mental health care in a supportive environment.",
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
      { startTime: "09:00", endTime: "12:00" },
      { startTime: "14:00", endTime: "17:00" }
    ],
    hospital: "Mental Health Institute",
    city: "Kathmandu",
    isActive: true
  },
  {
    name: "Dr. Anjali Singh",
    specialty: "Gynecology",
    qualification: "MBBS, MD (Obstetrics & Gynecology), Fellowship in Reproductive Medicine",
    experience: 16,
    profileImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
    consultationFee: 2400,
    rating: 4.9,
    about: "Specialist in women's health, pregnancy care, and reproductive medicine. Committed to providing comprehensive gynecological care with empathy.",
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
      { startTime: "08:00", endTime: "12:00" },
      { startTime: "14:00", endTime: "17:00" }
    ],
    hospital: "Women's Health Center",
    city: "Pokhara",
    isActive: true
  },
  {
    name: "Dr. Bikash Rai",
    specialty: "General Surgery",
    qualification: "MBBS, MS (General Surgery), Fellowship in Laparoscopic Surgery",
    experience: 20,
    profileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
    consultationFee: 2600,
    rating: 4.6,
    about: "Experienced general surgeon specializing in laparoscopic and minimally invasive procedures. Expert in emergency surgery and trauma care.",
    availability: {
      monday: false,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    timeSlots: [
      { startTime: "09:00", endTime: "13:00" },
      { startTime: "15:00", endTime: "18:00" }
    ],
    hospital: "Surgical Care Hospital",
    city: "Lalitpur",
    isActive: true
  }
];

const seedDoctors = async () => {
  try {
    // Clear existing doctors
    await Doctor.deleteMany({});
    console.log("🗑️ Cleared existing doctors");

    // Insert new doctors
    const insertedDoctors = await Doctor.insertMany(sampleDoctors);
    console.log(`✅ Successfully seeded ${insertedDoctors.length} doctors`);

    // Display seeded doctors
    console.log("\n📋 Seeded Doctors:");
    insertedDoctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ${doctor.name} - ${doctor.specialty} (${doctor.hospital})`);
    });

    console.log("\n🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding doctors:", error);
    process.exit(1);
  }
};

// Run seeder
connectDB().then(() => {
  seedDoctors();
}); 