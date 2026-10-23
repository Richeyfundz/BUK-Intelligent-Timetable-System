
const express = require("express");
const router = express.Router();

const lecturerController =
  require("../controllers/lecturerController");

const {
  authenticateToken,
  requireAdmin,
} = require("../authMiddleware");

// Lecturer records
router.get(
  "/",
  authenticateToken,
  lecturerController.getAllLecturers
);

router.get(
  "/:id",
  authenticateToken,
  lecturerController.getLecturerById
);

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  lecturerController.createLecturer
);

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  lecturerController.updateLecturer
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  lecturerController.deleteLecturer
);

// Course assignments
router.get(
  "/courses",
  authenticateToken,
  lecturerController.getCourses
);

router.get(
  "/:id/courses",
  authenticateToken,
  lecturerController.getAssignedCourses
);

router.put(
  "/:id/courses",
  authenticateToken,
  requireAdmin,
  lecturerController.assignCourses
);

module.exports = router;
