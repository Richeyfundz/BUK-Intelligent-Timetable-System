
const db = require("../config/database");

// GET SAVED TIMETABLES
exports.getTimetables = (req, res) => {
  const sql = `
    SELECT
      t.id,
      t.course_id,
      c.course_code,
      c.course_title,
      t.lecturer_id,
      CONCAT(l.first_name, ' ', l.last_name) AS lecturer_name,
      t.venue_id,
      v.venue_name,
      v.venue_code,
      t.level,
      t.semester,
      t.day,
      t.lecture_date,
      t.start_time,
      t.end_time,
      t.session,
      t.academic_year
    FROM timetables t
    LEFT JOIN courses c ON t.course_id = c.id
    LEFT JOIN lecturers l ON t.lecturer_id = l.id
    LEFT JOIN venues v ON t.venue_id = v.id
    ORDER BY t.lecture_date, t.start_time, t.level
  `;

  db.query(sql, (error, rows) => {
    if (error) {
      console.error("Timetable report error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve saved timetables."
      });
    }

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
};

// CLEAR ALL SAVED LECTURE TIMETABLES
exports.clearTimetables = (req, res) => {
  db.query("DELETE FROM timetables", (error, result) => {
    if (error) {
      console.error("Clear timetable error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to clear saved timetables."
      });
    }

    res.json({
      success: true,
      message: `${result.affectedRows} saved timetable records cleared.`,
      deleted: result.affectedRows
    });
  });
};
