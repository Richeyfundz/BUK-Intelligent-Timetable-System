
const express = require("express");
const router = express.Router();

const aiTimetableController =
  require("../controllers/aiTimetableController");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Generate AI timetable
router.post(
  "/generate",
  authenticateToken,
  requireAdmin,
  aiTimetableController.generateTimetable
);

// Save approved AI timetable
router.post(
  "/save",
  authenticateToken,
  requireAdmin,
  aiTimetableController.saveGeneratedTimetable
);

module.exports = router;

