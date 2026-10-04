const Department = require("../models/departmentModel");

// Get all departments
exports.getAllDepartments = (req, res) => {
  Department.getAll((err, results) => {
    if (err) {
      console.error("Get Departments Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve departments.",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// Get department by ID
exports.getDepartmentById = (req, res) => {
  Department.getById(req.params.id, (err, results) => {
    if (err) {
      console.error("Get Department Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve department.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  });
};

// Create department
exports.createDepartment = (req, res) => {
  const { faculty_id, department_name, department_code, hod } = req.body;

  if (!faculty_id || !department_name || !department_code) {
    return res.status(400).json({
      success: false,
      message: "Faculty, department name and department code are required.",
    });
  }

  Department.create(
    {
      faculty_id,
      department_name,
      department_code,
      hod,
    },
    (err, result) => {
      if (err) {
        console.error("Create Department Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Department code already exists.",
          });
        }

        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({
            success: false,
            message: "Selected faculty does not exist.",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to create department.",
        });
      }

      res.status(201).json({
        success: true,
        message: "Department added successfully.",
        departmentId: result.insertId,
      });
    },
  );
};

// Update department
exports.updateDepartment = (req, res) => {
  const { faculty_id, department_name, department_code, hod } = req.body;

  if (!faculty_id || !department_name || !department_code) {
    return res.status(400).json({
      success: false,
      message: "Faculty, department name and department code are required.",
    });
  }

  Department.update(
    req.params.id,
    {
      faculty_id,
      department_name,
      department_code,
      hod,
    },
    (err, result) => {
      if (err) {
        console.error("Update Department Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Department code already exists.",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to update department.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found.",
        });
      }

      res.json({
        success: true,
        message: "Department updated successfully.",
      });
    },
  );
};

// Delete department
exports.deleteDepartment = (req, res) => {
  Department.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Delete Department Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete department.",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    res.json({
      success: true,
      message: "Department deleted successfully.",
    });
  });
};
