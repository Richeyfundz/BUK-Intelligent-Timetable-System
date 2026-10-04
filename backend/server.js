const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Database
require("./config/database");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");
const studentRoutes = require("./routes/studentRoutes");
const venueRoutes = require("./routes/venueRoutes");
const examTimetableRoutes = require("./routes/exam-timetableRoutes");
const courseLecturerRoutes = require("./routes/courseLecturerRoutes");
const aiTimetableRoutes = require("./routes/aiTimetableRoutes");
const userRoutes = require("./routes/userRoutes");
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
// Test Route
app.get("/", (req, res) => {
  res.send("BUK Intelligent Timetable Management System Backend Running...");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
