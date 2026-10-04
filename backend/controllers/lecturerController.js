const Lecturer = require("../models/lecturerModel");

// =============================================
// GET ALL LECTURERS
// =============================================
exports.getAllLecturers = (req, res) => {
  Lecturer.getAll((err, results) => {
    if (err) {
      console.error("Get Lecturers Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch lecturers",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// =============================================
// GET LECTURER BY ID
// =============================================
exports.getLecturerById = (req, res) => {
  Lecturer.getById(req.params.id, (err, results) => {
    if (err) {
      console.error("Get Lecturer Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch lecturer",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found",
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  });
};

// =============================================
// CREATE LECTURER
// =============================================
exports.createLecturer = (req, res) => {
  const {
    department_id,
    staff_id,
    first_name,
    last_name,
    email,
    phone,
    academic_rank,
    specialization,
  } = req.body;

  if (!department_id || !staff_id || !first_name || !last_name || !email) {
    return res.status(400).json({
      success: false,
      message:
        "Department, staff ID, first name, last name and email are required",
    });
  }

  Lecturer.create(
    {
      department_id,
      staff_id,
      first_name,
      last_name,
      email,
      phone,
      academic_rank,
      specialization,
    },
    (err, result) => {
      if (err) {
        console.error("Create Lecturer Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Staff ID or email already exists",
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
          message: "Failed to create lecturer",
        });
      }

      res.status(201).json({
        success: true,
        message: "Lecturer added successfully",
        lecturerId: result.insertId,
      });
    },
  );
};

// =============================================
// UPDATE LECTURER
// =============================================
exports.updateLecturer = (req, res) => {
  const {
    department_id,
    staff_id,
    first_name,
    last_name,
    email,
    phone,
    academic_rank,
    specialization,
  } = req.body;

  if (!department_id || !staff_id || !first_name || !last_name || !email) {
    return res.status(400).json({
      success: false,
      message:
        "Department, staff ID, first name, last name and email are required",
    });
  }

  Lecturer.update(
    req.params.id,
    {
      department_id,
      staff_id,
      first_name,
      last_name,
      email,
      phone,
      academic_rank,
      specialization,
    },
    (err, result) => {
      if (err) {
        console.error("Update Lecturer Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Staff ID or email already exists",
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
          message: "Failed to update lecturer",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Lecturer not found",
        });
      }

      res.json({
        success: true,
        message: "Lecturer updated successfully",
      });
    },
  );
};

// =============================================
// DELETE LECTURER
// =============================================
exports.deleteLecturer = (req, res) => {
  Lecturer.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Delete Lecturer Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete lecturer",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found",
      });
    }

    res.json({
      success: true,
      message: "Lecturer deleted successfully",
    });
  });
};
