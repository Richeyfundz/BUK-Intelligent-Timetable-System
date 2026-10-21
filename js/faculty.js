
// =============================================
// BUK Intelligent Timetable Management System
// Faculty Module
// =============================================

const API_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api/faculties";

let editingFacultyId = null;

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

  document
    .getElementById("facultyForm")
    .addEventListener("submit", saveFaculty);

  document
    .getElementById("searchFaculty")
    .addEventListener("keyup", searchFaculty);

  document.getElementById("logoutBtn").addEventListener("click", logout);

  loadFaculties();
});

// =============================================
// Safe HTML Display
// =============================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char];
  });
}

// =============================================
// Load Faculties
// =============================================

async function loadFaculties() {
  try {
    const result = await apiRequest(API_URL);
    const faculties = Array.isArray(result.data) ? result.data : [];
    const table = document.getElementById("facultyTable");

    table.innerHTML = "";

    if (faculties.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">
            No faculties found.
          </td>
        </tr>
      `;
      return;
    }

    faculties.forEach(function (faculty) {
      const id = Number(faculty.id);

      if (!Number.isInteger(id) || id <= 0) return;

      table.innerHTML += `
        <tr>
          <td>${escapeHTML(faculty.faculty_code)}</td>
          <td>${escapeHTML(faculty.faculty_name)}</td>
          <td>${escapeHTML(faculty.dean || "")}</td>
          <td>
            <button
              class="btn btn-warning btn-sm me-1"
              onclick="editFaculty(${id})"
              aria-label="Edit faculty">
              <i class="bi bi-pencil-square"></i>
            </button>

            <button
              class="btn btn-danger btn-sm"
              onclick="deleteFaculty(${id})"
              aria-label="Delete faculty">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    if (error.message) {
      alert(error.message);
    } else {
      alert("Unable to connect to the backend server.");
    }
  }
}

// =============================================
// Save / Update Faculty
// =============================================

async function saveFaculty(e) {
  e.preventDefault();

  const facultyCode = document.getElementById("facultyCode").value.trim();
  const facultyName = document.getElementById("facultyName").value.trim();
  const facultyDean = document.getElementById("facultyDean").value.trim();

  if (!facultyCode || !facultyName) {
    alert("Faculty Code and Faculty Name are required.");
    return;
  }

  const facultyData = {
    faculty_code: facultyCode,
    faculty_name: facultyName,
    dean: facultyDean,
  };

  try {
    const isEditing = editingFacultyId !== null;

    const url = isEditing
      ? `${API_URL}/${editingFacultyId}`
      : API_URL;

    await apiRequest(url, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(facultyData),
    });

    alert(
      isEditing
        ? "Faculty updated successfully."
        : "Faculty added successfully."
    );

    editingFacultyId = null;
    document.getElementById("facultyForm").reset();

    await loadFaculties();
  } catch (error) {
    alert(error.message || "Unable to connect to the backend server.");
  }
}

// =============================================
// Edit Faculty
// =============================================

async function editFaculty(id) {
  try {
    const result = await apiRequest(`${API_URL}/${id}`);
    const faculty = result.data;

    if (!faculty) {
      alert("Faculty not found.");
      return;
    }

    document.getElementById("facultyCode").value =
      faculty.faculty_code || "";

    document.getElementById("facultyName").value =
      faculty.faculty_name || "";

    document.getElementById("facultyDean").value =
      faculty.dean || "";

    editingFacultyId = id;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    alert(error.message || "Unable to connect to the backend server.");
  }
}

// =============================================
// Delete Faculty
// =============================================

async function deleteFaculty(id) {
  if (!confirm("Are you sure you want to delete this Faculty?")) {
    return;
  }

  try {
    await apiRequest(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    alert("Faculty deleted successfully.");
    await loadFaculties();
  } catch (error) {
    alert(error.message || "Unable to connect to the backend server.");
  }
}

// =============================================
// Search Faculty
// =============================================

function searchFaculty() {
  const keyword = document
    .getElementById("searchFaculty")
    .value.toLowerCase();

  document.querySelectorAll("#facultyTable tr").forEach(function (row) {
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
