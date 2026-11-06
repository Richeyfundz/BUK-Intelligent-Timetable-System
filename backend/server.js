
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Database connection
require("./config/database");
const setupDatabase = require("./setupDatabase");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Existing routes
const authRoutes = require("./routes/authRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");
const studentRoutes = require("./routes/studentRoutes");
const venueRoutes = require("./routes/venueRoutes");
const examTimetableRoutes =
  require("./routes/exam-timetableRoutes");
const courseLecturerRoutes =
  require("./routes/courseLecturerRoutes");
const aiTimetableRoutes =
  require("./routes/aiTimetableRoutes");
const userRoutes = require("./routes/userRoutes");
const timetableRoutes =
  require("./routes/timetableRoutes");

// Register API endpoints
app.use("/api/auth", authRoutes);
app.use("/api/faculties", facultyRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/exam-timetables", examTimetableRoutes);
app.use("/api/course-lecturers", courseLecturerRoutes);
app.use("/api/ai-timetables", aiTimetableRoutes);
app.use("/api/users", userRoutes);
app.use("/api/timetables", timetableRoutes);

// Browser database setup page
app.get("/setup", (req, res) => {
  res.type("html").send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>BUK-ITMS Database Setup</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f5f7fb;
          padding: 20px;
        }
        main {
          max-width: 420px;
          margin: 40px auto;
          background: white;
          padding: 24px;
          border-radius: 12px;
        }
        input, button {
          width: 100%;
          box-sizing: border-box;
          padding: 14px;
          margin-top: 12px;
          font-size: 16px;
        }
        button {
          background: #0056a6;
          color: white;
          border: 0;
          border-radius: 6px;
        }
        pre {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
      </style>
    </head>
    <body>
      <main>
        <h2>BUK-ITMS Database Setup</h2>
        <p>Enter your Render DB_SETUP_KEY.</p>

        <input
          id="key"
          type="password"
          placeholder="Enter setup key"
          autocomplete="off"
        >

        <button id="run">Create Database</button>
        <pre id="result"></pre>
      </main>

      <script>
        document.getElementById("run").addEventListener("click", async () => {
          const key = document.getElementById("key").value;
          const result = document.getElementById("result");

          if (!key) {
            result.textContent = "Please enter your setup key.";
            return;
          }

          result.textContent = "Creating database tables...";

          try {
            const response = await fetch("/api/setup-database", {
              method: "POST",
              headers: {
                "x-setup-key": key
              }
            });

            const data = await response.json();
            result.textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            result.textContent =
              "Connection failed. Please check the backend.";
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Protected database setup API
app.post("/api/setup-database", async (req, res) => {
  if (
    !process.env.DB_SETUP_KEY ||
    req.get("x-setup-key") !== process.env.DB_SETUP_KEY
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  try {
    const result = await setupDatabase();
    res.json(result);
  } catch (error) {
    console.error("Database setup failed:", error);

    res.status(500).json({
      success: false,
      message: "Database setup failed.",
      error: error.message
    });
  }
});

// Backend test route
app.get("/", (req, res) => {
  res.send(
    "BUK Intelligent Timetable Management System Backend Running..."
  );
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
