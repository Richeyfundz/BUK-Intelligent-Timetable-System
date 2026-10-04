// =============================================
// BUK Intelligent Timetable Management System
// Venues Module
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

  loadVenues();

  document.getElementById("venueForm").addEventListener("submit", saveVenue);

  document.getElementById("searchVenue").addEventListener("keyup", searchVenue);

  document.getElementById("logoutBtn").addEventListener("click", logout);
});

// =============================================
// Save Venue
// =============================================

function saveVenue(e) {
  e.preventDefault();

  let venues = JSON.parse(localStorage.getItem("venues")) || [];

  const venue = {
    id: Date.now(),

    code: document.getElementById("venueCode").value,

    name: document.getElementById("venueName").value,

    capacity: document.getElementById("capacity").value,

    type: document.getElementById("venueType").value,
  };

  venues.push(venue);

  localStorage.setItem("venues", JSON.stringify(venues));

  document.getElementById("venueForm").reset();

  loadVenues();
}

// =============================================
// Load Venues
// =============================================

function loadVenues() {
  let venues = JSON.parse(localStorage.getItem("venues")) || [];

  const table = document.getElementById("venueTable");

  table.innerHTML = "";

  venues.forEach(function (venue) {
    table.innerHTML += `


        <tr>


        <td>${venue.code}</td>


        <td>${venue.name}</td>


        <td>${venue.capacity}</td>


        <td>${venue.type}</td>



        <td>


        <button
        class="btn btn-warning btn-sm"
        onclick="editVenue(${venue.id})">


        <i class="bi bi-pencil-square"></i>


        </button>




        <button
        class="btn btn-danger btn-sm"
        onclick="deleteVenue(${venue.id})">


        <i class="bi bi-trash"></i>


        </button>


        </td>


        </tr>


        `;
  });
}

// =============================================
// Delete Venue
// =============================================

function deleteVenue(id) {
  if (!confirm("Delete this Venue?")) return;

  let venues = JSON.parse(localStorage.getItem("venues")) || [];

  venues = venues.filter(function (venue) {
    return venue.id !== id;
  });

  localStorage.setItem("venues", JSON.stringify(venues));

  loadVenues();
}

// =============================================
// Edit Venue
// =============================================

function editVenue(id) {
  let venues = JSON.parse(localStorage.getItem("venues")) || [];

  const venue = venues.find(function (item) {
    return item.id === id;
  });

  document.getElementById("venueCode").value = venue.code;

  document.getElementById("venueName").value = venue.name;

  document.getElementById("capacity").value = venue.capacity;

  document.getElementById("venueType").value = venue.type;

  deleteVenue(id);
}

// =============================================
// Search Venue
// =============================================

function searchVenue() {
  const keyword = document.getElementById("searchVenue").value.toLowerCase();

  const rows = document.querySelectorAll("#venueTable tr");

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
