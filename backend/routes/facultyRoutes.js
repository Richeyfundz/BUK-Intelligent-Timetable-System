const express = require("express");
const router = express.Router();

const {
  getAllFaculties,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require("../controllers/facultyController");

// GET all faculties
router.get("/", getAllFaculties);

// GET faculty by ID
router.get("/:id", getFacultyById);

// CREATE new faculty
router.post("/", createFaculty);

// UPDATE faculty
router.put("/:id", updateFaculty);

// DELETE faculty
router.delete("/:id", deleteFaculty);

module.exports = router;
