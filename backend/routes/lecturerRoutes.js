const express = require("express");
const router = express.Router();

const lecturerController = require("../controllers/lecturerController");

// Get all lecturers
router.get("/", lecturerController.getAllLecturers);

// Get lecturer by ID
router.get("/:id", lecturerController.getLecturerById);

// Create lecturer
router.post("/", lecturerController.createLecturer);

// Update lecturer
router.put("/:id", lecturerController.updateLecturer);

// Delete lecturer
router.delete("/:id", lecturerController.deleteLecturer);

module.exports = router;
