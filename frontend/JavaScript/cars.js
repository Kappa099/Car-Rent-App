var carListEl = document.getElementById("car-list");
var loadingEl = document.getElementById("loading");
var carForm = document.getElementById("carForm");
var messageEl = document.getElementById("message");
var filterForm = document.getElementById("filterForm");
var sortSelect = document.getElementById("sortCars");

// Helper: get access token
function getAccessToken() {
  return localStorage.getItem("access");
}

// Helper: get current username from localStorage
function getCurrentUsername() {
  return localStorage.getItem("username");
}

// Helper: get URL parameters
function getURLParameter(name) {
  var urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Helper: fetch with auth
async function fetchWithAuth(endpoint, options = {}) {
  var token = getAccessToken();
  if (!options.headers) options.headers = {};
  if (!(options.body instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
  }
  if (token) options.headers["Authorization"] = `Bearer ${token}`;
  return await fetch(`http://127.0.0.1:8000${endpoint}`, options);
}

// Delete car function
async function deleteCar(carId) {
  if (!confirm("Are you sure you want to delete this car?")) {
    return;
  }

  try {
    var res = await fetchWithAuth(`/cars/${carId}/`, {
      method: "DELETE"
    });

    if (res.ok) {
      // Show success message
      if (messageEl) {
        messageEl.textContent = "Car deleted successfully!";
        messageEl.style.color = "green";
        setTimeout(function() {
          messageEl.textContent = "";
        }, 3000);
      }
      // Reload the car list
      loadCars();
    } else {
      var errorMsg = "Failed to delete car";
      try {
        var errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        errorMsg = await res.text() || errorMsg;
      }
      
      if (messageEl) {
        messageEl.textContent = errorMsg;
        messageEl.style.color = "red";
        setTimeout(function() {
          messageEl.textContent = "";
        }, 5000);
      }
      alert(errorMsg);
    }
  } catch (error) {
    console.error("Error deleting car:", error);
    var errMsg = "Error deleting car: " + error.message;
    if (messageEl) {
      messageEl.textContent = errMsg;
      messageEl.style.color = "red";
    }
    alert(errMsg);
  }
}

// Load cars
async function loadCars(query = "") {
  try {
    carListEl.innerHTML = "";
    loadingEl.style.display = "block";

    var res = await fetch(`http://127.0.0.1:8000/cars/${query}`, { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch cars");

    var cars = await res.json();
    loadingEl.style.display = "none";

    if (cars.length === 0) {
      carListEl.innerHTML = "<p>No cars available.</p>";
      return;
    }

    // Get current user
    var currentUser = getCurrentUsername();

    cars.forEach(function (car) {
      var div = document.createElement("div");
      div.classList.add("car-card");

      var imgSrc = car.photos && car.photos.length > 0
        ? `http://127.0.0.1:8000${car.photos[0]}`
        : "http://127.0.0.1:8000/media/cars/photos/default-car.jpg";

      // Check if current user is the owner
      var isOwner = currentUser && car.owner === currentUser;

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
          ${isOwner ? `
            <button class="edit-btn" data-car-id="${car.id}">Edit</button>
            <button class="delete-btn" data-car-id="${car.id}">Delete</button>
          ` : ''}
        </div>
      `;

      var heartEl = div.querySelector(".heart");
      var likesCountEl = div.querySelector(".likes-count");

      // Set initial liked state
      if (car.is_liked) {
        heartEl.classList.add("liked");
      }

      // Heart click: toggle like via API
      heartEl.addEventListener("click", async function (e) {
        e.preventDefault();
        try {
          var res = await fetchWithAuth(`/cars/${car.id}/like/`, { method: "POST" });
          if (res.ok) {
            var data = await res.json();
            if (data.message === "Car liked!") {
              heartEl.classList.add("liked");
              car.likes_count += 1;
            } else if (data.message === "Car unliked.") {
              heartEl.classList.remove("liked");
              car.likes_count -= 1;
            }
            likesCountEl.textContent = `Likes: ${car.likes_count || 0}`;
          } else {
            console.error("Failed to like/unlike car");
          }
        } catch (err) {
          console.error("Error liking/unliking car:", err);
        }
      });

      // Rent button click: go to rent.html with car_id
      var rentBtn = div.querySelector(".rent-btn");
      rentBtn.addEventListener("click", function () {
        window.location.href = `rent.html?car_id=${car.id}`;
      });

      // Edit button click (if owner)
      var editBtn = div.querySelector(".edit-btn");
      if (editBtn) {
        editBtn.addEventListener("click", function () {
          window.location.href = `details.html?id=${car.id}`;
        });
      }

      // Delete button click (if owner)
      var deleteBtn = div.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
          deleteCar(car.id);
        });
      }

      carListEl.appendChild(div);
    });
  } catch (e) {
    carListEl.innerHTML = "<p>Error loading cars.</p>";
    console.error(e);
  }
}

// Initialize page with URL parameters
function initializePage() {
  // Check if there's a city parameter in the URL
  var cityParam = getURLParameter("city");
  
  if (cityParam) {
    // Set the filter dropdown to the city from URL
    var filterCityEl = document.getElementById("filterCity");
    if (filterCityEl) {
      filterCityEl.value = cityParam.toLowerCase();
    }
    
    // Load cars with the city filter
    loadCars(`?city=${cityParam}`);
  } else {
    // Load all cars
    loadCars();
  }
}

// Filter form
filterForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  var city = document.getElementById("filterCity").value;
  var yearMin = document.getElementById("yearMin").value;
  var yearMax = document.getElementById("yearMax").value;
  var capacity = document.getElementById("capacityFilter").value;

  var query = "?";
  if (city) query += `city=${city}&`;
  if (yearMin) query += `year_min=${yearMin}&`;
  if (yearMax) query += `year_max=${yearMax}&`;
  if (capacity) query += `capacity=${capacity}&`;

  // Include sort if selected
  var sortValue = sortSelect.value;
  if (sortValue === "popular") query += "sort=popular&";

  // Update URL without reloading the page
  var newUrl = window.location.pathname;
  if (query !== "?") {
    newUrl += query.slice(0, -1); // Remove trailing &
  }
  window.history.pushState({}, '', newUrl);

  await loadCars(query);
});

// Sorting select
sortSelect.addEventListener("change", function () {
  var sortValue = sortSelect.value;
  var query = sortValue === "popular" ? "?sort=popular" : "";
  
  // Keep existing city filter if present
  var cityFilter = document.getElementById("filterCity").value;
  if (cityFilter) {
    query = query ? query + "&city=" + cityFilter : "?city=" + cityFilter;
  }
  
  loadCars(query);
});

// Handle add car form
carForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  var brand = document.getElementById("brand").value;
  var model = document.getElementById("model").value;
  var year = parseInt(document.getElementById("year").value);
  var price = parseFloat(document.getElementById("price").value);
  var capacity = parseInt(document.getElementById("capacity").value);
  var transmission = document.getElementById("transmission").value;
  var location = document.getElementById("location").value;
  var photoInput = document.getElementById("images");

  var formData = new FormData();
  formData.append("brand", brand);
  formData.append("model", model);
  formData.append("year", year);
  formData.append("price", price);
  formData.append("capacity", capacity);
  formData.append("transmission", transmission);
  formData.append("location", location);

  if (photoInput && photoInput.files.length > 0) {
    for (var i = 0; i < photoInput.files.length; i++) {
      formData.append("images", photoInput.files[i]);
    }
  }

  try {
    var res = await fetchWithAuth("/cars/create/", {
      method: "POST",
      body: formData
    });

    var errMsg = "";
    var contentType = res.headers.get("content-type") || "";

    if (res.ok) {
      messageEl.textContent = "Car added successfully!";
      messageEl.style.color = "green";
      carForm.reset();
      
      // Reload with current filters
      var cityFilter = document.getElementById("filterCity").value;
      if (cityFilter) {
        loadCars(`?city=${cityFilter}`);
      } else {
        loadCars();
      }
    } else {
      if (contentType.includes("application/json")) {
        var err = await res.json();
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

// Initialize the page
initializePage();