exports.assignCourses = (lecturerId, courseIds, callback) => {
  db.getConnection((err, connection) => {
    if (err) return callback(err);

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return callback(err);
      }

      const rollback = (error) => {
        connection.rollback(() => {
          connection.release();
          callback(error);
        });
      };

      connection.query(
        "DELETE FROM course_lecturers WHERE lecturer_id = ?",
        [lecturerId],
        (err) => {
          if (err) return rollback(err);

          if (courseIds.length === 0) {
            return connection.commit((err) => {
              if (err) return rollback(err);
              connection.release();
              callback(null, { success: true });
            });
          }

          const values = courseIds.map(id => [
            Number(id),
            Number(lecturerId)
          ]);

          connection.query(
            `INSERT INTO course_lecturers
             (course_id, lecturer_id) VALUES ?`,
            [values],
            (err) => {
              if (err) return rollback(err);

              connection.commit((err) => {
                if (err) return rollback(err);
                connection.release();
                callback(null, { success: true });
              });
            }
          );
        }
      );
    });
  });
};
