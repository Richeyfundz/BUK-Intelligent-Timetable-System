
const express = require("express");
const router = express.Router();

const timetableController =
  require("../controllers/timetableController");

const {
  authenticateToken,
} = require("../middleware/authMiddleware");

// Retrieve saved timetable records
router.get(
  "/",
  authenticateToken,
  timetableController.getTimetables
);

module.exports = router;
