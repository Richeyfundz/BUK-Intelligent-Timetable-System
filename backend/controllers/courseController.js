const Course = require("../models/courseModel");

// =============================================
// GET ALL COURSES
// =============================================
exports.getAllCourses = (req, res) => {
  Course.getAll((err, results) => {
    if (err) {
      console.error("Get Courses Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch courses",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// =============================================
// GET COURSE BY ID
// =============================================
exports.getCourseById = (req, res) => {
  Course.getById(req.params.id, (err, results) => {
    if (err) {
      console.error("Get Course Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch course",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  });
};

// =============================================
// CREATE COURSE
// =============================================
exports.createCourse = (req, res) => {
  const {
    department_id,
    course_code,
    course_title,
    course_unit,
    level,
    semester,
  } = req.body;

  if (
    !department_id ||
    !course_code ||
    !course_title ||
    !course_unit ||
    !level ||
    !semester
  ) {
    return res.status(400).json({
      success: false,
      message: "All course fields are required",
    });
  }

  Course.create(
    {
      department_id,
      course_code,
      course_title,
      course_unit,
      level,
      semester,
    },
    (err, result) => {
      if (err) {
        console.error("Create Course Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Course code already exists",
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
          message: "Failed to create course",
        });
      }

      res.status(201).json({
        success: true,
        message: "Course added successfully",
        courseId: result.insertId,
      });
    },
  );
};

// =============================================
// UPDATE COURSE
// =============================================
exports.updateCourse = (req, res) => {
  const {
    department_id,
    course_code,
    course_title,
    course_unit,
    level,
    semester,
  } = req.body;

  if (
    !department_id ||
    !course_code ||
    !course_title ||
    !course_unit ||
    !level ||
    !semester
  ) {
    return res.status(400).json({
      success: false,
      message: "All course fields are required",
    });
  }

  Course.update(
    req.params.id,
    {
      department_id,
      course_code,
      course_title,
      course_unit,
      level,
      semester,
    },
    (err, result) => {
      if (err) {
        console.error("Update Course Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Course code already exists",
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
          message: "Failed to update course",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      res.json({
        success: true,
        message: "Course updated successfully",
      });
    },
  );
};

// =============================================
// DELETE COURSE
// =============================================
exports.deleteCourse = (req, res) => {
  Course.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Delete Course Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete course",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  });
};
