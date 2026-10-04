const db = require("../config/database");

const Faculty = {
  getAll(callback) {
    const sql = `
            SELECT id, faculty_name, faculty_code, dean, created_at
            FROM faculties
            ORDER BY id DESC
        `;

    db.query(sql, callback);
  },

  getById(id, callback) {
    const sql = `
            SELECT id, faculty_name, faculty_code, dean, created_at
            FROM faculties
            WHERE id = ?
        `;

    db.query(sql, [id], callback);
  },

  create(data, callback) {
    const sql = `
            INSERT INTO faculties (faculty_name, faculty_code, dean)
            VALUES (?, ?, ?)
        `;

    db.query(sql, [data.faculty_name, data.faculty_code, data.dean], callback);
  },

  update(id, data, callback) {
    const sql = `
            UPDATE faculties
            SET faculty_name = ?,
                faculty_code = ?,
                dean = ?
            WHERE id = ?
        `;

    db.query(
      sql,
      [data.faculty_name, data.faculty_code, data.dean, id],
      callback,
    );
  },

  delete(id, callback) {
    const sql = `
            DELETE FROM faculties
            WHERE id = ?
        `;

    db.query(sql, [id], callback);
  },
};

module.exports = Faculty;
