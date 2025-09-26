document.addEventListener("DOMContentLoaded", function() {
    var urlParams = new URLSearchParams(window.location.search);
    var CAR_ID = urlParams.get("car_id"); 

    var carPhoto = document.getElementById("car-photo");
    var carName = document.getElementById("car-name");
    var carLocation = document.getElementById("car-location");
    var carPriceEl = document.getElementById("car-price");
    var daysInput = document.getElementById("days");
    var totalPriceEl = document.getElementById("total-price");
    var rentForm = document.getElementById("rent-form");
    var messageEl = document.getElementById("message");
    var pickupDateInput = document.getElementById("pickup-date");
    var rentButton = rentForm.querySelector("button[type='submit']");

    var token = localStorage.getItem("access");
    var username = localStorage.getItem("username");
    var currentUserId = token ? parseInt(localStorage.getItem("user_id")) : null;

    var carData = null;

    if (!CAR_ID) {
        messageEl.textContent = "Invalid car selected.";
        messageEl.style.color = "red";
        rentForm.style.display = "none";
        return;
    }

    async function fetchWithAuth(endpoint, options) {
        if (!options) options = {};
        if (!options.headers) options.headers = {};
        if (!(options.body instanceof FormData)) {
            options.headers["Content-Type"] = "application/json";
        }
        if (token) options.headers["Authorization"] = "Bearer " + token;
        return fetch("http://127.0.0.1:8000" + endpoint, options);
    }

    async function loadCar() {
        try {
            var res = await fetch("http://127.0.0.1:8000/cars/" + CAR_ID + "/");
            if (!res.ok) throw new Error("Failed to fetch car info");

            carData = await res.json();

            carPhoto.src = carData.photos && carData.photos.length 
                ? "http://127.0.0.1:8000" + carData.photos[0]
                : "http://127.0.0.1:8000/media/cars/photos/default-car.jpg";

            carName.textContent = carData.brand + " " + carData.model + " (" + carData.year + ")";
            carLocation.textContent = carData.location;
            carPriceEl.textContent = carData.price;

            updateTotalPrice();

            if (token && carData.owner_id === currentUserId) {
                rentButton.disabled = true;
                rentButton.textContent = "You cannot rent your own car";
                rentButton.style.backgroundColor = "#ccc";
            } else if (!token) {
                rentButton.addEventListener("click", function(e) {
                    e.preventDefault();
                    window.location.href = "/login.html";
                });
            }

        } catch (err) {
            console.error(err);
            messageEl.textContent = "Error loading car info.";
            messageEl.style.color = "red";
        }
    }

    function updateTotalPrice() {
        var days = parseInt(daysInput.value) || 1;
        totalPriceEl.textContent = ((days * (carData ? carData.price : 0))).toFixed(2);
    }

    daysInput.addEventListener("input", updateTotalPrice);

    rentForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        if (!token) return;
        messageEl.textContent = "";

        var pickup_date = pickupDateInput.value;
        var days = parseInt(daysInput.value);

        if (!pickup_date) {
            messageEl.textContent = "Please select a pickup date";
            messageEl.style.color = "red";
            return;
        }

        if (days < 1) {
            messageEl.textContent = "Number of days must be at least 1";
            messageEl.style.color = "red";
            return;
        }

        try {
            var res = await fetchWithAuth("/cars/" + CAR_ID + "/rent/", {
                method: "POST",
                body: JSON.stringify({ pickup_date: pickup_date, days: days })
            });

            var data = await res.json();
            if (res.ok) {
                messageEl.style.color = "green";
                messageEl.textContent = data.message || "Car rented successfully!";
            } else {
                messageEl.style.color = "red";
                messageEl.textContent = data.error || JSON.stringify(data);
            }
        } catch (err) {
            console.error(err);
            messageEl.style.color = "red";
            messageEl.textContent = "Something went wrong!";
        }
    });

    loadCar();
});
