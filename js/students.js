
async function saveStudent(e) {
  e.preventDefault();

  const regInput = document.getElementById("regNumber");
  const nameInput = document.getElementById("studentName");
  const departmentInput = document.getElementById("department");
  const levelInput = document.getElementById("level");
  const genderInput = document.getElementById("gender");

  const regNumber = regInput ? regInput.value.trim() : "";
  const studentName = nameInput ? nameInput.value.trim() : "";
  const departmentId = departmentInput ? departmentInput.value : "";
  const level = levelInput ? levelInput.value : "";
  const gender = genderInput ? genderInput.value : "";

  if (
    !regNumber ||
    !studentName ||
    !departmentId ||
    !level ||
    !gender
  ) {
    alert(
      "Please enter the matric number, full name, department, gender and level."
    );
    return;
  }

  const nameParts = studentName.split(/\s+/);
  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ") || "";

  if (!firstName || !lastName) {
    alert("Please enter both the student's first name and last name.");
    return;
  }

  const studentData = {
    matric_number: regNumber,
    first_name: firstName,
    last_name: lastName,
    department_id: Number(departmentId),
    gender: gender,
    level: level
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify(studentData)
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

    await loadStudents();
  } catch (error) {
    console.error("Error saving student:", error);
    alert("Failed to save student: " + error.message);
  }
}
