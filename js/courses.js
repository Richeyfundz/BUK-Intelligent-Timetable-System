// =============================================
// BUK Intelligent Timetable Management System
// Courses Module
// Railway + MySQL API Version
// =============================================

const API_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api/courses";

const DEPARTMENT_API_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api/departments";

let editingCourseId = null;
let courses = [];

// =============================================
// PAGE LOAD
// =============================================

document.addEventListener("DOMContentLoaded", function () {
  // Login Check
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "../index.html";
    return;
  }

  // Current Date
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
    courseForm.addEventListener("submit", saveCourse);
  }

  const searchCourseInput = document.getElementById("searchCourse");

  if (searchCourseInput) {
    searchCourseInput.addEventListener("keyup", searchCourse);
  }

  const resetCourseBtn = document.getElementById("resetCourseBtn");

  if (resetCourseBtn) {
    resetCourseBtn.addEventListener("click", resetCourseForm);
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

  if (!departmentSelect) {
    return;
  }

  try {
    const response = await fetch(DEPARTMENT_API_URL);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load departments.");
    }

    const departments = Array.isArray(result.data) ? result.data : [];

    departmentSelect.innerHTML = `
      <option value="">Select Department</option>
    `;

    departments.forEach(function (department) {
      const option = document.createElement("option");

      option.value = department.id;

      option.textContent =
        department.name ||
        department.department_name ||
        department.department ||
        department.code ||
        "Department";

      departmentSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Department loading error:", error);

    departmentSelect.innerHTML = `
      <option value="">Unable to load departments</option>
    `;
  }
}

// =============================================
// LOAD COURSES
// =============================================

async function loadCourses() {
  const table = document.getElementById("courseTable");

  if (!table) {
    return;
  }

  table.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted py-4">
        Loading courses...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(API_URL);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load courses.");
    }

    courses = Array.isArray(result.data) ? result.data : [];

    displayCourses(courses);
  } catch (error) {
    console.error("Course loading error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger py-4">
          Unable to load courses from the server.
        </td>
      </tr>
    `;
  }
}

// =============================================
// DISPLAY COURSES
// =============================================

function displayCourses(courseList) {
  const table = document.getElementById("courseTable");

  if (!table) {
    return;
  }

  table.innerHTML = "";

  if (!courseList || courseList.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          No courses found.
        </td>
      </tr>
    `;

    return;
  }

  courseList.forEach(function (course) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <strong>${escapeHTML(course.course_code || "")}</strong>
      </td>

      <td>
        ${escapeHTML(course.course_title || "")}
      </td>

      <td>
        ${escapeHTML(course.course_unit || "")}
      </td>

      <td>
        ${escapeHTML(course.level || "")}
      </td>

      <td>
        ${escapeHTML(
          course.department_name || course.department || "Not assigned",
        )}
      </td>

      <td>
        ${escapeHTML(course.semester || "")}
      </td>

      <td>

        <button
          class="btn btn-warning btn-sm me-1"
          onclick="editCourse(${course.id})"
          title="Edit Course"
        >
          <i class="bi bi-pencil-square"></i>
        </button>

        <button
          class="btn btn-danger btn-sm"
          onclick="deleteCourse(${course.id})"
          title="Delete Course"
        >
          <i class="bi bi-trash"></i>
        </button>

      </td>
    `;

    table.appendChild(row);
  });
}

// =============================================
// SAVE / UPDATE COURSE
// =============================================

async function saveCourse(e) {
  e.preventDefault();

  const courseCode = document.getElementById("courseCode").value.trim();

  const courseTitle = document.getElementById("courseTitle").value.trim();

  const courseUnit = document.getElementById("courseUnit").value;

  const courseLevel = document.getElementById("courseLevel").value;

  const departmentId = document.getElementById("courseDepartment").value;

  const semester = document.getElementById("courseSemester").value;

  if (
    !courseCode ||
    !courseTitle ||
    !courseUnit ||
    !courseLevel ||
    !departmentId ||
    !semester
  ) {
    alert("Please complete all course fields.");
    return;
  }

  const courseData = {
    department_id: departmentId,
    course_code: courseCode,
    course_title: courseTitle,
    course_unit: courseUnit,
    level: courseLevel,
    semester: semester,
  };

  try {
    let response;

    if (editingCourseId) {
      response = await fetch(`${API_URL}/${editingCourseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });
    } else {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to save course.");
    }

    alert(
      result.message ||
        (editingCourseId
          ? "Course updated successfully."
          : "Course created successfully."),
    );

    resetCourseForm();

    loadCourses();
  } catch (error) {
    console.error("Course save error:", error);

    alert(error.message || "Unable to connect to the server.");
  }
}

// =============================================
// EDIT COURSE
// =============================================

function editCourse(id) {
  const course = courses.find((item) => Number(item.id) === Number(id));

  if (!course) {
    alert("Course not found.");
    return;
  }

  editingCourseId = id;

  document.getElementById("courseCode").value = course.course_code || "";

  document.getElementById("courseTitle").value = course.course_title || "";

  document.getElementById("courseUnit").value = course.course_unit || "";

  document.getElementById("courseLevel").value = course.level || "";

  document.getElementById("courseDepartment").value =
    course.department_id || "";

  document.getElementById("courseSemester").value = course.semester || "";

  const submitButton = document.querySelector(
    "#courseForm button[type='submit']",
  );

  if (submitButton) {
    submitButton.innerHTML = `
      <i class="bi bi-pencil-square"></i>
      Update Course
    `;
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// =============================================
// DELETE COURSE
// =============================================

async function deleteCourse(id) {
  const confirmed = confirm("Are you sure you want to delete this course?");

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to delete course.");
    }

    alert(result.message || "Course deleted successfully.");

    loadCourses();
  } catch (error) {
    console.error("Course delete error:", error);

    alert(error.message || "Unable to connect to the server.");
  }
}

// =============================================
// SEARCH COURSE
// =============================================

function searchCourse() {
  const keyword = document
    .getElementById("searchCourse")
    .value.toLowerCase()
    .trim();

  const filteredCourses = courses.filter(function (course) {
    const searchableText = `
      ${course.course_code || ""}
      ${course.course_title || ""}
      ${course.course_unit || ""}
      ${course.level || ""}
      ${course.department_name || ""}
      ${course.department || ""}
      ${course.semester || ""}
    `.toLowerCase();

    return searchableText.includes(keyword);
  });

  displayCourses(filteredCourses);
}

// =============================================
// RESET FORM
// =============================================

function resetCourseForm() {
  editingCourseId = null;

  const form = document.getElementById("courseForm");

  if (form) {
    form.reset();
  }

  const submitButton = document.querySelector(
    "#courseForm button[type='submit']",
  );

  if (submitButton) {
    submitButton.innerHTML = `
      <i class="bi bi-save"></i>
      Save Course
    `;
  }
}

// =============================================
// ESCAPE HTML
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
// LOGOUT
// =============================================

function logout(e) {
  if (e) {
    e.preventDefault();
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");

  window.location.href = "../index.html";
}
