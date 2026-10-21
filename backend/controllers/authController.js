
const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("Login configuration error: JWT_SECRET is missing.");

    return res.status(500).json({
      success: false,
      message: "Login service is temporarily unavailable.",
    });
  }

  const sql = `
    SELECT id, username, password, role, status
    FROM users
    WHERE username = ?
    LIMIT 1
  `;

  db.query(sql, [username.trim()], async (err, results) => {
    if (err) {
      console.error("Login database query failed.");

      return res.status(500).json({
        success: false,
        message: "Unable to process login at this time.",
      });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password.",
        });
      }

      if (
        typeof user.status !== "string" ||
        user.status.toLowerCase() !== "active"
      ) {
        return res.status(403).json({
          success: false,
          message: "This account is inactive. Contact an administrator.",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login password verification or token generation failed.");

      return res.status(500).json({
        success: false,
        message: "Unable to process login at this time.",
      });
    }
  });
};
