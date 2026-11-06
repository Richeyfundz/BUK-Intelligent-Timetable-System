
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Database connection
const db = require("./config/database");
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
// ======================================
// BULK DEMO DATA IMPORT
// ======================================

// Import page
app.get("/seed", (req, res) => {
  res.send(`
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>BUK-ITMS Bulk Import</title>
    </head>
    <body style="font-family:Arial;padding:25px;max-width:500px;margin:auto">
      <h2>BUK-ITMS Bulk Import</h2>
      <p>Enter your database setup key to import demo records.</p>
      <input id="key" type="password" placeholder="Setup key"
        style="width:100%;padding:12px;box-sizing:border-box">
      <button onclick="runImport()"
        style="padding:14px;margin-top:12px;width:100%">
        IMPORT DEMO DATA
      </button>
      <pre id="result" style="white-space:pre-wrap"></pre>
      <script>
        async function runImport() {
          const key = document.getElementById("key").value;
          const result = document.getElementById("result");
          result.textContent = "Importing...";
          try {
            const response = await fetch("/api/seed-initial-data", {
              method: "POST",
              headers: { "x-setup-key": key }
            });
            const data = await response.json();
            result.textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            result.textContent = "Import failed. Please try again.";
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Protected bulk import API
app.post("/api/seed-initial-data", async (req, res) => {
  if (
    !process.env.DB_SETUP_KEY ||
    req.get("x-setup-key") !== process.env.DB_SETUP_KEY
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  let connection;

  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // Faculty
    let [rows] = await connection.query(
      "SELECT id FROM faculties WHERE faculty_code = ?",
      ["FCOM"]
    );

    let facultyId;

    if (rows.length) {
      facultyId = rows[0].id;
    } else {
      const [result] = await connection.query(
        `INSERT INTO faculties
        (faculty_name, faculty_code)
        VALUES (?, ?)`,
        ["Faculty of Computing", "FCOM"]
      );
      facultyId = result.insertId;
    }

    // Four departments
    const departments = [
      ["Computer Science", "CSC"],
      ["Information Technology", "IT"],
      ["Cyber Security", "CYB"],
      ["Software Engineering", "SWE"]
    ];

    const departmentIds = [];

    for (const department of departments) {
      const [found] = await connection.query(
        `SELECT id FROM departments
         WHERE faculty_id = ? AND department_name = ?`,
        [facultyId, department[0]]
      );

      let departmentId;

      if (found.length) {
        departmentId = found[0].id;
      } else {
        const [result] = await connection.query(
          `INSERT INTO departments
          (faculty_id, department_name, department_code)
          VALUES (?, ?, ?)`,
          [facultyId, department[0], department[1]]
        );
        departmentId = result.insertId;
      }

      departmentIds.push({
        id: departmentId,
        name: department[0],
        code: department[1]
      });
    }

    let courseCount = 0;
    let lecturerCount = 0;
    let studentCount = 0;
    let venueCount = 0;
    let assignmentCount = 0;

    // Demo lecturers, courses and students
    for (const department of departmentIds) {
      const lecturerIds = [];

      for (let i = 1; i <= 2; i++) {
        const staffId = `DEMO-${department.code}-${i}`;

        let [found] = await connection.query(
          "SELECT id FROM lecturers WHERE staff_id = ?",
          [staffId]
        );

        let lecturerId;

        if (found.length) {
          lecturerId = found[0].id;
        } else {
          const [result] = await connection.query(
            `INSERT INTO lecturers
            (department_id, staff_id, first_name, last_name, email)
            VALUES (?, ?, ?, ?, ?)`,
            [
              department.id,
              staffId,
              "Demo",
              `Lecturer${i}`,
              `${staffId.toLowerCase()}@example.com`
            ]
          );
          lecturerId = result.insertId;
          lecturerCount++;
        }

        lecturerIds.push(lecturerId);
      }

      // Two demo students per department
      for (let i = 1; i <= 2; i++) {
        const matricNo = `DEMO-${department.code}-STU-${i}`;

        const [found] = await connection.query(
          "SELECT id FROM students WHERE matric_no = ?",
          [matricNo]
        );

        if (!found.length) {
          await connection.query(
            `INSERT INTO students
            (department_id, matric_no, first_name, last_name,
             gender, level, email)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              department.id,
              matricNo,
              "Demo",
              `Student${i}`,
              "Other",
              "100",
              `${matricNo.toLowerCase()}@example.com`
            ]
          );
          studentCount++;
        }
      }

      // Demo courses: four levels, two semesters
      for (const level of ["100", "200", "300", "400"]) {
        for (const semester of ["First", "Second"]) {
          const semesterCode = semester === "First" ? "F" : "S";
          const courseCode =
            `DEMO-${department.code}-${level}-${semesterCode}`;

          const [found] = await connection.query(
            "SELECT id FROM courses WHERE course_code = ?",
            [courseCode]
          );

          let courseId;

          if (found.length) {
            courseId = found[0].id;
          } else {
            const [result] = await connection.query(
              `INSERT INTO courses
              (department_id, course_code, course_title,
               course_unit, level, semester)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                department.id,
                courseCode,
                `DEMO - ${department.name} ${level} Level ${semester} Semester`,
                3,
                level,
                semester
              ]
            );
            courseId = result.insertId;
            courseCount++;
          }

          // Assign each demo course to a demo lecturer
          const lecturerId =
            lecturerIds[Number(level) / 100 % 2];

          const [assignment] = await connection.query(
            `SELECT id FROM course_lecturers
             WHERE course_id = ? AND lecturer_id = ?`,
            [courseId, lecturerId]
          );

          if (!assignment.length) {
            await connection.query(
              `INSERT INTO course_lecturers
              (course_id, lecturer_id)
              VALUES (?, ?)`,
              [courseId, lecturerId]
            );
            assignmentCount++;
          }
        }
      }
    }

    // Four demo venues
    const venues = [
      ["Demo Lecture Hall 1", "DEMO-VEN-01", "Lecture Hall", 200],
      ["Demo Lecture Hall 2", "DEMO-VEN-02", "Lecture Hall", 150],
      ["Demo Computer Lab 1", "DEMO-VEN-03", "Laboratory", 60],
      ["Demo Computer Lab 2", "DEMO-VEN-04", "Laboratory", 60]
    ];

    for (const venue of venues) {
      const [found] = await connection.query(
        "SELECT id FROM venues WHERE venue_code = ?",
        [venue[1]]
      );

      if (!found.length) {
        await connection.query(
          `INSERT INTO venues
          (venue_name, venue_code, venue_type, capacity,
           faculty_id, status)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            venue[0], venue[1], venue[2],
            venue[3], facultyId, "Available"
          ]
        );
        venueCount++;
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Bulk demo data imported successfully.",
      faculty: 1,
      departments: departmentIds.length,
      courses: courseCount,
      lecturers: lecturerCount,
      students: studentCount,
      venues: venueCount,
      courseLecturerAssignments: assignmentCount,
      note: "All DEMO records are test data. No timetable or exam records were fabricated."
    });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Bulk import error:", error);

    res.status(500).json({
      success: false,
      message: "Bulk import failed. Check the server logs."
    });

  } finally {
    if (connection) connection.release();
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
