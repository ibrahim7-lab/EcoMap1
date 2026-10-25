

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reportForm");
    const message = document.getElementById("reportMessage");
    const locationButton = document.getElementById("useLocation");
    const mapStatus = document.getElementById("mapLocationStatus");

    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    const locationNameInput = document.getElementById("location_name");

    const defaultLocation = [19.2183, 72.9781];

    let marker = null;

    // Initialize the Leaflet map.
    const map = L.map("reportMap").setView(defaultLocation, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    // Select a point and update the form coordinates.
    function selectLocation(latitude, longitude) {
        latitudeInput.value = latitude.toFixed(7);
        longitudeInput.value = longitude.toFixed(7);

        const position = [latitude, longitude];

        if (marker) {
            marker.setLatLng(position);
        } else {
            marker = L.marker(position, {
                draggable: true
            }).addTo(map);

            marker.on("dragend", () => {
                const newPosition = marker.getLatLng();

                updateCoordinates(
                    newPosition.lat,
                    newPosition.lng
                );
            });
        }

        updateCoordinates(latitude, longitude);
    }

    // Keep the coordinate fields and status message synchronized.
    function updateCoordinates(latitude, longitude) {
        latitudeInput.value = latitude.toFixed(7);
        longitudeInput.value = longitude.toFixed(7);

        mapStatus.textContent =
            `Selected location: ${latitude.toFixed(5)}, ` +
            `${longitude.toFixed(5)}`;
    }

    // Clicking the map places or moves the marker.
    map.on("click", (event) => {
        selectLocation(
            event.latlng.lat,
            event.latlng.lng
        );
    });

    // Request the device's current location.
    locationButton.addEventListener("click", () => {
        if (!navigator.geolocation) {
            message.textContent =
                "Your browser does not support location access.";
            message.classList.add("error");
            return;
        }

        locationButton.disabled = true;
        locationButton.textContent = "Getting location...";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                map.setView([latitude, longitude], 16);
                selectLocation(latitude, longitude);

                locationButton.disabled = false;
                locationButton.textContent =
                    "◎ Use my current location";
            },
            () => {
                message.textContent =
                    "Unable to get your location. Allow browser location access or select a point on the map.";

                message.classList.add("error");
                locationButton.disabled = false;
                locationButton.textContent =
                    "◎ Use my current location";
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    });

    // Submit the report to the existing backend.
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        message.classList.remove("error");
        message.textContent = "Submitting report...";

        const formData = new FormData(form);

        const latitudeValue = formData.get("latitude");
        const longitudeValue = formData.get("longitude");

        const latitude = Number(latitudeValue);
        const longitude = Number(longitudeValue);

        // A location must be selected before submitting.
        if (
            latitudeValue === "" ||
            longitudeValue === "" ||
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90 ||
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180
        ) {
            message.textContent =
                "Please select the issue location on the map first.";
            message.classList.add("error");
            return;
        }

        // Check the optional image size.
        const image = formData.get("image");

        if (image && image.size > 2 * 1024 * 1024) {
            message.textContent =
                "The image must be 2 MB or smaller.";
            message.classList.add("error");
            return;
        }

        try {
            const result = await api("/reports", {
                method: "POST",
                body: formData
            });

            form.reset();

            if (marker) {
                map.removeLayer(marker);
                marker = null;
            }

            map.setView(defaultLocation, 13);

            mapStatus.textContent =
                "No location selected yet. Click on the map.";

            message.classList.remove("error");
            message.textContent =
                `Report submitted successfully. Report ID: ${result.id}`;
        } catch (error) {
            errorText(message, error);
        }
    });
});
