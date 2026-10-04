const db = require("../config/database");

// GET ALL ASSIGNMENTS
exports.getAll = (callback) => {
  const sql = `
        SELECT
            cl.id,
            cl.course_id,
            c.course_code,
            c.course_title,
            cl.lecturer_id,
            CONCAT(l.first_name, ' ', l.last_name) AS lecturer_name,
            l.staff_id
        FROM course_lecturers cl
        INNER JOIN courses c
            ON cl.course_id = c.id
        INNER JOIN lecturers l
            ON cl.lecturer_id = l.id
        ORDER BY cl.id DESC
    `;

  db.query(sql, callback);
};

// GET LECTURERS ASSIGNED TO A COURSE
exports.getByCourse = (courseId, callback) => {
  const sql = `
        SELECT
            cl.id,
            cl.course_id,
            c.course_code,
            c.course_title,
            cl.lecturer_id,
            CONCAT(l.first_name, ' ', l.last_name) AS lecturer_name,
            l.staff_id
        FROM course_lecturers cl
        INNER JOIN courses c
            ON cl.course_id = c.id
        INNER JOIN lecturers l
            ON cl.lecturer_id = l.id
        WHERE cl.course_id = ?
        ORDER BY l.last_name, l.first_name
    `;

  db.query(sql, [courseId], callback);
};

// CREATE ASSIGNMENT
exports.create = (courseId, lecturerId, callback) => {
  const sql = `
        INSERT INTO course_lecturers
        (course_id, lecturer_id)
        VALUES (?, ?)
    `;

  db.query(sql, [courseId, lecturerId], callback);
};

// DELETE ASSIGNMENT
exports.delete = (id, callback) => {
  const sql = `
        DELETE FROM course_lecturers
        WHERE id = ?
    `;

  db.query(sql, [id], callback);
};
