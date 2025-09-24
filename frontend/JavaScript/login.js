document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        username: document.getElementById("phone").value,
        password: document.getElementById("password").value
      };
      const msgEl = document.getElementById("message");

      try {
        const res = await fetch(API_BASE + "/accounts/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
          setTokens(result.access, result.refresh);
          localStorage.setItem("user_id", result.user.id);
          localStorage.setItem("username", result.user.username);

          msgEl.style.color = "green";
          msgEl.textContent = "Logged in. Redirecting...";
          setTimeout(() => window.location.href = "index.html", 500);
        } else {
          msgEl.style.color = "red";
          msgEl.textContent = result.detail || JSON.stringify(result);
        }
      } catch (e) {
        msgEl.style.color = "red";
        msgEl.textContent = "Server error: " + e;
      }
    });
  }
});
