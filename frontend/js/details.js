
document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("reportDetails");
  const id = new URLSearchParams(location.search).get("id");

  if (!id) {
    root.innerHTML =
      '<div class="empty-state">No report ID was provided.</div>';
    return;
  }

  try {
    const r = await api("/reports/" + encodeURIComponent(id));

    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    const hasCoordinates =
      r.latitude !== null &&
      r.longitude !== null &&
      r.latitude !== "" &&
      r.longitude !== "" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    root.innerHTML = `
      <article class="details-card">
        <span class="status ${statusClass(r.status)}">
          ${escapeHtml(r.status)}
        </span>

        <h2>${escapeHtml(r.title)}</h2>
        <p class="muted">${escapeHtml(r.description)}</p>

        ${
          r.image_path
            ? `<img class="details-photo"
                src="/uploads/${encodeURIComponent(r.image_path)}"
                alt="Photo attached to report">`
            : ""
        }

        <div class="detail-grid">
          <div class="detail-item">
            <small>Category</small>
            <b>${escapeHtml(r.category)}</b>
          </div>

          <div class="detail-item">
            <small>Location</small>
            <b>${escapeHtml(
              r.location_name || "Location provided by coordinates"
            )}</b>
          </div>

          <div class="detail-item">
            <small>Latitude</small>
            <b>${escapeHtml(r.latitude ?? "—")}</b>
          </div>

          <div class="detail-item">
            <small>Longitude</small>
            <b>${escapeHtml(r.longitude ?? "—")}</b>
          </div>

          <div class="detail-item">
            <small>Submitted</small>
            <b>${
              r.created_at
                ? escapeHtml(new Date(r.created_at).toLocaleString())
                : "—"
            }</b>
          </div>
        </div>

        <section class="details-map-section">
          <h3>Issue location</h3>
          <p class="muted">Explore the exact location recorded for this report.</p>

          ${
            hasCoordinates
              ? '<div id="detailsMap" role="application" aria-label="Map showing the report location"></div>'
              : '<p class="empty-state">Map unavailable because this report has no valid coordinates.</p>'
          }
        </section>

        ${
          hasCoordinates
            ? `<a class="btn btn-light"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}">
                Open location in OpenStreetMap ↗
              </a>`
            : ""
        }
      </article>
    `;

    if (hasCoordinates) {
      if (typeof L === "undefined") {
        document.getElementById("detailsMap").innerHTML =
          "The map library could not load. Please check your internet connection.";
        return;
      }

      const map = L.map("detailsMap").setView([lat, lng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<strong>${escapeHtml(r.title)}</strong>`)
        .openPopup();

      // Helps Leaflet calculate the correct map size after rendering.
      setTimeout(() => map.invalidateSize(), 100);
    }
  } catch (e) {
    root.innerHTML = `
      <div class="empty-state">
        Could not load report: ${escapeHtml(e.message)}
      </div>
    `;
  }
});