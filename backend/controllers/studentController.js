const Student = require("../models/studentModel");

// GET ALL STUDENTS
exports.getAllStudents = (req, res) => {
  Student.getAll((err, results) => {
    if (err) {
      console.error("Get Students Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch students",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// GET STUDENT BY ID
exports.getStudentById = (req, res) => {
  Student.getById(req.params.id, (err, results) => {
    if (err) {
      console.error("Get Student Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch student",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  });
};

// CREATE STUDENT
exports.createStudent = (req, res) => {
  const {
    department_id,
    matric_no,
    first_name,
    last_name,
    gender,
    level,
    email,
    phone,
  } = req.body;

  if (
    !department_id ||
    !matric_no ||
    !first_name ||
    !last_name ||
    !gender ||
    !level
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Department, matric number, names, gender and level are required",
    });
  }

  Student.create(
    {
      department_id,
      matric_no,
      first_name,
      last_name,
      gender,
      level,
      email,
      phone,
    },
    (err, result) => {
      if (err) {
        console.error("Create Student Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Matric number already exists",
          });
        }

        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({
            success: false,
            message: "Selected department does not exist",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to create student",
        });
      }

      res.status(201).json({
        success: true,
        message: "Student added successfully",
        studentId: result.insertId,
      });
    },
  );
};

// UPDATE STUDENT
exports.updateStudent = (req, res) => {
  const {
    department_id,
    matric_no,
    first_name,
    last_name,
    gender,
    level,
    email,
    phone,
  } = req.body;

  if (
    !department_id ||
    !matric_no ||
    !first_name ||
    !last_name ||
    !gender ||
    !level
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Department, matric number, names, gender and level are required",
    });
  }

  Student.update(
    req.params.id,
    {
      department_id,
      matric_no,
      first_name,
      last_name,
      gender,
      level,
      email,
      phone,
    },
    (err, result) => {
      if (err) {
        console.error("Update Student Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Matric number already exists",
          });
        }

        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({
            success: false,
            message: "Selected department does not exist",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to update student",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      res.json({
        success: true,
        message: "Student updated successfully",
      });
    },
  );
};

// DELETE STUDENT
exports.deleteStudent = (req, res) => {
  Student.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Delete Student Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete student",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  });
};
