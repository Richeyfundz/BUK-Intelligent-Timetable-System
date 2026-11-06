
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
    LEFT JOIN faculties f ON v.faculty_id = f.id
    LEFT JOIN departments d ON v.department_id = d.id
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
    LEFT JOIN faculties f ON v.faculty_id = f.id
    LEFT JOIN departments d ON v.department_id = d.id
    WHERE v.id = ?
  `;

  db.query(sql, [id], callback);
};

// CREATE VENUE
exports.create = (venue, callback) => {
  const sql = `
    INSERT INTO venues (
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
    venue.status || "Available"
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
    id
  ];

  db.query(sql, values, callback);
};

// DELETE VENUE
exports.delete = (id, callback) => {
  const referenceSql = `
    SELECT
      TABLE_NAME,
      COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
      AND REFERENCED_TABLE_NAME = 'venues'
      AND REFERENCED_COLUMN_NAME = 'id'
  `;

  db.query(referenceSql, (err, references) => {
    if (err) return callback(err);

    let index = 0;

    const checkNext = () => {
      if (index >= references.length) {
        return db.query(
          "DELETE FROM venues WHERE id = ?",
          [id],
          callback
        );
      }

      const ref = references[index++];

      const table = String(ref.TABLE_NAME)
        .replace(/`/g, "``");

      const column = String(ref.COLUMN_NAME)
        .replace(/`/g, "``");

      const checkSql = `
        SELECT COUNT(*) AS total
        FROM \`${table}\`
        WHERE \`${column}\` = ?
      `;

      db.query(checkSql, [id], (checkError, rows) => {
        if (checkError) {
          return callback(checkError);
        }

        const count = Number(rows[0].total);

        if (count > 0) {
          const error = new Error(
            "Venue is referenced by another database table."
          );

          error.code = "VENUE_REFERENCED";
          error.table = ref.TABLE_NAME;
          error.column = ref.COLUMN_NAME;
          error.count = count;

          return callback(error);
        }

        checkNext();
      });
    };

    checkNext();
  });
};
