const express = require("express");

const router = express.Router();

const examTimetableController = require("../controllers/exam-timetableController");

router.post("/generate", examTimetableController.generateExamTimetable);

router.post("/save", examTimetableController.saveExamTimetable);

router.delete("/clear", examTimetableController.clearExamTimetable);

module.exports = router;
