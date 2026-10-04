// =============================================
// BUK Intelligent Timetable Management System
// Students Module
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

  document
    .getElementById("studentForm")
    .addEventListener("submit", saveStudent);

  document
    .getElementById("searchStudent")
    .addEventListener("keyup", searchStudent);

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
// Save Student
// =============================================

function saveStudent(e) {
  e.preventDefault();

  let students = JSON.parse(localStorage.getItem("students")) || [];

  const student = {
    id: Date.now(),

    regNumber: document.getElementById("regNumber").value,

    name: document.getElementById("studentName").value,

    department: document.getElementById("department").value,

    level: document.getElementById("level").value,
  };

  students.push(student);

  localStorage.setItem("students", JSON.stringify(students));

  document.getElementById("studentForm").reset();

  loadStudents();
}

// =============================================
// Load Students
// =============================================

function loadStudents() {
  let students = JSON.parse(localStorage.getItem("students")) || [];

  const table = document.getElementById("studentTable");

  table.innerHTML = "";

  students.forEach(function (student) {
    table.innerHTML += `


        <tr>


        <td>${student.regNumber}</td>


        <td>${student.name}</td>


        <td>${student.department}</td>


        <td>${student.level}</td>



        <td>


        <button
        class="btn btn-warning btn-sm"
        onclick="editStudent(${student.id})">


        <i class="bi bi-pencil-square"></i>


        </button>



        <button
        class="btn btn-danger btn-sm"
        onclick="deleteStudent(${student.id})">


        <i class="bi bi-trash"></i>


        </button>



        </td>


        </tr>


        `;
  });
}

// =============================================
// Delete Student
// =============================================

function deleteStudent(id) {
  if (!confirm("Delete this Student?")) return;

  let students = JSON.parse(localStorage.getItem("students")) || [];

  students = students.filter(function (student) {
    return student.id !== id;
  });

  localStorage.setItem("students", JSON.stringify(students));

  loadStudents();
}

// =============================================
// Edit Student
// =============================================

function editStudent(id) {
  let students = JSON.parse(localStorage.getItem("students")) || [];

  const student = students.find(function (item) {
    return item.id === id;
  });

  document.getElementById("regNumber").value = student.regNumber;

  document.getElementById("studentName").value = student.name;

  document.getElementById("department").value = student.department;

  document.getElementById("level").value = student.level;

  deleteStudent(id);
}

// =============================================
// Search Student
// =============================================

function searchStudent() {
  const keyword = document.getElementById("searchStudent").value.toLowerCase();

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

  window.location.href = "../index.html";
}
