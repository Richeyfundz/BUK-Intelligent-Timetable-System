const Faculty = require("../models/facultyModel");

// Get all faculties
exports.getAllFaculties = (req, res) => {
  Faculty.getAll((err, results) => {
    if (err) {
      console.error("Get Faculties Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve faculties.",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// Get faculty by ID
exports.getFacultyById = (req, res) => {
  Faculty.getById(req.params.id, (err, results) => {
    if (err) {
      console.error("Get Faculty Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve faculty.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  });
};

// Create faculty
exports.createFaculty = (req, res) => {
  const { faculty_name, faculty_code, dean } = req.body;

  if (!faculty_name || !faculty_code) {
    return res.status(400).json({
      success: false,
      message: "Faculty name and faculty code are required.",
    });
  }

  Faculty.create(
    {
      faculty_name,
      faculty_code,
      dean,
    },
    (err, result) => {
      if (err) {
        console.error("Create Faculty Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Faculty code already exists.",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to create faculty.",
        });
      }

      res.status(201).json({
        success: true,
        message: "Faculty added successfully.",
        facultyId: result.insertId,
      });
    },
  );
};

// Update faculty
exports.updateFaculty = (req, res) => {
  const { faculty_name, faculty_code, dean } = req.body;

  if (!faculty_name || !faculty_code) {
    return res.status(400).json({
      success: false,
      message: "Faculty name and faculty code are required.",
    });
  }

  Faculty.update(
    req.params.id,
    {
      faculty_name,
      faculty_code,
      dean,
    },
    (err, result) => {
      if (err) {
        console.error("Update Faculty Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Faculty code already exists.",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to update faculty.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Faculty not found.",
        });
      }

      res.json({
        success: true,
        message: "Faculty updated successfully.",
      });
    },
  );
};

// Delete faculty
exports.deleteFaculty = (req, res) => {
  Faculty.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Delete Faculty Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete faculty.",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    res.json({
      success: true,
      message: "Faculty deleted successfully.",
    });
  });
};
