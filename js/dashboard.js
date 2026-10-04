// ======================================
// BUK Intelligent Timetable Management System
// Dashboard - Railway API Version
// ======================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

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
    todayDate.innerHTML = today.toLocaleDateString();
  }

  // ===============================
  // Load Dashboard Statistics
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
// Load Statistics From Railway API
// ======================================

async function loadStatistics() {
  try {
    const [
      facultiesResponse,
      departmentsResponse,
      coursesResponse,
      lecturersResponse,
      studentsResponse,
      venuesResponse,
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/faculties`),
      fetch(`${API_BASE_URL}/departments`),
      fetch(`${API_BASE_URL}/courses`),
      fetch(`${API_BASE_URL}/lecturers`),
      fetch(`${API_BASE_URL}/students`),
      fetch(`${API_BASE_URL}/venues`),
    ]);

    // Check for API errors
    if (
      !facultiesResponse.ok ||
      !departmentsResponse.ok ||
      !coursesResponse.ok ||
      !lecturersResponse.ok ||
      !studentsResponse.ok ||
      !venuesResponse.ok
    ) {
      throw new Error("Failed to load dashboard data.");
    }

    const facultiesData = await facultiesResponse.json();
    const departmentsData = await departmentsResponse.json();
    const coursesData = await coursesResponse.json();
    const lecturersData = await lecturersResponse.json();
    const studentsData = await studentsResponse.json();
    const venuesData = await venuesResponse.json();

    // ===============================
    // Get Data Arrays
    // ===============================

    const faculties = getDataArray(facultiesData);
    const departments = getDataArray(departmentsData);
    const courses = getDataArray(coursesData);
    const lecturers = getDataArray(lecturersData);
    const students = getDataArray(studentsData);
    const venues = getDataArray(venuesData);

    // ===============================
    // Update Dashboard
    // ===============================

    const facultyCount = document.getElementById("facultyCount");
    const departmentCount = document.getElementById("departmentCount");
    const courseCount = document.getElementById("courseCount");
    const lecturerCount = document.getElementById("lecturerCount");
    const studentCount = document.getElementById("studentCount");
    const venueCount = document.getElementById("venueCount");

    if (facultyCount) {
      facultyCount.innerHTML = faculties.length;
    }

    if (departmentCount) {
      departmentCount.innerHTML = departments.length;
    }

    if (courseCount) {
      courseCount.innerHTML = courses.length;
    }

    if (lecturerCount) {
      lecturerCount.innerHTML = lecturers.length;
    }

    if (studentCount) {
      studentCount.innerHTML = students.length;
    }

    if (venueCount) {
      venueCount.innerHTML = venues.length;
    }
  } catch (error) {
    console.error("Dashboard loading error:", error);

    // Show zero instead of breaking the dashboard
    const counters = [
      "facultyCount",
      "departmentCount",
      "courseCount",
      "lecturerCount",
      "studentCount",
      "venueCount",
    ];

    counters.forEach((id) => {
      const element = document.getElementById(id);

      if (element) {
        element.innerHTML = "0";
      }
    });
  }
}

// ======================================
// Handle Different API Response Formats
// ======================================

function getDataArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

// ======================================
// Logout
// ======================================

function logout(e) {
  e.preventDefault();

  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "../index.html";
  }
}
