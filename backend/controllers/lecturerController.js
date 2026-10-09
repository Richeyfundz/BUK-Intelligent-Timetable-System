
const Lecturer = require("../models/lecturerModel");
const db = require("../config/database");

// GET ALL LECTURERS
exports.getAllLecturers = (req, res) => {
  Lecturer.getAll((err, results) => {
    if (err) {
      console.error("Get Lecturers Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch lecturers",
      });
    }

    res.json({ success: true, data: results });
  });
};

// GET LECTURER BY ID
exports.getLecturerById = (req, res) => {
  Lecturer.getById(req.params.id, (err, results) => {
    if (err) {
      console.error("Get Lecturer Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch lecturer",
      });
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found",
      });
    }

    res.json({ success: true, data: results[0] });
  });
};

// CREATE LECTURER
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

  if (
    !department_id ||
    !staff_id ||
    !first_name ||
    !last_name ||
    !email
  ) {
    return res.status(400).json({
      success: false,
      message: "Department, staff ID, names and email are required",
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

        const duplicate = err.code === "ER_DUP_ENTRY";
        const invalidDepartment =
          err.code === "ER_NO_REFERENCED_ROW_2";

        return res.status(
          duplicate || invalidDepartment ? 409 : 500
        ).json({
          success: false,
          message: duplicate
            ? "Staff ID or email already exists"
            : invalidDepartment
              ? "Selected department does not exist"
              : "Failed to create lecturer",
        });
      }

      res.status(201).json({
        success: true,
        message: "Lecturer added successfully",
        lecturerId: result.insertId,
      });
    }
  );
};

// UPDATE LECTURER
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

  if (
    !department_id ||
    !staff_id ||
    !first_name ||
    !last_name ||
    !email
  ) {
    return res.status(400).json({
      success: false,
      message: "Department, staff ID, names and email are required",
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
        return res.status(500).json({
          success: false,
          message: "Failed to update lecturer",
        });
      }

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message: "Lecturer not found",
        });
      }

      res.json({
        success: true,
        message: "Lecturer updated successfully",
      });
    }
  );
};

// DELETE LECTURER
exports.deleteLecturer = (req, res) => {
  Lecturer.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Delete Lecturer Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to delete lecturer",
      });
    }

    if (!result.affectedRows) {
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

// GET COURSES FOR DROPDOWN
exports.getCourses = (req, res) => {
  const sql = `
    SELECT id, course_code, course_title,
           level, semester
    FROM courses
    ORDER BY CAST(level AS UNSIGNED),
             course_code
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Load Courses Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to load courses",
      });
    }

    res.json({ success: true, data: results });
  });
};

// GET ASSIGNED COURSES
exports.getAssignedCourses = (req, res) => {
  Lecturer.getAssignedCourses(
    req.params.id,
    (err, results) => {
      if (err) {
        console.error("Assigned Courses Error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to load assignments",
        });
      }

      res.json({
        success: true,
        data: results.map((row) => row.course_id),
      });
    }
  );
};

// SAVE ASSIGNED COURSES
exports.assignCourses = (req, res) => {
  const lecturerId = Number(req.params.id);
  const courseIds = req.body.course_ids;

  if (
    !Number.isInteger(lecturerId) ||
    lecturerId < 1 ||
    !Array.isArray(courseIds) ||
    courseIds.some(
      (id) =>
        !Number.isInteger(Number(id)) ||
        Number(id) < 1
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid lecturer and course list are required",
    });
  }

  Lecturer.assignCourses(
    lecturerId,
    [...new Set(courseIds.map(Number))],
    (err) => {
      if (err) {
        console.error("Assign Courses Error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to save course assignments",
        });
      }

      res.json({
        success: true,
        message: "Course assignments saved successfully",
      });
    }
  );
};
