// =============================================
// BUK Intelligent Timetable Management System
// Faculty Module
// =============================================

const API_URL = "http://localhost:5000/api/faculties";

let editingFacultyId = null;

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

  // Load faculties from MySQL
  loadFaculties();

  // Faculty form
  document
    .getElementById("facultyForm")
    .addEventListener("submit", saveFaculty);

  // Search
  document
    .getElementById("searchFaculty")
    .addEventListener("keyup", searchFaculty);

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// =============================================
// Load Faculties
// =============================================

async function loadFaculties() {
  try {
    const response = await fetch(API_URL);

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Failed to load faculties.");
      return;
    }

    const table = document.getElementById("facultyTable");

    table.innerHTML = "";

    if (result.data.length === 0) {
      table.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        No faculties found.
                    </td>
                </tr>
            `;

      return;
    }

    result.data.forEach(function (faculty) {
      table.innerHTML += `
                <tr>

                    <td>${faculty.faculty_code}</td>

                    <td>${faculty.faculty_name}</td>

                    <td>${faculty.dean || ""}</td>

                    <td>

                        <button
                            class="btn btn-warning btn-sm me-1"
                            onclick="editFaculty(${faculty.id})"
                        >
                            <i class="bi bi-pencil-square"></i>
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="deleteFaculty(${faculty.id})"
                        >
                            <i class="bi bi-trash"></i>
                        </button>

                    </td>

                </tr>
            `;
    });
  } catch (error) {
    console.error("Load Faculties Error:", error);

    alert("Unable to connect to the backend server.");
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
    let response;

    // UPDATE
    if (editingFacultyId !== null) {
      response = await fetch(`${API_URL}/${editingFacultyId}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(facultyData),
      });
    }

    // CREATE
    else {
      response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(facultyData),
      });
    }

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Operation failed.");

      return;
    }

    if (editingFacultyId !== null) {
      alert("Faculty updated successfully.");
    } else {
      alert("Faculty added successfully.");
    }

    // Reset
    editingFacultyId = null;

    document.getElementById("facultyForm").reset();

    // Reload database data
    loadFaculties();
  } catch (error) {
    console.error("Save Faculty Error:", error);

    alert("Unable to connect to the backend server.");
  }
}

// =============================================
// Edit Faculty
// =============================================

async function editFaculty(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Faculty not found.");

      return;
    }

    const faculty = result.data;

    document.getElementById("facultyCode").value = faculty.faculty_code;

    document.getElementById("facultyName").value = faculty.faculty_name;

    document.getElementById("facultyDean").value = faculty.dean || "";

    editingFacultyId = id;

    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Edit Faculty Error:", error);

    alert("Unable to connect to the backend server.");
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
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Failed to delete faculty.");

      return;
    }

    alert("Faculty deleted successfully.");

    loadFaculties();
  } catch (error) {
    console.error("Delete Faculty Error:", error);

    alert("Unable to connect to the backend server.");
  }
}

// =============================================
// Search Faculty
// =============================================

function searchFaculty() {
  const keyword = document.getElementById("searchFaculty").value.toLowerCase();

  const rows = document.querySelectorAll("#facultyTable tr");

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
