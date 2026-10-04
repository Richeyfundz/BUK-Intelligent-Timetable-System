// =====================================================
// BUK AI TIMETABLE - FRONTEND
// COMPLETE 100-400 LEVEL GENERATOR
// =====================================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";
const API_URL = `${API_BASE_URL}/ai-timetables`;

let generatedTimetable = [];

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  checkLogin();

  const generateBtn = document.getElementById("generateBtn");
  const saveBtn = document.getElementById("saveTimetable");
  const clearBtn = document.getElementById("clearTimetable");
  const logoutBtn = document.getElementById("logoutBtn");

  if (generateBtn) {
    generateBtn.addEventListener("click", generateTimetable);
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveTimetable);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearTimetable);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Set today's date as minimum for semester dates
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");

  if (startDate && endDate) {
    startDate.addEventListener("change", () => {
      endDate.min = startDate.value;

      if (endDate.value && endDate.value < startDate.value) {
        endDate.value = "";
      }
    });
  }

  // Load previously generated timetable
  loadStoredTimetable();
});

// =====================================================
// LOGIN CHECK
// =====================================================

function checkLogin() {
  const loggedIn = localStorage.getItem("loggedIn");

  if (loggedIn !== "true") {
    window.location.href = "../index.html";
  }
}

// =====================================================
// GENERATE COMPLETE TIMETABLE
// =====================================================

