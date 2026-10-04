const db = require("../config/database");

// =====================================================
// GET ALL COURSES FOR EXAMINATION
// =====================================================

exports.getExamCourses = (semester, callback) => {
  const sql = `
    SELECT
      c.id AS course_id,
      c.course_code,
      c.course_title,
      c.course_unit,
      c.level,
      c.semester
    FROM courses c
    WHERE c.semester = ?
      AND c.level IN ('100', '200', '300', '400')
    ORDER BY
      CAST(c.level AS UNSIGNED) ASC,
      c.course_code ASC
  `;

  db.query(sql, [semester], callback);
};

// =====================================================
// GET AVAILABLE VENUES
// =====================================================

exports.getAvailableVenues = (callback) => {
  const sql = `
    SELECT
      id,
      venue_name,
      venue_code,
      venue_type,
      capacity
    FROM venues
    WHERE status = 'Available'
    ORDER BY capacity ASC
  `;

  db.query(sql, callback);
};

// =====================================================
// GET EXISTING EXAM TIMETABLES
// =====================================================

exports.getExistingExamTimetables = (academicYear, semester, callback) => {
  const sql = `
    SELECT
      id,
      course_id,
      venue_id,
      level,
      semester,
      day,
      exam_date,
      start_time,
      end_time,
      session,
      academic_year
    FROM exam_timetables
    WHERE academic_year = ?
      AND semester = ?
  `;

  db.query(sql, [academicYear, semester], callback);
};

// =====================================================
// SAVE EXAM TIMETABLE
// =====================================================

exports.saveExamTimetable = (timetable, callback) => {
  const sql = `
    INSERT INTO exam_timetables
    (
      course_id,
      venue_id,
      level,
      semester,
      day,
      exam_date,
      start_time,
      end_time,
      session,
      academic_year
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    timetable.course_id,
    timetable.venue_id,
    timetable.level,
    timetable.semester,
    timetable.day,
    timetable.exam_date,
    timetable.start_time,
    timetable.end_time,
    timetable.session,
    timetable.academic_year,
  ];

  db.query(sql, values, callback);
};

// =====================================================
// CLEAR GENERATED EXAM TIMETABLE
// =====================================================

exports.deleteExamTimetable = (academicYear, semester, callback) => {
  const sql = `
    DELETE FROM exam_timetables
    WHERE academic_year = ?
      AND semester = ?
  `;

  db.query(sql, [academicYear, semester], callback);
};
