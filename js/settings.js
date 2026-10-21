
// =============================================
// BUK-ITMS SETTINGS MODULE
// Railway API + MySQL
// =============================================

const API_BASE =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const USERS_API = `${API_BASE}/users`;

const sidebar = document.getElementById("sidebar");
const sidebarOpen = document.getElementById("sidebarOpen");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const userForm = document.getElementById("userForm");
const userSelect = document.getElementById("userSelect");
const userMessage = document.getElementById("userMessage");
const saveUserBtn = document.getElementById("saveUserBtn");

let users = [];

// =============================================
// AUTHENTICATION
// =============================================

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
}

function checkAuthentication() {
  const token = localStorage.getItem("token");
  const loggedIn = localStorage.getItem("loggedIn") === "true";

  if (!token || !loggedIn) {
    clearSession();
    window.location.replace("../index.html");
    return false;
  }

  return true;
}

async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    clearSession();
    window.location.replace("../index.html");
    throw new Error("Session expired. Please log in again.");
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const responseText = await response.text();
  let result = {};

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }
  }

  if (response.status === 401) {
    clearSession();
    window.location.replace("../index.html");
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed (${response.status}).`
    );
  }

  return result;
}

// =============================================
// SIDEBAR CONTROLS
// =============================================

function openSidebarMenu() {
  if (!sidebar) return;

  sidebar.classList.add("sidebar-open");
  sidebarOverlay?.classList.add("show");
  sidebarOpen?.setAttribute("aria-expanded", "true");
}

function closeSidebarMenu() {
  if (!sidebar) return;

  sidebar.classList.remove("sidebar-open");
  sidebarOverlay?.classList.remove("show");
  sidebarOpen?.setAttribute("aria-expanded", "false");
}

sidebarOpen?.addEventListener("click", openSidebarMenu);
sidebarClose?.addEventListener("click", closeSidebarMenu);
sidebarOverlay?.addEventListener("click", closeSidebarMenu);

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    closeSidebarMenu();
  }
});

document.querySelectorAll("#sidebar a").forEach(function(link) {
  link.addEventListener("click", closeSidebarMenu);
});

document.getElementById("logoutBtn")?.addEventListener(
  "click",
  function(event) {
    event.preventDefault();
    clearSession();
    window.location.replace("../index.html");
  }
);

// =============================================
// MESSAGE DISPLAY
// =============================================

function showMessage(message, type = "info") {
  if (!userMessage) {
    alert(message);
    return;
  }

  userMessage.className = `alert alert-${type}`;
  userMessage.textContent = message;
}

function clearMessage() {
  if (!userMessage) return;

  userMessage.className = "alert d-none";
  userMessage.textContent = "";
}

// =============================================
// USER RESPONSE HANDLING
// =============================================

function extractUsers(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.users)) return result.users;

  return [];
}

// =============================================
// LOAD USERS
// =============================================

async function loadUsers(selectedId = "") {
  if (!userSelect) return;

  userSelect.innerHTML =
    '<option value="">Loading users...</option>';

  try {
    const result = await apiRequest(USERS_API);

    users = extractUsers(result);

    userSelect.innerHTML =
      '<option value="">-- Select a user --</option>';

    users.forEach(function(user) {
      const option = document.createElement("option");

      option.value = user.id;
      option.textContent =
        `${user.username || "User"} - ${user.full_name || ""}`;

      userSelect.appendChild(option);
    });

    if (selectedId) {
      userSelect.value = String(selectedId);

      if (userSelect.value) {
        loadSelectedUser();
      }
    }

    if (users.length === 0) {
      showMessage("No users found.", "warning");
    } else {
      clearMessage();
    }
  } catch (error) {
    console.error("Load users error:", error);

    userSelect.innerHTML =
      '<option value="">Unable to load users</option>';

    showMessage(
      error.message || "Failed to load users.",
      "danger"
    );
  }
}

// =============================================
// SELECT EXISTING USER
// =============================================

function loadSelectedUser() {
  const selectedId = userSelect?.value;

  const user = users.find(function(item) {
    return String(item.id) === String(selectedId);
  });

  if (!user) return;

  document.getElementById("userId").value = user.id;
  document.getElementById("username").value = user.username || "";
  document.getElementById("fullName").value = user.full_name || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("password").value = "";
  document.getElementById("role").value = user.role || "Staff";
  document.getElementById("status").value = user.status || "Active";

  if (saveUserBtn) {
    saveUserBtn.innerHTML =
      '<i class="bi bi-save"></i> Update User';
  }

  clearMessage();
}

userSelect?.addEventListener("change", loadSelectedUser);

// =============================================
// START NEW USER
// =============================================

function startNewUser() {
  userForm?.reset();

  const idField = document.getElementById("userId");
  const roleField = document.getElementById("role");
  const statusField = document.getElementById("status");

  if (idField) idField.value = "";
  if (userSelect) userSelect.value = "";
  if (roleField) roleField.value = "Staff";
  if (statusField) statusField.value = "Active";

  if (saveUserBtn) {
    saveUserBtn.innerHTML =
      '<i class="bi bi-person-plus"></i> Create User';
  }

  clearMessage();
}

document.getElementById("newUserBtn")?.addEventListener(
  "click",
  startNewUser
);

document.getElementById("reloadUsersBtn")?.addEventListener(
  "click",
  function() {
    loadUsers(userSelect?.value || "");
  }
);

// =============================================
// CREATE OR UPDATE USER
// =============================================

userForm?.addEventListener("submit", async function(event) {
  event.preventDefault();
  clearMessage();

  const id = document.getElementById("userId").value.trim();
  const password = document.getElementById("password").value;

  const userData = {
    username: document.getElementById("username").value.trim(),
    full_name: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    role: document.getElementById("role").value,
    status: document.getElementById("status").value
  };

  // The backend updateUser controller requires ID in the body.
  if (id) {
    userData.id = Number(id);
  }

  if (password.trim()) {
    userData.password = password;
  }

  if (
    !userData.username ||
    !userData.full_name ||
    !userData.email
  ) {
    showMessage("Complete all required fields.", "warning");
    return;
  }

  if (!id && !password.trim()) {
    showMessage(
      "A password is required when creating a new user.",
      "warning"
    );
    return;
  }

  if (saveUserBtn) {
    saveUserBtn.disabled = true;
  }

  try {
    const result = await apiRequest(
      id ? `${USERS_API}/${encodeURIComponent(id)}` : USERS_API,
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(userData)
      }
    );

    showMessage(
      result.message ||
        (id
          ? "User updated successfully."
          : "User created successfully."),
      "success"
    );

    await loadUsers(id || "");

    if (!id) {
      startNewUser();
    }
  } catch (error) {
    console.error("Save user error:", error);

    showMessage(
      error.message || "Failed to save user.",
      "danger"
    );
  } finally {
    if (saveUserBtn) {
      saveUserBtn.disabled = false;
    }
  }
});

// =============================================
// EXPORT LOCAL DATA
// This is not a complete database backup.
// =============================================

document.getElementById("backupBtn")?.addEventListener(
  "click",
  function() {
    const keys = [
      "faculties",
      "departments",
      "courses",
      "lecturers",
      "students",
      "venues",
      "generatedTimetable",
      "examTimetable"
    ];

    const backup = {
      system: "BUK ITMS",
      createdAt: new Date().toISOString(),
      data: {}
    };

    keys.forEach(function(key) {
      const value = localStorage.getItem(key);

      if (value !== null) {
        backup.data[key] = value;
      }
    });

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "BUK_ITMS_Backup.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }
);

// =============================================
// CLEAR LOCAL DATA ONLY
// =============================================

document.getElementById("clearBtn")?.addEventListener(
  "click",
  function() {
    const confirmed = confirm(
      "Clear locally stored timetable data? " +
      "This will not delete database records."
    );

    if (!confirmed) return;

    const keys = [
      "faculties",
      "departments",
      "courses",
      "lecturers",
      "students",
      "venues",
      "generatedTimetable",
      "examTimetable"
    ];

    keys.forEach(function(key) {
      localStorage.removeItem(key);
    });

    alert("Local timetable data cleared.");
  }
);

// =============================================
// INITIALIZE SETTINGS PAGE
// =============================================

function initializeSettings() {
  const currentDate = document.getElementById("currentDate");

  if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString();
  }

  if (checkAuthentication()) {
    loadUsers();
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeSettings
  );
} else {
  initializeSettings();
}
