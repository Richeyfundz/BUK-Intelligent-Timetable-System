javascript;
// =============================================
// BUK Intelligent Timetable Management System
// Departments Module
// Railway MySQL API Version
// =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const API_URL = `${API_BASE_URL}/departments`;
const FACULTY_API_URL = `${API_BASE_URL}/faculties`;

let editingDepartmentId = null;

console.log("DEPARTMENTS.JS LOADED");

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

  // Load Faculties
  loadFacultyDropdown();

  // Load Departments
  loadDepartments();

  // Department Form
  const departmentForm = document.getElementById("departmentForm");

  if (departmentForm) {
    departmentForm.addEventListener("submit", saveDepartment);
  }

  // Search
  const searchInput = document.getElementById("searchDepartment");

  if (searchInput) {
    searchInput.addEventListener("keyup", searchDepartment);
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// =============================================
// Load Faculties into Dropdown
// =============================================

async function loadFacultyDropdown() {
  const dropdown = document.getElementById("faculty");

  if (!dropdown) {
    console.error("Faculty dropdown not found.");
    return;
  }

  try {
    const response = await fetch(FACULTY_API_URL);

    const result = await response.json();

    console.log("Faculty API Response:", result);

    dropdown.innerHTML = '<option value="">-- Select Faculty --</option>';

    const faculties = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : [];

    if (faculties.length > 0) {
      faculties.forEach(function (faculty) {
        const option = document.createElement("option");

        option.value = faculty.id;
        option.textContent = faculty.faculty_name;

        dropdown.appendChild(option);
      });

      console.log("Faculties loaded successfully.");
    } else {
      dropdown.innerHTML = '<option value="">No faculties available</option>';

      console.log("No faculties found.");
    }
  } catch (error) {
    console.error("Faculty Loading Error:", error);

    dropdown.innerHTML = '<option value="">Unable to load faculties</option>';

    alert("Unable to load faculties from the server.");
  }
}

// =============================================
// Save / Update Department
// =============================================

async function saveDepartment(e) {
  e.preventDefault();

  const facultyElement = document.getElementById("faculty");
  const codeElement = document.getElementById("deptCode");
  const nameElement = document.getElementById("deptName");

  if (!facultyElement || !codeElement || !nameElement) {
    alert("Department form fields were not found.");
    return;
  }

  const facultyId = facultyElement.value.trim();
  const departmentCode = codeElement.value.trim();
  const departmentName = nameElement.value.trim();

  // Validation
  if (!facultyId) {
    alert("Please select a Faculty.");
    return;
  }

  if (!departmentCode) {
    alert("Please enter the Department Code.");
    return;
  }

  if (!departmentName) {
    alert("Please enter the Department Name.");
    return;
  }

  const departmentData = {
    faculty_id: Number(facultyId),
    department_name: departmentName,
    department_code: departmentCode,
    hod: null,
  };

  try {
    let response;

    // =============================================
    // UPDATE
    // =============================================

    if (editingDepartmentId) {
      response = await fetch(`${API_URL}/${editingDepartmentId}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(departmentData),
      });
    }

    // =============================================
    // CREATE
    // =============================================
    else {
      response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(departmentData),
      });
    }

    const result = await response.json();

    console.log("Department Save Response:", result);

    if (!response.ok || result.success === false) {
      alert(result.message || "Failed to save department.");
      return;
    }

    if (editingDepartmentId) {
      alert("Department updated successfully.");
    } else {
      alert("Department added successfully.");
    }

    // Reset
    document.getElementById("departmentForm").reset();

    editingDepartmentId = null;

    await loadDepartments();
  } catch (error) {
    console.error("Save Department Error:", error);

    alert("Unable to connect to the server.");
  }
}

// =============================================
// Load Departments
// =============================================

async function loadDepartments() {
  const table = document.getElementById("departmentTable");

  if (!table) {
    console.error("Department table not found.");
    return;
  }

  try {
    const response = await fetch(API_URL);

    const result = await response.json();

    console.log("Department API Response:", result);

    table.innerHTML = "";

    const departments = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : [];

    if (departments.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted py-4">
            No departments found.
          </td>
        </tr>
      `;

      return;
    }

    departments.forEach(function (department) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>
          ${escapeHTML(department.department_code)}
        </td>

        <td>
          ${escapeHTML(department.department_name)}
        </td>

        <td>
          ${escapeHTML(department.faculty_name || "N/A")}
        </td>

        <td>
          <button
            type="button"
            class="btn btn-warning btn-sm me-1"
            onclick="editDepartment(${department.id})"
          >
            <i class="bi bi-pencil-square"></i>
          </button>

          <button
            type="button"
            class="btn btn-danger btn-sm"
            onclick="deleteDepartment(${department.id})"
          >
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;

      table.appendChild(row);
    });
  } catch (error) {
    console.error("Load Departments Error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger py-4">
          Unable to load departments.
        </td>
      </tr>
    `;
  }
}

// =============================================
// Delete Department
// =============================================

async function deleteDepartment(id) {
  if (!confirm("Delete this Department?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    console.log("Delete Department Response:", result);

    if (!response.ok || result.success === false) {
      alert(result.message || "Failed to delete department.");
      return;
    }

    alert("Department deleted successfully.");

    await loadDepartments();
  } catch (error) {
    console.error("Delete Department Error:", error);

    alert("Unable to connect to the server.");
  }
}

// =============================================
// Edit Department
// =============================================

async function editDepartment(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);

    const result = await response.json();

    console.log("Edit Department Response:", result);

    if (!response.ok || result.success === false) {
      alert(result.message || "Department not found.");
      return;
    }

    const department = result.data;

    // Load faculties first
    await loadFacultyDropdown();

    const faculty = document.getElementById("faculty");
    const code = document.getElementById("deptCode");
    const name = document.getElementById("deptName");

    if (faculty) {
      faculty.value = department.faculty_id;
    }

    if (code) {
      code.value = department.department_code;
    }

    if (name) {
      name.value = department.department_name;
    }

    // Store ID for PUT update
    editingDepartmentId = id;

    // Change submit button text if available
    const submitButton = document.querySelector(
      '#departmentForm button[type="submit"]',
    );

    if (submitButton) {
      submitButton.innerHTML = '<i class="bi bi-save"></i> Update Department';
    }

    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Edit Department Error:", error);

    alert("Unable to load department.");
  }
}

// =============================================
// Search Department
// =============================================

function searchDepartment() {
  const searchInput = document.getElementById("searchDepartment");

  if (!searchInput) {
    return;
  }

  const keyword = searchInput.value.toLowerCase().trim();

  const rows = document.querySelectorAll("#departmentTable tr");

  rows.forEach(function (row) {
    const text = row.innerText.toLowerCase();

    row.style.display = text.includes(keyword) ? "" : "none";
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
// HTML Escape
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
