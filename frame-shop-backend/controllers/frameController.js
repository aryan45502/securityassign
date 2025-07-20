const Frame = require("../models/Frame");

exports.createFrame = async (req, res) => {
  try {
    const frame = new Frame(req.body);
    await frame.save();
    res.status(201).json(frame);
  } catch (err) {
    res.status(500).json({ message: "Failed to create frame", error: err.message });
  }
};

exports.getFrames = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const frames = await Frame.find(filter);
    res.status(200).json(frames);
  } catch (err) {
    res.status(500).json({ message: "Failed to get frames", error: err.message });
  }
};

exports.getFrameById = async (req, res) => {
  try {
    const frame = await Frame.findById(req.params.id);
    if (!frame) {
      return res.status(404).json({ message: "Frame not found" });
    }
    res.status(200).json(frame);
  } catch (err) {
    res.status(500).json({ message: "Failed to get frame", error: err.message });
  }
};

exports.updateFrame = async (req, res) => {
  try {
    const frame = await Frame.findById(req.params.id);
    if (!frame) {
      return res.status(404).json({ message: "Frame not found" });
    }
    // Update fields from req.body
    Object.keys(req.body).forEach(key => {
      frame[key] = req.body[key];
    });
    // If a new image was uploaded, update imageUrl
    if (req.file && req.file.path) {
      frame.imageUrl = req.file.path;
    }
    await frame.save();
    res.status(200).json(frame);
  } catch (err) {
    res.status(500).json({ message: "Failed to update frame", error: err.message });
  }
};

exports.deleteFrame = async (req, res) => {
  try {
    await Frame.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Frame deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete frame", error: err.message });
  }
};
