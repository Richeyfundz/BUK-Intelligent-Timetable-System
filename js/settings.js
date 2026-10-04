// =====================================================
// BUK INTELLIGENT TIMETABLE MANAGEMENT SYSTEM
// SETTINGS MODULE
// =====================================================

const API_URL = "http://localhost:5000/api/users";

let users = [];
let isCreatingNewUser = false;

// =====================================================
// PAGE LOAD
// =====================================================

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

  // Load Users
  loadUsers();

  // User Selection
  const userSelect = document.getElementById("userSelect");

  if (userSelect) {
    userSelect.addEventListener("change", loadSelectedUser);
  }

  // New User
  const newUserBtn = document.getElementById("newUserBtn");

  if (newUserBtn) {
    newUserBtn.addEventListener("click", prepareNewUser);
  }

  // Save User
  const saveUserBtn = document.getElementById("saveUserBtn");

  if (saveUserBtn) {
    saveUserBtn.addEventListener("click", createUser);
  }

  // Update User
  const updateUserBtn = document.getElementById("updateUserBtn");

  if (updateUserBtn) {
    updateUserBtn.addEventListener("click", updateUser);
  }

  // Toggle Status
  const toggleStatusBtn = document.getElementById("toggleStatusBtn");

  if (toggleStatusBtn) {
    toggleStatusBtn.addEventListener("click", toggleUserStatus);
  }

  // Delete User
  const deleteUserBtn = document.getElementById("deleteUserBtn");

  if (deleteUserBtn) {
    deleteUserBtn.addEventListener("click", deleteUser);
  }

  // Backup
  const backupBtn = document.getElementById("backupBtn");

  if (backupBtn) {
    backupBtn.addEventListener("click", backupData);
  }

  // Clear
  const clearBtn = document.getElementById("clearBtn");

  if (clearBtn) {
    clearBtn.addEventListener("click", clearData);
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {
  const userSelect = document.getElementById("userSelect");

  if (!userSelect) return;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to load users");
    }

    const result = await response.json();

    if (!result.success) {
      alert(result.message || "Failed to load users.");
      return;
    }

    users = result.data || [];

    userSelect.innerHTML = '<option value="">Select a user</option>';

    users.forEach(function (user) {
      const option = document.createElement("option");

      option.value = user.id;

      option.textContent = user.username + " - " + user.full_name;

      userSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Load users error:", error);

    alert("Unable to connect to the server.");
  }
}

// =====================================================
// PREPARE NEW USER
// =====================================================

function prepareNewUser() {
  isCreatingNewUser = true;

  document.getElementById("userSelect").value = "";

  clearUserFields();

  document.getElementById("username").focus();

  alert("Enter the new user's details, then click Save User.");
}

// =====================================================
// CLEAR USER FIELDS
// =====================================================

function clearUserFields() {
  document.getElementById("username").value = "";

  document.getElementById("fullName").value = "";

  document.getElementById("email").value = "";

  document.getElementById("password").value = "";

  document.getElementById("role").value = "Admin";

  document.getElementById("status").value = "Active";
}

// =====================================================
// LOAD SELECTED USER
// =====================================================

function loadSelectedUser() {
  const userSelect = document.getElementById("userSelect");

  const selectedId = userSelect.value;

  if (!selectedId) {
    isCreatingNewUser = true;
    clearUserFields();
    return;
  }

  isCreatingNewUser = false;

  const user = users.find(function (item) {
    return String(item.id) === String(selectedId);
  });

  if (!user) return;

  document.getElementById("username").value = user.username || "";

  document.getElementById("fullName").value = user.full_name || "";

  document.getElementById("email").value = user.email || "";

  document.getElementById("password").value = "";

  document.getElementById("role").value = user.role || "Admin";

  document.getElementById("status").value = user.status || "Active";
}

// =====================================================
// CREATE USER
// =====================================================

async function createUser() {
  const username = document.getElementById("username").value.trim();

  const fullName = document.getElementById("fullName").value.trim();

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value.trim();

  const role = document.getElementById("role").value;

  const status = document.getElementById("status").value;

  if (!username || !fullName || !email || !password) {
    alert("Username, full name, email and password are required.");

    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username: username,
        full_name: fullName,
        email: email,
        password: password,
        role: role,
        status: status,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Failed to create user.");

      return;
    }

    alert("User created successfully.");

    await loadUsers();

    clearUserFields();

    isCreatingNewUser = true;
  } catch (error) {
    console.error("Create user error:", error);

    alert("Unable to connect to the server.");
  }
}

