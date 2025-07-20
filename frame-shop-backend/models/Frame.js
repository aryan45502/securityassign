const mongoose = require("mongoose");

const frameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  material: { type: String, required: true },
  color: { type: String, required: true },
  imageUrl: { type: String },
  pricePerInch: { type: Number, required: true }, // pricing based on dimensions
  price: { type: Number, required: true }, // base price for the frame
  category: { type: String, required: true, default: 'Wooden' },
  description: { type: String, default: 'Beautiful custom frame' },
}, { timestamps: true });

module.exports = mongoose.model("Frame", frameSchema);
