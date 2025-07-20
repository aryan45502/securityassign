const express = require("express");
const router = express.Router();

const {
    createConfig,
    getUserConfigs,
    deleteConfig,
} = require("../controllers/frameConfigController");

const { protect } = require("../middleware/auth");

// Apply protect individually — more flexible
router.post("/", protect, createConfig);
router.get("/", protect, getUserConfigs);
router.delete("/:id", protect, deleteConfig);

module.exports = router;
