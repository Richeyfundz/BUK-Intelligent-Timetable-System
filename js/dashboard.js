
 // ======================================
 // BUK Intelligent Timetable Management System
 // Dashboard - Railway API Version
 // ======================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

document.addEventListener("DOMContentLoaded", function () {
  // Login Check
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "../index.html";
    return;
  }

  // Current Date
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
    currentDate.textContent =
      today.toLocaleDateString("en-GB", options);
  }

  if (todayDate) {
    todayDate.textContent = today.toLocaleDateString();
  }

  // Load Dashboard Statistics
  loadStatistics();

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// ======================================
// Load Statistics From Railway API
// ======================================

async function loadStatistics() {
  const token = localStorage.getItem("token");

  if (!token) {
    clearSession();
    window.location.href = "../index.html";
    return;
  }

  const requestOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const [
      facultiesResponse,
      departmentsResponse,
      coursesResponse,
      lecturersResponse,
      studentsResponse,
      venuesResponse,
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/faculties`, requestOptions),
      fetch(`${API_BASE_URL}/departments`, requestOptions),
      fetch(`${API_BASE_URL}/courses`, requestOptions),
      fetch(`${API_BASE_URL}/lecturers`, requestOptions),
      fetch(`${API_BASE_URL}/students`, requestOptions),
      fetch(`${API_BASE_URL}/venues`, requestOptions),
    ]);

    // Handle expired or invalid sessions
    const responses = [
      facultiesResponse,
      departmentsResponse,
      coursesResponse,
      lecturersResponse,
      studentsResponse,
      venuesResponse,
    ];

    if (responses.some((response) => response.status === 401)) {
      clearSession();
      window.location.href = "../index.html";
      return;
    }

    if (responses.some((response) => response.status === 403)) {
      throw new Error(
        "Access denied. Check your account status and permissions."
      );
    }

    if (responses.some((response) => !response.ok)) {
      throw new Error("Failed to load dashboard data.");
    }

    const [
      facultiesData,
      departmentsData,
      coursesData,
      lecturersData,
      studentsData,
      venuesData,
    ] = await Promise.all(
      responses.map((response) => response.json())
    );

    // Get Data Arrays
    const faculties = getDataArray(facultiesData);
    const departments = getDataArray(departmentsData);
    const courses = getDataArray(coursesData);
    const lecturers = getDataArray(lecturersData);
    const students = getDataArray(studentsData);
    const venues = getDataArray(venuesData);

    // Update Dashboard
    updateCount("facultyCount", faculties.length);
    updateCount("departmentCount", departments.length);
    updateCount("courseCount", courses.length);
    updateCount("lecturerCount", lecturers.length);
    updateCount("studentCount", students.length);
    updateCount("venueCount", venues.length);
  } catch (error) {
    console.error("Dashboard loading error:", error);

    // Show an error instead of misleading zero statistics
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
        element.textContent = "—";
      }
    });
  }
}

// ======================================
// Update Dashboard Counter
// ======================================

function updateCount(id, count) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = count;
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
// Clear Login Session
// ======================================

function clearSession() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ======================================
// Logout
// ======================================

function logout(e) {
  if (e && typeof e.preventDefault === "function") {
    e.preventDefault();
  }

  if (confirm("Are you sure you want to logout?")) {
    clearSession();
    window.location.href = "../index.html";
  }
}
