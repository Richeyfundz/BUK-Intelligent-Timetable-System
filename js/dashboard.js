js;
// ======================================
// BUK Intelligent Timetable Management System
// Dashboard
// Railway + MySQL API Version
// ======================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

// ======================================
// PAGE LOAD
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

  const currentDate = document.getElementById("currentDate");
  const todayDate = document.getElementById("todayDate");

  if (currentDate) {
    currentDate.innerHTML = today.toLocaleDateString("en-GB", options);
  }

  if (todayDate) {
    todayDate.innerHTML = today.toLocaleDateString("en-GB");
  }

  // ===============================
  // Dashboard Statistics
  // ===============================

  loadStatistics();

  // ===============================
  // Logout
  // ===============================

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// ======================================
// Load Statistics From Backend
// ======================================

async function loadStatistics() {
  try {
    const endpoints = [
      "faculties",
      "departments",
      "courses",
      "lecturers",
      "students",
      "venues",
    ];

    const responses = await Promise.all(
      endpoints.map(function (endpoint) {
        return fetch(`${API_BASE_URL}/${endpoint}`);
      }),
    );

    const results = await Promise.all(
      responses.map(async function (response) {
        if (!response.ok) {
          throw new Error("Failed to load dashboard data.");
        }

        return await response.json();
      }),
    );

    const faculties = getDataArray(results[0]);
    const departments = getDataArray(results[1]);
    const courses = getDataArray(results[2]);
    const lecturers = getDataArray(results[3]);
    const students = getDataArray(results[4]);
    const venues = getDataArray(results[5]);

    // ===============================
    // Update Counters
    // ===============================

    setCount("facultyCount", faculties.length);
    setCount("departmentCount", departments.length);
    setCount("courseCount", courses.length);
    setCount("lecturerCount", lecturers.length);
    setCount("studentCount", students.length);
    setCount("venueCount", venues.length);
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    setCount("facultyCount", 0);
    setCount("departmentCount", 0);
    setCount("courseCount", 0);
    setCount("lecturerCount", 0);
    setCount("studentCount", 0);
    setCount("venueCount", 0);
  }
}

// ======================================
// Get Data Array
// ======================================

function getDataArray(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (result && Array.isArray(result.data)) {
    return result.data;
  }

  if (result && result.data && Array.isArray(result.data.data)) {
    return result.data.data;
  }

  return [];
}

// ======================================
// Set Counter
// ======================================

function setCount(elementId, value) {
  const element = document.getElementById(elementId);

  if (element) {
    element.innerHTML = value;
  }
}

// ======================================
// Logout
// ======================================

function logout(e) {
  e.preventDefault();

  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("username");

    window.location.href = "../index.html";
  }
}
