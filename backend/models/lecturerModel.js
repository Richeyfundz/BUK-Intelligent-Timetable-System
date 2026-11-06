
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

// GET ASSIGNED COURSES
exports.getAssignedCourses = (lecturerId, callback) => {
  const sql = `
    SELECT course_id
    FROM course_lecturers
    WHERE lecturer_id = ?
  `;

  db.query(sql, [lecturerId], callback);
};

// SAVE COURSE ASSIGNMENTS
exports.assignCourses = (lecturerId, courseIds, callback) => {
  db.getConnection((connectionError, connection) => {
    if (connectionError) {
      return callback(connectionError);
    }

    connection.beginTransaction((transactionError) => {
      if (transactionError) {
        connection.release();
        return callback(transactionError);
      }

      connection.query(
        "DELETE FROM course_lecturers WHERE lecturer_id = ?",
        [lecturerId],
        (deleteError) => {
          if (deleteError) {
            return connection.rollback(() => {
              connection.release();
              callback(deleteError);
            });
          }

          if (!courseIds.length) {
            return connection.commit((commitError) => {
              if (commitError) {
                return connection.rollback(() => {
                  connection.release();
                  callback(commitError);
                });
              }

              connection.release();
              callback(null);
            });
          }

          const values = courseIds.map((courseId) => [
            courseId,
            lecturerId,
          ]);

          connection.query(
            `INSERT INTO course_lecturers
             (course_id, lecturer_id)
             VALUES ?`,
            [values],
            (insertError) => {
              if (insertError) {
                return connection.rollback(() => {
                  connection.release();
                  callback(insertError);
                });
              }

              connection.commit((commitError) => {
                if (commitError) {
                  return connection.rollback(() => {
                    connection.release();
                    callback(commitError);
                  });
                }

                connection.release();
                callback(null);
              });
            }
          );
        }
      );
    });
  });
};

// DELETE LECTURER
exports.delete = (id, callback) => {
  db.getConnection((connectionError, connection) => {
    if (connectionError) {
      return callback(connectionError);
    }

    connection.beginTransaction((transactionError) => {
      if (transactionError) {
        connection.release();
        return callback(transactionError);
      }

      // Remove course assignments first.
      connection.query(
        `DELETE FROM course_lecturers
         WHERE lecturer_id = ?`,
        [id],
        (assignmentError) => {
          if (assignmentError) {
            return connection.rollback(() => {
              connection.release();
              callback(assignmentError);
            });
          }

          // Delete the lecturer.
          // Saved timetable records are NOT deleted.
          connection.query(
            "DELETE FROM lecturers WHERE id = ?",
            [id],
            (deleteError, result) => {
              if (deleteError) {
                return connection.rollback(() => {
                  connection.release();
                  callback(deleteError);
                });
              }

              if (!result.affectedRows) {
                return connection.rollback(() => {
                  connection.release();
                  callback(null, result);
                });
              }

              connection.commit((commitError) => {
                if (commitError) {
                  return connection.rollback(() => {
                    connection.release();
                    callback(commitError);
                  });
                }

                connection.release();
                callback(null, result);
              });
            }
          );
        }
      );
    });
  });
};
