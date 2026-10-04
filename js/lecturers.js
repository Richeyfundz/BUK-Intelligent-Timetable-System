// =============================================
// BUK Intelligent Timetable Management System
// Lecturers Module
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

  loadLecturers();

  document
    .getElementById("lecturerForm")
    .addEventListener("submit", saveLecturer);

  document
    .getElementById("searchLecturer")
    .addEventListener("keyup", searchLecturer);

  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// =============================================
// Load Departments
// =============================================

function loadDepartmentDropdown() {
  let departments = JSON.parse(localStorage.getItem("departments")) || [];

  const dropdown = document.getElementById("department");

  dropdown.innerHTML = `

    <option value="">
    -- Select Department --
    </option>

    `;

  departments.forEach(function (department) {
    dropdown.innerHTML += `

        <option value="${department.name}">

        ${department.name}

        </option>

        `;
  });
}

// =============================================
// Save Lecturer
// =============================================

function saveLecturer(e) {
  e.preventDefault();

  let lecturers = JSON.parse(localStorage.getItem("lecturers")) || [];

  const lecturer = {
    id: Date.now(),

    staffId: document.getElementById("staffId").value,

    name: document.getElementById("lecturerName").value,

    department: document.getElementById("department").value,
  };

  lecturers.push(lecturer);

  localStorage.setItem("lecturers", JSON.stringify(lecturers));

  document.getElementById("lecturerForm").reset();

  loadLecturers();
}

// =============================================
// Load Lecturers
// =============================================

function loadLecturers() {
  let lecturers = JSON.parse(localStorage.getItem("lecturers")) || [];

  const table = document.getElementById("lecturerTable");

  table.innerHTML = "";

  lecturers.forEach(function (lecturer) {
    table.innerHTML += `


        <tr>


        <td>${lecturer.staffId}</td>


        <td>${lecturer.name}</td>


        <td>${lecturer.department}</td>



        <td>


        <button
        class="btn btn-warning btn-sm"
        onclick="editLecturer(${lecturer.id})">


        <i class="bi bi-pencil-square"></i>


        </button>



        <button
        class="btn btn-danger btn-sm"
        onclick="deleteLecturer(${lecturer.id})">


        <i class="bi bi-trash"></i>


        </button>



        </td>


        </tr>


        `;
  });
}

// =============================================
// Delete Lecturer
// =============================================

function deleteLecturer(id) {
  if (!confirm("Delete this Lecturer?")) return;

  let lecturers = JSON.parse(localStorage.getItem("lecturers")) || [];

  lecturers = lecturers.filter(function (lecturer) {
    return lecturer.id !== id;
  });

  localStorage.setItem("lecturers", JSON.stringify(lecturers));

  loadLecturers();
}

// =============================================
// Edit Lecturer
// =============================================

function editLecturer(id) {
  let lecturers = JSON.parse(localStorage.getItem("lecturers")) || [];

  const lecturer = lecturers.find(function (item) {
    return item.id === id;
  });

  document.getElementById("staffId").value = lecturer.staffId;

  document.getElementById("lecturerName").value = lecturer.name;

  document.getElementById("department").value = lecturer.department;

  deleteLecturer(id);
}

// =============================================
// Search Lecturer
// =============================================

function searchLecturer() {
  const keyword = document.getElementById("searchLecturer").value.toLowerCase();

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

function logout(e) {
  e.preventDefault();

  localStorage.removeItem("loggedIn");

  localStorage.removeItem("username");

  window.location.href = "../index.html";
}
