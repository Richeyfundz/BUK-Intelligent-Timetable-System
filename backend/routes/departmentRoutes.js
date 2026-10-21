
const express = require("express");
const router = express.Router();

const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentcontroller");

const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// View departments: active authenticated users
router.get("/", authenticateToken, getAllDepartments);
router.get("/:id", authenticateToken, getDepartmentById);

// Manage departments: administrators only
router.post("/", authenticateToken, requireAdmin, createDepartment);
router.put("/:id", authenticateToken, requireAdmin, updateDepartment);
router.delete("/:id", authenticateToken, requireAdmin, deleteDepartment);

module.exports = router;
