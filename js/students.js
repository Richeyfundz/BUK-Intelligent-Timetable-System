// =============================================
// BUK Intelligent Timetable Management System
// Students Module - Railway API Version
// =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const STUDENT_API_URL = `${API_BASE_URL}/students`;
const DEPARTMENT_API_URL = `${API_BASE_URL}/departments`;

let editingStudentId = null;

// =============================================
// Page Initialization
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

  loadDepartmentDropdown();
  loadStudents();

  const studentForm = document.getElementById("studentForm");

  if (studentForm) {
    studentForm.addEventListener("submit", saveStudent);
  }

  const searchInput = document.getElementById("searchStudent");

  if (searchInput) {
    searchInput.addEventListener("keyup", searchStudent);
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// =============================================
// Get API Data
// =============================================

function getDataArray(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (result && Array.isArray(result.data)) {
    return result.data;
  }

  if (result && Array.isArray(result.students)) {
    return result.students;
  }

  if (result && Array.isArray(result.departments)) {
    return result.departments;
  }

  return [];
}

// =============================================
// Load Departments
// =============================================

async function loadDepartmentDropdown() {
  const dropdown = document.getElementById("department");

  if (!dropdown) return;

  dropdown.innerHTML = `
    <option value="">-- Select Department --</option>
  `;

  try {
    const response = await fetch(DEPARTMENT_API_URL);

    if (!response.ok) {
      throw new Error("Failed to load departments");
    }

    const result = await response.json();

    const departments = getDataArray(result);

    departments.forEach(function (department) {
      dropdown.innerHTML += `
        <option value="${department.id}">
          ${escapeHTML(department.department_name || department.name || "")}
        </option>
      `;
    });
  } catch (error) {
    console.error("Error loading departments:", error);

    dropdown.innerHTML = `
      <option value="">Unable to load departments</option>
    `;
  }
}

// =============================================
// Save Student
// =============================================

async function saveStudent(e) {
  e.preventDefault();

  const regNumber = document.getElementById("regNumber").value.trim();
  const studentName = document.getElementById("studentName").value.trim();
  const department = document.getElementById("department").value;
  const level = document.getElementById("level").value;

  if (!regNumber || !studentName || !department || !level) {
    alert("Please fill in all student details.");
    return;
  }

  // Split full name
  const nameParts = studentName.split(/\s+/);

  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ") || "";

  const studentData = {
    registration_number: regNumber,
    first_name: firstName,
    last_name: lastName,
    department_id: department,
    level: level,
  };

  try {
    let response;

    if (editingStudentId) {
      // UPDATE
      response = await fetch(`${STUDENT_API_URL}/${editingStudentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });
    } else {
      // CREATE
      response = await fetch(STUDENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || result.error || "Failed to save student",
      );
    }

    alert(
      editingStudentId
        ? "Student updated successfully."
        : "Student added successfully.",
    );

    editingStudentId = null;

    document.getElementById("studentForm").reset();

    loadStudents();
  } catch (error) {
    console.error("Error saving student:", error);

    alert("Failed to save student: " + error.message);
  }
}

// =============================================
// Load Students
// =============================================

async function loadStudents() {
  const table = document.getElementById("studentTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">
        Loading students...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(STUDENT_API_URL);

    if (!response.ok) {
      throw new Error("Failed to load students");
    }

    const result = await response.json();

    const students = getDataArray(result);

    table.innerHTML = "";

    if (students.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">
            No students found.
          </td>
        </tr>
      `;
      return;
    }

    students.forEach(function (student) {
      const fullName =
        student.name ||
        `${student.first_name || ""} ${student.last_name || ""}`.trim();

      const registrationNumber =
        student.registration_number ||
        student.regNumber ||
        student.registration_no ||
        "";

      const departmentName =
        student.department_name || student.department || "";

      const studentLevel = student.level || "";

      table.innerHTML += `
        <tr>
          <td>${escapeHTML(registrationNumber)}</td>

          <td>${escapeHTML(fullName)}</td>

          <td>${escapeHTML(departmentName)}</td>

          <td>${escapeHTML(studentLevel)}</td>

          <td>
            <button
              class="btn btn-warning btn-sm"
              onclick="editStudent(${student.id})"
              title="Edit Student"
            >
              <i class="bi bi-pencil-square"></i>
            </button>

            <button
              class="btn btn-danger btn-sm"
              onclick="deleteStudent(${student.id})"
              title="Delete Student"
            >
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error loading students:", error);

    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">
          Failed to load students.
        </td>
      </tr>
    `;
  }
}

// =============================================
// Delete Student
// =============================================

async function deleteStudent(id) {
  if (!confirm("Delete this student?")) {
    return;
  }

  try {
    const response = await fetch(`${STUDENT_API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || result.error || "Failed to delete student",
      );
    }

    alert("Student deleted successfully.");

    loadStudents();
  } catch (error) {
    console.error("Error deleting student:", error);

    alert("Failed to delete student: " + error.message);
  }
}

// =============================================
// Edit Student
// =============================================

async function editStudent(id) {
  try {
    const response = await fetch(`${STUDENT_API_URL}/${id}`);

    if (!response.ok) {
      throw new Error("Failed to load student");
    }

    const result = await response.json();

    const student = result.data || result.student || result;

    editingStudentId = student.id || id;

    const fullName =
      student.name ||
      `${student.first_name || ""} ${student.last_name || ""}`.trim();

    document.getElementById("regNumber").value =
      student.registration_number ||
      student.regNumber ||
      student.registration_no ||
      "";

    document.getElementById("studentName").value = fullName;

    document.getElementById("department").value = student.department_id || "";

    document.getElementById("level").value = student.level || "";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Error loading student:", error);

    alert("Failed to load student: " + error.message);
  }
}

// =============================================
// Search Student
// =============================================

function searchStudent() {
  const searchInput = document.getElementById("searchStudent");

  if (!searchInput) return;

  const keyword = searchInput.value.toLowerCase();

  const rows = document.querySelectorAll("#studentTable tr");

  rows.forEach(function (row) {
    row.style.display = row.innerText.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
}

// =============================================
// Logout
// =============================================

function logout(e) {
  e.preventDefault();

  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "../index.html";
}

// =============================================
// Escape HTML
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
