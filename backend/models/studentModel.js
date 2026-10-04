const db = require("../config/database");

// GET ALL STUDENTS
exports.getAll = (callback) => {
  const sql = `
        SELECT
            s.id,
            s.department_id,
            d.department_name,
            s.matric_no,
            s.first_name,
            s.last_name,
            s.gender,
            s.level,
            s.email,
            s.phone,
            s.created_at
        FROM students s
        LEFT JOIN departments d
            ON s.department_id = d.id
        ORDER BY s.id DESC
    `;

  db.query(sql, callback);
};

// GET STUDENT BY ID
exports.getById = (id, callback) => {
  const sql = `
        SELECT
            s.id,
            s.department_id,
            d.department_name,
            s.matric_no,
            s.first_name,
            s.last_name,
            s.gender,
            s.level,
            s.email,
            s.phone,
            s.created_at
        FROM students s
        LEFT JOIN departments d
            ON s.department_id = d.id
        WHERE s.id = ?
    `;

  db.query(sql, [id], callback);
};

// CREATE STUDENT
exports.create = (student, callback) => {
  const sql = `
        INSERT INTO students
        (
            department_id,
            matric_no,
            first_name,
            last_name,
            gender,
            level,
            email,
            phone
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const values = [
    student.department_id,
    student.matric_no,
    student.first_name,
    student.last_name,
    student.gender,
    student.level,
    student.email,
    student.phone,
  ];

  db.query(sql, values, callback);
};

// UPDATE STUDENT
exports.update = (id, student, callback) => {
  const sql = `
        UPDATE students
        SET
            department_id = ?,
            matric_no = ?,
            first_name = ?,
            last_name = ?,
            gender = ?,
            level = ?,
            email = ?,
            phone = ?
        WHERE id = ?
    `;

  const values = [
    student.department_id,
    student.matric_no,
    student.first_name,
    student.last_name,
    student.gender,
    student.level,
    student.email,
    student.phone,
    id,
  ];

  db.query(sql, values, callback);
};

// DELETE STUDENT
exports.delete = (id, callback) => {
  const sql = `
        DELETE FROM students
        WHERE id = ?
    `;

  db.query(sql, [id], callback);
};
