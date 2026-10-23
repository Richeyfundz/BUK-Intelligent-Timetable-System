
const express = require("express");
const router = express.Router();

const examTimetableController =
  require("../controllers/exam-timetableController");

const {
  authenticateToken,
  requireAdmin,
} = require("../authMiddleware");

// Generate exam timetable
router.post(
  "/generate",
  authenticateToken,
  requireAdmin,
  examTimetableController.generateExamTimetable
);

// Save exam timetable
router.post(
  "/save",
  authenticateToken,
  requireAdmin,
  examTimetableController.saveExamTimetable
);

// Clear exam timetable
router.delete(
  "/clear",
  authenticateToken,
  requireAdmin,
  examTimetableController.clearExamTimetable
);

module.exports = router;
