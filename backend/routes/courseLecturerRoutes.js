const express = require("express");
const router = express.Router();

const courseLecturerController = require("../controllers/courseLecturerController");

// Get all lecturer-course assignments
router.get("/", courseLecturerController.getAllAssignments);

// Get lecturers assigned to a specific course
router.get("/course/:courseId", courseLecturerController.getCourseLecturers);

// Assign lecturer to course
router.post("/", courseLecturerController.assignLecturer);

// Remove assignment
router.delete("/:id", courseLecturerController.removeAssignment);

module.exports = router;
