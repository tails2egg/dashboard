const forms = document.querySelectorAll("[data-auth-form]");
const resetForms = document.querySelectorAll("[data-reset-form]");
const passwordToggles = document.querySelectorAll("[data-toggle-password]");
const resetOpeners = document.querySelectorAll("[data-open-reset]");
const ssoDemoButtons = document.querySelectorAll("[data-sso-demo]");
const ACCOUNT_STORAGE_KEY = "dashboardAuthAccounts";
const SESSION_STORAGE_KEY = "dashboardAuthSession";

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validGmail(value) {
  return /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@gmail\.com$/i.test(text(value));
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

function saveSession(account) {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      email: account.email,
      employeeId: account.employeeId || "",
      employeeName: account.employeeName || "",
      department: account.department || "",
      signedInAt: new Date().toISOString(),
    }),
  );
}

function emailExists(email) {
  const target = normalizedEmail(email);
  return storedAccounts().some((account) => normalizedEmail(account.email) === target);
}

function employeeRecords() {
  return window.DASHBOARD_DATA?.Employees || [];
}

function findEmployeeByEmail(email) {
  const target = normalizedEmail(email);
  return employeeRecords().find((employee) => normalizedEmail(employee.Email) === target);
}

function saveAccount(form) {
  const employee = findEmployeeByEmail(form.elements.email.value);
  const account = {
    email: normalizedEmail(form.elements.email.value),
    employeeId: employee?.["Employee ID"] || "",
    employeeName: employee?.["Employee Name"] || "",
    department: employee?.Department || "",
    createdAt: new Date().toISOString(),
  };
  const accounts = storedAccounts();
  accounts.push(account);
  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
  saveSession(account);
  return account;
}

function accountForEmail(email) {
  const target = normalizedEmail(email);
  return storedAccounts().find((account) => normalizedEmail(account.email) === target) || null;
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

  if (!email || !validGmail(email.value)) {
    setFieldError(form, "email", "Enter a valid Gmail address.");
    valid = false;
  } else if (mode === "signup" && emailExists(email.value)) {
    setFieldError(form, "email", "An account with this email already exists.");
    valid = false;
  }

  if (!password || password.value.length < 8) {
    setFieldError(form, "password", "Use at least 8 characters.");
    valid = false;
  }

  if (mode === "login" && email.value && !emailExists(email.value)) {
    setFieldError(form, "email", "We couldn't find an account for this email.");
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
      await fakeRequest();
      if (mode === "signup") {
        saveAccount(form);
        setFormMessage(form, "Account created. Opening dashboard...", "success");
        window.setTimeout(() => {
          window.location.assign("/");
        }, 700);
      } else {
        const account = accountForEmail(form.elements.email.value);
        if (account) saveSession(account);
        setFormMessage(form, "You're in. Opening dashboard...", "success");
        window.setTimeout(() => {
          window.location.assign("/");
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

    if (!email || !validGmail(email.value)) {
      setFieldError(form, "resetEmail", "Enter a valid Gmail address.");
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
