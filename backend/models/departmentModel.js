const db = require("../config/database");

const Department = {
  getAll(callback) {
    const sql = `
            SELECT
                d.id,
                d.department_name,
                d.department_code,
                d.hod,
                d.faculty_id,
                f.faculty_name
            FROM departments d
            INNER JOIN faculties f
                ON d.faculty_id = f.id
            ORDER BY d.id DESC
        `;

    db.query(sql, callback);
  },

  getById(id, callback) {
    const sql = `
            SELECT
                d.id,
                d.department_name,
                d.department_code,
                d.hod,
                d.faculty_id,
                f.faculty_name
            FROM departments d
            INNER JOIN faculties f
                ON d.faculty_id = f.id
            WHERE d.id = ?
        `;

    db.query(sql, [id], callback);
  },

  create(data, callback) {
    const sql = `
            INSERT INTO departments
            (faculty_id, department_name, department_code, hod)
            VALUES (?, ?, ?, ?)
        `;

    db.query(
      sql,
      [data.faculty_id, data.department_name, data.department_code, data.hod],
      callback,
    );
  },

  update(id, data, callback) {
    const sql = `
            UPDATE departments
            SET
                faculty_id = ?,
                department_name = ?,
                department_code = ?,
                hod = ?
            WHERE id = ?
        `;

    db.query(
      sql,
      [
        data.faculty_id,
        data.department_name,
        data.department_code,
        data.hod,
        id,
      ],
      callback,
    );
  },

  delete(id, callback) {
    const sql = `
            DELETE FROM departments
            WHERE id = ?
        `;

    db.query(sql, [id], callback);
  },
};

module.exports = Department;
