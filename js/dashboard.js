// ======================================
// BUK Intelligent Timetable Management System
// Dashboard
// ======================================

document.addEventListener("DOMContentLoaded", function () {
  // ===============================
  // Login Check
  // ===============================

  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "../index.html";

    return;
  }

  // ===============================
  // Current Date
  // ===============================

  const today = new Date();

  const options = {
    weekday: "long",

    year: "numeric",

    month: "long",

    day: "numeric",
  };

  document.getElementById("currentDate").innerHTML = today.toLocaleDateString(
    "en-GB",
    options,
  );

  document.getElementById("todayDate").innerHTML = today.toLocaleDateString();

  // ===============================
  // Dashboard Statistics
  // ===============================

  loadStatistics();

  // ===============================
  // Logout
  // ===============================

  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// ======================================
// Load Statistics
// ======================================

function loadStatistics() {
  const faculties = JSON.parse(localStorage.getItem("faculties")) || [];

  const departments = JSON.parse(localStorage.getItem("departments")) || [];

  const courses = JSON.parse(localStorage.getItem("courses")) || [];

  const lecturers = JSON.parse(localStorage.getItem("lecturers")) || [];

  const students = JSON.parse(localStorage.getItem("students")) || [];

  const venues = JSON.parse(localStorage.getItem("venues")) || [];

  document.getElementById("facultyCount").innerHTML = faculties.length;

  document.getElementById("departmentCount").innerHTML = departments.length;

  document.getElementById("courseCount").innerHTML = courses.length;

  document.getElementById("lecturerCount").innerHTML = lecturers.length;

  document.getElementById("studentCount").innerHTML = students.length;

  document.getElementById("venueCount").innerHTML = venues.length;
}

// ======================================
// Logout
// ======================================

function logout(e) {
  e.preventDefault();

  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("loggedIn");

    localStorage.removeItem("username");

    window.location.href = "../index.html";
  }
}
