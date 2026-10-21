
 // =============================================
 // BUK Intelligent Timetable Management System
 // Courses Module - Railway API Version
 // =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const API_URL = `${API_BASE_URL}/courses`;
const DEPARTMENT_API_URL = `${API_BASE_URL}/departments`;

// =============================================
// AUTHENTICATION HELPERS
// =============================================

function getToken() {
  return localStorage.getItem("token");
}

function getRequestOptions(options = {}) {
  const token = getToken();

  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

async function apiRequest(url, options = {}) {
  if (!getToken()) {
    clearSession();
    window.location.href = "../index.html";
    throw new Error("Your session has expired. Please log in again.");
  }

  const response = await fetch(url, getRequestOptions(options));

  if (response.status === 401) {
    clearSession();
    window.location.href = "../index.html";
    throw new Error("Your session has expired. Please log in again.");
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

function clearSession() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function getDataArray(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  return [];
}

// =============================================
// PAGE INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", function () {
  if (
    localStorage.getItem("loggedIn") !== "true" ||
    !getToken()
  ) {
    clearSession();
    window.location.href = "../index.html";
    return;
  }

  const currentDate = document.getElementById("currentDate");

  if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  loadDepartments();
  loadCourses();

  const courseForm = document.getElementById("courseForm");

  if (courseForm) {
    courseForm.addEventListener("submit", handleCourseSubmit);
  }

  const searchInput = document.getElementById("searchCourse");

  if (searchInput) {
    searchInput.addEventListener("input", searchCourse);
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// =============================================
// LOAD DEPARTMENTS
// =============================================

async function loadDepartments() {
  const departmentSelect = document.getElementById("courseDepartment");

  if (!departmentSelect) return;

  try {
    const result = await apiRequest(DEPARTMENT_API_URL);
    const departments = getDataArray(result);

    departmentSelect.innerHTML =
      '<option value="">Select Department</option>';

    departments.forEach((department) => {
      const option = document.createElement("option");

      option.value = department.id;
      option.textContent = department.department_name;

      departmentSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Department loading error:", error);
  }
}

// =============================================
// HANDLE COURSE FORM
// =============================================

async function handleCourseSubmit(e) {
  e.preventDefault();

  const form = e.currentTarget;

  const courseCode = document.getElementById("courseCode").value.trim();
  const courseTitle = document.getElementById("courseTitle").value.trim();
  const courseUnit = document.getElementById("courseUnit").value;
  const courseLevel = document.getElementById("courseLevel").value;

  const departmentElement = document.getElementById("courseDepartment");
  const semesterElement = document.getElementById("courseSemester");

  if (!courseCode || !courseTitle || !courseUnit || !courseLevel) {
    alert("Please fill in all required course information.");
    return;
  }

  const course = {
    course_code: courseCode,
    course_title: courseTitle,
    course_unit: courseUnit,
    level: courseLevel,
    department_id: departmentElement?.value || null,
    semester: semesterElement?.value || "First",
  };

  const editId = form.dataset.editId;
  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) submitButton.disabled = true;

  try {
    const result = await apiRequest(
      editId ? `${API_URL}/${editId}` : API_URL,
      {
        method: editId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(course),
      }
    );

    alert(
      result.message ||
        (editId
          ? "Course updated successfully."
          : "Course saved successfully.")
    );

    form.reset();
    delete form.dataset.editId;

    if (submitButton) {
      submitButton.innerHTML =
        '<i class="bi bi-save"></i> Save Course';
    }

    await loadCourses();
  } catch (error) {
    console.error("Save course error:", error);
    alert("Unable to save course: " + error.message);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

// =============================================
// LOAD COURSES
// =============================================

async function loadCourses() {
  const table = document.getElementById("courseTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="6" class="text-center">Loading courses...</td>
    </tr>
  `;

  try {
    const result = await apiRequest(API_URL);
    const courses = getDataArray(result);

    table.innerHTML = "";

    if (courses.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No courses found.</td>
        </tr>
      `;
      return;
    }

    courses.forEach((course) => {
      const row = document.createElement("tr");

      [
        course.course_code,
        course.course_title,
        course.course_unit,
        course.level,
        course.semester,
      ].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value ?? "";
        row.appendChild(cell);
      });

      const actions = document.createElement("td");

      const editButton = document.createElement("button");
      editButton.className = "btn btn-warning btn-sm me-1";
      editButton.title = "Edit Course";
      editButton.innerHTML = '<i class="bi bi-pencil-square"></i>';
      editButton.addEventListener("click", () => editCourse(course.id));

      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.title = "Delete Course";
      deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
      deleteButton.addEventListener("click", () => deleteCourse(course.id));

      actions.append(editButton, deleteButton);
      row.appendChild(actions);
      table.appendChild(row);
    });
  } catch (error) {
    console.error("Load courses error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">
          Unable to load courses: ${escapeHTML(error.message)}
        </td>
      </tr>
    `;
  }
}

// =============================================
// EDIT COURSE
// =============================================

async function editCourse(id) {
  try {
    const result = await apiRequest(`${API_URL}/${id}`);
    const course = result.data || result;

    document.getElementById("courseCode").value =
      course.course_code || "";

    document.getElementById("courseTitle").value =
      course.course_title || "";

    document.getElementById("courseUnit").value =
      course.course_unit || "";

    document.getElementById("courseLevel").value =
      course.level || "";

    const departmentElement = document.getElementById("courseDepartment");
    const semesterElement = document.getElementById("courseSemester");

    if (departmentElement) {
      departmentElement.value = course.department_id || "";
    }

    if (semesterElement) {
      semesterElement.value = course.semester || "First";
    }

    const form = document.getElementById("courseForm");
    form.dataset.editId = id;

    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.innerHTML =
        '<i class="bi bi-save"></i> Update Course';
    }

    form.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("Edit course error:", error);
    alert("Unable to load course: " + error.message);
  }
}

// =============================================
// DELETE COURSE
// =============================================

async function deleteCourse(id) {
  if (!confirm("Delete this course?")) return;

  try {
    const result = await apiRequest(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    alert(result.message || "Course deleted successfully.");
    await loadCourses();
  } catch (error) {
    console.error("Delete course error:", error);
    alert("Unable to delete course: " + error.message);
  }
}

// =============================================
// SEARCH COURSE
// =============================================

function searchCourse() {
  const searchInput = document.getElementById("searchCourse");

  if (!searchInput) return;

  const keyword = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll("#courseTable tr");

  rows.forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
}

// =============================================
// SAFE HTML FOR ERROR MESSAGES
// =============================================

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

// =============================================
// LOGOUT
// =============================================

function logout(e) {
  if (e) e.preventDefault();

  if (confirm("Are you sure you want to logout?")) {
    clearSession();
    window.location.href = "../index.html";
  }
}
