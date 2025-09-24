const carForm = document.getElementById("carForm");
const msgEl = document.getElementById("message");

carForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("brand", document.getElementById("brand").value);
  formData.append("model", document.getElementById("model").value);
  formData.append("year", document.getElementById("year").value);
  formData.append("price", document.getElementById("price").value);

  const fileInput = document.getElementById("images");
  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append("images", fileInput.files[i]);
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/cars/create/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
        // Do NOT set Content-Type when using FormData
      },
      body: formData
    });

    const result = await res.json();
    if (res.ok) {
      msgEl.style.color = "green";
      msgEl.textContent = "Car added successfully!";
      carForm.reset();
      // Redirect to cars list
      window.location.href = "cars.html";
    } else {
      msgEl.style.color = "red";
      msgEl.textContent = result.detail || JSON.stringify(result);
    }
  } catch (e) {
    msgEl.style.color = "red";
    msgEl.textContent = "Server error: " + e;
  }
});

// Redirect if not authenticated
(async () => {
  if (!getAccessToken()) window.location.href = "login.html";
})();
