
const express = require("express");
const router = express.Router();

const courseLecturerController =
  require("../controllers/courseLecturerController");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Get all lecturer-course assignments
router.get(
  "/",
  authenticateToken,
  courseLecturerController.getAllAssignments
);

// Get lecturers assigned to a specific course
router.get(
  "/course/:courseId",
  authenticateToken,
  courseLecturerController.getCourseLecturers
);

// Assign lecturer to course
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  courseLecturerController.assignLecturer
);

// Remove assignment
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  courseLecturerController.removeAssignment
);

module.exports = router;
