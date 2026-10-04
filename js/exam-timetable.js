const API_URL = "http://localhost:5000/api/exam-timetables";

let generatedExamTimetable = [];

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  const generateButton = document.getElementById("generateExamBtn");

  const saveButton = document.getElementById("saveExamBtn");

  const clearButton = document.getElementById("clearExamBtn");

  if (generateButton) {
    generateButton.addEventListener("click", generateExamTimetable);
  }

  if (saveButton) {
    saveButton.addEventListener("click", saveExamTimetable);
  }

  if (clearButton) {
    clearButton.addEventListener("click", clearExamTimetable);
  }

  // Load previously generated timetable
  loadGeneratedExamTimetable();
});

// =====================================================
// GENERATE EXAM TIMETABLE
// =====================================================

async function generateExamTimetable() {
  const semester = document.getElementById("semester").value;

  const academicYear = document.getElementById("academicYear").value.trim();

  const startDate = document.getElementById("startDate").value;

  const endDate = document.getElementById("endDate").value;

  // ===================================================
  // VALIDATION
  // ===================================================

  if (!semester || !academicYear || !startDate || !endDate) {
    alert(
      "Please select the semester and enter the academic year, exam start date and exam end date.",
    );

    return;
  }

  if (startDate > endDate) {
    alert("Exam start date cannot be after exam end date.");

    return;
  }

  const button = document.getElementById("generateExamBtn");

  button.disabled = true;

  button.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Generating...';

  try {
    const response = await fetch(`${API_URL}/generate`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        semester: semester,

        academic_year: academicYear,

        start_date: startDate,

        end_date: endDate,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to generate examination timetable.",
      );
    }

    // Store generated timetable
    generatedExamTimetable = result.data || [];

    localStorage.setItem(
      "examGeneratedTimetable",
      JSON.stringify(generatedExamTimetable),
    );

    localStorage.setItem(
      "examTimetableSummary",
      JSON.stringify(result.summary || {}),
    );

    displayExamTimetable();

    displayExamSummary(result.summary || {});

    alert("Complete examination timetable generated successfully.");
  } catch (error) {
    console.error("Exam timetable error:", error);

    alert(error.message || "Unable to generate examination timetable.");
  } finally {
    button.disabled = false;

    button.innerHTML =
      '<i class="bi bi-magic"></i> Generate Complete Exam Timetable';
  }
}

// =====================================================
// DISPLAY EXAM TIMETABLE
// =====================================================

function displayExamTimetable() {
  const tableBody = document.getElementById("examTimetableTable");

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = "";

  if (!generatedExamTimetable || generatedExamTimetable.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8"
            class="text-center text-muted py-4">
          No examination timetable generated yet.
        </td>
      </tr>
    `;

    return;
  }

  // ===================================================
  // SORT BY DATE → TIME → LEVEL
  // ===================================================

  const sorted = [...generatedExamTimetable].sort((a, b) => {
    const dateA = new Date(`${a.exam_date}T00:00:00`);

    const dateB = new Date(`${b.exam_date}T00:00:00`);

    if (dateA - dateB !== 0) {
      return dateA - dateB;
    }

    if (a.start_time < b.start_time) {
      return -1;
    }

    if (a.start_time > b.start_time) {
      return 1;
    }

    return Number(a.level) - Number(b.level);
  });

  let currentDate = "";

  sorted.forEach((item, index) => {
    // =================================================
    // DATE HEADER
    // =================================================

    if (item.exam_date !== currentDate) {
      currentDate = item.exam_date;

      const dateObject = new Date(`${item.exam_date}T00:00:00`);

      const formattedDate = dateObject.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const dateRow = document.createElement("tr");

      dateRow.innerHTML = `
          <td colspan="8"
              class="table-primary fw-bold">
            <i class="bi bi-calendar-event"></i>
            ${formattedDate}
          </td>
        `;

      tableBody.appendChild(dateRow);
    }

    // =================================================
    // EXAM ROW
    // =================================================

    const row = document.createElement("tr");

    row.innerHTML = `

        <td>
          <span class="badge bg-primary">
            ${item.level} Level
          </span>
        </td>

        <td>
          ${formatTime(item.start_time)}
          -
          ${formatTime(item.end_time)}
        </td>

        <td>
          <strong>
            ${escapeHtml(item.course_code)}
          </strong>
        </td>

        <td>
          ${escapeHtml(item.course_title)}
        </td>

        <td>
          ${escapeHtml(item.venue_name || "-")}

          ${
            item.venue_code
              ? `<small class="text-muted d-block">
                   ${escapeHtml(item.venue_code)}
                 </small>`
              : ""
          }
        </td>

        <td>
          <span class="badge bg-success">
            <i class="bi bi-check-circle"></i>
            No Clash
          </span>
        </td>

        <td>
          ${escapeHtml(item.session || "-")}
        </td>

        <td>
          <button
            class="btn btn-sm btn-outline-danger"
            onclick="removeExamRow(${index})"
            title="Remove this exam"
          >
            <i class="bi bi-trash"></i>
          </button>
        </td>

      `;

    tableBody.appendChild(row);
  });
}

// =====================================================
// REMOVE EXAM ROW
// =====================================================

function removeExamRow(index) {
  if (!confirm("Remove this examination from the generated timetable?")) {
    return;
  }

  generatedExamTimetable.splice(index, 1);

  localStorage.setItem(
    "examGeneratedTimetable",
    JSON.stringify(generatedExamTimetable),
  );

  displayExamTimetable();

  updateExamSummaryAfterRemoval();
}

// =====================================================
// SAVE EXAM TIMETABLE
// =====================================================

async function saveExamTimetable() {
  if (!generatedExamTimetable || generatedExamTimetable.length === 0) {
    alert("Generate an examination timetable first.");

    return;
  }

  const saveButton = document.getElementById("saveExamBtn");

  if (saveButton) {
    saveButton.disabled = true;

    saveButton.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Saving...';
  }

  try {
    const response = await fetch(`${API_URL}/save`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        timetable: generatedExamTimetable,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to save examination timetable.",
      );
    }

    alert(
      `Examination timetable saved successfully.\n\n${result.saved} examinations saved.`,
    );
  } catch (error) {
    console.error("Save exam timetable error:", error);

    alert(error.message || "Unable to save examination timetable.");
  } finally {
    if (saveButton) {
      saveButton.disabled = false;

      saveButton.innerHTML = '<i class="bi bi-save"></i> Save Timetable';
    }
  }
}

// =====================================================
// CLEAR EXAM TIMETABLE
// =====================================================

async function clearExamTimetable() {
  const academicYear = document.getElementById("academicYear").value.trim();

  const semester = document.getElementById("semester").value;

  if (!academicYear || !semester) {
    alert("Select the semester and enter the academic year first.");

    return;
  }

  if (
    !confirm(
      "Are you sure you want to clear the saved examination timetable for this semester?",
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/clear`, {
      method: "DELETE",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        academic_year: academicYear,

        semester: semester,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to clear examination timetable.",
      );
    }

    generatedExamTimetable = [];

    localStorage.removeItem("examGeneratedTimetable");

    localStorage.removeItem("examTimetableSummary");

    displayExamTimetable();

    const summary = document.getElementById("examTimetableSummary");

    if (summary) {
      summary.innerHTML = "";
    }

    alert("Examination timetable cleared successfully.");
  } catch (error) {
    console.error("Clear exam timetable error:", error);

    alert(error.message || "Unable to clear examination timetable.");
  }
}

