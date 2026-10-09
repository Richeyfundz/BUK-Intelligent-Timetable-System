```javascript
// =============================================
// BUK Intelligent Timetable Management System
// Lecturers Module - Railway MySQL API Version
// =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const LECTURER_API_URL = `${API_BASE_URL}/lecturers`;
const DEPARTMENT_API_URL = `${API_BASE_URL}/departments`;

let editingLecturerId = null;

// =============================================
// Page Initialization
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

  loadDepartmentDropdown();
  loadLecturers();

  const lecturerForm = document.getElementById("lecturerForm");

  if (lecturerForm) {
    lecturerForm.addEventListener("submit", saveLecturer);
  }

  const searchInput = document.getElementById("searchLecturer");

  if (searchInput) {
    searchInput.addEventListener("input", searchLecturer);
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// =============================================
// Load Departments into Dropdown
// =============================================

async function loadDepartmentDropdown() {
  const dropdown = document.getElementById("department");

  if (!dropdown) {
    console.error("Department dropdown #department was not found.");
    return;
  }

  dropdown.innerHTML = '<option value="">Loading departments...</option>';

  try {
    const response = await fetch(DEPARTMENT_API_URL);

    if (!response.ok) {
      throw new Error(`Department API returned HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log("Department API Response:", result);

    const departments = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : [];

    dropdown.innerHTML = '<option value="">-- Select Department --</option>';

    if (departments.length === 0) {
      dropdown.innerHTML =
        '<option value="">No departments available</option>';

      console.warn("The API returned no department records.");
      return;
    }

    departments.forEach(function (department) {
      if (department.id == null || !department.department_name) {
        console.warn("Skipping invalid department record:", department);
        return;
      }

      const option = document.createElement("option");
      option.value = String(department.id);
      option.textContent = department.department_name;

      dropdown.appendChild(option);
    });

    if (dropdown.options.length <= 1) {
      dropdown.innerHTML =
        '<option value="">No valid departments available</option>';
      return;
    }

    console.log(
      "Department dropdown loaded:",
      Array.from(dropdown.options).map((option) => ({
        name: option.textContent,
        id: option.value,
      })),
    );
  } catch (error) {
    console.error("Department Loading Error:", error);

    dropdown.innerHTML =
      '<option value="">Unable to load departments</option>';
  }
}

// =============================================
// Save / Update Lecturer
// =============================================

async function saveLecturer(event) {
  event.preventDefault();

  const staffId = document.getElementById("staffId").value.trim();
  const lecturerName = document.getElementById("lecturerName").value.trim();
  const departmentDropdown = document.getElementById("department");
  const departmentId = departmentDropdown ? departmentDropdown.value : "";

  if (!staffId) {
    alert("Please enter the Staff ID.");
    return;
  }

  if (!lecturerName) {
    alert("Please enter the Lecturer Name.");
    return;
  }

  if (!departmentId) {
    alert("Please select a Department.");
    return;
  }

  const nameParts = lecturerName.split(/\s+/);
  const firstName = nameParts.shift();
  const lastName = nameParts.join(" ") || "";

  const lecturerData = {
    department_id: Number(departmentId),
    staff_id: staffId,
    first_name: firstName,
    last_name: lastName,
    email: "",
    phone: "",
    academic_rank: "",
    specialization: "",
  };

  try {
    const url = editingLecturerId
      ? `${LECTURER_API_URL}/${editingLecturerId}`
      : LECTURER_API_URL;

    const response = await fetch(url, {
      method: editingLecturerId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lecturerData),
    });

    const result = await response.json();

    console.log("Lecturer Save Response:", result);

    if (!response.ok || result.success === false) {
      alert(result.message || "Failed to save lecturer.");
      return;
    }

    alert(
      editingLecturerId
        ? "Lecturer updated successfully."
        : "Lecturer added successfully.",
    );

    editingLecturerId = null;
    document.getElementById("lecturerForm").reset();

    const submitButton = document.querySelector(
      '#lecturerForm button[type="submit"]',
    );

    if (submitButton) {
      submitButton.innerHTML =
        '<i class="bi bi-save"></i> Save Lecturer';
    }

    await loadLecturers();
  } catch (error) {
    console.error("Save Lecturer Error:", error);
    alert("Unable to connect to the server. Please try again.");
  }
}

