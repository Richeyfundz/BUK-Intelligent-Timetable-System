const db = require("../config/database");

// =====================================================
// GET ALL COURSES WITH THEIR ACTUAL ASSIGNED LECTURERS
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

      CONCAT(l.first_name, ' ', l.last_name) AS lecturer_name

    FROM courses c

    INNER JOIN course_lecturers cl
      ON c.id = cl.course_id

    INNER JOIN lecturers l
      ON cl.lecturer_id = l.id

    WHERE c.semester = ?
  `;

  const params = [semester];

  // If a level is supplied, filter by it.
  // Our new generator sends null, meaning ALL levels.
  if (level !== null && level !== undefined && level !== "") {
    sql += ` AND c.level = ?`;

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
// GET EXISTING TIMETABLES
// =====================================================

exports.getExistingTimetables = (academicYear, semester, callback) => {
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
// SAVE GENERATED TIMETABLE
// =====================================================

exports.saveGeneratedTimetable = (timetable, callback) => {
  const sql = `
    INSERT INTO timetables
    (
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

    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    timetable.academic_year,
  ];

  db.query(sql, values, callback);
};
