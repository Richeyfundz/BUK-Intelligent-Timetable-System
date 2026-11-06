
const express = require("express");
const router = express.Router();

const timetableController =
  require("../controllers/timetableController");

const {
  authenticateToken,
  requireAdmin
} = require("../authMiddleware");

// Retrieve saved timetables
router.get(
  "/",
  authenticateToken,
  timetableController.getTimetables
);

// Clear saved lecture timetables
router.delete(
  "/clear",
  authenticateToken,
  requireAdmin,
  timetableController.clearTimetables
);

module.exports = router;
