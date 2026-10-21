
 // =============================================
 // BUK-ITMS LECTURERS MODULE
 // Railway API + Authentication
 // =============================================

const API_BASE =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const LECTURER_API = `${API_BASE}/lecturers`;
const DEPARTMENT_API = `${API_BASE}/departments`;
const COURSE_API = `${API_BASE}/courses`;

let lecturers = [];
let courses = [];

document.addEventListener("DOMContentLoaded", () => {
  if (
    localStorage.getItem("loggedIn") !== "true" ||
    !localStorage.getItem("token")
  ) {
    clearSession();
    window.location.href = "../index.html";
    return;
  }

  const form = document.getElementById("lecturerForm");
  const resetBtn = document.getElementById("resetBtn");
  const searchInput = document.getElementById("searchInput");
  const logoutBtn = document.getElementById("logoutBtn");

  if (form) form.addEventListener("submit", saveLecturer);
  if (resetBtn) resetBtn.addEventListener("click", resetForm);
  if (searchInput) searchInput.addEventListener("input", searchLecturers);
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  setCurrentDate();
  loadDepartments();
  loadCourses();
  loadLecturers();
});

// =============================================
// AUTHENTICATION
// =============================================

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
}

async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    clearSession();
    window.location.href = "../index.html";
    throw new Error("Please log in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearSession();
    window.location.href = "../index.html";
    throw new Error("Your session expired. Please log in again.");
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

function getDataArray(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  return [];
}

// =============================================
// DATE
// =============================================

function setCurrentDate() {
  const date = document.getElementById("currentDate");

  if (date) {
    date.textContent = new Date().toLocaleDateString("en-GB");
  }
}

// =============================================
// MESSAGES
// =============================================

function showMessage(message, type = "success") {
  const box = document.getElementById("messageBox");
  if (!box) return;

  box.replaceChildren();

  const alertBox = document.createElement("div");
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;

  box.appendChild(alertBox);
}

// =============================================
// LOAD DEPARTMENTS
// =============================================

async function loadDepartments() {
  const select = document.getElementById("department_id");
  if (!select) return;

  try {
    const result = await apiRequest(DEPARTMENT_API);
    const departments = getDataArray(result);

    select.innerHTML =
      '<option value="">-- Select Department --</option>';

    departments.forEach((department) => {
      const option = document.createElement("option");
      option.value = department.id;
      option.textContent = department.department_name || "";
      select.appendChild(option);
    });
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

// =============================================
// LOAD COURSES
// =============================================

async function loadCourses() {
  const select = document.getElementById("course_ids");
  if (!select) return;

  select.innerHTML = '<option disabled>Loading courses...</option>';

  try {
    const result = await apiRequest(COURSE_API);
    courses = getDataArray(result);

    select.innerHTML = "";

    if (!courses.length) {
      select.innerHTML = '<option disabled>No courses found</option>';
      return;
    }

    courses.forEach((course) => {
      const option = document.createElement("option");
      option.value = course.id;
      option.textContent =
        `${course.course_code} - ${course.course_title} ` +
        `(${course.level}, ${course.semester})`;
      select.appendChild(option);
    });
  } catch (error) {
    select.innerHTML =
      '<option disabled>Failed to load courses</option>';
    showMessage(error.message, "danger");
  }
}

// =============================================
// LOAD LECTURERS
// =============================================

async function loadLecturers() {
  const body = document.getElementById("lecturerTableBody");
  if (!body) return;

  body.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">Loading lecturers...</td>
    </tr>
  `;

  try {
    const result = await apiRequest(LECTURER_API);
    lecturers = getDataArray(result);

    body.innerHTML = "";

    if (!lecturers.length) {
      body.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No lecturers found.</td>
        </tr>
      `;
      return;
    }

    lecturers.forEach((lecturer) => {
      const id = Number(lecturer.id);
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHTML(lecturer.staff_id)}</td>
        <td>${escapeHTML(lecturer.first_name)}
          ${escapeHTML(lecturer.last_name)}</td>
        <td>${escapeHTML(lecturer.department_name || "")}</td>
        <td id="courses-${id}">Loading...</td>
        <td>
          <button class="btn btn-sm btn-primary me-1"
            data-action="edit" data-id="${id}">Edit</button>
          <button class="btn btn-sm btn-danger"
            data-action="delete" data-id="${id}">Delete</button>
        </td>
      `;

      body.appendChild(row);
    });

    await Promise.all(
      lecturers.map((lecturer) => loadLecturerCourseNames(lecturer.id))
    );
  } catch (error) {
    body.innerHTML = `
      <tr>
        <td colspan="5" class="text-danger">
          Failed to load lecturers.
        </td>
      </tr>
    `;

    showMessage(error.message, "danger");
  }
}

// =============================================
// DISPLAY ASSIGNED COURSES
// =============================================

async function loadLecturerCourseNames(id) {
  const cell = document.getElementById(`courses-${Number(id)}`);
  if (!cell) return;

  try {
    const result = await apiRequest(`${LECTURER_API}/${id}/courses`);
    const assigned = getDataArray(result);

    // Support APIs that return IDs or course objects.
    const ids = assigned.map((item) =>
      Number(typeof item === "object" ? item.id : item)
    );

    const names = courses
      .filter((course) => ids.includes(Number(course.id)))
      .map((course) => course.course_code);

    cell.textContent = names.length
      ? names.join(", ")
      : "No courses assigned";
  } catch (error) {
    cell.textContent = "Could not load";
  }
}

// =============================================
// SAVE OR UPDATE LECTURER
// =============================================

async function saveLecturer(event) {
  event.preventDefault();

  const form = document.getElementById("lecturerForm");
  const id = document.getElementById("lecturerId").value;
  const button = document.getElementById("saveBtn");

  const lecturer = {
    staff_id: document.getElementById("staff_id").value.trim(),
    department_id: document.getElementById("department_id").value,
    first_name: document.getElementById("first_name").value.trim(),
    last_name: document.getElementById("last_name").value.trim(),
    email: document.getElementById("email").value.trim(),
  };

  const courseIds = Array.from(
    document.getElementById("course_ids").selectedOptions
  ).map((option) => Number(option.value));

  if (
    !lecturer.staff_id ||
    !lecturer.department_id ||
    !lecturer.first_name ||
    !lecturer.last_name ||
    !lecturer.email
  ) {
    showMessage("Please complete all required lecturer fields.", "danger");
    return;
  }

  button.disabled = true;

  try {
    let lecturerId = Number(id);

    if (id) {
      await apiRequest(`${LECTURER_API}/${id}`, {
        method: "PUT",
        body: JSON.stringify(lecturer),
      });
    } else {
      const result = await apiRequest(LECTURER_API, {
        method: "POST",
        body: JSON.stringify(lecturer),
      });

      const created = result.data || result;
      lecturerId = Number(
        result.lecturerId ?? created.lecturerId ?? created.id
      );
    }

    if (!lecturerId) {
      throw new Error(
        "The API did not return the new lecturer ID. Check lecturerController."
      );
    }

    await apiRequest(`${LECTURER_API}/${lecturerId}/courses`, {
      method: "PUT",
      body: JSON.stringify({ course_ids: courseIds }),
    });

    showMessage("Lecturer and course assignments saved successfully.");

    resetForm();
    await loadLecturers();
  } catch (error) {
    showMessage(error.message, "danger");
  } finally {
    button.disabled = false;
  }
}

// =============================================
// EDIT LECTURER
// =============================================

async function editLecturer(id) {
  try {
    const result = await apiRequest(`${LECTURER_API}/${id}`);
    const lecturer = result.data || result;

    document.getElementById("lecturerId").value = lecturer.id;
    document.getElementById("staff_id").value = lecturer.staff_id || "";
    document.getElementById("first_name").value = lecturer.first_name || "";
    document.getElementById("last_name").value = lecturer.last_name || "";
    document.getElementById("email").value = lecturer.email || "";

    const departmentSelect = document.getElementById("department_id");
    departmentSelect.value = lecturer.department_id || "";

    const resultCourses = await apiRequest(
      `${LECTURER_API}/${id}/courses`
    );

    const assigned = getDataArray(resultCourses);
    const assignedIds = assigned.map((item) =>
      Number(typeof item === "object" ? item.id : item)
    );

    const select = document.getElementById("course_ids");

    Array.from(select.options).forEach((option) => {
      option.selected = assignedIds.includes(Number(option.value));
    });

    document.getElementById("formTitle").textContent = "Edit Lecturer";
    document.getElementById("saveBtn").textContent = "Update Lecturer";

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

// =============================================
// DELETE LECTURER
// =============================================

async function deleteLecturer(id) {
  if (!confirm("Delete this lecturer?")) return;

  try {
    await apiRequest(`${LECTURER_API}/${id}`, {
      method: "DELETE",
    });

    showMessage("Lecturer deleted successfully.");
    await loadLecturers();
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

// =============================================
// TABLE ACTIONS
// =============================================

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);

  if (button.dataset.action === "edit") editLecturer(id);
  if (button.dataset.action === "delete") deleteLecturer(id);
});

// =============================================
// SEARCH
// =============================================

function searchLecturers() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  const query = input.value.toLowerCase();

  document.querySelectorAll("#lecturerTableBody tr").forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(query)
      ? ""
      : "none";
  });
}

// =============================================
// RESET FORM
// =============================================

function resetForm() {
  const form = document.getElementById("lecturerForm");
  if (form) form.reset();

  document.getElementById("lecturerId").value = "";
  document.getElementById("formTitle").textContent = "Add New Lecturer";
  document.getElementById("saveBtn").innerHTML =
    '<i class="bi bi-save"></i> Save Lecturer';

  const select = document.getElementById("course_ids");
  if (select) {
    Array.from(select.options).forEach((option) => {
      option.selected = false;
    });
  }

  const box = document.getElementById("messageBox");
  if (box) box.innerHTML = "";
}

// =============================================
// LOGOUT
// =============================================

function logout(event) {
  if (event) event.preventDefault();

  if (confirm("Are you sure you want to logout?")) {
    clearSession();
    window.location.href = "../index.html";
  }
}

// =============================================
// ESCAPE HTML
// =============================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

