
const express = require("express");
const router = express.Router();

const timetableController =
  require("../controllers/timetableController");

// Retrieve saved timetable records.
router.get("/", timetableController.getTimetables);

module.exports = router;