async function generateTimetable() {
  const semester = document.getElementById("semester")?.value;

  const academicYear = document.getElementById("academicYear")?.value.trim();

  const startDate = document.getElementById("startDate")?.value;

  const endDate = document.getElementById("endDate")?.value;

  const generateBtn = document.getElementById("generateBtn");

  // =================================================
  // VALIDATION
  // =================================================

  if (!semester) {
    alert("Please select a semester.");
    return;
  }

  if (!academicYear) {
    alert("Please enter the academic year.");
    return;
  }

  if (!startDate) {
    alert("Please select the semester start date.");
    return;
  }

  if (!endDate) {
    alert("Please select the semester end date.");
    return;
  }

  if (startDate > endDate) {
    alert("Semester start date cannot be after the end date.");
    return;
  }

  // =================================================
  // LOADING STATE
  // =================================================

  if (generateBtn) {
    generateBtn.disabled = true;

    generateBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Generating Complete Timetable...
        `;
  }

  try {
    // =================================================
    // SEND REQUEST
    // =================================================

    const response = await fetch(`${API_URL}/generate`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        semester,

        academic_year: academicYear,

        start_date: startDate,

        end_date: endDate,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to generate timetable.");
    }

    // =================================================
    // STORE GENERATED TIMETABLE
    // =================================================

    generatedTimetable = Array.isArray(result.data) ? result.data : [];

    localStorage.setItem(
      "aiGeneratedTimetable",
      JSON.stringify(generatedTimetable),
    );

    // =================================================
    // DISPLAY
    // =================================================

    displayTimetable(generatedTimetable);

    // =================================================
    // SHOW SUMMARY
    // =================================================

    showSummary(result.summary);

    alert("Complete timetable generated successfully!");
  } catch (error) {
    console.error("Timetable generation error:", error);

    alert(error.message || "An error occurred while generating the timetable.");
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;

      generateBtn.innerHTML = `
                <i class="bi bi-stars me-1"></i>
                Generate Complete Timetable
            `;
    }
  }
}

// =====================================================
// DISPLAY COMPLETE TIMETABLE
// =====================================================

function displayTimetable(timetable) {
  const tableBody = document.getElementById("timetableTable");

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  if (!timetable || timetable.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center text-muted py-4"
                >
                    No timetable generated.
                </td>
            </tr>
        `;

    return;
  }

  // =================================================
  // SORT BY DATE → TIME → LEVEL
  // =================================================

  const sorted = [...timetable].sort((a, b) => {
    const dateCompare = String(a.lecture_date).localeCompare(
      String(b.lecture_date),
    );

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const timeCompare = String(a.start_time).localeCompare(
      String(b.start_time),
    );

    if (timeCompare !== 0) {
      return timeCompare;
    }

    return Number(a.level) - Number(b.level);
  });

  let currentDate = "";

  // =================================================
  // CREATE STRAIGHT-LINE DAILY TIMETABLE
  // =================================================

  sorted.forEach((item) => {
    // =================================================
    // NEW DAY HEADER
    // =================================================

    if (String(item.lecture_date) !== String(currentDate)) {
      currentDate = item.lecture_date;

      const dayHeader = document.createElement("tr");

      dayHeader.className = "table-primary";

      dayHeader.innerHTML = `
                <td
                    colspan="8"
                    class="fw-bold py-3"
                >
                    <i class="bi bi-calendar3 me-2"></i>
                    ${escapeHTML(item.day)}
                    -
                    ${formatDate(item.lecture_date)}
                </td>
            `;

      tableBody.appendChild(dayHeader);
    }

    // =================================================
    // COURSE ROW
    // =================================================

    const row = document.createElement("tr");

    row.dataset.id = `${item.course_id}-${item.lecture_date}-${item.start_time}`;

    row.innerHTML = `

            <td>
                <span class="badge bg-primary">
                    ${escapeHTML(item.level)} Level
                </span>
            </td>

            <td class="fw-semibold">
                ${formatTime(item.start_time)}
                -
                ${formatTime(item.end_time)}
            </td>

            <td>
                <strong>
                    ${escapeHTML(item.course_code)}
                </strong>

                <br>

                <small class="text-muted">
                    ${escapeHTML(item.course_title)}
                </small>
            </td>

            <td>
                ${escapeHTML(item.lecturer_name || "Not assigned")}
            </td>

            <td>
                ${escapeHTML(item.venue_name || "Not assigned")}

                ${
                  item.venue_code
                    ? `
                        <br>
                        <small class="text-muted">
                            ${escapeHTML(item.venue_code)}
                        </small>
                        `
                    : ""
                }
            </td>

            <td>
                <span class="badge bg-success">
                    No Clash
                </span>
            </td>

            <td>
                ${escapeHTML(item.session || "Lecture")}
            </td>

            <td>
                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="removeTimetableRow(this)"
                >
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

    tableBody.appendChild(row);
  });
}

// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =====================================================
// FORMAT TIME
// =====================================================

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

  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${minute} ${suffix}`;
}

// =====================================================
// REMOVE ROW
// =====================================================

function removeTimetableRow(button) {
  const row = button.closest("tr");

  if (!row) {
    return;
  }

  const id = row.dataset.id;

  generatedTimetable = generatedTimetable.filter(
    (item) =>
      `${item.course_id}-${item.lecture_date}-${item.start_time}` !== id,
  );

  localStorage.setItem(
    "aiGeneratedTimetable",
    JSON.stringify(generatedTimetable),
  );

  displayTimetable(generatedTimetable);
}

// =====================================================
// SAVE TIMETABLE
// =====================================================

async function saveTimetable() {
  if (!generatedTimetable || generatedTimetable.length === 0) {
    alert("Please generate a timetable first.");

    return;
  }

  const saveBtn = document.getElementById("saveTimetable");

  if (saveBtn) {
    saveBtn.disabled = true;

    saveBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Saving...
        `;
  }

  try {
    const response = await fetch(`${API_URL}/save`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        timetable: generatedTimetable,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to save timetable.");
    }

    alert(result.message || "Timetable saved successfully.");

    localStorage.removeItem("aiGeneratedTimetable");
  } catch (error) {
    console.error("Save timetable error:", error);

    alert(error.message || "An error occurred while saving the timetable.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;

      saveBtn.innerHTML = `
                <i class="bi bi-save me-1"></i>
                Save Timetable
            `;
    }
  }
}

// =====================================================
// CLEAR TIMETABLE
// =====================================================

function clearTimetable() {
  if (generatedTimetable.length === 0) {
    return;
  }

  const confirmClear = confirm(
    "Are you sure you want to clear the generated timetable?",
  );

  if (!confirmClear) {
    return;
  }

  generatedTimetable = [];

  localStorage.removeItem("aiGeneratedTimetable");

  const tableBody = document.getElementById("timetableTable");

  if (tableBody) {
    tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center text-muted py-4"
                >
                    Generate a complete timetable
                    to see the results here.
                </td>
            </tr>
        `;
  }

  const summary = document.getElementById("timetableSummary");

  if (summary) {
    summary.innerHTML = "";
  }
}

// =====================================================
// LOAD STORED TIMETABLE
// =====================================================

function loadStoredTimetable() {
  const stored = localStorage.getItem("aiGeneratedTimetable");

  if (!stored) {
    return;
  }

  try {
    generatedTimetable = JSON.parse(stored);

    if (Array.isArray(generatedTimetable) && generatedTimetable.length > 0) {
      displayTimetable(generatedTimetable);
    }
  } catch (error) {
    console.error("Could not load stored timetable:", error);

    localStorage.removeItem("aiGeneratedTimetable");
  }
}

// =====================================================
// SHOW SUMMARY
// =====================================================

function showSummary(summary) {
  const container = document.getElementById("timetableSummary");

  if (!container || !summary) {
    return;
  }

  const levels = Array.isArray(summary.levels) ? summary.levels : [];

  container.innerHTML = `

        <div class="row g-3 mb-4">

            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <small class="text-muted">
                            Courses
                        </small>

                        <h4 class="mb-0">
                            ${summary.total_courses || 0}
                        </h4>
                    </div>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <small class="text-muted">
                            Sessions
                        </small>

                        <h4 class="mb-0">
                            ${summary.total_sessions || 0}
                        </h4>
                    </div>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <small class="text-muted">
                            Levels
                        </small>

                        <h4 class="mb-0">
                            ${levels.length ? levels.join(", ") : "All"}
                        </h4>
                    </div>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <small class="text-muted">
                            Status
                        </small>

                        <h4 class="mb-0 text-success">
                            No Clash
                        </h4>
                    </div>
                </div>
            </div>

        </div>
    `;
}

// =====================================================
// ESCAPE HTML
// =====================================================

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

// =====================================================
// LOGOUT
// =====================================================

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");

  window.location.href = "../index.html";
}
