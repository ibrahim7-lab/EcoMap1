
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  async function handleAuth(form, endpoint, messageId) {
    const msg = document.getElementById(messageId);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      msg.classList.remove("error");
      msg.textContent = "Please wait…";

      const submitButton = form.querySelector('[type="submit"]');
      submitButton.disabled = true;

      const data = Object.fromEntries(new FormData(form));

      try {
        const result = await api(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!result || !result.token || !result.user) {
          throw new Error("Unexpected server response. Please check the backend.");
        }

        localStorage.setItem("userToken", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        window.location.href = "/my-reports.html";
      } catch (err) {
        if (typeof errorText === "function") {
          errorText(msg, err);
        } else {
          msg.textContent = err.message || "Authentication failed.";
          msg.classList.add("error");
        }
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  if (loginForm) {
    handleAuth(loginForm, "/users/login", "loginMessage");
  }

  if (registerForm) {
    handleAuth(registerForm, "/users/register", "registerMessage");
  }
});