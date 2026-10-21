
const express = require("express");
const router = express.Router();

const studentController =
  require("../controllers/studentController");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// View student records
router.get(
  "/",
  authenticateToken,
  studentController.getAllStudents
);

router.get(
  "/:id",
  authenticateToken,
  studentController.getStudentById
);

// Manage student records
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  studentController.createStudent
);

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  studentController.updateStudent
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  studentController.deleteStudent
);

module.exports = router;
