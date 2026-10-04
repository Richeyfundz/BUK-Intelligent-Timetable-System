const db = require("../config/database");
const bcrypt = require("bcryptjs");

// =====================================================
// GET ALL USERS
// =====================================================

exports.getUsers = (req, res) => {
  const sql = `
    SELECT id, username, full_name, email, role, status
    FROM users
    ORDER BY id ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get users error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load users.",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// =====================================================
// CREATE NEW USER
// =====================================================

exports.createUser = async (req, res) => {
  const { username, full_name, email, password, role, status } = req.body;

  if (!username || !full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username, full name, email and password are required.",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users
      (
        username,
        full_name,
        email,
        password,
        role,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      username.trim(),
      full_name.trim(),
      email.trim(),
      hashedPassword,
      role || "Admin",
      status || "Active",
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Create user error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Username or email already exists.",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to create user.",
        });
      }

      res.status(201).json({
        success: true,
        message: "User created successfully.",
        data: {
          id: result.insertId,
          username,
          full_name,
          email,
          role: role || "Admin",
          status: status || "Active",
        },
      });
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create user.",
    });
  }
};

// =====================================================
// UPDATE USER
// =====================================================

exports.updateUser = async (req, res) => {
  const { id, username, full_name, email, password, role, status } = req.body;

  if (!id || !username || !full_name || !email) {
    return res.status(400).json({
      success: false,
      message: "id, username, full_name and email are required.",
    });
  }

  try {
    let sql;
    let values;

    // Password supplied
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);

      sql = `
        UPDATE users
        SET
          username = ?,
          full_name = ?,
          email = ?,
          password = ?,
          role = ?,
          status = ?
        WHERE id = ?
      `;

      values = [
        username.trim(),
        full_name.trim(),
        email.trim(),
        hashedPassword,
        role || "Admin",
        status || "Active",
        id,
      ];
    } else {
      // Keep existing password
      sql = `
        UPDATE users
        SET
          username = ?,
          full_name = ?,
          email = ?,
          role = ?,
          status = ?
        WHERE id = ?
      `;

      values = [
        username.trim(),
        full_name.trim(),
        email.trim(),
        role || "Admin",
        status || "Active",
        id,
      ];
    }

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Update user error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Username or email already exists.",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to update user.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      res.json({
        success: true,
        message: "User updated successfully.",
      });
    });
  } catch (error) {
    console.error("Password hashing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user.",
    });
  }
};

// =====================================================
// DELETE USER
// =====================================================

exports.deleteUser = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required.",
    });
  }

  const sql = `
    DELETE FROM users
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Delete user error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete user.",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully.",
    });
  });
};

// =====================================================
// ACTIVATE / DEACTIVATE USER
// =====================================================

exports.toggleUserStatus = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required.",
    });
  }

  const getSql = `
    SELECT status
    FROM users
    WHERE id = ?
  `;

  db.query(getSql, [id], (err, results) => {
    if (err) {
      console.error("Get user status error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to get user status.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const currentStatus = results[0].status;

    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    const updateSql = `
      UPDATE users
      SET status = ?
      WHERE id = ?
    `;

    db.query(updateSql, [newStatus, id], (updateErr, result) => {
      if (updateErr) {
        console.error("Update user status error:", updateErr);

        return res.status(500).json({
          success: false,
          message: "Failed to change user status.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      res.json({
        success: true,
        message:
          newStatus === "Active"
            ? "User activated successfully."
            : "User deactivated successfully.",
        status: newStatus,
      });
    });
  });
};
