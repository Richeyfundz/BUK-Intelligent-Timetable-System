const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    console.log("User Found:", results);

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);

    console.log("Password Match:", match);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  });
};
