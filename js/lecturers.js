
const API_BASE =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const LECTURER_API = `${API_BASE}/lecturers`;
const DEPARTMENT_API = `${API_BASE}/departments`;
const COURSE_API = `${API_BASE}/courses`;

let lecturers = [];
let courses = [];

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("lecturerForm")
    .addEventListener("submit", saveLecturer);

  document.getElementById("resetBtn")
    .addEventListener("click", resetForm);

  document.getElementById("searchInput")
    .addEventListener("input", searchLecturers);

  document.getElementById("logoutBtn")
    .addEventListener("click", logout);

  setCurrentDate();
  loadDepartments();
  loadCourses();
  loadLecturers();
});

// SET DATE
function setCurrentDate() {
  const date = document.getElementById("currentDate");

  if (date) {
    date.textContent = new Date().toLocaleDateString();
  }
}

// API REQUEST
async function apiRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = localStorage.getItem("token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request failed");
  }

  return result;
}

// MESSAGE
function showMessage(message, type = "success") {
  const box = document.getElementById("messageBox");
  if (!box) return;

  box.innerHTML = "";

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  box.appendChild(alert);
}

// LOAD DEPARTMENTS
async function loadDepartments() {
  const select = document.getElementById("department_id");

  try {
    const result = await apiRequest(DEPARTMENT_API);

    select.innerHTML =
      '<option value="">-- Select Department --</option>';

    (result.data || []).forEach((department) => {
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

  select.innerHTML =
    '<option disabled>Loading courses...</option>';

  try {
    const result = await apiRequest(COURSE_API);
    courses = result.data || [];

    select.innerHTML = "";

    if (!courses.length) {
      select.innerHTML =
        '<option disabled>No courses found</option>';
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

    showMessage(
      "Course loading failed: " + error.message,
      "danger"
    );
  }
}

// LOAD LECTURERS
async function loadLecturers() {
  const body = document.getElementById("lecturerTableBody");

  body.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">
        Loading lecturers...
      </td>
    </tr>
  `;

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

    lecturers.forEach((lecturer) => {
      const id = Number(lecturer.id);
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
        <td id="courses-${id}">Loading...</td>
        <td>
          <button
            class="btn btn-sm btn-primary me-1"
            data-action="edit"
            data-id="${id}">
            Edit
          </button>
          <button
            class="btn btn-sm btn-danger"
            data-action="delete"
            data-id="${id}">
            Delete
          </button>
        </td>
      `;

      body.appendChild(row);
    });

    lecturers.forEach((lecturer) => {
      loadLecturerCourseNames(lecturer.id);
    });
  } catch (error) {
    console.error(error);

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

// DISPLAY ASSIGNED COURSES
async function loadLecturerCourseNames(id) {
  const cell = document.getElementById(`courses-${Number(id)}`);
  if (!cell) return;

  try {
    const result = await apiRequest(
      `${LECTURER_API}/${id}/courses`
    );

    const ids = (result.data || []).map(Number);

    const names = courses
      .filter((course) => ids.includes(Number(course.id)))
      .map((course) => course.course_code);

    cell.textContent = names.length
      ? names.join(", ")
      : "No courses assigned";
  } catch (error) {
    console.error(error);
    cell.textContent = "Could not load";
  }
}

// SAVE OR UPDATE
async function saveLecturer(event) {
  event.preventDefault();

  const id = document.getElementById("lecturerId").value;
  const button = document.getElementById("saveBtn");

  const lecturer = {
    staff_id: document.getElementById("staff_id").value.trim(),
    department_id:
      document.getElementById("department_id").value,
    first_name:
      document.getElementById("first_name").value.trim(),
    last_name:
      document.getElementById("last_name").value.trim(),
    email: document.getElementById("email").value.trim(),
  };

  const courseIds = Array.from(
    document.getElementById("course_ids").selectedOptions
  ).map((option) => Number(option.value));

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

      lecturerId = Number(result.lecturerId);
    }

    if (!lecturerId) {
      throw new Error("Lecturer ID was not returned by the API.");
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

    showMessage("Lecturer and courses saved successfully.");

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
    const result = await apiRequest(`${LECTURER_API}/${id}`);
    const lecturer = result.data;

    document.getElementById("lecturerId").value = lecturer.id;
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

    const resultCourses = await apiRequest(
      `${LECTURER_API}/${id}/courses`
    );

    const assignedIds = (resultCourses.data || []).map(Number);
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

// TABLE ACTIONS
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

// SEARCH
function searchLecturers() {
  const query = document.getElementById("searchInput")
    .value.toLowerCase();

  document.querySelectorAll(
    "#lecturerTableBody tr"
  ).forEach((row) => {
    row.style.display = row.textContent
      .toLowerCase()
      .includes(query) ? "" : "none";
  });
}

// RESET FORM
function resetForm() {
  document.getElementById("lecturerForm").reset();
  document.getElementById("lecturerId").value = "";

  document.getElementById("formTitle").textContent =
    "Add New Lecturer";

  document.getElementById("saveBtn").innerHTML =
    '<i class="bi bi-save"></i> Save Lecturer';

  document.getElementById("course_ids").selectedIndex = -1;

  const box = document.getElementById("messageBox");
  if (box) box.innerHTML = "";
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");

  window.location.href = "../index.html";
}

// ESCAPE HTML
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

