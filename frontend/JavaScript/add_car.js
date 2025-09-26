var carForm = document.getElementById("carForm");
var msgEl = document.getElementById("message");

carForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  var formData = new FormData();
  formData.append("brand", document.getElementById("brand").value);
  formData.append("model", document.getElementById("model").value);
  formData.append("year", document.getElementById("year").value);
  formData.append("price", document.getElementById("price").value);

  var fileInput = document.getElementById("images");
  for (var i = 0; i < fileInput.files.length; i++) {
    formData.append("images", fileInput.files[i]);
  }

  try {
    var res = await fetch("http://127.0.0.1:8000/cars/create/", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: formData
    });

    var result = await res.json();
    if (res.ok) {
      msgEl.style.color = "green";
      msgEl.textContent = "Car added successfully!";
      carForm.reset();
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

(async () => {
  if (!getAccessToken()) window.location.href = "login.html";
})();
