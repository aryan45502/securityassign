const FrameConfig = require("../models/FrameConfig");

exports.createConfig = async (req, res) => {
  try {
    const config = new FrameConfig({
      ...req.body,
      user: req.user._id,
    });
    await config.save();
    res.status(201).json(config);
  } catch (err) {
    res.status(500).json({ message: "Failed to save config", error: err.message });
  }
};

exports.getUserConfigs = async (req, res) => {
  try {
    const configs = await FrameConfig.find({ user: req.user._id }).populate("frame");
    res.status(200).json(configs);
  } catch (err) {
    res.status(500).json({ message: "Failed to get configs", error: err.message });
  }
};

exports.deleteConfig = async (req, res) => {
  try {
    await FrameConfig.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ message: "Config deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete config", error: err.message });
  }
};
