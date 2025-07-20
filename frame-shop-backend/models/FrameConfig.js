const mongoose = require("mongoose");

const frameConfigSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    frame: { type: mongoose.Schema.Types.ObjectId, ref: "Frame", required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    matting: { type: Boolean, default: false },
    glass: { type: Boolean, default: false },
    imageUrl: { type: String }, // optional image preview
    configName: { type: String }, // user can name their frame config
}, { timestamps: true });

module.exports = mongoose.model("FrameConfig", frameConfigSchema);