// =====================================================
// LOAD SAVED GENERATED TIMETABLE FROM BROWSER
// =====================================================

function loadGeneratedExamTimetable() {
  const saved = localStorage.getItem("examGeneratedTimetable");

  if (saved) {
    try {
      generatedExamTimetable = JSON.parse(saved);

      displayExamTimetable();

      const savedSummary = localStorage.getItem("examTimetableSummary");

      if (savedSummary) {
        displayExamSummary(JSON.parse(savedSummary));
      }
    } catch (error) {
      console.error("Unable to load generated exam timetable:", error);
    }
  }
}

// =====================================================
// DISPLAY SUMMARY
// =====================================================

function displayExamSummary(summary) {
  const summaryBox = document.getElementById("examTimetableSummary");

  if (!summaryBox) {
    return;
  }

  const levels =
    summary.levels && summary.levels.length
      ? summary.levels.map((level) => `${level} Level`).join(", ")
      : "100–400";

  summaryBox.innerHTML = `

    <div class="row g-3">

      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <i class="bi bi-book fs-3"></i>
            <h4 class="mt-2 mb-0">
              ${summary.courses || generatedExamTimetable.length}
            </h4>
            <small class="text-muted">
              Courses
            </small>
          </div>
        </div>
      </div>


      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <i class="bi bi-calendar-check fs-3"></i>
            <h4 class="mt-2 mb-0">
              ${summary.examinations || generatedExamTimetable.length}
            </h4>
            <small class="text-muted">
              Examinations
            </small>
          </div>
        </div>
      </div>


      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <i class="bi bi-mortarboard fs-3"></i>
            <h6 class="mt-2 mb-0">
              ${levels}
            </h6>
            <small class="text-muted">
              Levels
            </small>
          </div>
        </div>
      </div>


      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body text-center">
            <i class="bi bi-shield-check fs-3"></i>
            <h4 class="mt-2 mb-0">
              No Clash
            </h4>
            <small class="text-muted">
              Conflict Status
            </small>
          </div>
        </div>
      </div>

    </div>

  `;
}

// =====================================================
// UPDATE SUMMARY AFTER REMOVING A ROW
// =====================================================

function updateExamSummaryAfterRemoval() {
  displayExamSummary({
    courses: generatedExamTimetable.length,

    examinations: generatedExamTimetable.length,

    levels: [...new Set(generatedExamTimetable.map((item) => item.level))],
  });
}

// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(time) {
  if (!time) {
    return "-";
  }

  const parts = time.split(":");

  if (parts.length < 2) {
    return time;
  }

  let hour = parseInt(parts[0], 10);

  const minute = parts[1];

  const period = hour >= 12 ? "PM" : "AM";

  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }

  return `${hour}:${minute} ${period}`;
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {
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
// MAKE REMOVE FUNCTION AVAILABLE TO HTML
// =====================================================

window.removeExamRow = removeExamRow;
