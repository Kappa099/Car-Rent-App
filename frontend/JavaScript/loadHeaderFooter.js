document.addEventListener("DOMContentLoaded", async () => {
  const headerPlaceholder = document.getElementById("header-placeholder");
  const footerPlaceholder = document.getElementById("footer-placeholder");

  if (headerPlaceholder) {
    try {
      const res = await fetch("header.html");
      const headerHtml = await res.text();
      headerPlaceholder.innerHTML = headerHtml;

      const userLinkContainer = document.getElementById("user-link-container");
      const logoutBtn = document.getElementById("logoutBtn");
      const token = localStorage.getItem("access");

      if (token) {
        try {
          const userRes = await fetch("http://127.0.0.1:8000/accounts/me/", {
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (userRes.ok) {
            const user = await userRes.json();
            const username = user.username;

            if (userLinkContainer) {
              userLinkContainer.innerHTML = `
                <a href="profile.html" class="user-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24" style="vertical-align: middle; margin-right: 5px; fill: currentColor;">
                    <path d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/>
                  </svg>
                  ${username}
                </a>
              `;
            }

            if (logoutBtn) logoutBtn.style.display = "inline-block";

            if (logoutBtn) {
              logoutBtn.addEventListener("click", () => {
                localStorage.removeItem("access");
                window.location.href = "index.html";
              });
            }

          } else {
            if (userLinkContainer) userLinkContainer.innerHTML = `<a href="login.html" class="login-btn">Login</a>`;
            if (logoutBtn) logoutBtn.style.display = "none";
          }

        } catch (err) {
          console.error("Error fetching user info:", err);
        }

      } else {
        if (userLinkContainer) userLinkContainer.innerHTML = `<a href="login.html" class="login-btn">Login</a>`;
        if (logoutBtn) logoutBtn.style.display = "none";
      }

    } catch (err) {
      console.error("Error loading header:", err);
    }
  }

  if (footerPlaceholder) {
    try {
      const res = await fetch("footer.html");
      const footerHtml = await res.text();
      footerPlaceholder.innerHTML = footerHtml;

      const contactForm = document.querySelector(".form-container form");

      if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          
        const firstNameInput = contactForm.querySelector("#first-name");
        const lastNameInput  = contactForm.querySelector("#last-name");
        const emailInput     = contactForm.querySelector("#email");
        const messageInput   = contactForm.querySelector("#message");


          if (!firstNameInput || !lastNameInput || !emailInput || !messageInput) {
            alert("Form inputs not found.");
            return;
          }

          const data = {
            first_name: firstNameInput.value.trim(),
            last_name: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
            message: messageInput.value.trim(),
          };

          try {
            const res = await fetch("http://127.0.0.1:8000/api/contact/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (res.ok) {
              alert("Message sent successfully!");
              contactForm.reset();
            } else {
              const errorData = await res.json();
              console.error(errorData);
              alert("Failed to send message. Please check your input.");
            }
          } catch (err) {
            console.error(err);
            alert("An error occurred. Please try again later.");
          }
        });
      }

      const inputs = document.querySelectorAll(".input-group input, .input-group textarea");
      inputs.forEach(input => {
        input.addEventListener("invalid", () => {
          const instruction = input.parentElement.querySelector(".instruction");
          if (instruction) instruction.style.display = "block";
        });
      });

    } catch (err) {
      console.error("Error loading footer:", err);
    }
  }
});

function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem("access");
  if (!options.headers) options.headers = {};
  if (!(options.body instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
  }
  if (token) options.headers["Authorization"] = `Bearer ${token}`;
  return fetch(`http://127.0.0.1:8000${endpoint}`, options);
}
