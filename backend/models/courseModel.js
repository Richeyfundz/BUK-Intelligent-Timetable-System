
const db = require("../config/database");

// GET ALL COURSES
exports.getAll = (callback) => {
  const sql = `
    SELECT c.id, c.department_id, d.department_name,
           c.course_code, c.course_title, c.course_unit,
           c.level, c.semester, c.created_at
    FROM courses c
    LEFT JOIN departments d ON c.department_id = d.id
    ORDER BY c.id DESC
  `;
  db.query(sql, callback);
};

// GET COURSE BY ID
exports.getById = (id, callback) => {
  const sql = `
    SELECT c.id, c.department_id, d.department_name,
           c.course_code, c.course_title, c.course_unit,
           c.level, c.semester, c.created_at
    FROM courses c
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.id = ?
  `;
  db.query(sql, [id], callback);
};

// CREATE COURSE
exports.create = (course, callback) => {
  const sql = `
    INSERT INTO courses
    (department_id, course_code, course_title,
     course_unit, level, semester)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    course.department_id,
    course.course_code,
    course.course_title,
    course.course_unit,
    course.level,
    course.semester
  ], callback);
};

// UPDATE COURSE
exports.update = (id, course, callback) => {
  const sql = `
    UPDATE courses
    SET department_id = ?, course_code = ?,
        course_title = ?, course_unit = ?,
        level = ?, semester = ?
    WHERE id = ?
  `;

  db.query(sql, [
    course.department_id,
    course.course_code,
    course.course_title,
    course.course_unit,
    course.level,
    course.semester,
    id
  ], callback);
};

// SAFE COURSE DELETION
exports.delete = (id, callback) => {
  db.getConnection((connectionError, connection) => {
    if (connectionError) return callback(connectionError);

    const rollback = (error) => {
      connection.rollback(() => {
        connection.release();
        callback(error);
      });
    };

    connection.beginTransaction((beginError) => {
      if (beginError) {
        connection.release();
        return callback(beginError);
      }

      connection.query(
        "SELECT id FROM courses WHERE id = ? FOR UPDATE",
        [id],
        (findError, courses) => {
          if (findError) return rollback(findError);

          if (!courses.length) {
            return rollback(
              Object.assign(new Error("Course not found"), {
                code: "COURSE_NOT_FOUND"
              })
            );
          }

          connection.query(
            `SELECT
              (SELECT COUNT(*) FROM timetables
               WHERE course_id = ?) AS lectures,
              (SELECT COUNT(*) FROM exam_timetables
               WHERE course_id = ?) AS exams`,
            [id, id],
            (checkError, rows) => {
              if (checkError) return rollback(checkError);

              const usage = rows[0];

              if (Number(usage.lectures) > 0 ||
                  Number(usage.exams) > 0) {
                const error = Object.assign(
                  new Error("Course is already used in a timetable or exam."),
                  {
                    code: "COURSE_IN_USE",
                    lectures: Number(usage.lectures),
                    exams: Number(usage.exams)
                  }
                );
                return rollback(error);
              }

              connection.query(
                "DELETE FROM course_lecturers WHERE course_id = ?",
                [id],
                (assignmentError) => {
                  if (assignmentError) return rollback(assignmentError);

                  connection.query(
                    "DELETE FROM courses WHERE id = ?",
                    [id],
                    (deleteError, result) => {
                      if (deleteError) return rollback(deleteError);

                      connection.commit((commitError) => {
                        if (commitError) return rollback(commitError);

                        connection.release();
                        callback(null, result);
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};
