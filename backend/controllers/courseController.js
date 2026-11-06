
const Course = require("../models/courseModel");

// GET ALL COURSES
exports.getAllCourses = (req, res) => {
  Course.getAll((err, results) => {
    if (err) {
      console.error("Get Courses Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch courses"
      });
    }

    res.json({ success: true, data: results });
  });
};

// GET COURSE BY ID
exports.getCourseById = (req, res) => {
  Course.getById(req.params.id, (err, results) => {
    if (err) {
      console.error("Get Course Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch course"
      });
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({ success: true, data: results[0] });
  });
};

// CREATE COURSE
exports.createCourse = (req, res) => {
  const {
    department_id,
    course_code,
    course_title,
    course_unit,
    level,
    semester
  } = req.body || {};

  if (!department_id || !course_code || !course_title ||
      !course_unit || !level || !semester) {
    return res.status(400).json({
      success: false,
      message: "All course fields are required"
    });
  }

  Course.create({
    department_id,
    course_code,
    course_title,
    course_unit,
    level,
    semester
  }, (err, result) => {
    if (err) {
      console.error("Create Course Error:", err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "Course code already exists"
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create course"
      });
    }

    res.status(201).json({
      success: true,
      message: "Course added successfully",
      courseId: result.insertId
    });
  });
};

// UPDATE COURSE
exports.updateCourse = (req, res) => {
  const {
    department_id,
    course_code,
    course_title,
    course_unit,
    level,
    semester
  } = req.body || {};

  if (!department_id || !course_code || !course_title ||
      !course_unit || !level || !semester) {
    return res.status(400).json({
      success: false,
      message: "All course fields are required"
    });
  }

  Course.update(req.params.id, {
    department_id,
    course_code,
    course_title,
    course_unit,
    level,
    semester
  }, (err, result) => {
    if (err) {
      console.error("Update Course Error:", err);

      return res.status(
        err.code === "ER_DUP_ENTRY" ? 409 : 500
      ).json({
        success: false,
        message: err.code === "ER_DUP_ENTRY"
          ? "Course code already exists"
          : "Failed to update course"
      });
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({
      success: true,
      message: "Course updated successfully"
    });
  });
};

// DELETE COURSE
exports.deleteCourse = (req, res) => {
  Course.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Delete Course Error:", err);

      if (err.code === "COURSE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      if (err.code === "COURSE_IN_USE") {
        return res.status(409).json({
          success: false,
          message: "This course cannot be deleted because it has existing timetable or exam records.",
          lectureRecords: err.lectures,
          examRecords: err.exams
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to delete course",
        error: err.message
      });
    }

    res.json({
      success: true,
      message: "Course and unused lecturer assignments deleted successfully"
    });
  });
};
