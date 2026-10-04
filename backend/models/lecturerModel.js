const db = require("../config/database");

// =============================================
// GET ALL LECTURERS
// =============================================
exports.getAll = (callback) => {
  const sql = `
        SELECT
            l.id,
            l.department_id,
            d.department_name,
            l.staff_id,
            l.first_name,
            l.last_name,
            l.email,
            l.phone,
            l.academic_rank,
            l.specialization,
            l.created_at
        FROM lecturers l
        LEFT JOIN departments d
            ON l.department_id = d.id
        ORDER BY l.id DESC
    `;

  db.query(sql, callback);
};

// =============================================
// GET LECTURER BY ID
// =============================================
exports.getById = (id, callback) => {
  const sql = `
        SELECT
            l.id,
            l.department_id,
            d.department_name,
            l.staff_id,
            l.first_name,
            l.last_name,
            l.email,
            l.phone,
            l.academic_rank,
            l.specialization,
            l.created_at
        FROM lecturers l
        LEFT JOIN departments d
            ON l.department_id = d.id
        WHERE l.id = ?
    `;

  db.query(sql, [id], callback);
};

// =============================================
// CREATE LECTURER
// =============================================
exports.create = (lecturer, callback) => {
  const sql = `
        INSERT INTO lecturers
        (
            department_id,
            staff_id,
            first_name,
            last_name,
            email,
            phone,
            academic_rank,
            specialization
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const values = [
    lecturer.department_id,
    lecturer.staff_id,
    lecturer.first_name,
    lecturer.last_name,
    lecturer.email,
    lecturer.phone,
    lecturer.academic_rank,
    lecturer.specialization,
  ];

  db.query(sql, values, callback);
};

// =============================================
// UPDATE LECTURER
// =============================================
exports.update = (id, lecturer, callback) => {
  const sql = `
        UPDATE lecturers
        SET
            department_id = ?,
            staff_id = ?,
            first_name = ?,
            last_name = ?,
            email = ?,
            phone = ?,
            academic_rank = ?,
            specialization = ?
        WHERE id = ?
    `;

  const values = [
    lecturer.department_id,
    lecturer.staff_id,
    lecturer.first_name,
    lecturer.last_name,
    lecturer.email,
    lecturer.phone,
    lecturer.academic_rank,
    lecturer.specialization,
    id,
  ];

  db.query(sql, values, callback);
};

// =============================================
// DELETE LECTURER
// =============================================
exports.delete = (id, callback) => {
  const sql = `
        DELETE FROM lecturers
        WHERE id = ?
    `;

  db.query(sql, [id], callback);
};
