
 // =============================================
 // BUK Intelligent Timetable Management System
 // Students Module - Railway API Version
 // =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const STUDENT_API_URL = `${API_BASE_URL}/students`;
const DEPARTMENT_API_URL = `${API_BASE_URL}/departments`;

let editingStudentId = null;

// =============================================
// Page Initialization
// =============================================

document.addEventListener("DOMContentLoaded", async function () {
  if (localStorage.getItem("loggedIn") !== "true") {
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

  const studentForm = document.getElementById("studentForm");

  if (studentForm) {
    studentForm.addEventListener("submit", saveStudent);

    studentForm.addEventListener("reset", function () {
      editingStudentId = null;
      setSaveButtonText("Save Student");
    });
  }

  const searchInput = document.getElementById("searchStudent");

  if (searchInput) {
    searchInput.addEventListener("input", searchStudent);
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  await loadDepartmentDropdown();
  await loadStudents();
});

// =============================================
// Extract Arrays from API Responses
// =============================================

function getDataArray(result, key) {
  if (Array.isArray(result)) return result;

  if (result && Array.isArray(result.data)) {
    return result.data;
  }

  if (result && Array.isArray(result[key])) {
    return result[key];
  }

  return [];
}

// =============================================
// Load Department Dropdown
// =============================================

async function loadDepartmentDropdown() {
  const dropdown = document.getElementById("department");

  if (!dropdown) return;

  dropdown.innerHTML =
    '<option value="">Loading departments...</option>';

  try {
    const response = await fetch(DEPARTMENT_API_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to load departments"
      );
    }

    const departments = getDataArray(result, "departments");

    dropdown.innerHTML =
      '<option value="">-- Select Department --</option>';

    if (departments.length === 0) {
      dropdown.innerHTML =
        '<option value="">No departments found</option>';

      console.error("No department records found:", result);
      return;
    }

    departments.forEach(function (department) {
      const id = department.id ?? department.department_id;

      const name =
        department.department_name ??
        department.name ??
        department.department;

      if (id === undefined || id === null || !name) {
        console.warn("Skipping invalid department record:", department);
        return;
      }

      const option = document.createElement("option");
      option.value = String(id);
      option.textContent = name;

      dropdown.appendChild(option);
    });

    if (dropdown.options.length === 1) {
      dropdown.innerHTML =
        '<option value="">Department records have invalid fields</option>';
    }
  } catch (error) {
    console.error("Error loading departments:", error);

    dropdown.innerHTML =
      '<option value="">Failed to load departments</option>';
  }
}

// =============================================
// Save or Update Student
// =============================================

async function saveStudent(event) {
  event.preventDefault();

  const regInput = document.getElementById("regNumber");
  const nameInput = document.getElementById("studentName");
  const departmentInput = document.getElementById("department");
  const genderInput = document.getElementById("gender");
  const levelInput = document.getElementById("level");

  if (
    !regInput ||
    !nameInput ||
    !departmentInput ||
    !genderInput ||
    !levelInput
  ) {
    alert("A required student form field is missing. Check students.html.");
    return;
  }

  const matricNumber = regInput.value.trim();
  const fullName = nameInput.value.trim();
  const departmentId = departmentInput.value;
  const gender = genderInput.value;
  const level = levelInput.value;

  if (!matricNumber || !fullName || !departmentId || !gender || !level) {
    alert("Please fill in all student details.");
    return;
  }

  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ");

  if (!firstName || !lastName) {
    alert("Enter the student's first name and surname.");
    return;
  }

  // Field names must match the backend student controller.
  const studentData = {
    matric_number: matricNumber,
    first_name: firstName,
    last_name: lastName,
    department_id: Number(departmentId),
    gender: gender,
    level: level,
  };

  try {
    const isEditing = Boolean(editingStudentId);

    const response = await fetch(
      isEditing
        ? `${STUDENT_API_URL}/${editingStudentId}`
        : STUDENT_API_URL,
      {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || result.error || "Failed to save student"
      );
    }

    alert(
      isEditing
        ? "Student updated successfully."
        : "Student added successfully."
    );

    editingStudentId = null;

    document.getElementById("studentForm").reset();
    setSaveButtonText("Save Student");

    await loadStudents();
  } catch (error) {
    console.error("Error saving student:", error);
    alert("Failed to save student: " + error.message);
  }
}

// =============================================
// Load Students
// =============================================

async function loadStudents() {
  const table = document.getElementById("studentTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">Loading students...</td>
    </tr>
  `;

  try {
    const response = await fetch(STUDENT_API_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to load students"
      );
    }

    const students = getDataArray(result, "students");

    table.innerHTML = "";

    if (students.length === 0) {
      table.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No students found.</td>
        </tr>
      `;
      return;
    }

    students.forEach(function (student) {
      const fullName =
        student.name ||
        `${student.first_name || ""} ${student.last_name || ""}`.trim();

      const matricNumber =
        student.matric_number ||
        student.registration_number ||
        student.regNumber ||
        student.registration_no ||
        "";

      const departmentName =
        student.department_name || student.department || "";

      const studentLevel = student.level || "";

      const row = document.createElement("tr");

      [
        matricNumber,
        fullName,
        departmentName,
        studentLevel,
      ].forEach(function (value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actions = document.createElement("td");

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn btn-warning btn-sm me-2";
      editButton.title = "Edit Student";
      editButton.innerHTML = '<i class="bi bi-pencil-square"></i>';
      editButton.addEventListener("click", function () {
        editStudent(student.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.title = "Delete Student";
      deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
      deleteButton.addEventListener("click", function () {
        deleteStudent(student.id);
      });

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);
      row.appendChild(actions);
      table.appendChild(row);
    });

    searchStudent();
  } catch (error) {
    console.error("Error loading students:", error);

    table.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">
          Failed to load students.
        </td>
      </tr>
    `;
  }
}

// =============================================
// Edit Student
// =============================================

async function editStudent(id) {
  try {
    const response = await fetch(`${STUDENT_API_URL}/${id}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to load student"
      );
    }

    const student = result.data || result.student || result;

    editingStudentId = student.id || id;

    document.getElementById("regNumber").value =
      student.matric_number ||
      student.registration_number ||
      student.regNumber ||
      student.registration_no ||
      "";

    document.getElementById("studentName").value =
      student.name ||
      `${student.first_name || ""} ${student.last_name || ""}`.trim();

    const departmentDropdown = document.getElementById("department");

    // Load dropdown options before selecting the student's department.
    if (departmentDropdown.options.length <= 1) {
      await loadDepartmentDropdown();
    }

    departmentDropdown.value = String(
      student.department_id ?? student.departmentId ?? ""
    );

    document.getElementById("gender").value = student.gender || "";
    document.getElementById("level").value = student.level || "";

    setSaveButtonText("Update Student");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Error loading student:", error);
    alert("Failed to load student: " + error.message);
  }
}

// =============================================
// Delete Student
// =============================================

async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) {
    return;
  }

  try {
    const response = await fetch(`${STUDENT_API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || result.error || "Failed to delete student"
      );
    }

    alert("Student deleted successfully.");
    await loadStudents();
  } catch (error) {
    console.error("Error deleting student:", error);
    alert("Failed to delete student: " + error.message);
  }
}

// =============================================
// Search Students
// =============================================

function searchStudent() {
  const searchInput = document.getElementById("searchStudent");
  const table = document.getElementById("studentTable");

  if (!searchInput || !table) return;

  const keyword = searchInput.value.toLowerCase().trim();

  table.querySelectorAll("tr").forEach(function (row) {
    row.style.display = row.innerText.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
}

// =============================================
// Save Button Label
// =============================================

function setSaveButtonText(label) {
  const form = document.getElementById("studentForm");

  if (!form) return;

  const button = form.querySelector('button[type="submit"]');

  if (button) {
    button.innerHTML =
      label === "Update Student"
        ? '<i class="bi bi-pencil-square"></i> Update Student'
        : '<i class="bi bi-save"></i> Save Student';
  }
}

// =============================================
// Logout
// =============================================

function logout(event) {
  event.preventDefault();

  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "../index.html";
}
