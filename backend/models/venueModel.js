const db = require("../config/database");

// GET ALL VENUES
exports.getAll = (callback) => {
  const sql = `
        SELECT
            v.id,
            v.venue_name,
            v.venue_code,
            v.venue_type,
            v.capacity,
            v.faculty_id,
            f.faculty_name,
            v.department_id,
            d.department_name,
            v.status,
            v.created_at
        FROM venues v
        LEFT JOIN faculties f
            ON v.faculty_id = f.id
        LEFT JOIN departments d
            ON v.department_id = d.id
        ORDER BY v.id DESC
    `;

  db.query(sql, callback);
};

// GET VENUE BY ID
exports.getById = (id, callback) => {
  const sql = `
        SELECT
            v.id,
            v.venue_name,
            v.venue_code,
            v.venue_type,
            v.capacity,
            v.faculty_id,
            f.faculty_name,
            v.department_id,
            d.department_name,
            v.status,
            v.created_at
        FROM venues v
        LEFT JOIN faculties f
            ON v.faculty_id = f.id
        LEFT JOIN departments d
            ON v.department_id = d.id
        WHERE v.id = ?
    `;

  db.query(sql, [id], callback);
};

// CREATE VENUE
exports.create = (venue, callback) => {
  const sql = `
        INSERT INTO venues
        (
            venue_name,
            venue_code,
            venue_type,
            capacity,
            faculty_id,
            department_id,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

  const values = [
    venue.venue_name,
    venue.venue_code,
    venue.venue_type,
    venue.capacity,
    venue.faculty_id,
    venue.department_id,
    venue.status || "Available",
  ];

  db.query(sql, values, callback);
};

// UPDATE VENUE
exports.update = (id, venue, callback) => {
  const sql = `
        UPDATE venues
        SET
            venue_name = ?,
            venue_code = ?,
            venue_type = ?,
            capacity = ?,
            faculty_id = ?,
            department_id = ?,
            status = ?
        WHERE id = ?
    `;

  const values = [
    venue.venue_name,
    venue.venue_code,
    venue.venue_type,
    venue.capacity,
    venue.faculty_id,
    venue.department_id,
    venue.status,
    id,
  ];

  db.query(sql, values, callback);
};

// DELETE VENUE
exports.delete = (id, callback) => {
  const sql = `
        DELETE FROM venues
        WHERE id = ?
    `;

  db.query(sql, [id], callback);
};
