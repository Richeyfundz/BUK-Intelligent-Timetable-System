
const db = require("../config/database");

// =====================================================
// GET ALL SEMESTER COURSES AND THEIR ACTUAL LECTURERS
// LEFT JOIN keeps courses that have no lecturer assigned,
// so the controller can report missing assignments.
// =====================================================

exports.getCoursesWithLecturers = (semester, level, callback) => {
  let sql = `
    SELECT
      c.id AS course_id,
      c.course_code,
      c.course_title,
      c.course_unit,
      c.level,
      c.semester,
      l.id AS lecturer_id,
      l.staff_id,
      CASE
        WHEN l.id IS NOT NULL
        THEN CONCAT(l.first_name, ' ', l.last_name)
        ELSE NULL
      END AS lecturer_name
    FROM courses c
    LEFT JOIN course_lecturers cl
      ON c.id = cl.course_id
    LEFT JOIN lecturers l
      ON cl.lecturer_id = l.id
    WHERE c.semester = ?
  `;

  const params = [semester];

  if (level !== null && level !== undefined && level !== "") {
    sql += " AND c.level = ?";
    params.push(level);
  }

  sql += `
    ORDER BY
      CAST(c.level AS UNSIGNED) ASC,
      c.course_code ASC
  `;

  db.query(sql, params, callback);
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
// GET EXISTING TIMETABLE ENTRIES FOR CLASH DETECTION
// =====================================================

exports.getExistingTimetables = (
  academicYear,
  semester,
  callback
) => {
  const sql = `
    SELECT
      id,
      course_id,
      lecturer_id,
      venue_id,
      level,
      semester,
      day,
      lecture_date,
      start_time,
      end_time,
      session,
      academic_year
    FROM timetables
    WHERE academic_year = ?
      AND semester = ?
  `;

  db.query(sql, [academicYear, semester], callback);
};

// =====================================================
// SAVE ONE GENERATED TIMETABLE ENTRY
// =====================================================

exports.saveGeneratedTimetable = (timetable, callback) => {
  const sql = `
    INSERT INTO timetables (
      course_id,
      lecturer_id,
      venue_id,
      level,
      semester,
      day,
      lecture_date,
      start_time,
      end_time,
      session,
      academic_year
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    timetable.course_id,
    timetable.lecturer_id,
    timetable.venue_id,
    timetable.level,
    timetable.semester,
    timetable.day,
    timetable.lecture_date,
    timetable.start_time,
    timetable.end_time,
    timetable.session,
    timetable.academic_year
  ];

  db.query(sql, values, callback);
};

