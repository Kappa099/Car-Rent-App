document.addEventListener("DOMContentLoaded", () => {
    const profileInfo = document.getElementById("profile-info");
    const ownedCarsEl = document.getElementById("owned-cars");
    const rentedCarsEl = document.getElementById("rented-cars");

    const accessToken = localStorage.getItem("access");

    if (!accessToken) {
        window.location.href = "login.html";
        return;
    }

    async function fetchProfile() {
        try {
            // Step 1: Get current user ID
            const meRes = await fetch("http://127.0.0.1:8000/accounts/me/", {
                headers: { "Authorization": `Bearer ${accessToken}` }
            });

            if (!meRes.ok) {
                if (meRes.status === 401) {
                    localStorage.removeItem("access");
                    window.location.href = "login.html";
                    return;
                }
                throw new Error("Failed to fetch current user");
            }

            const meData = await meRes.json();
            const userId = meData.id;

            // Step 2: Fetch full profile
            const res = await fetch(`http://127.0.0.1:8000/accounts/profile/${userId}/`, {
                headers: { "Authorization": `Bearer ${accessToken}` }
            });

            if (!res.ok) throw new Error("Failed to fetch full profile");

            const data = await res.json();
            console.log("Profile data received:", data);

            // Render profile info
            profileInfo.innerHTML = `
                <div class="profile-field"><span>Username:</span> ${data.username}</div>
                <div class="profile-field"><span>Email:</span> ${data.email}</div>
                <div class="profile-field"><span>First Name:</span> ${data.first_name || 'Not provided'}</div>
                <div class="profile-field"><span>Last Name:</span> ${data.last_name || 'Not provided'}</div>
            `;

            // Owned Cars
            if (data.owned_cars && Array.isArray(data.owned_cars)) {
                renderCars(data.owned_cars, ownedCarsEl, "No cars owned.");
            } else {
                await fetchOwnedCarsAlternative();
            }

            // Rented Cars — pass rentals array instead
            if (data.rentals && Array.isArray(data.rentals)) {
                renderCars(data.rentals, rentedCarsEl, "No cars rented.", true);
            } else {
                rentedCarsEl.innerHTML = "<p>No cars rented.</p>";
            }

        } catch (err) {
            console.error("Error fetching profile:", err);
            profileInfo.innerText = "Failed to load profile.";
        }
    }

    async function fetchOwnedCarsAlternative() {
        try {
            const userRes = await fetch("http://127.0.0.1:8000/accounts/me/", {
                headers: { "Authorization": `Bearer ${accessToken}` }
            });

            if (!userRes.ok) throw new Error("Failed to get user data");
            const userData = await userRes.json();
            const userId = userData.id;

            const carsRes = await fetch("http://127.0.0.1:8000/cars/", {
                headers: { "Authorization": `Bearer ${accessToken}` }
            });

            if (!carsRes.ok) throw new Error("Failed to fetch cars");
            const allCars = await carsRes.json();

            const ownedCars = allCars.filter(car => {
                return car.owner === userId || 
                       car.owner_id === userId || 
                       (car.owner && car.owner.id === userId);
            });

            renderCars(ownedCars, ownedCarsEl, "No cars owned.");

        } catch (err) {
            console.error("Error fetching owned cars alternative:", err);
            ownedCarsEl.innerHTML = "<p>Unable to load owned cars.</p>";
        }
    }

    function renderCars(cars, containerEl, emptyMessage, isRental = false) {
        if (!cars || cars.length === 0) {
            containerEl.innerHTML = `<p>${emptyMessage}</p>`;
            return;
        }

        containerEl.innerHTML = "";

        cars.forEach(item => {
            const car = item.car ? item.car : item; // If rental, use item.car
            const div = document.createElement("div");
            div.classList.add("car-card-small");

            let imgSrc = "http://127.0.0.1:8000/media/cars/photos/default-car.jpg";
            if (car.photos && car.photos.length > 0) {
                imgSrc = car.photos[0].startsWith('http') ? car.photos[0] : `http://127.0.0.1:8000${car.photos[0]}`;
            } else if (car.image) {
                imgSrc = car.image.startsWith('http') ? car.image : `http://127.0.0.1:8000${car.image}`;
            } else if (car.photo) {
                imgSrc = car.photo.startsWith('http') ? car.photo : `http://127.0.0.1:8000${car.photo}`;
            }

            div.innerHTML = `
                <span class="heart ${car.is_liked ? 'liked' : ''}">&hearts;</span>
                <img src="${imgSrc}" alt="${car.brand} ${car.model}" 
                     onerror="this.src='http://127.0.0.1:8000/media/cars/photos/default-car.jpg';">
                <h4>${car.brand} ${car.model}</h4>
                <p>Year: ${car.year}</p>
                <p>Price/day: ${car.price}</p>
                ${isRental ? `<p>Pickup: ${item.pickup_date}</p>
                              <p>Days: ${item.days}</p>
                              <p>Total: ${item.total_price}</p>` : ""}
            `;

            const heartEl = div.querySelector(".heart");
            heartEl.addEventListener("click", async e => {
                e.preventDefault();
                try {
                    const res = await fetch(`http://127.0.0.1:8000/cars/${car.id}/like/`, {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${accessToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.message === "Car liked!") heartEl.classList.add("liked");
                        else if (data.message === "Car unliked.") heartEl.classList.remove("liked");
                    }
                } catch (err) {
                    console.error("Error liking car:", err);
                }
            });

            containerEl.appendChild(div);
        });
    }

    fetchProfile();
});
