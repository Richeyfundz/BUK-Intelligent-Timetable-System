const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please enter your username and password.");
    return;
  }

  try {
    const response = await fetch(
      "https://buk-intelligent-timetable-system-production.up.railway.app/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      },
    );

    const data = await response.json();

    console.log("Login response:", data);

    if (response.ok && data.success) {
      if (!data.user) {
        alert("Login successful, but user information was not returned.");
        return;
      }

      localStorage.setItem("token", data.token || "");
      localStorage.setItem("user", JSON.stringify(data.user));

      // Keep existing page authentication system working
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("username", data.user.username || username);

      alert("Login Successful!");

      window.location.href = "pages/dashboard.html";
    } else {
      const errorMessage =
        data.message ||
        data.error ||
        data.msg ||
        "Invalid username or password.";

      alert(errorMessage);
    }
  } catch (error) {
    console.error("Login Error:", error);

    alert("Unable to connect to the server.");
  }
});

// =============================================
// Show / Hide Password
// =============================================

const togglePassword = document.getElementById("togglePassword");

if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const password = document.getElementById("password");

    if (password.type === "password") {
      password.type = "text";
      togglePassword.innerHTML = '<i class="bi bi-eye-slash-fill"></i>';
    } else {
      password.type = "password";
      togglePassword.innerHTML = '<i class="bi bi-eye-fill"></i>';
    }
  });
}
