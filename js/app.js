
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

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
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("username", data.user.username || username);

        alert("Login Successful!");
        window.location.href = "pages/dashboard.html";
      } else {
        alert(
          data.message ||
          data.error ||
          data.msg ||
          "Invalid username or password."
        );
      }
    } catch (error) {
      alert("Unable to connect to the server. Please try again.");
    }
  });
}

// Show / Hide Password
const togglePassword = document.getElementById("togglePassword");

if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const passwordInput = document.getElementById("password");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePassword.innerHTML =
        '<i class="bi bi-eye-slash-fill"></i>';
    } else {
      passwordInput.type = "password";
      togglePassword.innerHTML =
        '<i class="bi bi-eye-fill"></i>';
    }
  });
}
