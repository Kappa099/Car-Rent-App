document.addEventListener("DOMContentLoaded", function() {
    var carDetailsEl = document.getElementById("car-details");
    var loadingEl = document.getElementById("loading");
    var track = document.querySelector(".carousel-track");
    var prevBtn = document.querySelector(".prev");
    var nextBtn = document.querySelector(".next");
    var dotsContainer = document.querySelector(".carousel-dots");

    var token = localStorage.getItem("access");
    var username = localStorage.getItem("username");
    var currentUserId = token ? parseInt(localStorage.getItem("user_id")) : null;

    var currentCarData = null;
    var currentIndex = 0;
    var slides = [];
    var dots = [];

    async function fetchWithAuth(endpoint, options) {
        options = options || {};
        if (!options.headers) options.headers = {};
        if (!(options.body instanceof FormData)) options.headers["Content-Type"] = "application/json";
        if (token) options.headers["Authorization"] = "Bearer " + token;
        return fetch("http://127.0.0.1:8000" + endpoint, options);
    }

    async function deletePhoto(photoUrl, carId) {
        if (!confirm("Are you sure you want to delete this photo?")) return false;

        try {
            var res = await fetchWithAuth("/cars/" + carId + "/delete-photo/", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ photo_url: photoUrl })
            });

            if (res.ok) return true;
            var errorData = await res.json();
            alert("Failed to delete photo: " + (errorData.detail || "Unknown error"));
            return false;
        } catch (err) {
            console.error("Error deleting photo:", err);
            alert("Error deleting photo");
            return false;
        }
    }

    function removePhotoFromCarousel(photoIndex) {
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
            var carouselEl = document.querySelector(".carousel");
            carouselEl.classList.add("single");
            prevBtn.style.display = "none";
            nextBtn.style.display = "none";
            dotsContainer.style.display = "none";
        }

        dots.forEach(function(dot, i) { dot.onclick = function() { updateCarousel(i); }; });

        if (currentIndex >= slides.length) currentIndex = slides.length - 1;
        updateCarousel(currentIndex);
    }

    function updateCarousel(index) {
        if (slides.length === 0) return;
        var slideWidth = slides[0].offsetWidth + 20;
        track.style.transform = "translateX(-" + index * slideWidth + "px)";
        dots.forEach(function(d) { d.classList.remove("active"); });
        if (dots[index]) dots[index].classList.add("active");
        currentIndex = index;
    }

    function buildCarousel(car, isOwner) {
        track.innerHTML = "";
        dotsContainer.innerHTML = "";
        slides = [];
        dots = [];

        if (car.photos && car.photos.length > 0) {
            var carouselEl = document.querySelector(".carousel");

            car.photos.forEach(function(photoUrl, index) {
                var img = document.createElement("img");
                img.src = "http://127.0.0.1:8000" + photoUrl;
                img.alt = car.brand + " " + car.model + " photo " + (index + 1);
                img.classList.add("carousel-img");
                img.style.position = "relative";

                if (isOwner) {
                    var slideContainer = document.createElement("div");
                    slideContainer.style.position = "relative";
                    slideContainer.style.width = "100%";
                    slideContainer.style.height = "100%";
                    slideContainer.appendChild(img);

                    var deleteBtn = document.createElement("button");
                    deleteBtn.innerHTML = "×";
                    deleteBtn.style.position = "absolute";
                    deleteBtn.style.top = "10px";
                    deleteBtn.style.right = "10px";
                    deleteBtn.style.background = "rgba(255, 0, 0, 0.8)";
                    deleteBtn.style.color = "white";
                    deleteBtn.style.border = "none";
                    deleteBtn.style.borderRadius = "50%";
                    deleteBtn.style.width = "30px";
                    deleteBtn.style.height = "30px";
                    deleteBtn.style.cursor = "pointer";
                    deleteBtn.style.fontSize = "18px";
                    deleteBtn.style.fontWeight = "bold";
                    deleteBtn.style.display = "flex";
                    deleteBtn.style.alignItems = "center";
                    deleteBtn.style.justifyContent = "center";
                    deleteBtn.style.zIndex = "1000";

                    deleteBtn.addEventListener("mouseenter", function() {
                        deleteBtn.style.background = "rgba(255, 0, 0, 1)";
                        deleteBtn.style.transform = "scale(1.1)";
                    });
                    deleteBtn.addEventListener("mouseleave", function() {
                        deleteBtn.style.background = "rgba(255, 0, 0, 0.8)";
                        deleteBtn.style.transform = "scale(1)";
                    });
                    deleteBtn.addEventListener("click", async function(e) {
                        e.stopPropagation();
                        var relativePhotoUrl = photoUrl.replace("/media/", "");
                        var slideToRemove = slideContainer;
                        var success = await deletePhoto(relativePhotoUrl, car.id);
                        if (success) {
                            var slideIndex = slides.indexOf(slideToRemove);
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

                var dot = document.createElement("button");
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
            slides.forEach(function(slide) {
                var img = isOwner ? slide.querySelector("img") : slide;
                img.addEventListener("load", function() { updateCarousel(0); });
            });

            nextBtn.onclick = function() { updateCarousel((currentIndex + 1) % slides.length); };
            prevBtn.onclick = function() { updateCarousel((currentIndex - 1 + slides.length) % slides.length); };
            dots.forEach(function(dot, i) { dot.onclick = function() { updateCarousel(i); }; });
        } else {
            track.innerHTML = "<p>No photos available</p>";
        }
    }

    async function getCarDetails(carId) {
        try {
            var res = await fetch("http://127.0.0.1:8000/cars/" + carId + "/");
            if (!res.ok) throw new Error("Failed to fetch car details");
            var car = await res.json();
            currentCarData = car;
            loadingEl.style.display = "none";

            var currentUserId = parseInt(localStorage.getItem("user_id"), 10);
            var currentUsername = localStorage.getItem("username");
            var ownerId = car.owner_id;
            var ownerUsername = car.owner;
            var isOwner = currentUserId && ownerId && (ownerId === currentUserId);

            var leftBox = carDetailsEl.querySelector(".left-box");
            leftBox.style.display = "block";
            leftBox.innerHTML = 
                "<h2>" + car.brand + " " + car.model + " (" + car.year + ")</h2>" +
                "<p id='car-price'>Price per day: $" + car.price + "</p>" +
                "<p id='car-capacity'>Capacity: " + car.capacity + "</p>" +
                "<p id='car-transmission'>Transmission: " + car.transmission + "</p>" +
                "<p id='car-city'>City: " + car.location + "</p>" +
                "<p id='car-owner'>Owner: " + ownerUsername + "</p>" +
                "<button id='like-btn' class='" + (car.is_liked ? "liked" : "") + "'>❤️ Like : {<span id='likes-count'>" + car.likes_count + "</span>}</button>";

            var rentBtn = document.createElement("button");
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
                rentBtn.addEventListener("click", function() { window.location.href = "login.html"; });
            } else if (ownerId === currentUserId) {
                rentBtn.textContent = "You can't rent your own car";
                rentBtn.disabled = true;
                rentBtn.style.backgroundColor = "#ccc";
                rentBtn.style.cursor = "not-allowed";
            } else {
                rentBtn.textContent = "Rent Now";
                rentBtn.style.backgroundColor = "#FFCB1E";
                rentBtn.addEventListener("click", function() { window.location.href = "rent.html?car_id=" + car.id; });
            }
            leftBox.appendChild(rentBtn);

            var rightBox = carDetailsEl.querySelector(".right-box");
            rightBox.style.display = "block";

            var populateList = function(id, items) {
                var ul = document.getElementById(id);
                ul.innerHTML = "";
                if (token && isOwner) {
                    (items.length ? items : [""]).forEach(function(i) {
                        var li = document.createElement("li");
                        var input = document.createElement("input");
                        input.type = "text";
                        input.value = i;
                        li.appendChild(input);
                        ul.appendChild(li);
                    });
                    var addBtn = document.createElement("button");
                    addBtn.textContent = "Add";
                    addBtn.addEventListener("click", function() {
                        var li = document.createElement("li");
                        var input = document.createElement("input");
                        input.type = "text";
                        li.appendChild(input);
                        ul.appendChild(li);
                    });
                    ul.parentElement.appendChild(addBtn);
                } else {
                    if (items.length > 0) {
                        items.forEach(function(i) {
                            var li = document.createElement("li");
                            li.textContent = i;
                            ul.appendChild(li);
                        });
                    } else {
                        var li = document.createElement("li");
                        li.textContent = "N/A";
                        ul.appendChild(li);
                    }
                }
            };

            populateList("vehicle-features", car.vehicle_features || []);
            populateList("device-connectivity", car.device_connectivity || []);
            populateList("convenience", car.convenience || []);
            populateList("additional-features", car.additional_features || []);

            buildCarousel(car, isOwner);

            var likeBtn = document.getElementById("like-btn");
            var likesCountEl = document.getElementById("likes-count");
            if (token) {
                likeBtn.style.display = "inline-block";
                likeBtn.addEventListener("click", async function() {
                    try {
                        var res = await fetchWithAuth("/cars/" + car.id + "/like/", { method: "POST" });
                        if (res.ok) {
                            var data = await res.json();
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

            if (token && isOwner) {
                var uploadDiv = document.createElement("div");
                uploadDiv.id = "photo-upload-container";
                uploadDiv.innerHTML = 
                    "<h4>Upload Photos</h4>" +
                    "<input type='file' id='photo-input' multiple>" +
                    "<button id='upload-btn'>Upload</button>" +
                    "<p id='upload-msg'></p>";
                var leftBox = carDetailsEl.querySelector(".left-box");
                leftBox.appendChild(uploadDiv);

                uploadDiv.querySelector("#upload-btn").addEventListener("click", async function() {
                    var files = document.getElementById("photo-input").files;
                    if (!files.length) return;
                    var formData = new FormData();
                    for (var f of files) formData.append("images", f);
                    var uploadMsg = document.getElementById("upload-msg");
                    try {
                        var res = await fetchWithAuth("/cars/" + car.id + "/upload-photo/", { method: "POST", body: formData });
                        var data = await res.json();
                        if (res.ok) {
                            uploadMsg.textContent = "Uploaded successfully!";
                            uploadMsg.style.color = "green";
                            data.photos.forEach(function(photoUrl) { currentCarData.photos.push(photoUrl); });
                            buildCarousel(currentCarData, isOwner);
                            document.getElementById("photo-input").value = "";
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

                var saveBtn = document.createElement("button");
                saveBtn.textContent = "Save Features";
                saveBtn.style.marginTop = "1rem";
                saveBtn.addEventListener("click", async function() {
                    var gatherValues = function(id) {
                        return Array.from(document.getElementById(id).querySelectorAll("input")).map(function(i) { return i.value; }).filter(function(v) { return v.trim() !== ""; });
                    };
                    var payload = {
                        vehicle_features: gatherValues("vehicle-features"),
                        device_connectivity: gatherValues("device-connectivity"),
                        convenience: gatherValues("convenience"),
                        additional_features: gatherValues("additional-features")
                    };
                    try {
                        var res = await fetchWithAuth("/cars/" + car.id + "/update-features/", { method: "PATCH", body: JSON.stringify(payload) });
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

    var params = new URLSearchParams(window.location.search);
    var carId = params.get("id");
    if (carId) getCarDetails(carId);
});
