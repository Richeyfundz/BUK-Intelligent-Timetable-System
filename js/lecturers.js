
const API_BASE =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const LECTURER_API = `${API_BASE}/lecturers`;
const DEPARTMENT_API = `${API_BASE}/departments`;
const COURSE_API = `${LECTURER_API}/courses`;

let lecturers = [];
let courses = [];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("lecturerForm");

  if (
    localStorage.getItem("loggedIn") !== "true"
  ) {
    window.location.href = "../index.html";
    return;
  }

  form.addEventListener("submit", saveLecturer);

  document.getElementById("resetBtn")
    .addEventListener("click", resetForm);

  document.getElementById("searchInput")
    .addEventListener("input", searchLecturers);

  document.getElementById("logoutBtn")
    .addEventListener("click", logout);

  loadDepartments();
  loadCourses();
  loadLecturers();
});

// COMMON API REQUEST
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || "Request failed"
    );
  }

  return result;
}

// SHOW MESSAGE
function showMessage(message, type = "success") {
  const box = document.getElementById("messageBox");

  box.innerHTML = "";

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  box.appendChild(alert);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// LOAD DEPARTMENTS
async function loadDepartments() {
  try {
    const result = await apiRequest(DEPARTMENT_API);
    const select = document.getElementById("department_id");

    select.innerHTML =
      '<option value="">Select department</option>';

    const rows = result.data || [];

    rows.forEach((department) => {
      const option = document.createElement("option");

      option.value = department.id;
      option.textContent = department.department_name;

      select.appendChild(option);
    });
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

// LOAD COURSES
async function loadCourses() {
  const select = document.getElementById("course_ids");

  try {
    const result = await apiRequest(COURSE_API);
    courses = result.data || [];

    select.innerHTML = "";

    courses.forEach((course) => {
      const option = document.createElement("option");

      option.value = course.id;
      option.textContent =
        `${course.course_code} - ${course.course_title}` +
        ` (${course.level}, ${course.semester})`;

      select.appendChild(option);
    });
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

// LOAD LECTURERS
async function loadLecturers() {
  const body = document.getElementById(
    "lecturerTableBody"
  );

  try {
    const result = await apiRequest(LECTURER_API);
    lecturers = result.data || [];

    body.innerHTML = "";

    if (!lecturers.length) {
      body.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">
            No lecturers found.
          </td>
        </tr>
      `;
      return;
    }

    for (const lecturer of lecturers) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHTML(lecturer.staff_id)}</td>
        <td>
          ${escapeHTML(lecturer.first_name)}
          ${escapeHTML(lecturer.last_name)}
        </td>
        <td>
          ${escapeHTML(lecturer.department_name || "")}
        </td>
        <td id="courses-${Number(lecturer.id)}">
          Loading...
        </td>
        <td>
          <button
            class="btn btn-sm btn-primary me-1"
            data-action="edit"
            data-id="${Number(lecturer.id)}">
            Edit
          </button>
          <button
            class="btn btn-sm btn-danger"
            data-action="delete"
            data-id="${Number(lecturer.id)}">
            Delete
          </button>
        </td>
      `;

      body.appendChild(row);

      loadLecturerCourseNames(lecturer.id);
    }
  } catch (error) {
    body.innerHTML = `
      <tr>
        <td colspan="5" class="text-danger">
          ${escapeHTML(error.message)}
        </td>
      </tr>
    `;
  }
}

// SHOW ASSIGNED COURSE NAMES
async function loadLecturerCourseNames(lecturerId) {
  const cell = document.getElementById(
    `courses-${Number(lecturerId)}`
  );

  if (!cell) return;

  try {
    const result = await apiRequest(
      `${LECTURER_API}/${lecturerId}/courses`
    );

    const ids = result.data || [];

    const names = courses
      .filter((course) => ids.includes(Number(course.id)))
      .map((course) => course.course_code);

    cell.textContent = names.length
      ? names.join(", ")
      : "No courses assigned";
  } catch {
    cell.textContent = "Could not load";
  }
}

// SAVE OR UPDATE LECTURER
async function saveLecturer(event) {
  event.preventDefault();

  const id = document.getElementById("lecturerId").value;

  const lecturer = {
    staff_id: document.getElementById("staff_id").value.trim(),
    department_id: document.getElementById("department_id").value,
    first_name: document.getElementById("first_name").value.trim(),
    last_name: document.getElementById("last_name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    academic_rank:
      document.getElementById("academic_rank").value.trim(),
    specialization:
      document.getElementById("specialization").value.trim(),
  };

  const courseIds = Array.from(
    document.getElementById("course_ids").selectedOptions
  ).map((option) => Number(option.value));

  const button = document.getElementById("saveBtn");
  button.disabled = true;

  try {
    let lecturerId = id;

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

      lecturerId = result.lecturerId;
    }

    await apiRequest(
      `${LECTURER_API}/${lecturerId}/courses`,
      {
        method: "PUT",
        body: JSON.stringify({
          course_ids: courseIds,
        }),
      }
    );

    showMessage(
      "Lecturer and course assignments saved successfully."
    );

    resetForm();
    await loadLecturers();
  } catch (error) {
    showMessage(error.message, "danger");
  } finally {
    button.disabled = false;
  }
}

// EDIT LECTURER
async function editLecturer(id) {
  try {
    const result = await apiRequest(
      `${LECTURER_API}/${id}`
    );

    const lecturer = result.data;

    document.getElementById("lecturerId").value =
      lecturer.id;

    document.getElementById("staff_id").value =
      lecturer.staff_id || "";

    document.getElementById("department_id").value =
      lecturer.department_id || "";

    document.getElementById("first_name").value =
      lecturer.first_name || "";

    document.getElementById("last_name").value =
      lecturer.last_name || "";

    document.getElementById("email").value =
      lecturer.email || "";

    document.getElementById("phone").value =
      lecturer.phone || "";

    document.getElementById("academic_rank").value =
      lecturer.academic_rank || "";

    document.getElementById("specialization").value =
      lecturer.specialization || "";

    const assignment = await apiRequest(
      `${LECTURER_API}/${id}/courses`
    );

    const assignedIds = (assignment.data || [])
      .map(Number);

    const select = document.getElementById("course_ids");

    Array.from(select.options).forEach((option) => {
      option.selected = assignedIds.includes(
        Number(option.value)
      );
    });

    document.getElementById("formTitle").textContent =
      "Edit Lecturer";

    document.getElementById("saveBtn").textContent =
      "Update Lecturer";

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(error.message, "danger");
  }
}

// DELETE LECTURER
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

// TABLE BUTTONS
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  const id = Number(button.dataset.id);

  if (button.dataset.action === "edit") {
    editLecturer(id);
  }

  if (button.dataset.action === "delete") {
    deleteLecturer(id);
  }
});

// SEARCH LECTURERS
function searchLecturers() {
  const query = document.getElementById(
    "searchInput"
  ).value.toLowerCase();

  document.querySelectorAll(
    "#lecturerTableBody tr"
  ).forEach((row) => {
    row.style.display = row.textContent
      .toLowerCase()
      .includes(query) ? "" : "none";
  });
}

// CLEAR FORM
function resetForm() {
  document.getElementById("lecturerForm").reset();

  document.getElementById("lecturerId").value = "";

  document.getElementById("formTitle").textContent =
    "Add Lecturer";

  document.getElementById("saveBtn").textContent =
    "Save Lecturer";

  document.getElementById("messageBox").innerHTML = "";

  document.getElementById("course_ids")
    .selectedIndex = -1;
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");

  window.location.href = "../index.html";
}

// HTML SAFETY
function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]
  );
}

