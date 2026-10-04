// =============================================
// BUK Intelligent Timetable Management System
// Venues Module - Railway API Version
// =============================================

const API_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api/venues";

let editingVenueId = null;

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

  loadVenues();

  const venueForm = document.getElementById("venueForm");

  if (venueForm) {
    venueForm.addEventListener("submit", saveVenue);
  }

  const searchInput = document.getElementById("searchVenue");

  if (searchInput) {
    searchInput.addEventListener("keyup", searchVenue);
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// =============================================
// Get API Data
// =============================================

function getDataArray(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (result && Array.isArray(result.data)) {
    return result.data;
  }

  if (result && Array.isArray(result.venues)) {
    return result.venues;
  }

  return [];
}

// =============================================
// Save Venue
// =============================================

async function saveVenue(e) {
  e.preventDefault();

  const code = document.getElementById("venueCode").value.trim();
  const name = document.getElementById("venueName").value.trim();
  const capacity = document.getElementById("capacity").value;
  const type = document.getElementById("venueType").value;

  if (!code || !name || !capacity || !type) {
    alert("Please fill in all venue details.");
    return;
  }

  const venueData = {
    venue_code: code,
    venue_name: name,
    capacity: Number(capacity),
    venue_type: type,
  };

  try {
    let response;

    if (editingVenueId) {
      // UPDATE
      response = await fetch(`${API_URL}/${editingVenueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });
    } else {
      // CREATE
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || "Failed to save venue");
    }

    alert(
      editingVenueId
        ? "Venue updated successfully."
        : "Venue added successfully.",
    );

    editingVenueId = null;

    document.getElementById("venueForm").reset();

    loadVenues();
  } catch (error) {
    console.error("Error saving venue:", error);

    alert("Failed to save venue: " + error.message);
  }
}

// =============================================
// Load Venues
// =============================================

async function loadVenues() {
  const table = document.getElementById("venueTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">
        Loading venues...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to load venues");
    }

    const result = await response.json();

    const venues = getDataArray(result);

    table.innerHTML = "";

    if (venues.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">
            No venues found.
          </td>
        </tr>
      `;
      return;
    }

    venues.forEach(function (venue) {
      const code = venue.venue_code || venue.code || "";

      const name = venue.venue_name || venue.name || "";

      const capacity = venue.capacity || "";

      const type = venue.venue_type || venue.type || "";

      table.innerHTML += `
        <tr>
          <td>${escapeHTML(code)}</td>

          <td>${escapeHTML(name)}</td>

          <td>${escapeHTML(capacity)}</td>

          <td>${escapeHTML(type)}</td>

          <td>
            <button
              class="btn btn-warning btn-sm"
              onclick="editVenue(${venue.id})"
              title="Edit Venue"
            >
              <i class="bi bi-pencil-square"></i>
            </button>

            <button
              class="btn btn-danger btn-sm"
              onclick="deleteVenue(${venue.id})"
              title="Delete Venue"
            >
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error loading venues:", error);

    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">
          Failed to load venues.
        </td>
      </tr>
    `;
  }
}

// =============================================
// Delete Venue
// =============================================

async function deleteVenue(id) {
  if (!confirm("Delete this venue?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || result.error || "Failed to delete venue",
      );
    }

    alert("Venue deleted successfully.");

    loadVenues();
  } catch (error) {
    console.error("Error deleting venue:", error);

    alert("Failed to delete venue: " + error.message);
  }
}

// =============================================
// Edit Venue
// =============================================

async function editVenue(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);

    if (!response.ok) {
      throw new Error("Failed to load venue");
    }

    const result = await response.json();

    const venue = result.data || result.venue || result;

    editingVenueId = venue.id || id;

    document.getElementById("venueCode").value =
      venue.venue_code || venue.code || "";

    document.getElementById("venueName").value =
      venue.venue_name || venue.name || "";

    document.getElementById("capacity").value = venue.capacity || "";

    document.getElementById("venueType").value =
      venue.venue_type || venue.type || "";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Error loading venue:", error);

    alert("Failed to load venue: " + error.message);
  }
}

// =============================================
// Search Venue
// =============================================

function searchVenue() {
  const searchInput = document.getElementById("searchVenue");

  if (!searchInput) return;

  const keyword = searchInput.value.toLowerCase();

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
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "../index.html";
}

// =============================================
// Escape HTML
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
