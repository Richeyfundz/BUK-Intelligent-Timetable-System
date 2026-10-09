// =====================================================
// BUK-ITMS: AI TIMETABLE FRONTEND
// File: js/ai-timetable.js
// =====================================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const AI_TIMETABLE_URL =
  `${API_BASE_URL}/ai-timetables`;

let generatedTimetable = [];

// =====================================================
// INITIALIZE PAGE
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("generatorForm");
  const saveButton = document.getElementById("saveTimetable");
  const clearButton = document.getElementById("clearTimetable");
  const csvButton = document.getElementById("downloadCsv");

  if (form) {
    form.addEventListener("submit", generateTimetable);
  }

  if (saveButton) {
    saveButton.addEventListener("click", saveTimetable);
  }

  if (clearButton) {
    clearButton.addEventListener("click", clearTimetable);
  }

  if (csvButton) {
    csvButton.addEventListener("click", exportCSV);
  }

  loadStoredTimetable();
});

// =====================================================
// API HELPERS
// =====================================================

function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };

  const token = localStorage.getItem("token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function readAPIResponse(response) {
  const text = await response.text();

  let result;

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "The server returned an unexpected response."
    );
  }

  if (!response.ok || result.success === false) {
    const error = new Error(
      result.message ||
        `Server request failed (${response.status}).`
    );

    error.details = result;
    throw error;
  }

  return result;
}

// =====================================================
// GENERATE TIMETABLE
// =====================================================

async function generateTimetable(event) {
  event.preventDefault();

  const semester =
    document.getElementById("semester").value;

  const academicYear =
    document.getElementById("academicYear").value.trim();

  const startDate =
    document.getElementById("startDate").value;

  const endDate =
    document.getElementById("endDate").value;

  if (
    !semester ||
    !academicYear ||
    !startDate ||
    !endDate
  ) {
    showMessage(
      "Please complete all timetable settings.",
      "warning"
    );
    return;
  }

  if (startDate > endDate) {
    showMessage(
      "The semester end date cannot be earlier than the start date.",
      "warning"
    );
    return;
  }

  const generateButton =
    document.getElementById("generateBtn");

  const saveButton =
    document.getElementById("saveTimetable");

  generateButton.disabled = true;
  generateButton.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';

  saveButton.hidden = true;
  clearSummary();

  showMessage(
    "Generating the timetable. Please wait...",
    "info"
  );

  try {
    const response = await fetch(
      `${AI_TIMETABLE_URL}/generate`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          semester,
          academic_year: academicYear,
          start_date: startDate,
          end_date: endDate
        })
      }
    );

    const result = await readAPIResponse(response);

    // The backend currently returns the array as result.data.
    // Also support wrapped response formats.
    let timetable = null;

    if (Array.isArray(result.data)) {
      timetable = result.data;
    } else if (Array.isArray(result.timetable)) {
      timetable = result.timetable;
    } else if (
      Array.isArray(result.generatedTimetable)
    ) {
      timetable = result.generatedTimetable;
    } else if (
      Array.isArray(result.generated_timetable)
    ) {
      timetable = result.generated_timetable;
    } else if (
      result.data &&
      Array.isArray(result.data.timetable)
    ) {
      timetable = result.data.timetable;
    } else if (
      result.data &&
      Array.isArray(result.data.generatedTimetable)
    ) {
      timetable = result.data.generatedTimetable;
    }

    if (!Array.isArray(timetable)) {
      console.error(
        "Unexpected timetable response:",
        result
      );

      throw new Error(
        "The backend did not return a timetable array. Check the backend response."
      );
    }

    if (timetable.length === 0) {
      generatedTimetable = [];

      localStorage.removeItem("generatedTimetable");
      displayTimetable([]);
      clearSummary();

      showMessage(
        "No timetable entries were generated. Check courses, assignments, venues, and dates.",
        "warning"
      );
      return;
    }

    generatedTimetable = timetable.map((item) => ({
      ...item,
      academic_year:
        item.academic_year || academicYear,
      semester: item.semester || semester
    }));

    localStorage.setItem(
      "generatedTimetable",
      JSON.stringify(generatedTimetable)
    );

    displayTimetable(generatedTimetable);

    showSummary(
      generatedTimetable,
      result.summary ||
        result.data?.summary ||
        null
    );

    saveButton.hidden = false;

    showMessage(
      `Timetable generated successfully: ${generatedTimetable.length} session(s). Review before saving.`,
      "success"
    );
  } catch (error) {
    console.error(
      "Generate Timetable Error:",
      error
    );

    if (error.details) {
      console.error(
        "Backend error details:",
        error.details
      );
    }

    showMessage(
      error.message ||
        "Failed to generate the timetable.",
      "danger"
    );
  } finally {
    generateButton.disabled = false;
    generateButton.innerHTML =
      '<i class="bi bi-magic"></i> Generate Timetable';
  }
}

// =====================================================
// DISPLAY TIMETABLE
// =====================================================

