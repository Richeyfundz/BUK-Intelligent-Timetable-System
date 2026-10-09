
const API_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api/exam-timetables";

let generatedExamTimetable = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generateExamBtn")
    ?.addEventListener("click", generateExamTimetable);

  document.getElementById("saveExamBtn")
    ?.addEventListener("click", saveExamTimetable);

  document.getElementById("clearExamBtn")
    ?.addEventListener("click", clearExamTimetable);

  loadGeneratedExamTimetable();
});

async function generateExamTimetable() {
  const semester = document.getElementById("semester").value;
  const academicYear = document.getElementById("academicYear").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!semester || !academicYear || !startDate || !endDate) {
    alert("Please select the semester and enter the academic year, start date and end date.");
    return;
  }

  if (startDate > endDate) {
    alert("Exam start date cannot be after exam end date.");
    return;
  }

  const button = document.getElementById("generateExamBtn");
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';

  try {
    const response = await fetch(`${API_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        semester,
        academic_year: academicYear,
        start_date: startDate,
        end_date: endDate
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to generate examination timetable.");
    }

    const data = result.data;
    generatedExamTimetable = Array.isArray(data)
      ? data
      : data?.timetable || data?.examinations || [];

    localStorage.setItem(
      "examGeneratedTimetable",
      JSON.stringify(generatedExamTimetable)
    );

    localStorage.setItem(
      "examTimetableSummary",
      JSON.stringify(result.summary || data?.summary || {})
    );

    displayExamTimetable();
    displayExamSummary(result.summary || data?.summary || {});

    if (generatedExamTimetable.length === 0) {
      alert("The server returned no examinations. Check whether eligible courses exist for this semester.");
    } else {
      alert("Examination timetable generated. Please review the dates and days before saving.");
    }
  } catch (error) {
    console.error("Exam timetable error:", error);
    alert(error.message || "Unable to generate examination timetable.");
  } finally {
    button.disabled = false;
    button.innerHTML = '<i class="bi bi-magic me-1"></i>Generate Complete Exam Timetable';
  }
}

function getExamDate(item) {
  const rawDate = item.exam_date || item.examDate || item.exam_day_date || item.date;

  if (!rawDate) return "";

  // Normalize SQL date strings and ISO timestamps to YYYY-MM-DD.
  if (rawDate instanceof Date) {
    return [
      rawDate.getFullYear(),
      String(rawDate.getMonth() + 1).padStart(2, "0"),
      String(rawDate.getDate()).padStart(2, "0")
    ].join("-");
  }

  const value = String(rawDate);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) return match[1];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0")
  ].join("-");
}

function getWeekday(dateString, item) {
  // Use a server-provided weekday only when there is no usable date.
  const date = getExamDate(item);

  if (!date) {
    return item.day || item.exam_day || item.weekday || "Date not provided";
  }

  // Construct the date locally without UTC timezone shifting.
  const [year, month, day] = date.split("-").map(Number);
  const dateObject = new Date(year, month - 1, day);

  return dateObject.toLocaleDateString("en-GB", { weekday: "long" });
}

function formatDate(dateString) {
  if (!dateString) return "Date not provided";

  const [year, month, day] = dateString.split("-").map(Number);
  const dateObject = new Date(year, month - 1, day);

  if (Number.isNaN(dateObject.getTime())) return escapeHtml(dateString);

  return dateObject.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function displayExamTimetable() {
  const tableBody = document.getElementById("examTimetableTable");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!generatedExamTimetable.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted py-4">
          No examination timetable generated yet.
        </td>
      </tr>`;
    return;
  }

  const sorted = [...generatedExamTimetable].sort((a, b) => {
    const dateA = getExamDate(a);
    const dateB = getExamDate(b);

    if (dateA !== dateB) return dateA.localeCompare(dateB);

    return String(a.start_time || "").localeCompare(String(b.start_time || ""));
  });

  sorted.forEach((item) => {
    const date = getExamDate(item);
    const weekday = getWeekday(date, item);
    const row = document.createElement("tr");

    const level = item.level ?? item.course_level ?? "-";
    const courseCode = item.course_code ?? item.courseCode ?? "-";
    const courseTitle = item.course_title ?? item.course_name ?? item.courseTitle ?? "-";
    const venueName = item.venue_name ?? item.venue ?? "-";
    const venueCode = item.venue_code ?? "";
    const startTime = item.start_time ?? item.startTime ?? "";
    const endTime = item.end_time ?? item.endTime ?? "";

    row.innerHTML = `
      <td>${escapeHtml(formatDate(date))}</td>
      <td><span class="badge bg-info text-dark">${escapeHtml(weekday)}</span></td>
      <td><span class="badge bg-primary">${escapeHtml(level)} Level</span></td>
      <td>${escapeHtml(formatTime(startTime))} - ${escapeHtml(formatTime(endTime))}</td>
      <td><strong>${escapeHtml(courseCode)}</strong></td>
      <td>${escapeHtml(courseTitle)}</td>
      <td>
        ${escapeHtml(venueName)}
        ${venueCode ? `<small class="text-muted d-block">${escapeHtml(venueCode)}</small>` : ""}
      </td>
      <td><span class="badge bg-success"><i class="bi bi-check-circle"></i> Generated</span></td>
      <td>${escapeHtml(item.session || "-")}</td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-danger remove-exam-btn" title="Remove this exam">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;

    row.querySelector(".remove-exam-btn").addEventListener("click", () => {
      const originalIndex = generatedExamTimetable.indexOf(item);
      if (originalIndex !== -1) removeExamRow(originalIndex);
    });

    tableBody.appendChild(row);
  });
}

function removeExamRow(index) {
  if (!confirm("Remove this examination from the generated timetable?")) return;

  generatedExamTimetable.splice(index, 1);

  localStorage.setItem(
    "examGeneratedTimetable",
    JSON.stringify(generatedExamTimetable)
  );

  displayExamTimetable();
  updateExamSummaryAfterRemoval();
}

async function saveExamTimetable() {
  if (!generatedExamTimetable.length) {
    alert("Generate an examination timetable first.");
    return;
  }

  const saveButton = document.getElementById("saveExamBtn");
  saveButton.disabled = true;
  saveButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

  try {
    const response = await fetch(`${API_URL}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timetable: generatedExamTimetable })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to save examination timetable.");
    }

    alert(`Examination timetable saved successfully.\n\n${result.saved ?? generatedExamTimetable.length} examinations saved.`);
  } catch (error) {
    console.error("Save exam timetable error:", error);
    alert(error.message || "Unable to save examination timetable.");
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = '<i class="bi bi-save me-1"></i>Save Timetable';
  }
}

