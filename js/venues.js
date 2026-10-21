
// =============================================
// BUK-ITMS VENUES MODULE
// Railway API + Authentication
// =============================================

const API_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api/venues";

let editingVenueId = null;

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  if (
    localStorage.getItem("loggedIn") !== "true" ||
    !localStorage.getItem("token")
  ) {
    clearSession();
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

  document.getElementById("venueForm")
    ?.addEventListener("submit", saveVenue);

  document.getElementById("searchVenue")
    ?.addEventListener("input", searchVenue);

  document.getElementById("logoutBtn")
    ?.addEventListener("click", logout);

  document.getElementById("venueForm")
    ?.addEventListener("reset", () => {
      editingVenueId = null;
      setSaveButtonText();
    });

  loadVenues();
});

// =============================================
// AUTHENTICATION
// =============================================

function clearSession() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    clearSession();
    window.location.href = "../index.html";
    throw new Error("Please log in again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearSession();
    window.location.href = "../index.html";
    throw new Error("Your session expired. Please log in again.");
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || result.error || "Request failed."
    );
  }

  return result;
}

// =============================================
// READ API RESPONSE
// =============================================

function getDataArray(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.venues)) return result.venues;
  return [];
}

// =============================================
// SAVE OR UPDATE VENUE
// =============================================

async function saveVenue(event) {
  event.preventDefault();

  const code = document.getElementById("venueCode").value.trim();
  const name = document.getElementById("venueName").value.trim();
  const capacity = Number(
    document.getElementById("capacity").value
  );
  const type = document.getElementById("venueType").value;

  if (
    !code ||
    !name ||
    !type ||
    !Number.isFinite(capacity) ||
    capacity <= 0
  ) {
    alert(
      "Enter a venue code, name, type, and a capacity greater than zero."
    );
    return;
  }

  const venueData = {
    venue_code: code,
    venue_name: name,
    venue_type: type,
    capacity,
  };

  const button = document.querySelector(
    '#venueForm button[type="submit"]'
  );

  if (button) button.disabled = true;

  try {
    const isEditing = Boolean(editingVenueId);

    await apiRequest(
      isEditing ? `${API_URL}/${editingVenueId}` : API_URL,
      {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(venueData),
      }
    );

    alert(
      isEditing
        ? "Venue updated successfully."
        : "Venue added successfully."
    );

    editingVenueId = null;
    document.getElementById("venueForm").reset();
    setSaveButtonText();

    await loadVenues();
  } catch (error) {
    console.error("Save Venue Error:", error);
    alert("Failed to save venue: " + error.message);
  } finally {
    if (button) button.disabled = false;
  }
}

// =============================================
// LOAD VENUES
// =============================================

async function loadVenues() {
  const table = document.getElementById("venueTable");
  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">Loading venues...</td>
    </tr>
  `;

  try {
    const result = await apiRequest(API_URL);
    const venues = getDataArray(result);

    table.innerHTML = "";

    if (!venues.length) {
      table.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No venues found.</td>
        </tr>
      `;
      return;
    }

    venues.forEach((venue) => {
      const id = Number(venue.id ?? venue.venue_id);
      const row = document.createElement("tr");

      [
        venue.venue_code ?? venue.code ?? "",
        venue.venue_name ?? venue.name ?? "",
        venue.capacity ?? "",
        venue.venue_type ?? venue.type ?? "",
      ].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actions = document.createElement("td");

      if (Number.isFinite(id) && id > 0) {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-warning btn-sm me-2";
        editButton.title = "Edit Venue";
        editButton.innerHTML =
          '<i class="bi bi-pencil-square"></i>';
        editButton.addEventListener("click", () => editVenue(id));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-danger btn-sm";
        deleteButton.title = "Delete Venue";
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.addEventListener("click", () => deleteVenue(id));

        actions.append(editButton, deleteButton);
      }

      row.appendChild(actions);
      table.appendChild(row);
    });

    searchVenue();
  } catch (error) {
    console.error("Load Venues Error:", error);

    table.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.className = "text-center text-danger";
    cell.textContent = error.message || "Failed to load venues.";

    row.appendChild(cell);
    table.appendChild(row);
  }
}

// =============================================
// EDIT VENUE
// =============================================

async function editVenue(id) {
  try {
    const result = await apiRequest(`${API_URL}/${id}`);
    const venue = result.data || result.venue || result;

    editingVenueId = venue.id ?? venue.venue_id ?? id;

    document.getElementById("venueCode").value =
      venue.venue_code ?? venue.code ?? "";

    document.getElementById("venueName").value =
      venue.venue_name ?? venue.name ?? "";

    document.getElementById("capacity").value =
      venue.capacity ?? "";

    document.getElementById("venueType").value =
      venue.venue_type ?? venue.type ?? "";

    setSaveButtonText();

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Edit Venue Error:", error);
    alert("Failed to load venue: " + error.message);
  }
}

// =============================================
// DELETE VENUE
// =============================================

async function deleteVenue(id) {
  if (!confirm("Are you sure you want to delete this venue?")) {
    return;
  }

  try {
    await apiRequest(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (String(editingVenueId) === String(id)) {
      editingVenueId = null;
      document.getElementById("venueForm").reset();
      setSaveButtonText();
    }

    alert("Venue deleted successfully.");
    await loadVenues();
  } catch (error) {
    console.error("Delete Venue Error:", error);
    alert("Failed to delete venue: " + error.message);
  }
}

// =============================================
// SEARCH VENUES
// =============================================

function searchVenue() {
  const searchInput = document.getElementById("searchVenue");
  if (!searchInput) return;

  const keyword = searchInput.value.trim().toLowerCase();

  document.querySelectorAll("#venueTable tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
}

// =============================================
// BUTTON TEXT
// =============================================

function setSaveButtonText() {
  const button = document.querySelector(
    '#venueForm button[type="submit"]'
  );

  if (!button) return;

  button.innerHTML = editingVenueId
    ? '<i class="bi bi-save"></i> Update Venue'
    : '<i class="bi bi-save"></i> Save Venue';
}

// =============================================
// LOGOUT
// =============================================

function logout(event) {
  event?.preventDefault();
  clearSession();
  window.location.href = "../index.html";
}
