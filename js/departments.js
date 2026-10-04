// =============================================
// BUK Intelligent Timetable Management System
// Departments Module
// MySQL API Version
// =============================================

const API_URL = "http://localhost:5000/api/departments";
const FACULTY_API_URL = "http://localhost:5000/api/faculties";

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

    if (
      result.success &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      result.data.forEach(function (faculty) {
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
// Save Department
// =============================================

async function saveDepartment(e) {
  e.preventDefault();

  const facultyId = document.getElementById("faculty").value.trim();

  const departmentCode = document.getElementById("deptCode").value.trim();

  const departmentName = document.getElementById("deptName").value.trim();

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

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        faculty_id: Number(facultyId),
        department_name: departmentName,
        department_code: departmentCode,
        hod: null,
      }),
    });

    const result = await response.json();

    console.log("Save Department Response:", result);

    if (!response.ok || !result.success) {
      alert(result.message || "Failed to save department.");

      return;
    }

    alert("Department added successfully.");

    document.getElementById("departmentForm").reset();

    // Reload department list
    await loadDepartments();
  } catch (error) {
    console.error("Save Department Error:", error);

    alert("Unable to connect to the server. Make sure the backend is running.");
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

    if (
      !result.success ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      table.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted py-4">
            No departments found.
          </td>
        </tr>
      `;

      return;
    }

    result.data.forEach(function (department) {
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

    if (!response.ok || !result.success) {
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

    if (!response.ok || !result.success) {
      alert(result.message || "Department not found.");

      return;
    }

    const department = result.data;

    // Make sure faculties are loaded first
    await loadFacultyDropdown();

    document.getElementById("faculty").value = department.faculty_id;

    document.getElementById("deptCode").value = department.department_code;

    document.getElementById("deptName").value = department.department_name;

    /*
      We temporarily delete the old record.
      When the user clicks Save, the updated
      department will be created.
    */

    await deleteDepartmentWithoutConfirmation(id);

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
// Delete Without Confirmation
// =============================================

async function deleteDepartmentWithoutConfirmation(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    console.log("Delete For Edit Response:", result);

    await loadDepartments();
  } catch (error) {
    console.error("Edit preparation error:", error);
  }
}

// =============================================
// Search Department
// =============================================

function searchDepartment() {
  const searchInput = document.getElementById("searchDepartment");

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
