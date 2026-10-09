// =============================================
// BUK Intelligent Timetable Management System
// Courses Module - Railway API Version
// =============================================

const API_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api/courses";

const DEPARTMENT_API_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api/departments";

// =============================================
// PAGE INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("loggedIn") !== "true") {
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
    courseForm.addEventListener("submit", saveCourse);
  }

  const searchInput = document.getElementById("searchCourse");

  if (searchInput) {
    searchInput.addEventListener("keyup", searchCourse);
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
    const response = await fetch(DEPARTMENT_API_URL);

    if (!response.ok) {
      throw new Error("Failed to load departments");
    }

    const result = await response.json();

    const departments = result.data || result;

    departmentSelect.innerHTML = '<option value="">Select Department</option>';

    departments.forEach((department) => {
  const option = document.createElement("option");

  option.value = department.id;
  option.textContent = department.department_name;

  departmentSelect.appendChild(option);
});

console.log(
  "Department options loaded:",
  Array.from(departmentSelect.options).map((option) => ({
    text: option.textContent.trim(),
    value: option.value,
  }))
);
  } catch (error) {
    console.error("Department loading error:", error);
  }
}

// =============================================
// SAVE COURSE
// =============================================

async function saveCourse(e) {
  e.preventDefault();

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
console.log("Course form values:", {
  courseCode,
  courseTitle,
  courseUnit,
  courseLevel,
  departmentId: departmentElement?.value,
  semester: semesterElement?.value,
});
  const course = {
    course_code: courseCode,
    course_title: courseTitle,
    course_unit: courseUnit,
    level: courseLevel,
    department_id: departmentElement ? departmentElement.value : null,
    semester: semesterElement ? semesterElement.value : "First",
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(course),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save course");
    }

    alert("Course saved successfully.");

    document.getElementById("courseForm").reset();

    await loadCourses();
  } catch (error) {
    console.error("Save course error:", error);

    alert("Unable to save course: " + error.message);
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
      <td colspan="6" class="text-center">
        Loading courses...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(API_URL);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to load courses");
    }

    const courses = result.data || result;

    table.innerHTML = "";

    if (!courses || courses.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            No courses found.
          </td>
        </tr>
      `;
      return;
    }

    courses.forEach(function (course) {
      table.innerHTML += `
        <tr>
          <td>${course.course_code || ""}</td>

          <td>${course.course_title || ""}</td>

          <td>${course.course_unit || ""}</td>

          <td>${course.level || ""}</td>

          <td>${course.semester || ""}</td>

          <td>
            <button
              class="btn btn-warning btn-sm"
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
        </tr>
      `;
    });
  } catch (error) {
    console.error("Load courses error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">
          Unable to load courses.
        </td>
      </tr>
    `;
  }
}

// =============================================
// DELETE COURSE
// =============================================

async function deleteCourse(id) {
  if (!confirm("Delete this Course?")) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete course");
    }

    alert("Course deleted successfully.");

    await loadCourses();
  } catch (error) {
    console.error("Delete course error:", error);

    alert("Unable to delete course: " + error.message);
  }
}

// =============================================
// EDIT COURSE
// =============================================

async function editCourse(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to load course");
    }

    const course = result.data || result;

    document.getElementById("courseCode").value = course.course_code || "";

    document.getElementById("courseTitle").value = course.course_title || "";

    document.getElementById("courseUnit").value = course.course_unit || "";

    document.getElementById("courseLevel").value = course.level || "";

    const departmentElement = document.getElementById("courseDepartment");

    if (departmentElement) {
      departmentElement.value = course.department_id || "";
    }

    const semesterElement = document.getElementById("courseSemester");

    if (semesterElement) {
      semesterElement.value = course.semester || "First";
    }

    const form = document.getElementById("courseForm");

    form.dataset.editId = id;

    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.innerHTML = '<i class="bi bi-save"></i> Update Course';
    }
  } catch (error) {
    console.error("Edit course error:", error);

    alert("Unable to load course: " + error.message);
  }
}

// =============================================
// UPDATE COURSE
// =============================================

async function updateCourse(id, course) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(course),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update course");
    }

    alert("Course updated successfully.");

    document.getElementById("courseForm").reset();

    delete document.getElementById("courseForm").dataset.editId;

    await loadCourses();
  } catch (error) {
    console.error("Update course error:", error);

    alert("Unable to update course: " + error.message);
  }
}

// =============================================
// HANDLE FORM UPDATE
// =============================================

document.addEventListener("submit", function (e) {
  if (e.target.id !== "courseForm") return;

  const form = e.target;

  const editId = form.dataset.editId;

  if (!editId) return;

  e.preventDefault();

  const departmentElement = document.getElementById("courseDepartment");

  const semesterElement = document.getElementById("courseSemester");

  const course = {
    course_code: document.getElementById("courseCode").value.trim(),

    course_title: document.getElementById("courseTitle").value.trim(),

    course_unit: document.getElementById("courseUnit").value,

    level: document.getElementById("courseLevel").value,

    department_id: departmentElement ? departmentElement.value : null,

    semester: semesterElement ? semesterElement.value : "First",
  };

  updateCourse(editId, course);
});

// =============================================
// SEARCH COURSE
// =============================================

function searchCourse() {
  const searchInput = document.getElementById("searchCourse");

  if (!searchInput) return;

  const keyword = searchInput.value.toLowerCase();

  const rows = document.querySelectorAll("#courseTable tr");

  rows.forEach(function (row) {
    row.style.display = row.innerText.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
}

// =============================================
// LOGOUT
// =============================================

function logout(e) {
  e.preventDefault();

  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "../index.html";
}