// =============================================
// Load Lecturers
// =============================================

async function loadLecturers() {
  const table = document.getElementById("lecturerTable");

  if (!table) {
    console.error("Lecturer table not found.");
    return;
  }

  try {
    const response = await fetch(LECTURER_API_URL);

    if (!response.ok) {
      throw new Error(`Lecturer API returned HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log("Lecturer API Response:", result);

    const lecturers = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : [];

    table.innerHTML = "";

    if (lecturers.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted py-4">
            No lecturers found.
          </td>
        </tr>
      `;
      return;
    }

    lecturers.forEach(function (lecturer) {
      const row = document.createElement("tr");

      const fullName =
        `${lecturer.first_name || ""} ${lecturer.last_name || ""}`.trim();

      row.innerHTML = `
        <td>${escapeHTML(lecturer.staff_id)}</td>
        <td>${escapeHTML(fullName)}</td>
        <td>${escapeHTML(lecturer.department_name || "N/A")}</td>
        <td>
          <button
            type="button"
            class="btn btn-warning btn-sm me-1"
            onclick="editLecturer(${Number(lecturer.id)})"
            aria-label="Edit lecturer"
          >
            <i class="bi bi-pencil-square"></i>
          </button>

          <button
            type="button"
            class="btn btn-danger btn-sm"
            onclick="deleteLecturer(${Number(lecturer.id)})"
            aria-label="Delete lecturer"
          >
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;

      table.appendChild(row);
    });
  } catch (error) {
    console.error("Load Lecturers Error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger py-4">
          Unable to load lecturers.
        </td>
      </tr>
    `;
  }
}

// =============================================
// Delete Lecturer
// =============================================

async function deleteLecturer(id) {
  if (!confirm("Are you sure you want to delete this lecturer?")) {
    return;
  }

  try {
    const response = await fetch(`${LECTURER_API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      alert(result.message || "Failed to delete lecturer.");
      return;
    }

    alert("Lecturer deleted successfully.");
    await loadLecturers();
  } catch (error) {
    console.error("Delete Lecturer Error:", error);
    alert("Unable to connect to the server.");
  }
}

// =============================================
// Edit Lecturer
// =============================================

async function editLecturer(id) {
  try {
    const response = await fetch(`${LECTURER_API_URL}/${id}`);

    const result = await response.json();

    if (!response.ok || result.success === false) {
      alert(result.message || "Lecturer not found.");
      return;
    }

    const lecturer = result.data;

    await loadDepartmentDropdown();

    document.getElementById("staffId").value = lecturer.staff_id || "";

    document.getElementById("lecturerName").value =
      `${lecturer.first_name || ""} ${lecturer.last_name || ""}`.trim();

    document.getElementById("department").value =
      String(lecturer.department_id || "");

    editingLecturerId = id;

    const submitButton = document.querySelector(
      '#lecturerForm button[type="submit"]',
    );

    if (submitButton) {
      submitButton.innerHTML =
        '<i class="bi bi-save"></i> Update Lecturer';
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Edit Lecturer Error:", error);
    alert("Unable to load lecturer.");
  }
}

// =============================================
// Search Lecturer
// =============================================

function searchLecturer() {
  const searchInput = document.getElementById("searchLecturer");

  if (!searchInput) return;

  const keyword = searchInput.value.toLowerCase().trim();
  const rows = document.querySelectorAll("#lecturerTable tr");

  rows.forEach(function (row) {
    row.style.display = row.innerText.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
}

// =============================================
// Logout
// =============================================

function logout(event) {
  event.preventDefault();

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
```
