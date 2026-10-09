const db = require("../config/database");

// GET ALL LECTURERS
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

// GET LECTURER BY ID
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

// CREATE LECTURER
exports.create = (lecturer, callback) => {
  const sql = `
    INSERT INTO lecturers (
      department_id,
      staff_id,
      first_name,
      last_name,
      email
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    lecturer.department_id,
    lecturer.staff_id,
    lecturer.first_name,
    lecturer.last_name,
    lecturer.email,
  ];

  db.query(sql, values, callback);
};

// UPDATE LECTURER
exports.update = (id, lecturer, callback) => {
  const sql = `
    UPDATE lecturers
    SET
      department_id = ?,
      staff_id = ?,
      first_name = ?,
      last_name = ?,
      email = ?
    WHERE id = ?
  `;

  const values = [
    lecturer.department_id,
    lecturer.staff_id,
    lecturer.first_name,
    lecturer.last_name,
    lecturer.email,
    id,
  ];

  db.query(sql, values, callback);
};

// GET ASSIGNED COURSES
exports.getAssignedCourses = (
  lecturerId,
  callback
) => {
  const sql = `
    SELECT course_id
    FROM course_lecturers
    WHERE lecturer_id = ?
  `;

  db.query(sql, [lecturerId], callback);
};

// SAVE COURSE ASSIGNMENTS
exports.assignCourses = (
  lecturerId,
  courseIds,
  callback
) => {
  db.beginTransaction((err) => {
    if (err) return callback(err);

    const rollback = (error) => {
      db.rollback(() => callback(error));
    };

    db.query(
      `DELETE FROM course_lecturers
       WHERE lecturer_id = ?`,
      [lecturerId],
      (deleteErr) => {
        if (deleteErr) {
          return rollback(deleteErr);
        }

        if (courseIds.length === 0) {
          return db.commit((commitErr) => {
            if (commitErr) {
              return rollback(commitErr);
            }

            callback(null, { success: true });
          });
        }

        const values = courseIds.map((courseId) => [
          Number(courseId),
          Number(lecturerId),
        ]);

        const sql = `
          INSERT INTO course_lecturers (
            course_id,
            lecturer_id
          )
          VALUES ?
        `;

        db.query(sql, [values], (insertErr) => {
          if (insertErr) {
            return rollback(insertErr);
          }

          db.commit((commitErr) => {
            if (commitErr) {
              return rollback(commitErr);
            }

            callback(null, { success: true });
          });
        });
      }
    );
  });
};

// DELETE LECTURER
exports.delete = (id, callback) => {
  const sql = `
    DELETE FROM lecturers
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};
