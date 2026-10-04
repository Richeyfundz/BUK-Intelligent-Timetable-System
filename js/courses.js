// =============================================
// BUK Intelligent Timetable Management System
// Courses Module
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

  loadCourses();

  document.getElementById("courseForm").addEventListener("submit", saveCourse);

  document
    .getElementById("searchCourse")
    .addEventListener("keyup", searchCourse);

  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// =============================================
// Save Course
// =============================================

function saveCourse(e) {
  e.preventDefault();

  let courses = JSON.parse(localStorage.getItem("courses")) || [];

  const course = {
    id: Date.now(),

    code: document.getElementById("courseCode").value,

    title: document.getElementById("courseTitle").value,

    unit: document.getElementById("courseUnit").value,

    level: document.getElementById("courseLevel").value,
  };

  courses.push(course);

  localStorage.setItem("courses", JSON.stringify(courses));

  document.getElementById("courseForm").reset();

  loadCourses();
}

// =============================================
// Load Courses
// =============================================

function loadCourses() {
  let courses = JSON.parse(localStorage.getItem("courses")) || [];

  const table = document.getElementById("courseTable");

  table.innerHTML = "";

  courses.forEach(function (course) {
    table.innerHTML += `

<tr>

<td>${course.code}</td>

<td>${course.title}</td>

<td>${course.unit}</td>

<td>${course.level}</td>

<td>

<button
class="btn btn-warning btn-sm"
onclick="editCourse(${course.id})">

<i class="bi bi-pencil-square"></i>

</button>

<button
class="btn btn-danger btn-sm"
onclick="deleteCourse(${course.id})">

<i class="bi bi-trash"></i>

</button>

</td>

</tr>

`;
  });
}

// =============================================
// Delete Course
// =============================================

function deleteCourse(id) {
  if (!confirm("Delete this Course?")) return;

  let courses = JSON.parse(localStorage.getItem("courses")) || [];

  courses = courses.filter((course) => course.id !== id);

  localStorage.setItem("courses", JSON.stringify(courses));

  loadCourses();
}

// =============================================
// Edit Course
// =============================================

function editCourse(id) {
  let courses = JSON.parse(localStorage.getItem("courses")) || [];

  const course = courses.find((course) => course.id === id);

  document.getElementById("courseCode").value = course.code;

  document.getElementById("courseTitle").value = course.title;

  document.getElementById("courseUnit").value = course.unit;

  document.getElementById("courseLevel").value = course.level;

  deleteCourse(id);
}

// =============================================
// Search Course
// =============================================

function searchCourse() {
  const keyword = document.getElementById("searchCourse").value.toLowerCase();

  const rows = document.querySelectorAll("#courseTable tr");

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
