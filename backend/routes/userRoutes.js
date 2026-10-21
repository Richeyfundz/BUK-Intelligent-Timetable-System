
const express = require("express");
const router = express.Router();

const aiTimetableController = require("../controllers/aiTimetableController");
const {
  authenticateToken,
} = require("../middleware/authMiddleware");

// Both operations require an active, authenticated account.
router.post(
  "/generate",
  authenticateToken,
  aiTimetableController.generateTimetable
);

router.post(
  "/save",
  authenticateToken,
  aiTimetableController.saveGeneratedTimetable
);

module.exports = router;
