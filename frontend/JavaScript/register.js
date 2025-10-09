document.addEventListener("DOMContentLoaded", function() {
  let registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function(e) {
      e.preventDefault();

      let data = {
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        username: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        confirm_password: document.getElementById("confirm_password").value
      };

      try {
        let response = await fetch(API_BASE + "/accounts/register/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        let result = await response.json();
        let msgEl = document.getElementById("message");

        if (response.ok) {
          msgEl.style.color = "green";
          msgEl.textContent = result.message || "Registered successfully!";
          registerForm.reset();
        } else {
          msgEl.style.color = "red";
          msgEl.textContent = result.detail || JSON.stringify(result);
        }
      } catch (error) {
        let msgEl = document.getElementById("message");
        msgEl.style.color = "red";
        msgEl.textContent = "Server error: " + error;
      }
    });
  }
});
