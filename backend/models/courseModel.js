const db = require("../config/database");

// =============================================
// GET ALL COURSES
// =============================================
exports.getAll = (callback) => {
  const sql = `
        SELECT 
            c.id,
            c.department_id,
            d.department_name,
            c.course_code,
            c.course_title,
            c.course_unit,
            c.level,
            c.semester,
            c.created_at
        FROM courses c
        LEFT JOIN departments d 
            ON c.department_id = d.id
        ORDER BY c.id DESC
    `;

  db.query(sql, callback);
};

// =============================================
// GET COURSE BY ID
// =============================================
exports.getById = (id, callback) => {
  const sql = `
        SELECT 
            c.id,
            c.department_id,
            d.department_name,
            c.course_code,
            c.course_title,
            c.course_unit,
            c.level,
            c.semester,
            c.created_at
        FROM courses c
        LEFT JOIN departments d 
            ON c.department_id = d.id
        WHERE c.id = ?
    `;

  db.query(sql, [id], callback);
};

// =============================================
// CREATE COURSE
// =============================================
exports.create = (course, callback) => {
  const sql = `
        INSERT INTO courses
        (
            department_id,
            course_code,
            course_title,
            course_unit,
            level,
            semester
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

  const values = [
    course.department_id,
    course.course_code,
    course.course_title,
    course.course_unit,
    course.level,
    course.semester,
  ];

  db.query(sql, values, callback);
};

// =============================================
// UPDATE COURSE
// =============================================
exports.update = (id, course, callback) => {
  const sql = `
        UPDATE courses
        SET
            department_id = ?,
            course_code = ?,
            course_title = ?,
            course_unit = ?,
            level = ?,
            semester = ?
        WHERE id = ?
    `;

  const values = [
    course.department_id,
    course.course_code,
    course.course_title,
    course.course_unit,
    course.level,
    course.semester,
    id,
  ];

  db.query(sql, values, callback);
};

// =============================================
// DELETE COURSE
// =============================================
exports.delete = (id, callback) => {
  const sql = `
        DELETE FROM courses
        WHERE id = ?
    `;

  db.query(sql, [id], callback);
};
