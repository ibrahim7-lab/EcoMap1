const API_BASE = `${location.origin}/api`;
async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = path.startsWith("/users/")
    ? localStorage.getItem("userToken")
    : localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(
    `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`,
    { ...options, headers },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function statusClass(s = "") {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function reportCard(r) {
  return `<article class="report-card"><div class="report-card-body"><span class="status ${statusClass(r.status)}">${escapeHtml(r.status || "Pending Review")}</span><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml((r.description || "").slice(0, 150))}${(r.description || "").length > 150 ? "…" : ""}</p><div class="report-meta"><span>◉ ${escapeHtml(r.category)}</span><span>📍 ${escapeHtml(r.location_name || `${r.latitude}, ${r.longitude}`)}</span></div><a class="text-link" href="/report-details.html?id=${encodeURIComponent(r.id)}">View report →</a></div></article>`;
}
function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}
function errorText(el, error) {
  if (el) {
    el.textContent = error.message || String(error);
    el.classList.add("error");
  }
}
