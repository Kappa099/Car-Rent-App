let carListEl = document.getElementById("car-list");
let loadingEl = document.getElementById("loading");
let carForm = document.getElementById("carForm");
let messageEl = document.getElementById("message");
let filterForm = document.getElementById("filterForm");
let sortSelect = document.getElementById("sortCars");
let photoInput = document.getElementById("images");
let imagePreviewContainer = document.getElementById("imagePreviews");

let selectedFiles = [];

function getAccessToken() { return localStorage.getItem("access"); }
function getCurrentUsername() { return localStorage.getItem("username"); }
function getURLParameter(name) {
  let urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

async function fetchWithAuth(endpoint, options = {}) {
  let token = getAccessToken();
  if (!options.headers) options.headers = {};
  if (!(options.body instanceof FormData)) options.headers["Content-Type"] = "application/json";
  if (token) options.headers["Authorization"] = "Bearer " + token;
  return await fetch("http://127.0.0.1:8000" + endpoint, options);
}

async function deleteCar(carId) {
  if (!confirm("Are you sure you want to delete this car?")) return;

  try {
    let res = await fetchWithAuth("/cars/" + carId + "/", { method: "DELETE" });
    if (res.ok) {
      if (messageEl) {
        messageEl.textContent = "Car deleted successfully!";
        messageEl.style.color = "green";
        setTimeout(function() { messageEl.textContent = ""; }, 3000);
      }
      loadCars();
    } else {
      let errorMsg = "Failed to delete car";
      try { let errorData = await res.json(); errorMsg = errorData.detail || errorMsg; } 
      catch (e) { errorMsg = await res.text() || errorMsg; }
      if (messageEl) { messageEl.textContent = errorMsg; messageEl.style.color = "red"; setTimeout(function() { messageEl.textContent = ""; }, 5000); }
      alert(errorMsg);
    }
  } catch (error) {
    console.error("Error deleting car:", error);
    let errMsg = "Error deleting car: " + error.message;
    if (messageEl) { messageEl.textContent = errMsg; messageEl.style.color = "red"; }
    alert(errMsg);
  }
}

async function loadCars(query = "") {
  try {
    carListEl.innerHTML = "";
    loadingEl.style.display = "block";
    let res = await fetch("http://127.0.0.1:8000/cars/" + query, { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch cars");

    let cars = await res.json();
    loadingEl.style.display = "none";

    if (cars.length === 0) { carListEl.innerHTML = "<p>No cars available.</p>"; return; }

    let currentUser = getCurrentUsername();

    cars.forEach(function(car) {
      let div = document.createElement("div");
      div.classList.add("car-card");

      let imgSrc = car.photos && car.photos.length > 0
        ? "http://127.0.0.1:8000" + car.photos[0]
        : "http://127.0.0.1:8000/media/cars/photos/default-car.jpg";

      let isOwner = currentUser && car.owner === currentUser;

      div.innerHTML = `
        <a href="details.html?id=${car.id}" class="car-card-link">
            <span class="heart">&hearts;</span>
            <img src="${imgSrc}" alt="${car.brand} ${car.model}">
            <h3>${car.brand} ${car.model} (${car.year})</h3>
            <p>Price per day: $${car.price}</p>
            <p>Capacity: ${car.capacity} people</p>
            <p>Transmission: ${car.transmission}</p>
            <p>City: ${car.location}</p>
            <p>Owner: ${car.owner}</p>
            <p class="likes-count">Likes: ${car.likes_count || 0}</p>
        </a>
        <div class="car-actions">
          <button class="rent-btn" data-car-id="${car.id}">Rent</button>
          ${isOwner ? `<button class="edit-btn" data-car-id="${car.id}">Edit</button><button class="delete-btn" data-car-id="${car.id}">Delete</button>` : ''}
        </div>
      `;

      let heartEl = div.querySelector(".heart");
      let likesCountEl = div.querySelector(".likes-count");
      if (car.is_liked) heartEl.classList.add("liked");

      heartEl.addEventListener("click", async function(e) {
        e.preventDefault();
        try {
          let res = await fetchWithAuth("/cars/" + car.id + "/like/", { method: "POST" });
          if (res.ok) {
            let data = await res.json();
            if (data.message === "Car liked!") { heartEl.classList.add("liked"); car.likes_count += 1; } 
            else if (data.message === "Car unliked.") { heartEl.classList.remove("liked"); car.likes_count -= 1; }
            likesCountEl.textContent = "Likes: " + (car.likes_count || 0);
          }
        } catch (err) { console.error("Error liking/unliking car:", err); }
      });

      let rentBtn = div.querySelector(".rent-btn");
      rentBtn.addEventListener("click", function() { window.location.href = "rent.html?car_id=" + car.id; });

      let editBtn = div.querySelector(".edit-btn");
      if (editBtn) editBtn.addEventListener("click", function() { window.location.href = "details.html?id=" + car.id; });

      let deleteBtn = div.querySelector(".delete-btn");
      if (deleteBtn) deleteBtn.addEventListener("click", function() { deleteCar(car.id); });

      carListEl.appendChild(div);
    });
  } catch (e) {
    carListEl.innerHTML = "<p>Error loading cars.</p>";
    console.error(e);
  }
}

function updatePreviews() {
  imagePreviewContainer.innerHTML = "";
  imagePreviewContainer.style.display = "flex";
  imagePreviewContainer.style.flexWrap = "wrap";
  imagePreviewContainer.style.gap = "10px";
  
  selectedFiles.forEach(function(file, index) {
    let previewDiv = document.createElement("div");
    previewDiv.style.position = "relative";
    previewDiv.style.display = "inline-block";

    let img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.onload = function() { URL.revokeObjectURL(img.src); };
    img.style.width = "120px";
    img.style.height = "80px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "6px";

    let removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.style.position = "absolute";
    removeBtn.style.top = "-5px";
    removeBtn.style.right = "-5px";
    removeBtn.style.background = "red";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.borderRadius = "50%";
    removeBtn.style.width = "20px";
    removeBtn.style.height = "20px";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.fontSize = "12px";

    removeBtn.addEventListener("click", function() {
      selectedFiles.splice(index, 1);
      updatePreviews();
    });

    previewDiv.appendChild(img);
    previewDiv.appendChild(removeBtn);
    imagePreviewContainer.appendChild(previewDiv);
  });
}

function initializePage() {
  let cityParam = getURLParameter("city");
  if (cityParam) {
    let filterCityEl = document.getElementById("filterCity");
    if (filterCityEl) filterCityEl.value = cityParam.toLowerCase();
    loadCars("?city=" + cityParam);
  } else {
    loadCars();
  }
}

photoInput.addEventListener("change", function () {
  Array.from(this.files).forEach(function(file) {
    if (!selectedFiles.some(function(f){ return f.name === file.name && f.size === file.size; })) selectedFiles.push(file);
  });
  updatePreviews();
  this.value = '';
});

filterForm.addEventListener("submit", async function(e) {
  e.preventDefault();
  let city = document.getElementById("filterCity").value;
  let yearMin = document.getElementById("yearMin").value;
  let yearMax = document.getElementById("yearMax").value;
  let capacity = document.getElementById("capacityFilter").value;

  let query = "?";
  if (city) query += "city=" + city + "&";
  if (yearMin) query += "year_min=" + yearMin + "&";
  if (yearMax) query += "year_max=" + yearMax + "&";
  if (capacity) query += "capacity=" + capacity + "&";

  let sortValue = sortSelect.value;
  if (sortValue === "popular") query += "sort=popular&";

  let newUrl = window.location.pathname;
  if (query !== "?") newUrl += query.slice(0, -1);
  window.history.pushState({}, "", newUrl);

  await loadCars(query);
});

sortSelect.addEventListener("change", function() {
  let sortValue = sortSelect.value;
  let query = sortValue === "popular" ? "?sort=popular" : "";
  let cityFilter = document.getElementById("filterCity").value;
  if (cityFilter) query = query ? query + "&city=" + cityFilter : "?city=" + cityFilter;
  loadCars(query);
});

carForm.addEventListener("submit", async function(e) {
  e.preventDefault();
  let brand = document.getElementById("brand").value;
  let model = document.getElementById("model").value;
  let year = parseInt(document.getElementById("year").value);
  let price = parseFloat(document.getElementById("price").value);
  let capacity = parseInt(document.getElementById("capacity").value);
  let transmission = document.getElementById("transmission").value;
  let location = document.getElementById("location").value;

  let formData = new FormData();
  formData.append("brand", brand);
  formData.append("model", model);
  formData.append("year", year);
  formData.append("price", price);
  formData.append("capacity", capacity);
  formData.append("transmission", transmission);
  formData.append("location", location);

  if (selectedFiles.length > 0) {
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("images", selectedFiles[i]);
    }
  }

  try {
    let res = await fetchWithAuth("/cars/create/", { method: "POST", body: formData });
    let errMsg = "";
    let contentType = res.headers.get("content-type") || "";

    if (res.ok) {
      messageEl.textContent = "Car added successfully!";
      messageEl.style.color = "green";
      carForm.reset();
      selectedFiles = [];
      imagePreviewContainer.innerHTML = "";
      if (document.getElementById("filterCity").value) loadCars("?city=" + document.getElementById("filterCity").value);
      else loadCars();
    } else {
      if (contentType.includes("application/json")) {
        let err = await res.json();
        errMsg = err.detail || JSON.stringify(err);
      } else {
        errMsg = await res.text();
      }
      messageEl.textContent = "Failed to add car: " + errMsg;
      messageEl.style.color = "red";
    }
  } catch (error) {
    console.error("Error adding car:", error);
    messageEl.textContent = "Error adding car.";
    messageEl.style.color = "red";
  }
});

initializePage();
