
// =============================================
// BUK-ITMS REPORTS MODULE
// Railway API + MySQL
// =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const REPORT_APIS = {
  courses: `${API_BASE_URL}/courses`,
  lecturers: `${API_BASE_URL}/lecturers`,
  students: `${API_BASE_URL}/students`,
  venues: `${API_BASE_URL}/venues`,
  timetables: `${API_BASE_URL}/timetables`,
};

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "../index.html";
    return;
  }

  const dateElement = document.getElementById("currentDate");

  if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  loadStatistics();
  loadTimetableReport();
});

// =============================================
// FETCH API DATA
// =============================================

async function fetchReportData(url) {
  const token = localStorage.getItem("token");

  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  const rawText = await response.text();

  let result;

  try {
    result = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(
      `The API returned an invalid response. HTTP status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.error ||
        `API request failed with HTTP ${response.status}`
    );
  }

  if (result.success === false) {
    throw new Error(result.message || "The API reported a failure.");
  }

  return result;
}

// =============================================
// EXTRACT ARRAY FROM DIFFERENT API FORMATS
// =============================================

function getDataArray(result, possibleKeys = []) {
  if (Array.isArray(result)) {
    return result;
  }

  if (!result || typeof result !== "object") {
    return [];
  }

  // Common response formats:
  // { data: [...] }
  // { courses: [...] }
  // { results: [...] }
  // { success: true, data: { courses: [...] } }

  const keys = [
    "data",
    "results",
    "records",
    "items",
    ...possibleKeys,
  ];

  for (const key of keys) {
    if (Array.isArray(result[key])) {
      return result[key];
    }
  }

  if (result.data && typeof result.data === "object") {
    for (const key of [
      ...possibleKeys,
      "results",
      "records",
      "items",
    ]) {
      if (Array.isArray(result.data[key])) {
        return result.data[key];
      }
    }
  }

  return [];
}

// =============================================
// LOAD STATISTICS
// =============================================

async function loadStatistics() {
  const reports = [
    {
      name: "courses",
      elementId: "reportCourses",
      url: REPORT_APIS.courses,
      keys: ["courses"],
    },
    {
      name: "lecturers",
      elementId: "reportLecturers",
      url: REPORT_APIS.lecturers,
      keys: ["lecturers"],
    },
    {
      name: "students",
      elementId: "reportStudents",
      url: REPORT_APIS.students,
      keys: ["students"],
    },
    {
      name: "venues",
      elementId: "reportVenues",
      url: REPORT_APIS.venues,
      keys: ["venues"],
    },
  ];

  const results = await Promise.allSettled(
    reports.map((report) => fetchReportData(report.url))
  );

  results.forEach((outcome, index) => {
    const report = reports[index];
    const element = document.getElementById(report.elementId);

    if (!element) return;

    if (outcome.status === "fulfilled") {
      const records = getDataArray(outcome.value, report.keys);
      element.textContent = records.length;

      console.log(
        `Reports: ${report.name}:`,
        records.length,
        "records"
      );
    } else {
      element.textContent = "—";

      console.error(
        `Failed to load ${report.name}:`,
        outcome.reason
      );
    }
  });
}

// =============================================
// LOAD TIMETABLE REPORT
// =============================================

async function loadTimetableReport() {
  const table = document.getElementById("reportTable");

  if (!table) {
    console.error("Report table element #reportTable was not found.");
    return;
  }

  table.innerHTML = `
    <tr>
      <td colspan="5" class="text-center py-4">
        <span class="spinner-border spinner-border-sm me-2"></span>
        Loading timetable report...
      </td>
    </tr>
  `;

  try {
    const result = await fetchReportData(REPORT_APIS.timetables);

    console.log("Timetable API response:", result);

    const timetable = getDataArray(result, ["timetables", "timetable"]);

    table.innerHTML = "";

    if (timetable.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            No timetable records were returned by the API.
          </td>
        </tr>
      `;
      return;
    }

    // Sort records by day and start time.
    const dayOrder = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 7,
    };

    timetable.sort((a, b) => {
      const dayA = dayOrder[a.day] || 99;
      const dayB = dayOrder[b.day] || 99;

      if (dayA !== dayB) return dayA - dayB;

      return String(a.start_time || "").localeCompare(
        String(b.start_time || "")
      );
    });

    timetable.forEach((item) => {
      const row = document.createElement("tr");

      const course = firstValue(
        item.course_code,
        item.courseCode,
        item.course_title,
        item.course_name,
        item.course,
        "N/A"
      );

      const lecturer = firstValue(
        item.lecturer_name,
        item.lecturerName,
        item.lecturer,
        item.staff_name,
        "N/A"
      );

      const venue = firstValue(
        item.venue_name,
        item.venueName,
        item.venue_code,
        item.venue,
        "N/A"
      );

      const day = firstValue(
        item.day,
        item.weekday,
        item.exam_day,
        "N/A"
      );

      let time = "N/A";

      const startTime = item.start_time || item.startTime;
      const endTime = item.end_time || item.endTime;

      if (startTime && endTime) {
        time = `${formatTime(startTime)} - ${formatTime(endTime)}`;
      } else if (item.time) {
        time = item.time;
      }

      row.innerHTML = `
        <td>${escapeHTML(course)}</td>
        <td>${escapeHTML(lecturer)}</td>
        <td>${escapeHTML(venue)}</td>
        <td>${escapeHTML(day)}</td>
        <td>${escapeHTML(time)}</td>
      `;

      table.appendChild(row);
    });

    console.log(
      `Timetable report loaded: ${timetable.length} records.`
    );
  } catch (error) {
    console.error("Timetable report error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger py-4">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Failed to load timetable report.
          <div class="small mt-2">${escapeHTML(error.message)}</div>
        </td>
      </tr>
    `;
  }
}

// =============================================
// GET FIRST AVAILABLE FIELD
// =============================================

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "N/A";
}

// =============================================
// FORMAT TIME
// =============================================

function formatTime(time) {
  if (!time) return "N/A";

  const value = String(time);
  const match = value.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return value;

  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}

// =============================================
// ESCAPE HTML
// =============================================

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =============================================
// LOGOUT
// =============================================

function logout(event) {
  event.preventDefault();

  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "../index.html";
}