function displayTimetable(timetable) {
  const tableBody =
    document.getElementById("timetableTable");

  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!Array.isArray(timetable) || !timetable.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6"
            class="text-center text-secondary py-4">
          No timetable entries to display.
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...timetable].sort((a, b) => {
    const dateA = normalizeDate(a.lecture_date);
    const dateB = normalizeDate(b.lecture_date);

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return String(a.start_time || "").localeCompare(
      String(b.start_time || "")
    );
  });

  const rows = new Map();
  const dates = new Set();

  sorted.forEach((course) => {
    const date = normalizeDate(course.lecture_date);
    const start = normalizeTime(course.start_time);
    const end = normalizeTime(course.end_time);
    const key = `${date}|${start}|${end}`;

    dates.add(date);

    if (!rows.has(key)) {
      rows.set(key, {
        date,
        day: course.day || getDayFromDate(date),
        start,
        end,
        courses: []
      });
    }

    rows.get(key).courses.push(course);
  });

  const scheduleRows = Array.from(rows.values());

  dates.forEach((date) => {
    const day = getDayFromDate(date);

    if (day === "Friday") {
      scheduleRows.push({
        date,
        day,
        start: "13:00",
        end: "14:30",
        prayerBreak: "Friday Jumu'ah Prayer Break",
        courses: []
      });
    } else if (
      [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday"
      ].includes(day)
    ) {
      scheduleRows.push({
        date,
        day,
        start: "13:00",
        end: "14:00",
        prayerBreak: "Prayer Break",
        courses: []
      });
    }
  });

  scheduleRows.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);

    if (dateCompare !== 0) return dateCompare;

    return a.start.localeCompare(b.start);
  });

  scheduleRows.forEach((row) => {
    const tr = document.createElement("tr");

    if (row.prayerBreak) {
      tr.className = "prayer-row";

      const cell = document.createElement("td");
      cell.colSpan = 6;

      cell.textContent =
        `${row.day} — ${formatDate(row.date)} | ` +
        `${formatTime(row.start)}–${formatTime(row.end)} | ` +
        row.prayerBreak;

      tr.appendChild(cell);
      tableBody.appendChild(tr);
      return;
    }

    const timeCell = document.createElement("td");

    timeCell.innerHTML = `
      <strong>${escapeHTML(row.day)}</strong>
      <small class="d-block text-secondary">
        ${escapeHTML(formatDate(row.date))}
      </small>
      <small class="d-block">
        ${escapeHTML(formatTime(row.start))}–
        ${escapeHTML(formatTime(row.end))}
      </small>
    `;

    tr.appendChild(timeCell);

    const columns = [
      { key: "100" },
      { key: "200" },
      { key: "300" },
      { key: "400" },
      { key: "other" }
    ];

    columns.forEach((column) => {
      const td = document.createElement("td");

      const courses = row.courses.filter((course) => {
        const level = String(course.level ?? "")
          .replace(/\s*level/i, "")
          .trim();

        if (column.key === "other") {
          return ![
            "100",
            "200",
            "300",
            "400"
          ].includes(level);
        }

        return level === column.key;
      });

      if (!courses.length) {
        td.innerHTML =
          '<span class="text-muted">—</span>';
      } else {
        courses.forEach((course) => {
          const card = document.createElement("div");
          card.className = "course-card mb-2";

          const code = escapeHTML(
            course.course_code || "Course"
          );

          const title = escapeHTML(
            course.course_title || course.title || ""
          );

          const lecturer = escapeHTML(
            course.lecturer_name ||
              course.lecturer ||
              "Not provided"
          );

          const venue = escapeHTML(
            course.venue_name ||
              course.venue_code ||
              course.venue ||
              "Not provided"
          );

          card.innerHTML = `
            <strong>${code}</strong>
            <div>${title}</div>
            <small>
              <i class="bi bi-person"></i>
              ${lecturer}
            </small>
            <small>
              <i class="bi bi-geo-alt"></i>
              ${venue}
            </small>
          `;

          td.appendChild(card);
        });
      }

      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });
}

// =====================================================
// SUMMARY
// =====================================================

function showSummary(timetable, serverSummary = null) {
  const container =
    document.getElementById("timetableSummary");

  if (!container) return;

  const courses = new Set(
    timetable.map(
      (item) => item.course_id ?? item.course_code
    )
  );

  const levels = new Set(
    timetable.map(
      (item) => String(item.level ?? "Other")
    )
  );

  const venues = new Set(
    timetable.map(
      (item) =>
        item.venue_id ??
        item.venue_code ??
        item.venue_name
    )
  );

  const stats = [
    {
      title: "Scheduled Sessions",
      value: timetable.length,
      icon: "bi-calendar-check"
    },
    {
      title: "Courses Scheduled",
      value: courses.size,
      icon: "bi-book"
    },
    {
      title: "Levels Covered",
      value: levels.size,
      icon: "bi-mortarboard"
    },
    {
      title: "Venues Used",
      value: venues.size,
      icon: "bi-building"
    }
  ];

  container.innerHTML = stats.map((stat) => `
    <div class="col-6 col-lg-3">
      <div class="settings-card p-3 h-100">
        <div class="text-secondary small">
          <i class="bi ${stat.icon} me-1"></i>
          ${stat.title}
        </div>
        <div class="fs-3 fw-bold">
          ${stat.value}
        </div>
      </div>
    </div>
  `).join("");

  if (serverSummary) {
    console.log(
      "Backend timetable summary:",
      serverSummary
    );
  }
}

function clearSummary() {
  const container =
    document.getElementById("timetableSummary");

  if (container) {
    container.innerHTML = "";
  }
}

// =====================================================
// SAVE TIMETABLE
// =====================================================

async function saveTimetable() {
  if (!generatedTimetable.length) {
    showMessage(
      "Generate a timetable before saving.",
      "warning"
    );
    return;
  }

  const saveButton =
    document.getElementById("saveTimetable");

  saveButton.disabled = true;
  saveButton.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

  try {
    const response = await fetch(
      `${AI_TIMETABLE_URL}/save`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          timetable: generatedTimetable
        })
      }
    );

    const result = await readAPIResponse(response);

    showMessage(
      result.message || "Timetable saved successfully.",
      "success"
    );

    saveButton.hidden = true;

    localStorage.removeItem("generatedTimetable");
  } catch (error) {
    console.error("Save Timetable Error:", error);

    showMessage(
      error.message || "Failed to save the timetable.",
      "danger"
    );
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML =
      '<i class="bi bi-save"></i> Save Timetable';
  }
}

