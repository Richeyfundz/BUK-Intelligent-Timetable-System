
// =============================================
// BUK-ITMS STUDENTS MODULE
// Railway API + Authentication
// =============================================

const API_BASE_URL =
  "https://buk-intelligent-timetable-system-production.up.railway.app/api";

const STUDENT_API_URL = `${API_BASE_URL}/students`;
const DEPARTMENT_API_URL = `${API_BASE_URL}/departments`;

let editingStudentId = null;

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", async () => {
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

  const form = document.getElementById("studentForm");

  if (form) {
    form.addEventListener("submit", saveStudent);

    form.addEventListener("reset", () => {
      editingStudentId = null;
      setSaveButtonText("Save Student");
    });
  }

  document.getElementById("searchStudent")
    ?.addEventListener("input", searchStudent);

  document.getElementById("logoutBtn")
    ?.addEventListener("click", logout);

  await loadDepartmentDropdown();
  await loadStudents();
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

function getDataArray(result, key) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.[key])) return result[key];
  return [];
}

// =============================================
// LOAD DEPARTMENTS
// =============================================

async function loadDepartmentDropdown() {
  const dropdown = document.getElementById("department");
  if (!dropdown) return;

  dropdown.innerHTML =
    '<option value="">Loading departments...</option>';

  try {
    const result = await apiRequest(DEPARTMENT_API_URL);
    const departments = getDataArray(result, "departments");

    dropdown.innerHTML =
      '<option value="">-- Select Department --</option>';

    departments.forEach((department) => {
      const id = department.id ?? department.department_id;
      const name =
        department.department_name ??
        department.name ??
        department.department;

      if (id == null || !name) return;

      const option = document.createElement("option");
      option.value = String(id);
      option.textContent = name;
      dropdown.appendChild(option);
    });

    if (dropdown.options.length === 1) {
      dropdown.innerHTML =
        '<option value="">No departments found</option>';
    }
  } catch (error) {
    dropdown.innerHTML =
      '<option value="">Failed to load departments</option>';
    console.error(error);
    alert(error.message);
  }
}

// =============================================
// SAVE OR UPDATE STUDENT
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
    alert("A required form field is missing. Check students.html.");
    return;
  }

  const matricNumber = regInput.value.trim();
  const fullName = nameInput.value.trim();
  const departmentId = departmentInput.value;
  const gender = genderInput.value;
  const level = levelInput.value;

  if (
    !matricNumber ||
    !fullName ||
    !departmentId ||
    !gender ||
    !level
  ) {
    alert("Please fill in all student details.");
    return;
  }

  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ");

  if (!firstName || !lastName) {
    alert("Enter both the student's first name and surname.");
    return;
  }

  const studentData = {
    department_id: Number(departmentId),
    matric_no: matricNumber,
    first_name: firstName,
    last_name: lastName,
    gender,
    level,
  };

  const submitButton = document.querySelector(
    '#studentForm button[type="submit"]'
  );

  if (submitButton) submitButton.disabled = true;

  try {
    const isEditing = Boolean(editingStudentId);

    await apiRequest(
      isEditing
        ? `${STUDENT_API_URL}/${editingStudentId}`
        : STUDENT_API_URL,
      {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(studentData),
      }
    );

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
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

// =============================================
// LOAD STUDENTS
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
    const result = await apiRequest(STUDENT_API_URL);
    const students = getDataArray(result, "students");

    table.innerHTML = "";

    if (!students.length) {
      table.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No students found.</td>
        </tr>
      `;
      return;
    }

    students.forEach((student) => {
      const fullName =
        student.name ||
        `${student.first_name || ""} ${student.last_name || ""}`.trim();

      const matricNumber =
        student.matric_no ||
        student.matric_number ||
        student.registration_number ||
        student.regNumber ||
        student.registration_no ||
        "";

      const departmentName =
        student.department_name || student.department || "";

      const row = document.createElement("tr");

      [
        matricNumber,
        fullName,
        departmentName,
        student.level || "",
      ].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actions = document.createElement("td");

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn btn-warning btn-sm me-2";
      editButton.title = "Edit Student";
      editButton.innerHTML =
        '<i class="bi bi-pencil-square"></i>';
      editButton.addEventListener("click", () => editStudent(student.id));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.title = "Delete Student";
      deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
      deleteButton.addEventListener("click", () =>
        deleteStudent(student.id)
      );

      actions.append(editButton, deleteButton);
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

    alert(error.message);
  }
}

// =============================================
// EDIT STUDENT
// =============================================

async function editStudent(id) {
  try {
    const result = await apiRequest(`${STUDENT_API_URL}/${id}`);
    const student = result.data || result.student || result;

    editingStudentId = student.id ?? id;

    document.getElementById("regNumber").value =
      student.matric_no ||
      student.matric_number ||
      student.registration_number ||
      student.regNumber ||
      student.registration_no ||
      "";

    document.getElementById("studentName").value =
      student.name ||
      `${student.first_name || ""} ${student.last_name || ""}`.trim();

    const departmentDropdown = document.getElementById("department");

    if (departmentDropdown.options.length <= 1) {
      await loadDepartmentDropdown();
    }

    departmentDropdown.value = String(
      student.department_id ?? student.departmentId ?? ""
    );

    document.getElementById("gender").value = student.gender || "";
    document.getElementById("level").value = student.level || "";

    setSaveButtonText("Update Student");

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Error loading student:", error);
    alert("Failed to load student: " + error.message);
  }
}

// =============================================
// DELETE STUDENT
// =============================================

async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) {
    return;
  }

  try {
    await apiRequest(`${STUDENT_API_URL}/${id}`, {
      method: "DELETE",
    });

    alert("Student deleted successfully.");
    await loadStudents();
  } catch (error) {
    console.error("Error deleting student:", error);
    alert("Failed to delete student: " + error.message);
  }
}

// =============================================
// SEARCH STUDENTS
// =============================================

function searchStudent() {
  const input = document.getElementById("searchStudent");
  const table = document.getElementById("studentTable");

  if (!input || !table) return;

  const keyword = input.value.toLowerCase().trim();

  table.querySelectorAll("tr").forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(keyword)
      ? ""
      : "none";
  });
}

// =============================================
// SAVE BUTTON LABEL
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
// LOGOUT
// =============================================

function logout(event) {
  event?.preventDefault();
  clearSession();
  window.location.href = "../index.html";
}
