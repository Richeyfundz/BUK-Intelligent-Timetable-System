const CourseLecturer = require("../models/courseLecturerModel");

// GET ALL ASSIGNMENTS
exports.getAllAssignments = (req, res) => {
  CourseLecturer.getAll((err, results) => {
    if (err) {
      console.error("Get Course Lecturer Assignments Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch lecturer-course assignments",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// GET LECTURERS FOR A COURSE
exports.getCourseLecturers = (req, res) => {
  CourseLecturer.getByCourse(req.params.courseId, (err, results) => {
    if (err) {
      console.error("Get Course Lecturers Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch course lecturers",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// ASSIGN LECTURER TO COURSE
exports.assignLecturer = (req, res) => {
  const { course_id, lecturer_id } = req.body;

  if (!course_id || !lecturer_id) {
    return res.status(400).json({
      success: false,
      message: "Course ID and lecturer ID are required",
    });
  }

  CourseLecturer.create(course_id, lecturer_id, (err, result) => {
    if (err) {
      console.error("Assign Lecturer Error:", err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "This lecturer is already assigned to this course",
        });
      }

      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          success: false,
          message: "Course or lecturer does not exist",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to assign lecturer to course",
      });
    }

    res.status(201).json({
      success: true,
      message: "Lecturer assigned to course successfully",
      assignmentId: result.insertId,
    });
  });
};

// REMOVE ASSIGNMENT
exports.removeAssignment = (req, res) => {
  CourseLecturer.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Remove Assignment Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to remove lecturer-course assignment",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.json({
      success: true,
      message: "Lecturer-course assignment removed successfully",
    });
  });
};
