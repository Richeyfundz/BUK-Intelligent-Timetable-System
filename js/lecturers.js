```javascript
// =============================================
// BUK Intelligent Timetable Management System
// Lecturers Module - Railway MySQL API
// =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const LECTURER_API_URL = `${API_BASE_URL}/lecturers`;
const DEPARTMENT_API_URL = `${API_BASE_URL}/departments`;

let editingLecturerId = null;

document.addEventListener("DOMContentLoaded", async function () {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "../index.html";
    return;
  }

  const dateElement = document.getElementById("currentDate");

  if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const form = document.getElementById("lecturerForm");

  if (form) {
    form.addEventListener("submit", saveLecturer);
    form.addEventListener("reset", function () {
      editingLecturerId = null;

      const button = form.querySelector('button[type="submit"]');

      if (button) {
        button.innerHTML = '<i class="bi bi-save"></i> Save Lecturer';
      }
    });
  }

  const searchInput = document.getElementById("searchLecturer");

  if (searchInput) {
    searchInput.addEventListener("input", searchLecturer);
  }

  const logoutButton = document.getElementById("logoutBtn");

  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  await loadDepartmentDropdown();
  await loadLecturers();
});

// =============================================
// LOAD DEPARTMENTS
// =============================================

async function loadDepartmentDropdown() {
  const dropdown = document.getElementById("department");

  if (!dropdown) return;

  dropdown.innerHTML = '<option value="">Loading departments...</option>';

  try {
    const response = await fetch(DEPARTMENT_API_URL);
    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to load departments.");
    }

    const departments = Array.isArray(result)
      ? result
      : Array.isArray(result.data)
        ? result.data
        : [];

    dropdown.innerHTML = '<option value="">-- Select Department --</option>';

    departments.forEach(function (department) {
      if (department.id == null || !department.department_name) return;

      const option = document.createElement("option");
      option.value = String(department.id);
      option.textContent = department.department_name;

      dropdown.appendChild(option);
    });

    if (dropdown.options.length === 1) {
      dropdown.innerHTML =
        '<option value="">No departments available</option>';
    }
  } catch (error) {
    console.error("Department Loading Error:", error);

    dropdown.innerHTML =
      '<option value="">Unable to load departments</option>';
  }
}

// =============================================
// SAVE OR UPDATE LECTURER
// =============================================

async function saveLecturer(event) {
  event.preventDefault();

  const staffId = document.getElementById("staffId").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("lecturerEmail").value.trim();
  const departmentId = document.getElementById("department").value;

  if (!staffId || !firstName || !lastName || !email || !departmentId) {
    alert("Please complete all required fields.");
    return;
  }

  const lecturerData = {
    department_id: Number(departmentId),
    staff_id: staffId,
    first_name: firstName,
    last_name: lastName,
    email: email,
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

    const button = document.querySelector(
      '#lecturerForm button[type="submit"]',
    );

    if (button) {
      button.innerHTML = '<i class="bi bi-save"></i> Save Lecturer';
    }

    await loadLecturers();
  } catch (error) {
    console.error("Save Lecturer Error:", error);
    alert("Unable to connect to the server. Please try again.");
  }
}

// =============================================
// LOAD LECTURERS
// =============================================

async function loadLecturers() {
  const table = document.getElementById("lecturerTable");

  if (!table) return;

  try {
    const response = await fetch(LECTURER_API_URL);
    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Failed to load lecturers.");
    }

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

      const name =
        `${lecturer.first_name || ""} ${lecturer.last_name || ""}`.trim();

      row.innerHTML = `
        <td>${escapeHTML(lecturer.staff_id)}</td>
        <td>${escapeHTML(name)}</td>
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
// EDIT LECTURER
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
    document.getElementById("firstName").value = lecturer.first_name || "";
    document.getElementById("lastName").value = lecturer.last_name || "";
    document.getElementById("lecturerEmail").value = lecturer.email || "";
    document.getElementById("department").value =
      String(lecturer.department_id || "");

    editingLecturerId = id;

    const button = document.querySelector(
      '#lecturerForm button[type="submit"]',
    );

    if (button) {
      button.innerHTML = '<i class="bi bi-save"></i> Update Lecturer';
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Edit Lecturer Error:", error);
    alert("Unable to load lecturer.");
  }
}

// =============================================
// DELETE LECTURER
// =============================================

async function deleteLecturer(id) {
  if (!confirm("Are you sure you want to delete this lecturer?")) return;

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
// SEARCH LECTURERS
// =============================================

function searchLecturer() {
  const input = document.getElementById("searchLecturer");
  if (!input) return;

  const keyword = input.value.toLowerCase().trim();

  document.querySelectorAll("#lecturerTable tr").forEach(function (row) {
    row.style.display = row.innerText.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
}

// =============================================
// LOGOUT
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
// HTML ESCAPE
// =============================================

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```
