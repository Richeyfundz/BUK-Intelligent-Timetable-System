const express = require("express");
const router = express.Router();

const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentcontroller");

// Get all departments
router.get("/", getAllDepartments);

// Get one department
router.get("/:id", getDepartmentById);

// Create department
router.post("/", createDepartment);

// Update department
router.put("/:id", updateDepartment);

// Delete department
router.delete("/:id", deleteDepartment);

module.exports = router;
