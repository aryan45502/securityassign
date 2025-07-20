const mongoose = require('mongoose');
const Frame = require('./models/Frame');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/frame-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleFrames = [
  {
    name: "Everest Solid Wood Frame",
    material: "Wood",
    color: "Brown",
    pricePerInch: 15,
    price: 3840,
    category: "Wooden",
    description: "Premium solid wood frame with elegant finish. Perfect for showcasing your precious memories.",
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop"
  },
  {
    name: "Modern Metal Frame",
    material: "Metal",
    color: "Silver",
    pricePerInch: 12,
    price: 2880,
    category: "Metal",
    description: "Sleek modern metal frame with contemporary design. Ideal for modern interiors.",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop"
  },
  {
    name: "Minimalist White Frame",
    material: "Plastic",
    color: "White",
    pricePerInch: 8,
    price: 1920,
    category: "Modern",
    description: "Clean minimalist white frame for a fresh, modern look.",
    imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop"
  },
  {
    name: "Classic Gallery Frame",
    material: "Wood",
    color: "Black",
    pricePerInch: 18,
    price: 4320,
    category: "Classic",
    description: "Timeless classic gallery frame with sophisticated black finish.",
    imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop"
  },
  {
    name: "Premium Gold Frame",
    material: "Wood",
    color: "Gold",
    pricePerInch: 25,
    price: 6000,
    category: "Premium",
    description: "Luxurious gold-finished frame for the most elegant displays.",
    imageUrl: "https://images.unsplash.com/photo-1608232034071-c604ddc8470a?w=600&h=400&fit=crop"
  },
  {
    name: "Vintage Brass Frame",
    material: "Metal",
    color: "Brass",
    pricePerInch: 20,
    price: 4800,
    category: "Vintage",
    description: "Beautiful vintage brass frame with antique finish.",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop"
  },
  {
    name: "Contemporary Silver Frame",
    material: "Metal",
    color: "Silver",
    pricePerInch: 16,
    price: 3840,
    category: "Contemporary",
    description: "Contemporary silver frame with modern aesthetics.",
    imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop"
  },
  {
    name: "Natural Oak Frame",
    material: "Wood",
    color: "Oak",
    pricePerInch: 14,
    price: 3360,
    category: "Natural",
    description: "Natural oak wood frame with beautiful grain patterns.",
    imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop"
  }
];

async function seedFrames() {
  try {
    // Clear existing frames
    await Frame.deleteMany({});
    console.log('Cleared existing frames');

    // Insert new frames
    const frames = await Frame.insertMany(sampleFrames);
    console.log(`Successfully seeded ${frames.length} frames with proper prices`);

    // Log the frames with their prices
    frames.forEach(frame => {
      console.log(`${frame.name}: ₹${frame.price} (₹${frame.pricePerInch}/inch)`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding frames:', error);
    mongoose.connection.close();
  }
}

seedFrames(); 