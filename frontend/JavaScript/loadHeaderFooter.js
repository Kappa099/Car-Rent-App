document.addEventListener("DOMContentLoaded", async function() {
  var headerPlaceholder = document.getElementById("header-placeholder");
  var footerPlaceholder = document.getElementById("footer-placeholder");

  if (headerPlaceholder) {
    try {
      var res = await fetch("header.html");
      var headerHtml = await res.text();
      headerPlaceholder.innerHTML = headerHtml;

      var userLinkContainer = document.getElementById("user-link-container");
      var logoutBtn = document.getElementById("logoutBtn");
      var token = localStorage.getItem("access");

      if (token) {
        try {
          var userRes = await fetch("http://127.0.0.1:8000/accounts/me/", {
            headers: { "Authorization": "Bearer " + token }
          });

          if (userRes.ok) {
            var user = await userRes.json();
            var username = user.username;

            if (userLinkContainer) {
              userLinkContainer.innerHTML = 
                '<a href="profile.html" class="user-icon">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24" style="vertical-align: middle; margin-right: 5px; fill: currentColor;">' +
                    '<path d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/>' +
                  '</svg>' + username +
                '</a>';
            }

            if (logoutBtn) logoutBtn.style.display = "inline-block";

            if (logoutBtn) {
              logoutBtn.addEventListener("click", function() {
                localStorage.removeItem("access");
                window.location.href = "index.html";
              });
            }

          } else {
            if (userLinkContainer) userLinkContainer.innerHTML = '<a href="login.html" class="login-btn">Login</a>';
            if (logoutBtn) logoutBtn.style.display = "none";
          }

        } catch (err) {
          console.error("Error fetching user info:", err);
        }

      } else {
        if (userLinkContainer) userLinkContainer.innerHTML = '<a href="login.html" class="login-btn">Login</a>';
        if (logoutBtn) logoutBtn.style.display = "none";
      }

    } catch (err) {
      console.error("Error loading header:", err);
    }
  }

  if (footerPlaceholder) {
    try {
      var res = await fetch("footer.html");
      var footerHtml = await res.text();
      footerPlaceholder.innerHTML = footerHtml;

      var contactForm = document.querySelector(".form-container form");

      if (contactForm) {
        contactForm.addEventListener("submit", async function(e) {
          e.preventDefault();

          var firstNameInput = contactForm.querySelector("#first-name");
          var lastNameInput  = contactForm.querySelector("#last-name");
          var emailInput     = contactForm.querySelector("#email");
          var messageInput   = contactForm.querySelector("#message");

          if (!firstNameInput || !lastNameInput || !emailInput || !messageInput) {
            alert("Form inputs not found.");
            return;
          }

          var data = {
            first_name: firstNameInput.value.trim(),
            last_name: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
            message: messageInput.value.trim()
          };

          try {
            var res = await fetch("http://127.0.0.1:8000/api/contact/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data)
            });

            if (res.ok) {
              alert("Message sent successfully!");
              contactForm.reset();
            } else {
              var errorData = await res.json();
              console.error(errorData);
              alert("Failed to send message. Please check your input.");
            }
          } catch (err) {
            console.error(err);
            alert("An error occurred. Please try again later.");
          }
        });
      }

      var inputs = document.querySelectorAll(".input-group input, .input-group textarea");
      inputs.forEach(function(input) {
        input.addEventListener("invalid", function() {
          var instruction = input.parentElement.querySelector(".instruction");
          if (instruction) instruction.style.display = "block";
        });
      });

    } catch (err) {
      console.error("Error loading footer:", err);
    }
  }
});

function fetchWithAuth(endpoint, options) {
  options = options || {};
  var token = localStorage.getItem("access");
  if (!options.headers) options.headers = {};
  if (!(options.body instanceof FormData)) options.headers["Content-Type"] = "application/json";
  if (token) options.headers["Authorization"] = "Bearer " + token;
  return fetch("http://127.0.0.1:8000" + endpoint, options);
}
