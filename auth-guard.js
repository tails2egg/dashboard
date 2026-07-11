(function () {
  const SESSION_STORAGE_KEY = "dashboardAuthSession";

  function authSession() {
    try {
      const session = JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) || "null");
      return session && typeof session === "object" && session.email ? session : null;
    } catch (error) {
      return null;
    }
  }

  if (!authSession()) {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    return;
  }

  document.documentElement.classList.add("has-auth-session");

  try {
    const adminSession = JSON.parse(window.sessionStorage.getItem("dashboardAdminSession") || "null");
    if (adminSession?.ok && adminSession?.token) {
      document.documentElement.classList.add("is-admin-session");
    }
  } catch (error) {
    // Ignore malformed session data.
  }
})();
