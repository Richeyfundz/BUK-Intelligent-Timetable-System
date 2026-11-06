
const db = require("../config/database");

// GET ALL LECTURERS
exports.getAll = (callback) => {
  const sql = `
    SELECT l.*, d.department_name
    FROM lecturers l
    LEFT JOIN departments d
      ON l.department_id = d.id
    ORDER BY l.id DESC
  `;

  db.query(sql, callback);
};

// GET ONE LECTURER
exports.getById = (id, callback) => {
  db.query(
    "SELECT * FROM lecturers WHERE id = ?",
    [id],
    callback
  );
};

// CREATE LECTURER
exports.create = (data, callback) => {
  db.query(
    "INSERT INTO lecturers SET ?",
    [data],
    callback
  );
};

// UPDATE LECTURER
exports.update = (id, data, callback) => {
  db.query(
    "UPDATE lecturers SET ? WHERE id = ?",
    [data, id],
    callback
  );
};

// DELETE LECTURER SAFELY
exports.delete = (id, callback) => {
  db.beginTransaction((transactionError) => {
    if (transactionError) {
      return callback(transactionError);
    }

    db.query(
      "DELETE FROM course_lecturers WHERE lecturer_id = ?",
      [id],
      (assignmentError) => {
        if (assignmentError) {
          return db.rollback(() => {
            callback(assignmentError);
          });
        }

        db.query(
          "DELETE FROM lecturers WHERE id = ?",
          [id],
          (deleteError, result) => {
            if (deleteError) {
              return db.rollback(() => {
                callback(deleteError);
              });
            }

            if (!result.affectedRows) {
              return db.rollback(() => {
                callback(null, result);
              });
            }

            db.commit((commitError) => {
              if (commitError) {
                return db.rollback(() => {
                  callback(commitError);
                });
              }

              callback(null, result);
            });
          }
        );
      }
    );
  });
};
