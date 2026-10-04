const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Keep the existing page authentication system working
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("username", data.user.username);

      alert("Login Successful!");

      window.location.href = "pages/dashboard.html";
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);

    alert("Unable to connect to the server.");
  }
});

// Show/Hide Password

const togglePassword = document.getElementById("togglePassword");

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
