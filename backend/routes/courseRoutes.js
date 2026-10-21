
const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// View courses: active authenticated users
router.get("/", authenticateToken, courseController.getAllCourses);
router.get("/:id", authenticateToken, courseController.getCourseById);

// Manage courses: administrators only
router.post("/", authenticateToken, requireAdmin, courseController.createCourse);
router.put("/:id", authenticateToken, requireAdmin, courseController.updateCourse);
router.delete("/:id", authenticateToken, requireAdmin, courseController.deleteCourse);

module.exports = router;
