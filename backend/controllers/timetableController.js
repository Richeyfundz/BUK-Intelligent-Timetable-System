
const db = require("../config/database");

// Get saved timetable records for Reports.
exports.getTimetables = (req, res) => {
  const sql = `
    SELECT
      t.id,
      t.course_id,
      c.course_code,
      c.course_title,
      t.lecturer_id,
      CONCAT(
        l.first_name, ' ', l.last_name
      ) AS lecturer_name,
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
    LEFT JOIN courses c
      ON t.course_id = c.id
    LEFT JOIN lecturers l
      ON t.lecturer_id = l.id
    LEFT JOIN venues v
      ON t.venue_id = v.id
    ORDER BY
      t.lecture_date ASC,
      t.start_time ASC,
      t.level ASC
  `;

  db.query(sql, (error, rows) => {
    if (error) {
      console.error("Timetable report query failed:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve saved timetable records."
      });
    }

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  });
};
