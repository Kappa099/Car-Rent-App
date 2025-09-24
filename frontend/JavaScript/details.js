document.addEventListener("DOMContentLoaded", () => {
    const carDetailsEl = document.getElementById("car-details");
    const loadingEl = document.getElementById("loading");
    const track = document.querySelector(".carousel-track");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    const dotsContainer = document.querySelector(".carousel-dots");

    const token = localStorage.getItem("access");
    const username = localStorage.getItem("username");
    const currentUserId = token ? parseInt(localStorage.getItem("user_id")) : null;
    
    

    async function fetchWithAuth(endpoint, options = {}) {
        if (!options.headers) options.headers = {};
        if (!(options.body instanceof FormData)) options.headers["Content-Type"] = "application/json";
        if (token) options.headers["Authorization"] = `Bearer ${token}`;
        return fetch(`http://127.0.0.1:8000${endpoint}`, options);
    }

    async function getCarDetails(carId) {
        try {
            const res = await fetch(`http://127.0.0.1:8000/cars/${carId}/`);
            if (!res.ok) throw new Error("Failed to fetch car details");
            const car = await res.json();
            loadingEl.style.display = "none";

            const currentUserId = parseInt(localStorage.getItem("user_id"), 10);
            const currentUsername = localStorage.getItem("username");
            const ownerId = car.owner_id;
            const ownerUsername = car.owner;
            const isOwner = currentUserId && ownerId && (ownerId === currentUserId);

            console.log("Car owner ID:", ownerId, "Current user ID:", currentUserId);
            // --- Left Box ---
            const leftBox = carDetailsEl.querySelector(".left-box");
            leftBox.style.display = "block";
            leftBox.innerHTML = `
                <h2>${car.brand} ${car.model} (${car.year})</h2>
                <p id="car-price">Price per day: $${car.price}</p>
                <p id="car-capacity">Capacity: ${car.capacity}</p>
                <p id="car-transmission">Transmission: ${car.transmission}</p>
                <p id="car-city">City: ${car.location}</p>
                <p id="car-owner">Owner: ${ownerUsername}</p>
                <button id="like-btn" class="${car.is_liked ? 'liked' : ''}">❤️ Like : {<span id="likes-count">${car.likes_count}</span>}</button>
            `;

            // --- Rent Button ---
            const rentBtn = document.createElement("button");
            rentBtn.id = "rent-btn";
            rentBtn.style.marginTop = "1rem";
            rentBtn.style.padding = "12px 24px";
            rentBtn.style.fontSize = "18px";
            rentBtn.style.border = "none";
            rentBtn.style.borderRadius = "8px";
            rentBtn.style.cursor = "pointer";
            rentBtn.style.display = "block";

            if (!token) {
                rentBtn.textContent = "Rent Now";
                rentBtn.style.backgroundColor = "#FFCB1E";
                rentBtn.addEventListener("click", () => window.location.href = "login.html");
            } else if (ownerId === currentUserId) {
                rentBtn.textContent = "You can't rent your own car";
                rentBtn.disabled = true;
                rentBtn.style.backgroundColor = "#ccc";
                rentBtn.style.cursor = "not-allowed";
            } else {
                rentBtn.textContent = "Rent Now";
                rentBtn.style.backgroundColor = "#FFCB1E";
                rentBtn.addEventListener("click", () => window.location.href = `rent.html?car_id=${car.id}`);
            }
            leftBox.appendChild(rentBtn);

            // --- Right Box & Features ---
            const rightBox = carDetailsEl.querySelector(".right-box");
            rightBox.style.display = "block";

            const populateList = (id, items) => {
                const ul = document.getElementById(id);
                ul.innerHTML = "";
                if (token && isOwner) {
                    (items.length ? items : [""]).forEach(i => {
                        const li = document.createElement("li");
                        const input = document.createElement("input");
                        input.type = "text";
                        input.value = i;
                        li.appendChild(input);
                        ul.appendChild(li);
                    });
                    const addBtn = document.createElement("button");
                    addBtn.textContent = "Add";
                    addBtn.addEventListener("click", () => {
                        const li = document.createElement("li");
                        const input = document.createElement("input");
                        input.type = "text";
                        li.appendChild(input);
                        ul.appendChild(li);
                    });
                    ul.parentElement.appendChild(addBtn);
                } else {
                    if (items.length > 0) {
                        items.forEach(i => {
                            const li = document.createElement("li");
                            li.textContent = i;
                            ul.appendChild(li);
                        });
                    } else {
                        const li = document.createElement("li");
                        li.textContent = "N/A";
                        ul.appendChild(li);
                    }
                }
            };

            populateList("vehicle-features", car.vehicle_features || []);
            populateList("device-connectivity", car.device_connectivity || []);
            populateList("convenience", car.convenience || []);
            populateList("additional-features", car.additional_features || []);

            // --- Carousel ---
            track.innerHTML = "";
            dotsContainer.innerHTML = "";
            if (car.photos && car.photos.length > 0) {
                const slides = [];
                car.photos.forEach((p, index) => {
                    const img = document.createElement("img");
                    img.src = `http://127.0.0.1:8000${p}`;
                    img.alt = `${car.brand} ${car.model} photo ${index + 1}`;
                    img.classList.add("carousel-img");
                    track.appendChild(img);
                    slides.push(img);

                    const dot = document.createElement("button");
                    if (index === 0) dot.classList.add("active");
                    dotsContainer.appendChild(dot);
                });

                let currentIndex = 0;
                const dots = Array.from(dotsContainer.children);
                const updateCarousel = (index) => {
                    const slideWidth = slides[0].offsetWidth + 20;
                    track.style.transform = `translateX(-${index * slideWidth}px)`;
                    dots.forEach(dot => dot.classList.remove("active"));
                    if (dots[index]) dots[index].classList.add("active");
                    currentIndex = index;
                };

                slides.forEach(img => img.addEventListener("load", () => updateCarousel(0)));
                nextBtn.onclick = () => updateCarousel((currentIndex + 1) % slides.length);
                prevBtn.onclick = () => updateCarousel((currentIndex - 1 + slides.length) % slides.length);
                dots.forEach((dot, idx) => dot.onclick = () => updateCarousel(idx));
            } else {
                track.innerHTML = "<p>No photos available</p>";
            }

            // --- Like Button ---
            const likeBtn = document.getElementById("like-btn");
            const likesCountEl = document.getElementById("likes-count");
            if (token) {
                likeBtn.style.display = "inline-block";
                likeBtn.addEventListener("click", async () => {
                    try {
                        const res = await fetchWithAuth(`/cars/${car.id}/like/`, { method: "POST" });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.message === "Car liked!") {
                                likeBtn.classList.add("liked");
                                car.likes_count++;
                            } else if (data.message === "Car unliked.") {
                                likeBtn.classList.remove("liked");
                                car.likes_count--;
                            }
                            likesCountEl.textContent = car.likes_count;
                        }
                    } catch (err) { console.error(err); }
                });
            } else likeBtn.style.display = "none";

            // --- Owner Photo Upload & Feature Save ---
            if (token && isOwner) {
                const uploadDiv = document.createElement("div");
                uploadDiv.id = "photo-upload-container";
                uploadDiv.innerHTML = `
                    <h4>Upload Photos</h4>
                    <input type="file" id="photo-input" multiple>
                    <button id="upload-btn">Upload</button>
                    <p id="upload-msg"></p>
                `;
                carDetailsEl.appendChild(uploadDiv);

                uploadDiv.querySelector("#upload-btn").addEventListener("click", async () => {
                    const files = document.getElementById("photo-input").files;
                    if (!files.length) return;
                    const formData = new FormData();
                    for (let f of files) formData.append("images", f);
                    const uploadMsg = document.getElementById("upload-msg");
                    try {
                        const res = await fetchWithAuth(`/cars/${car.id}/upload-photo/`, { method: "POST", body: formData });
                        const data = await res.json();
                        if (res.ok) {
                            uploadMsg.textContent = "Uploaded successfully!";
                            uploadMsg.style.color = "green";
                            data.photos.forEach(p => {
                                const img = document.createElement("img");
                                img.src = `http://127.0.0.1:8000${p}`;
                                track.appendChild(img);
                            });
                        } else {
                            uploadMsg.textContent = "Upload failed";
                            uploadMsg.style.color = "red";
                        }
                    } catch (err) {
                        console.error(err);
                        uploadMsg.textContent = "Upload failed";
                        uploadMsg.style.color = "red";
                    }
                });

                const saveBtn = document.createElement("button");
                saveBtn.textContent = "Save Features";
                saveBtn.style.marginTop = "1rem";
                saveBtn.addEventListener("click", async () => {
                    const gatherValues = (id) => Array.from(document.getElementById(id).querySelectorAll("input"))
                        .map(i => i.value).filter(v => v.trim() !== "");
                    const payload = {
                        vehicle_features: gatherValues("vehicle-features"),
                        device_connectivity: gatherValues("device-connectivity"),
                        convenience: gatherValues("convenience"),
                        additional_features: gatherValues("additional-features")
                    };
                    try {
                        const res = await fetchWithAuth(`/cars/${car.id}/update-features/`, { method: "PATCH", body: JSON.stringify(payload) });
                        if (res.ok) alert("Features updated successfully!");
                        else alert("Error updating features");
                    } catch (err) { console.error(err); alert("Failed to update features"); }
                });
                rightBox.appendChild(saveBtn);
            }

        } catch (e) {
            carDetailsEl.innerHTML = "<p>Error loading car details.</p>";
            console.error(e);
        }
    }

    const params = new URLSearchParams(window.location.search);
    const carId = params.get("id");
    if (carId) getCarDetails(carId);
});
