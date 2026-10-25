
document.addEventListener("DOMContentLoaded", () => {
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginPanel = document.getElementById("loginPanel");
  const registerPanel = document.getElementById("registerPanel");

  if (!loginTab || !registerTab) return;

  function showTab(tab) {
    const isLogin = tab === "login";

    loginPanel.hidden = !isLogin;
    registerPanel.hidden = isLogin;

    loginTab.setAttribute("aria-selected", String(isLogin));
    registerTab.setAttribute("aria-selected", String(!isLogin));

    loginTab.classList.toggle("btn-primary", isLogin);
    registerTab.classList.toggle("btn-primary", !isLogin);

    document.getElementById("introEyebrow").textContent =
      isLogin ? "WELCOME BACK" : "JOIN YOUR COMMUNITY";

    document.getElementById("introTitle").textContent =
      isLogin
        ? "Your reports, all in one place."
        : "Keep track of the issues you report.";

    document.getElementById("introDescription").textContent =
      isLogin
        ? "Log in to see the environmental reports connected to your account."
        : "Create an account to see your own report history.";

    document.title = isLogin
      ? "User login | EcoMap"
      : "Create account | EcoMap";
  }

  loginTab.addEventListener("click", () => showTab("login"));
  registerTab.addEventListener("click", () => showTab("register"));

  if (window.location.hash === "#register") {
    showTab("register");
  }
});