const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");

// Get all courses
router.get("/", courseController.getAllCourses);

// Get course by ID
router.get("/:id", courseController.getCourseById);

// Create course
router.post("/", courseController.createCourse);

// Update course
router.put("/:id", courseController.updateCourse);

// Delete course
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
