const forms = document.querySelectorAll("[data-auth-form]");
const resetForms = document.querySelectorAll("[data-reset-form]");
const passwordToggles = document.querySelectorAll("[data-toggle-password]");
const resetOpeners = document.querySelectorAll("[data-open-reset]");
const ssoDemoButtons = document.querySelectorAll("[data-sso-demo]");
const ACCOUNT_STORAGE_KEY = "dashboardAuthAccounts";
const SESSION_STORAGE_KEY = "dashboardAuthSession";
const ADMIN_SESSION_STORAGE_KEY = "dashboardAdminSession";

function clearLoginPasswords() {
  document.querySelectorAll("[data-auth-form='login'] input[name='password']").forEach((input) => {
    input.value = "";
  });
}

clearLoginPasswords();
window.addEventListener("pageshow", clearLoginPasswords);
window.setTimeout(clearLoginPasswords, 100);

function text(value) {
  return String(value || "").trim();
}

function setFieldError(form, name, message) {
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (error) error.textContent = message;
}

function setFormMessage(form, message, type = "") {
  const messageEl = form.querySelector("[data-form-message]");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `message ${type}`.trim();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value));
}

function normalizedEmail(value) {
  return text(value).toLowerCase();
}

function storedAccounts() {
  try {
    const accounts = JSON.parse(window.localStorage.getItem(ACCOUNT_STORAGE_KEY) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch (error) {
    return [];
  }
}

function storeLocalAccount(account) {
  const email = normalizedEmail(account.email);
  const accounts = storedAccounts().filter((storedAccount) => normalizedEmail(storedAccount.email) !== email);
  const localAccount = {
    email,
    employeeId: account.employeeId || "",
    employeeName: account.employeeName || "",
    department: account.department || "",
    createdAt: account.createdAt || new Date().toISOString(),
    isAdmin: Boolean(account.isAdmin),
  };
  accounts.push(localAccount);
  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
  return localAccount;
}

function saveSession(account) {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      email: account.email,
      employeeId: account.employeeId || "",
      employeeName: account.employeeName || "",
      department: account.department || "",
      isAdmin: Boolean(account.isAdmin),
      signedInAt: new Date().toISOString(),
    }),
  );
}

function saveAdminSession(account) {
  if (!account.isAdmin || !account.adminSessionToken) {
    window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    ADMIN_SESSION_STORAGE_KEY,
    JSON.stringify({
      ok: true,
      email: account.email,
      role: "admin",
      token: account.adminSessionToken || "",
      signedInAt: new Date().toISOString(),
    }),
  );
}

function signedInPath(account) {
  const next = new URLSearchParams(window.location.search).get("next") || "";
  const authPath = /^\/(?:login|log-in|log%20in|signup|sign-up|sign%20up)(?:[/?#]|$)/i;
  if (next.startsWith("/") && !next.startsWith("//") && !authPath.test(next)) {
    return next;
  }
  return account.isAdmin ? "/dashbaord2admins" : "/dashbaord";
}

function accountForEmail(email) {
  const target = normalizedEmail(email);
  return storedAccounts().find((account) => normalizedEmail(account.email) === target) || null;
}

async function authRequest(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Authentication failed.");
  }
  return result;
}

async function createAccount(form) {
  return authRequest("/api/auth/signup", {
    email: form.elements.email.value,
    password: form.elements.password.value,
  });
}

async function loginAccount(form) {
  const result = await authRequest("/api/auth/login", {
    email: form.elements.email.value,
    password: form.elements.password.value,
  });
  const localAccount = storeLocalAccount(result.account);
  localAccount.adminSessionToken = result.adminSessionToken || "";
  saveSession(localAccount);
  saveAdminSession(localAccount);
  return localAccount;
}

function validateForm(form) {
  let valid = true;
  const mode = form.dataset.authForm;
  const email = form.elements.email;
  const password = form.elements.password;
  const confirmPassword = form.elements.confirmPassword;

  form.querySelectorAll("[data-error-for]").forEach((error) => {
    error.textContent = "";
  });
  setFormMessage(form, "");

  if (!email || !validEmail(email.value)) {
    setFieldError(form, "email", "Enter a valid email address.");
    valid = false;
  }

  if (!password || password.value.length < 8 || !/[A-Za-z]/.test(password.value) || !/\d/.test(password.value)) {
    setFieldError(form, "password", "Use at least 8 characters with one letter and one number.");
    valid = false;
  }

  if (mode === "signup" && confirmPassword && confirmPassword.value !== password.value) {
    setFieldError(form, "confirmPassword", "Passwords do not match.");
    valid = false;
  }

  return valid;
}

function setLoading(form, loading) {
  const button = form.querySelector("button[type='submit']");
  if (!button) return;
  button.disabled = loading;
  button.classList.toggle("loading", loading);
  button.setAttribute("aria-busy", String(loading));
}

async function fakeRequest() {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 900);
  });
}

passwordToggles.forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.querySelector(`#${button.dataset.togglePassword}`);
    if (!input) return;
    const show = input.type === "password";
    const buttonLabel = button.querySelector("span");
    input.type = show ? "text" : "password";
    if (buttonLabel) {
      buttonLabel.textContent = show ? "Hide" : "Show";
    } else {
      button.textContent = show ? "Hide" : "Show";
    }
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});

resetOpeners.forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.openReset);
    if (!panel) return;
    panel.hidden = false;
    panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
    panel.querySelector("input")?.focus({ preventScroll: true });
  });
});

ssoDemoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const panel = button.closest(".auth-panel");
    const form = panel?.querySelector("[data-auth-form]");
    if (form) {
      setFormMessage(form, "SSO is not configured for this demo.", "error");
    }
  });
});

forms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm(form)) {
      setFormMessage(form, "Please check the highlighted fields.", "error");
      return;
    }

    const mode = form.dataset.authForm;
    setLoading(form, true);
    setFormMessage(form, mode === "signup" ? "Creating your account..." : "Signing you in...");

    try {
      if (mode === "signup") {
        const result = await createAccount(form);
        const localAccount = storeLocalAccount(result.account);
        localAccount.adminSessionToken = result.adminSessionToken || "";
        saveSession(localAccount);
        saveAdminSession(localAccount);
        setFormMessage(form, result.message || "Account created. Opening dashboard...", "success");
        window.setTimeout(() => {
          window.location.assign(signedInPath(localAccount));
        }, 700);
      } else {
        const localAccount = await loginAccount(form);
        setFormMessage(form, "You're in. Opening dashboard...", "success");
        window.setTimeout(() => {
          window.location.assign(signedInPath(localAccount));
        }, 700);
      }
    } catch (error) {
      setFormMessage(form, error.message || "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(form, false);
    }
  });
});

resetForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = form.elements.resetEmail;

    setFieldError(form, "resetEmail", "");
    setFormMessage(form, "");

    if (!email || !validEmail(email.value)) {
      setFieldError(form, "resetEmail", "Enter a valid email address.");
      setFormMessage(form, "Please check the highlighted field.", "error");
      return;
    }

    if (!accountForEmail(email.value)) {
      setFieldError(form, "resetEmail", "No account was found for this email.");
      setFormMessage(form, "Create an account first, then try again.", "error");
      return;
    }

    setLoading(form, true);
    setFormMessage(form, "Sending reset link...");

    try {
      await fakeRequest();
      setFormMessage(form, `Reset link sent to ${normalizedEmail(email.value)}.`, "success");
    } catch (error) {
      setFormMessage(form, "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(form, false);
    }
  });
});
