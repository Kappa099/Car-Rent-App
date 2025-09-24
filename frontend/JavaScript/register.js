document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        username: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        confirm_password: document.getElementById("confirm_password").value,
      };

      try {
        const response = await fetch(API_BASE + "/accounts/register/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        const msgEl = document.getElementById("message");

        if (response.ok) {
          msgEl.style.color = "green";
          msgEl.textContent = result.message || "Registered successfully!";
          registerForm.reset();
        } else {
          msgEl.style.color = "red";
          msgEl.textContent = result.detail || JSON.stringify(result);
        }
      } catch (error) {
        msgEl.style.color = "red";
        msgEl.textContent = "Server error: " + error;
      }
    });
  }
});
