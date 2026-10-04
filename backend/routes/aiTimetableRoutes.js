const express = require("express");
const router = express.Router();

const aiTimetableController = require("../controllers/aiTimetableController");

// Generate AI timetable
router.post("/generate", aiTimetableController.generateTimetable);

// Save approved AI timetable
router.post("/save", aiTimetableController.saveGeneratedTimetable);

module.exports = router;
