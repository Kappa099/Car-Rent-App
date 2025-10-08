document.addEventListener("DOMContentLoaded", function() {
    let carDetailsEl = document.getElementById("car-details");
    let loadingEl = document.getElementById("loading");
    let track = document.querySelector(".carousel-track");
    let prevBtn = document.querySelector(".prev");
    let nextBtn = document.querySelector(".next");
    let dotsContainer = document.querySelector(".carousel-dots");

    let token = localStorage.getItem("access");
    let username = localStorage.getItem("username");
    let currentUserId = token ? parseInt(localStorage.getItem("user_id")) : null;

    let currentCarData = null;
    let currentIndex = 0;
    let slides = [];
    let dots = [];

    let fetchWithAuth = async (endpoint, options = {}) => {
        if (!options.headers) options.headers = {};
        if (!(options.body instanceof FormData)) options.headers["Content-Type"] = "application/json";
        if (token) options.headers["Authorization"] = "Bearer " + token;
        return fetch("http://127.0.0.1:8000" + endpoint, options);
    };

    let deletePhoto = async (photoUrl, carId) => {
        if (!confirm("Are you sure you want to delete this photo?")) return false;

        try {
            let res = await fetchWithAuth("/cars/" + carId + "/delete-photo/", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photo_url: photoUrl })
            });

            if (res.ok) return true;
            let errorData = await res.json();
            alert("Failed to delete photo: " + (errorData.detail || "Unknown error"));
            return false;
        } catch (err) {
            console.error("Error deleting photo:", err);
            alert("Error deleting photo");
            return false;
        }
    };

    let removePhotoFromCarousel = (photoIndex) => {
        if (slides.length <= photoIndex) return;

        slides[photoIndex].remove();
        slides.splice(photoIndex, 1);

        if (dots[photoIndex]) {
            dots[photoIndex].remove();
            dots.splice(photoIndex, 1);
        }

        currentCarData.photos.splice(photoIndex, 1);

        if (slides.length === 0) {
            track.innerHTML = "<p>No photos available</p>";
            dotsContainer.innerHTML = "";
            prevBtn.style.display = "none";
            nextBtn.style.display = "none";
            return;
        }

        if (slides.length === 1) {
            let carouselEl = document.querySelector(".carousel");
            carouselEl.classList.add("single");
            prevBtn.style.display = "none";
            nextBtn.style.display = "none";
            dotsContainer.style.display = "none";
        }

        dots.forEach((dot, i) => dot.onclick = () => updateCarousel(i));

        if (currentIndex >= slides.length) currentIndex = slides.length - 1;
        updateCarousel(currentIndex);
    };

    let updateCarousel = (index) => {
        if (slides.length === 0) return;
        let slideWidth = slides[0].offsetWidth + 20;
        track.style.transform = "translateX(-" + index * slideWidth + "px)";
        dots.forEach(d => d.classList.remove("active"));
        if (dots[index]) dots[index].classList.add("active");
        currentIndex = index;
    };

    let buildCarousel = (car, isOwner) => {
        track.innerHTML = "";
        dotsContainer.innerHTML = "";
        slides = [];
        dots = [];

        if (car.photos && car.photos.length > 0) {
            let carouselEl = document.querySelector(".carousel");

            car.photos.forEach((photoUrl, index) => {
                let img = document.createElement("img");
                img.src = "http://127.0.0.1:8000" + photoUrl;
                img.alt = car.brand + " " + car.model + " photo " + (index + 1);
                img.classList.add("carousel-img");
                img.style.position = "relative";

                if (isOwner) {
                    let slideContainer = document.createElement("div");
                    slideContainer.style.position = "relative";
                    slideContainer.style.width = "100%";
                    slideContainer.style.height = "100%";
                    slideContainer.appendChild(img);

                    let deleteBtn = document.createElement("button");
                    deleteBtn.innerHTML = "×";
                    deleteBtn.style.cssText = `
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(255,0,0,0.8);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        cursor: pointer;
                        font-size: 18px;
                        font-weight: bold;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    `;

                    deleteBtn.addEventListener("mouseenter", () => {
                        deleteBtn.style.background = "rgba(255,0,0,1)";
                        deleteBtn.style.transform = "scale(1.1)";
                    });
                    deleteBtn.addEventListener("mouseleave", () => {
                        deleteBtn.style.background = "rgba(255,0,0,0.8)";
                        deleteBtn.style.transform = "scale(1)";
                    });
                    deleteBtn.addEventListener("click", async (e) => {
                        e.stopPropagation();
                        let relativePhotoUrl = photoUrl.replace("/media/", "");
                        let slideToRemove = slideContainer;
                        let success = await deletePhoto(relativePhotoUrl, car.id);
                        if (success) {
                            let slideIndex = slides.indexOf(slideToRemove);
                            if (slideIndex !== -1) removePhotoFromCarousel(slideIndex);
                        }
                    });

                    slideContainer.appendChild(deleteBtn);
                    track.appendChild(slideContainer);
                    slides.push(slideContainer);
                } else {
                    track.appendChild(img);
                    slides.push(img);
                }

                let dot = document.createElement("button");
                if (index === 0) dot.classList.add("active");
                dotsContainer.appendChild(dot);
                dots.push(dot);
            });

            if (slides.length === 1) {
                carouselEl.classList.add("single");
                prevBtn.style.display = "none";
                nextBtn.style.display = "none";
                dotsContainer.style.display = "none";
            } else {
                carouselEl.classList.remove("single");
                prevBtn.style.display = "block";
                nextBtn.style.display = "block";
                dotsContainer.style.display = "flex";
            }

            currentIndex = 0;
            slides.forEach(slide => {
                let img = isOwner ? slide.querySelector("img") : slide;
                img.addEventListener("load", () => updateCarousel(0));
            });

            nextBtn.onclick = () => updateCarousel((currentIndex + 1) % slides.length);
            prevBtn.onclick = () => updateCarousel((currentIndex - 1 + slides.length) % slides.length);
            dots.forEach((dot, i) => dot.onclick = () => updateCarousel(i));
        } else {
            track.innerHTML = "<p>No photos available</p>";
        }
    };

    let getCarDetails = async (carId) => {
        try {
            let res = await fetch("http://127.0.0.1:8000/cars/" + carId + "/");
            if (!res.ok) throw new Error("Failed to fetch car details");
            let car = await res.json();
            currentCarData = car;
            loadingEl.style.display = "none";

            let currentUserId = parseInt(localStorage.getItem("user_id"), 10);
            let ownerId = car.owner_id;
            let isOwner = currentUserId && ownerId && (ownerId === currentUserId);

            let leftBox = carDetailsEl.querySelector(".left-box");
            leftBox.style.display = "block";
            leftBox.innerHTML = `
                <h2>${car.brand} ${car.model} (${car.year})</h2>
                <p id='car-price'>Price per day: $${car.price}</p>
                <p id='car-capacity'>Capacity: ${car.capacity}</p>
                <p id='car-transmission'>Transmission: ${car.transmission}</p>
                <p id='car-city'>City: ${car.location}</p>
                <p id='car-owner'>Owner: ${car.owner}</p>
                <button id='like-btn' class='${car.is_liked ? "liked" : ""}'>❤️ Like : {<span id='likes-count'>${car.likes_count}</span>}</button>
            `;
        } catch (e) {
            carDetailsEl.innerHTML = "<p>Error loading car details.</p>";
            console.error(e);
        }
    };

    let params = new URLSearchParams(window.location.search);
    let carId = params.get("id");
    if (carId) getCarDetails(carId);
});
