// =============================================
// BUK Intelligent Timetable Management System
// Reports Module
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

  loadStatistics();

  loadTimetableReport();

  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// =============================================
// Load Statistics
// =============================================

function loadStatistics() {
  let courses = JSON.parse(localStorage.getItem("courses")) || [];

  let lecturers = JSON.parse(localStorage.getItem("lecturers")) || [];

  let students = JSON.parse(localStorage.getItem("students")) || [];

  let venues = JSON.parse(localStorage.getItem("venues")) || [];

  document.getElementById("reportCourses").innerHTML = courses.length;

  document.getElementById("reportLecturers").innerHTML = lecturers.length;

  document.getElementById("reportStudents").innerHTML = students.length;

  document.getElementById("reportVenues").innerHTML = venues.length;
}

// =============================================
// Load Generated Timetable Report
// =============================================

function loadTimetableReport() {
  let timetable = JSON.parse(localStorage.getItem("generatedTimetable")) || [];

  const table = document.getElementById("reportTable");

  table.innerHTML = "";

  timetable.forEach(function (item) {
    table.innerHTML += `


        <tr>


        <td>${item.course}</td>


        <td>${item.lecturer}</td>


        <td>${item.venue}</td>


        <td>${item.day}</td>


        <td>${item.time}</td>


        </tr>


        `;
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
