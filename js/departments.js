
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

// =============================================
// Authentication
// =============================================

function getToken() {
  return localStorage.getItem("token");
}

function clearSession() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

async function apiRequest(url, options = {}) {
  const token = getToken();

  if (!token || localStorage.getItem("loggedIn") !== "true") {
    clearSession();
    throw new Error("Please log in again.");
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
    throw new Error("Your session has expired. Please log in again.");
  }

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "The request failed.");
  }

  return result;
}

// =============================================
// Page Initialization
// =============================================

document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("loggedIn") !== "true" || !getToken()) {
    clearSession();
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

  const departmentForm = document.getElementById("departmentForm");

  if (departmentForm) {
    departmentForm.addEventListener("submit", saveDepartment);
  }

  const searchInput = document.getElementById("searchDepartment");

  if (searchInput) {
    searchInput.addEventListener("keyup", searchDepartment);
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  loadFacultyDropdown();
  loadDepartments();
});

// =============================================
// HTML Escape
// =============================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

// =============================================
// Load Faculties into Dropdown
// =============================================

async function loadFacultyDropdown() {
  const dropdown = document.getElementById("faculty");

  if (!dropdown) {
    console.error("Faculty dropdown not found.");
    return;
  }

  const previousValue = dropdown.value;

  try {
    const result = await apiRequest(FACULTY_API_URL);

    const faculties = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : [];

    dropdown.innerHTML =
      '<option value="">-- Select Faculty --</option>';

    if (faculties.length === 0) {
      dropdown.innerHTML =
        '<option value="">No faculties available</option>';
      return;
    }

    faculties.forEach(function (faculty) {
      const option = document.createElement("option");
      option.value = faculty.id;
      option.textContent = faculty.faculty_name || "Unnamed Faculty";
      dropdown.appendChild(option);
    });

    if (previousValue) {
      dropdown.value = previousValue;
    }
  } catch (error) {
    console.error("Faculty Loading Error:", error);
    dropdown.innerHTML =
      '<option value="">Unable to load faculties</option>';
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

  if (!facultyId) {
    alert("Please select a Faculty.");
    return;
  }

  if (!departmentCode || !departmentName) {
    alert("Department Code and Department Name are required.");
    return;
  }

  const departmentData = {
    faculty_id: Number(facultyId),
    department_name: departmentName,
    department_code: departmentCode,
    hod: null,
  };

  try {
    const isEditing = editingDepartmentId !== null;

    const url = isEditing
      ? `${API_URL}/${editingDepartmentId}`
      : API_URL;

    await apiRequest(url, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(departmentData),
    });

    alert(
      isEditing
        ? "Department updated successfully."
        : "Department added successfully."
    );

    editingDepartmentId = null;

    document.getElementById("departmentForm").reset();

    const submitButton = document.querySelector(
      '#departmentForm button[type="submit"]'
    );

    if (submitButton) {
      submitButton.innerHTML = "Save Department";
    }

    await loadDepartments();
    await loadFacultyDropdown();
  } catch (error) {
    console.error("Save Department Error:", error);
    alert(error.message || "Unable to save department.");
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
    const result = await apiRequest(API_URL);

    const departments = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result)
        ? result
        : [];

    table.innerHTML = "";

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
      const id = Number(department.id);

      if (!Number.isInteger(id) || id <= 0) {
        return;
      }

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${escapeHTML(department.department_code)}</td>
        <td>${escapeHTML(department.department_name)}</td>
        <td>${escapeHTML(department.faculty_name || "N/A")}</td>
        <td>
          <button
            type="button"
            class="btn btn-warning btn-sm me-1"
            onclick="editDepartment(${id})"
            aria-label="Edit department">
            <i class="bi bi-pencil-square"></i>
          </button>

          <button
            type="button"
            class="btn btn-danger btn-sm"
            onclick="deleteDepartment(${id})"
            aria-label="Delete department">
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
          ${escapeHTML(error.message || "Unable to load departments.")}
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
    await apiRequest(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    alert("Department deleted successfully.");
    await loadDepartments();
  } catch (error) {
    console.error("Delete Department Error:", error);
    alert(error.message || "Unable to delete department.");
  }
}

// =============================================
// Edit Department
// =============================================

async function editDepartment(id) {
  try {
    const result = await apiRequest(`${API_URL}/${id}`);
    const department = result.data;

    if (!department) {
      alert("Department not found.");
      return;
    }

    await loadFacultyDropdown();

    const faculty = document.getElementById("faculty");
    const code = document.getElementById("deptCode");
    const name = document.getElementById("deptName");

    if (faculty) {
      faculty.value = department.faculty_id;
    }

    if (code) {
      code.value = department.department_code || "";
    }

    if (name) {
      name.value = department.department_name || "";
    }

    editingDepartmentId = id;

    const submitButton = document.querySelector(
      '#departmentForm button[type="submit"]'
    );

    if (submitButton) {
      submitButton.innerHTML =
        '<i class="bi bi-save"></i> Update Department';
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Edit Department Error:", error);
    alert(error.message || "Unable to load department.");
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

  document.querySelectorAll("#departmentTable tr").forEach(function (row) {
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
  clearSession();
}
