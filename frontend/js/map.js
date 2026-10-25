document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([19.2183, 72.9781], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  let markers = L.featureGroup().addTo(map),
    all = [];
  const category = document.getElementById("filterCategory"),
    status = document.getElementById("filterStatus"),
    search = document.getElementById("filterSearch");
  async function load() {
    try {
      const qs = new URLSearchParams();
      if (category.value) qs.set("category", category.value);
      if (status.value) qs.set("status", status.value);
      if (search.value.trim()) qs.set("search", search.value.trim());
      all = await api("/reports?" + qs.toString());
      render();
    } catch (e) {
      document.getElementById("mapReports").innerHTML =
        `<div class="empty-state">Could not load reports: ${escapeHtml(e.message)}</div>`;
      document.getElementById("resultCount").textContent =
        "Unable to load reports";
    }
  }
  function render() {
    markers.clearLayers();
    const withCoords = all.filter(
      (r) =>
        Number.isFinite(Number(r.latitude)) &&
        Number.isFinite(Number(r.longitude)),
    );
    withCoords.forEach((r) => {
      const m = L.marker([Number(r.latitude), Number(r.longitude)]).bindPopup(
        `<b>${escapeHtml(r.title)}</b><br>${escapeHtml(r.category)}<br><a href="/report-details.html?id=${encodeURIComponent(r.id)}">View details</a>`,
      );
      markers.addLayer(m);
    });
    if (withCoords.length)
      map.fitBounds(markers.getBounds().pad(0.15), { maxZoom: 13 });
    document.getElementById("mapReports").innerHTML = all.length
      ? all.map(reportCard).join("")
      : '<div class="empty-state">No reports match these filters.</div>';
    document.getElementById("resultCount").textContent =
      `${all.length} report${all.length === 1 ? "" : "s"} found`;
  }
  [category, status].forEach((el) => el.addEventListener("change", load));
  let timer;
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(load, 250);
  });
  document.getElementById("clearFilters").addEventListener("click", () => {
    category.value = "";
    status.value = "";
    search.value = "";
    load();
  });
  load();
});
