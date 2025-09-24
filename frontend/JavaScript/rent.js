document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const CAR_ID = urlParams.get("car_id"); 

    const carPhoto = document.getElementById("car-photo");
    const carName = document.getElementById("car-name");
    const carLocation = document.getElementById("car-location");
    const carPriceEl = document.getElementById("car-price");
    const daysInput = document.getElementById("days");
    const totalPriceEl = document.getElementById("total-price");
    const rentForm = document.getElementById("rent-form");
    const messageEl = document.getElementById("message");
    const pickupDateInput = document.getElementById("pickup-date");
    const rentButton = rentForm.querySelector("button[type='submit']");

    const token = localStorage.getItem("access");
    const username = localStorage.getItem("username");
    const currentUserId = token ? parseInt(localStorage.getItem("user_id")) : null;

    let carData = null;
    

    if (!CAR_ID) {
        messageEl.textContent = "Invalid car selected.";
        messageEl.style.color = "red";
        rentForm.style.display = "none";
        return;
    }

    async function fetchWithAuth(endpoint, options = {}) {
        if (!options.headers) options.headers = {};
        if (!(options.body instanceof FormData)) {
            options.headers["Content-Type"] = "application/json";
        }
        if (token) options.headers["Authorization"] = `Bearer ${token}`;
        return fetch(`http://127.0.0.1:8000${endpoint}`, options);
    }

    async function loadCar() {
        try {
            const res = await fetch(`http://127.0.0.1:8000/cars/${CAR_ID}/`);
            if (!res.ok) throw new Error("Failed to fetch car info");

            carData = await res.json();

            carPhoto.src = carData.photos?.length 
                ? `http://127.0.0.1:8000${carData.photos[0]}` 
                : "http://127.0.0.1:8000/media/cars/photos/default-car.jpg";

            carName.textContent = `${carData.brand} ${carData.model} (${carData.year})`;
            carLocation.textContent = carData.location;
            carPriceEl.textContent = carData.price;

            updateTotalPrice();

            // DEBUG LOGS
            console.log("Token:", token);
            console.log("Current user ID:", currentUserId);
            console.log("Car owner ID:", carData.owner_id);

            // Owner check
            if (token && carData.owner_id === currentUserId) {
                console.log("You are the owner of this car.");
                rentButton.disabled = true;
                rentButton.textContent = "You cannot rent your own car";
                rentButton.style.backgroundColor = "#ccc";
            } else if (!token) {
                console.log("No token, user not logged in.");
                rentButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    window.location.href = "/login.html"; // redirect to login
                });
            } else {
                console.log("You are NOT the owner, rental available.");
            }

        } catch (err) {
            console.error(err);
            messageEl.textContent = "Error loading car info.";
            messageEl.style.color = "red";
        }
    }

    function updateTotalPrice() {
        const days = parseInt(daysInput.value) || 1;
        totalPriceEl.textContent = (days * (carData?.price || 0)).toFixed(2);
    }

    daysInput.addEventListener("input", updateTotalPrice);

    rentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!token) return; // already redirected if not logged in
        messageEl.textContent = "";

        const pickup_date = pickupDateInput.value;
        const days = parseInt(daysInput.value);

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
            const res = await fetchWithAuth(`/cars/${CAR_ID}/rent/`, {
                method: "POST",
                body: JSON.stringify({ pickup_date, days })
            });

            const data = await res.json();
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
