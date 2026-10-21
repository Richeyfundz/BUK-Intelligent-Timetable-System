
const jwt = require("jsonwebtoken");
const db = require("../config/database");

exports.authenticateToken = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (tokenError, decoded) => {
    if (tokenError || !decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid or expired. Please log in again.",
      });
    }

    const sql = `
      SELECT id, username, role, status
      FROM users
      WHERE id = ?
      LIMIT 1
    `;

    db.query(sql, [decoded.id], (dbError, results) => {
      if (dbError) {
        console.error("Authentication database check failed.");

        return res.status(500).json({
          success: false,
          message: "Unable to verify your account.",
        });
      }

      if (!results || results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Account not found. Please log in again.",
        });
      }

      const user = results[0];

      if (
        typeof user.status !== "string" ||
        user.status.toLowerCase() !== "active"
      ) {
        return res.status(403).json({
          success: false,
          message: "Your account is inactive.",
        });
      }

      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      next();
    });
  });
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Administrator permission is required.",
    });
  }

  next();
};