async function clearExamTimetable() {
  const academicYear = document.getElementById("academicYear").value.trim();
  const semester = document.getElementById("semester").value;

  if (!academicYear || !semester) {
    alert("Select the semester and enter the academic year first.");
    return;
  }

  if (!confirm("Are you sure you want to clear the saved examination timetable for this semester?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/clear`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        academic_year: academicYear,
        semester
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to clear examination timetable.");
    }

    generatedExamTimetable = [];
    localStorage.removeItem("examGeneratedTimetable");
    localStorage.removeItem("examTimetableSummary");

    displayExamTimetable();

    const summaryBox = document.getElementById("examTimetableSummary");
    if (summaryBox) summaryBox.innerHTML = "";

    alert("Examination timetable cleared successfully.");
  } catch (error) {
    console.error("Clear exam timetable error:", error);
    alert(error.message || "Unable to clear examination timetable.");
  }
}

function loadGeneratedExamTimetable() {
  const saved = localStorage.getItem("examGeneratedTimetable");

  if (!saved) {
    displayExamTimetable();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    generatedExamTimetable = Array.isArray(parsed) ? parsed : [];
    displayExamTimetable();

    const savedSummary = localStorage.getItem("examTimetableSummary");
    if (savedSummary) displayExamSummary(JSON.parse(savedSummary));
  } catch (error) {
    console.error("Unable to load generated exam timetable:", error);
    generatedExamTimetable = [];
    displayExamTimetable();
  }
}

function displayExamSummary(summary = {}) {
  const summaryBox = document.getElementById("examTimetableSummary");
  if (!summaryBox) return;

  const levels = Array.isArray(summary.levels) && summary.levels.length
    ? summary.levels.map((level) => `${level} Level`).join(", ")
    : [...new Set(generatedExamTimetable.map((item) => item.level).filter(Boolean))]
        .map((level) => `${level} Level`).join(", ") || "Not available";

  summaryBox.innerHTML = `
    <div class="row g-3">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100"><div class="card-body text-center">
          <i class="bi bi-book fs-3"></i>
          <h4 class="mt-2 mb-0">${Number(summary.courses ?? generatedExamTimetable.length)}</h4>
          <small class="text-muted">Courses</small>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100"><div class="card-body text-center">
          <i class="bi bi-calendar-check fs-3"></i>
          <h4 class="mt-2 mb-0">${Number(summary.examinations ?? generatedExamTimetable.length)}</h4>
          <small class="text-muted">Examinations</small>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100"><div class="card-body text-center">
          <i class="bi bi-mortarboard fs-3"></i>
          <h6 class="mt-2 mb-0">${escapeHtml(levels)}</h6>
          <small class="text-muted">Levels</small>
        </div></div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm h-100"><div class="card-body text-center">
          <i class="bi bi-calendar-week fs-3"></i>
          <h4 class="mt-2 mb-0">${new Set(generatedExamTimetable.map(getExamDate).filter(Boolean)).size}</h4>
          <small class="text-muted">Exam Days</small>
        </div></div>
      </div>
    </div>`;
}

function updateExamSummaryAfterRemoval() {
  displayExamSummary({
    courses: generatedExamTimetable.length,
    examinations: generatedExamTimetable.length,
    levels: [...new Set(generatedExamTimetable.map((item) => item.level).filter(Boolean))]
  });
}

function formatTime(time) {
  if (!time) return "-";

  const parts = String(time).split(":");
  if (parts.length < 2) return String(time);

  let hour = parseInt(parts[0], 10);
  if (Number.isNaN(hour)) return String(time);

  const minute = parts[1].slice(0, 2);
  const period = hour >= 12 ? "PM" : "AM";

  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;

  return `${hour}:${minute} ${period}`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.removeExamRow = removeExamRow;