// =====================================================
// CLEAR PREVIEW
// =====================================================

function clearTimetable() {
  generatedTimetable = [];

  localStorage.removeItem("generatedTimetable");

  displayTimetable([]);
  clearSummary();

  const saveButton =
    document.getElementById("saveTimetable");

  if (saveButton) {
    saveButton.hidden = true;
  }

  showMessage(
    "The timetable preview has been cleared.",
    "info"
  );
}

// =====================================================
// RESTORE PREVIOUS PREVIEW
// =====================================================

function loadStoredTimetable() {
  try {
    const saved =
      localStorage.getItem("generatedTimetable");

    if (!saved) return;

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed) || !parsed.length) {
      localStorage.removeItem("generatedTimetable");
      return;
    }

    generatedTimetable = parsed;

    displayTimetable(generatedTimetable);
    showSummary(generatedTimetable);

    const saveButton =
      document.getElementById("saveTimetable");

    if (saveButton) {
      saveButton.hidden = false;
    }

    showMessage(
      "A previous timetable preview was restored.",
      "info"
    );
  } catch (error) {
    console.error("Restore Timetable Error:", error);

    localStorage.removeItem("generatedTimetable");
  }
}

// =====================================================
// EXPORT CSV
// =====================================================

function exportCSV() {
  if (!generatedTimetable.length) {
    showMessage(
      "Generate a timetable before exporting.",
      "warning"
    );
    return;
  }

  const headers = [
    "Academic Year",
    "Semester",
    "Course Code",
    "Course Title",
    "Level",
    "Lecturer",
    "Venue",
    "Day",
    "Date",
    "Start Time",
    "End Time"
  ];

  const rows = generatedTimetable.map((item) => [
    item.academic_year || "",
    item.semester || "",
    item.course_code || "",
    item.course_title || item.title || "",
    item.level || "",
    item.lecturer_name || item.lecturer || "",
    item.venue_name || item.venue_code || item.venue || "",
    item.day || "",
    normalizeDate(item.lecture_date),
    normalizeTime(item.start_time),
    normalizeTime(item.end_time)
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((value) => {
        const text = String(value ?? "");
        return `"${text.replace(/"/g, '""')}"`;
      }).join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "BUK-ITMS-AI-Timetable.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showMessage(
    "The CSV export has been prepared.",
    "success"
  );
}

// =====================================================
// MESSAGE DISPLAY
// =====================================================

function showMessage(message, type = "info") {
  const box =
    document.getElementById("statusMessage");

  if (!box) return;

  box.className =
    `alert alert-${type} status-message`;

  box.textContent = message;
  box.classList.remove("d-none");
}

// =====================================================
// DATE AND TIME HELPERS
// =====================================================

function normalizeDate(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0")
  ].join("-");
}

function normalizeTime(value) {
  if (!value) return "";

  const match = String(value).match(
    /^(\d{1,2}):(\d{2})/
  );

  if (match) {
    return (
      `${match[1].padStart(2, "0")}:` +
      match[2]
    );
  }

  return String(value);
}

function formatDate(value) {
  const dateText = normalizeDate(value);

  if (!dateText) return "Date unavailable";

  const parts = dateText.split("-");

  if (parts.length !== 3) return dateText;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(value) {
  const normalized = normalizeTime(value);

  if (!normalized) return "Time unavailable";

  const parts = normalized.split(":");
  const hour = Number(parts[0]);
  const minute = parts[1] || "00";

  if (Number.isNaN(hour)) return normalized;

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function getDayFromDate(value) {
  const dateText = normalizeDate(value);
  const parts = dateText.split("-");

  if (parts.length !== 3) return "";

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ][date.getDay()];
}

// =====================================================
// HTML ESCAPING
// =====================================================

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return replacements[character];
    }
  );
}