// =====================================================
// UPDATE USER
// =====================================================

async function updateUser() {
  const userSelect = document.getElementById("userSelect");

  const id = userSelect.value;

  if (!id) {
    alert("Please select a user first.");

    return;
  }

  const username = document.getElementById("username").value.trim();

  const fullName = document.getElementById("fullName").value.trim();

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value.trim();

  const role = document.getElementById("role").value;

  const status = document.getElementById("status").value;

  if (!username || !fullName || !email) {
    alert("Username, full name and email are required.");

    return;
  }

  try {
    const response = await fetch(API_URL + "/" + id, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        id: id,
        username: username,
        full_name: fullName,
        email: email,
        password: password,
        role: role,
        status: status,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Failed to update user.");

      return;
    }

    alert("User updated successfully.");

    await loadUsers();

    userSelect.value = id;

    loadSelectedUser();
  } catch (error) {
    console.error("Update user error:", error);

    alert("Unable to connect to the server.");
  }
}

// =====================================================
// ACTIVATE / DEACTIVATE USER
// =====================================================

async function toggleUserStatus() {
  const userSelect = document.getElementById("userSelect");

  const id = userSelect.value;

  if (!id) {
    alert("Please select a user first.");

    return;
  }

  const user = users.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!user) return;

  const action = user.status === "Active" ? "deactivate" : "activate";

  const confirmed = confirm(
    "Are you sure you want to " + action + " this user?",
  );

  if (!confirmed) return;

  try {
    const response = await fetch(API_URL + "/" + id + "/status", {
      method: "PATCH",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Failed to change user status.");

      return;
    }

    alert(result.message);

    await loadUsers();

    userSelect.value = id;

    loadSelectedUser();
  } catch (error) {
    console.error("Toggle status error:", error);

    alert("Unable to connect to the server.");
  }
}

// =====================================================
// DELETE USER
// =====================================================

async function deleteUser() {
  const userSelect = document.getElementById("userSelect");

  const id = userSelect.value;

  if (!id) {
    alert("Please select a user first.");

    return;
  }

  const user = users.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!user) return;

  const confirmed = confirm("Delete user '" + user.username + "' permanently?");

  if (!confirmed) return;

  try {
    const response = await fetch(API_URL + "/" + id, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Failed to delete user.");

      return;
    }

    alert("User deleted successfully.");

    await loadUsers();

    clearUserFields();
  } catch (error) {
    console.error("Delete user error:", error);

    alert("Unable to connect to the server.");
  }
}

// =====================================================
// BACKUP DATA
// =====================================================

function backupData() {
  const systemData = {
    faculties: JSON.parse(localStorage.getItem("faculties")) || [],

    departments: JSON.parse(localStorage.getItem("departments")) || [],

    courses: JSON.parse(localStorage.getItem("courses")) || [],

    lecturers: JSON.parse(localStorage.getItem("lecturers")) || [],

    students: JSON.parse(localStorage.getItem("students")) || [],

    venues: JSON.parse(localStorage.getItem("venues")) || [],

    timetable: JSON.parse(localStorage.getItem("generatedTimetable")) || [],

    exams: JSON.parse(localStorage.getItem("examGeneratedTimetable")) || [],
  };

  const data = JSON.stringify(systemData, null, 4);

  const file = new Blob([data], {
    type: "application/json",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(file);

  link.download = "BUK_ITMS_Backup.json";

  link.click();

  URL.revokeObjectURL(link.href);

  alert("Backup exported successfully.");
}

// =====================================================
// CLEAR LOCAL DATA
// =====================================================

function clearData() {
  const confirmed = confirm(
    "Warning! This will remove locally stored system data. Continue?",
  );

  if (!confirmed) return;

  localStorage.removeItem("faculties");

  localStorage.removeItem("departments");

  localStorage.removeItem("courses");

  localStorage.removeItem("lecturers");

  localStorage.removeItem("students");

  localStorage.removeItem("venues");

  localStorage.removeItem("generatedTimetable");

  localStorage.removeItem("examGeneratedTimetable");

  alert("Local system data has been cleared.");
}

// =====================================================
// LOGOUT
// =====================================================

function logout(event) {
  event.preventDefault();

  localStorage.removeItem("loggedIn");

  localStorage.removeItem("username");

  window.location.href = "../index.html";
}
