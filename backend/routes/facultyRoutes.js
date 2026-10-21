
const express = require("express");
const router = express.Router();

const {
  getAllFaculties,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require("../controllers/facultyController");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// View faculties: active authenticated users
router.get("/", authenticateToken, getAllFaculties);
router.get("/:id", authenticateToken, getFacultyById);

// Manage faculties: administrators only
router.post("/", authenticateToken, requireAdmin, createFaculty);
router.put("/:id", authenticateToken, requireAdmin, updateFaculty);
router.delete("/:id", authenticateToken, requireAdmin, deleteFaculty);

module.exports = router;
