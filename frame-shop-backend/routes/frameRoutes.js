const express = require("express");
const router = express.Router();
const {protect,admin} = require("../middleware/auth");
const {
  createFrame,
  getFrames,
  getFrameById,
  updateFrame,
  deleteFrame,
} = require("../controllers/frameController");
const parser = require("../middleware/upload");

// Public - anyone can view frames
router.get("/", getFrames);
router.get("/:id", getFrameById);

// Admin - protected routes (for now no admin check, just JWT)
router.post("/", protect, admin, createFrame);
router.put("/:id", protect, admin, parser.single("image"), updateFrame);
router.delete("/:id", protect, admin, deleteFrame);

module.exports = router;
