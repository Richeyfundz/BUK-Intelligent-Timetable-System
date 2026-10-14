
// =============================================
// BUK Intelligent Timetable Management System
// Reports Module - Railway MySQL API Version
// =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const COURSES_API_URL = `${API_BASE_URL}/courses`;
const LECTURERS_API_URL = `${API_BASE_URL}/lecturers`;
const STUDENTS_API_URL = `${API_BASE_URL}/students`;
const VENUES_API_URL = `${API_BASE_URL}/venues`;
const TIMETABLE_API_URL = `${API_BASE_URL}/timetables`;

document.addEventListener("DOMContentLoaded", function () {
  // =============================================
  // Login Check
  // =============================================

  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "../index.html";
    return;
  }

  // =============================================
  // Current Date
  // =============================================

  const currentDate = document.getElementById("currentDate");

  if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // =============================================
  // Load Report Data
  // =============================================

  loadStatistics();

  loadTimetableReport();

  // =============================================
  // Logout
  // =============================================

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// =============================================
// Load Statistics
// =============================================

async function loadStatistics() {
  try {
    const [
      coursesResponse,
      lecturersResponse,
      studentsResponse,
      venuesResponse,
    ] = await Promise.all([
      fetch(COURSES_API_URL),
      fetch(LECTURERS_API_URL),
      fetch(STUDENTS_API_URL),
      fetch(VENUES_API_URL),
    ]);

    const coursesResult = await coursesResponse.json();
    const lecturersResult = await lecturersResponse.json();
    const studentsResult = await studentsResponse.json();
    const venuesResult = await venuesResponse.json();

    const courses = getDataArray(coursesResult);
    const lecturers = getDataArray(lecturersResult);
    const students = getDataArray(studentsResult);
    const venues = getDataArray(venuesResult);

    const reportCourses = document.getElementById("reportCourses");
    const reportLecturers = document.getElementById("reportLecturers");
    const reportStudents = document.getElementById("reportStudents");
    const reportVenues = document.getElementById("reportVenues");

    if (reportCourses) {
      reportCourses.innerHTML = courses.length;
    }

    if (reportLecturers) {
      reportLecturers.innerHTML = lecturers.length;
    }

    if (reportStudents) {
      reportStudents.innerHTML = students.length;
    }

    if (reportVenues) {
      reportVenues.innerHTML = venues.length;
    }
  } catch (error) {
    console.error("Report Statistics Error:", error);

    setReportCount("reportCourses", 0);
    setReportCount("reportLecturers", 0);
    setReportCount("reportStudents", 0);
    setReportCount("reportVenues", 0);
  }
}

// =============================================
// Load Timetable Report
// =============================================

async function loadTimetableReport() {
  const table = document.getElementById("reportTable");

  if (!table) {
    console.error("Report table not found.");
    return;
  }

  try {
    const response = await fetch(TIMETABLE_API_URL);

    const result = await response.json();

    console.log("Timetable Report API Response:", result);

    const timetable = getDataArray(result);

    table.innerHTML = "";

    if (timetable.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            No timetable records found.
          </td>
        </tr>
      `;

      return;
    }

    timetable.forEach(function (item) {
      const row = document.createElement("tr");

      const course =
        item.course_code || item.course || item.course_title || "N/A";

      const lecturer =
        item.lecturer_name || item.lecturer || item.lecturerName || "N/A";

      const venue = item.venue_name || item.venue || "N/A";

      const day = item.day || "N/A";

      let time = "N/A";

      if (item.start_time && item.end_time) {
        time = `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`;
      } else if (item.time) {
        time = item.time;
      }

      row.innerHTML = `
        <td>
          ${escapeHTML(course)}
        </td>

        <td>
          ${escapeHTML(lecturer)}
        </td>

        <td>
          ${escapeHTML(venue)}
        </td>

        <td>
          ${escapeHTML(day)}
        </td>

        <td>
          ${escapeHTML(time)}
        </td>
      `;

      table.appendChild(row);
    });
  } catch (error) {
    console.error("Timetable Report Error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger py-4">
          Unable to load timetable report.
        </td>
      </tr>
    `;
  }
}

// =============================================
// Get API Data Array
// =============================================

function getDataArray(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (result && Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

// =============================================
// Set Report Count
// =============================================

function setReportCount(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.innerHTML = value;
  }
}

// =============================================
// Format Time
// =============================================

function formatTime(time) {
  if (!time) {
    return "";
  }

  const parts = String(time).split(":");

  if (parts.length < 2) {
    return time;
  }

  let hour = parseInt(parts[0], 10);
  const minute = parts[1];

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${period}`;
}

// =============================================
// HTML Escape
// =============================================

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =============================================
// Logout
// =============================================

function logout(e) {
  e.preventDefault();

  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "../index.html";
}
