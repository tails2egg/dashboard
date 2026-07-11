const data = window.DASHBOARD_DATA || {};
const projects = data.Projects || [];
const employees = data.Employees || [];
const adminSessionKey = "dashboardAdminSession";
const projectStatuses = ["Not Started", "Planning", "In Progress", "At Risk", "On Hold", "Completed"];
const projectPriorities = ["Low", "Medium", "High", "Critical"];
const projectRiskLevels = ["Low", "Medium", "High"];

const progressColors = {
  base: "#16837a",
  high: "#2f9b68",
  mid: "#5366c9",
  low: "#c98114",
  none: "#667085",
};

const els = {
  dashboardBack: document.querySelector("[data-dashboard-back]"),
  progressScope: document.querySelector("#progressScope"),
  progressMetricGrid: document.querySelector("#progressMetricGrid"),
  progressAverageStat: document.querySelector("#progressAverageStat"),
  progressHero: document.querySelector("#progressHero"),
  progressBands: document.querySelector("#progressBands"),
  progressProjects: document.querySelector("#progressProjects"),
  progressTableCount: document.querySelector("#progressTableCount"),
  editDrawerScrim: document.querySelector("#editDrawerScrim"),
  editDrawer: document.querySelector("#editDrawer"),
  editDrawerTitle: document.querySelector("#editDrawerTitle"),
  editDrawerBody: document.querySelector("#editDrawerBody"),
  closeEditDrawer: document.querySelector("#closeEditDrawer"),
};

function isAdminRouteOrSession() {
  if (window.location.pathname.includes("2admins")) return true;
  try {
    const session = JSON.parse(window.sessionStorage.getItem(adminSessionKey) || "null");
    return Boolean(session?.ok && session?.token);
  } catch (error) {
    return false;
  }
}

function adminSession() {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(adminSessionKey) || "null");
    return session?.ok && session?.token ? session : null;
  } catch (error) {
    return null;
  }
}

function isAdminSession() {
  return Boolean(adminSession());
}

function isAdminEditRoute() {
  return window.location.pathname.includes("2admins");
}

function canEditOnCurrentRoute() {
  return isAdminEditRoute() && isAdminSession();
}

function adminRequestHeaders() {
  const session = adminSession();
  return {
    "Content-Type": "application/json",
    "X-Admin-Email": text(session?.email).toLowerCase(),
    "X-Admin-Token": text(session?.token),
  };
}

function setDashboardBackLink() {
  if (!els.dashboardBack) return;
  els.dashboardBack.href = isAdminRouteOrSession() ? "/dashbaord2admins" : "/dashboard";
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function optionList(values, current) {
  return values
    .map((value) => {
      const selected = text(value) === text(current) ? " selected" : "";
      return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(value)}</option>`;
    })
    .join("");
}

function optionPairs(values, current = "") {
  return values
    .map(({ value, label }) => {
      const selected = text(value) === text(current) ? " selected" : "";
      return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`;
    })
    .join("");
}

function excelDateInput(serial) {
  const value = Number(serial);
  if (!Number.isFinite(value)) return "";
  const date = new Date(Math.round((value - 25569) * 86400 * 1000));
  return date.toISOString().slice(0, 10);
}

function dateInputToExcelSerial(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return String(Math.round(date.getTime() / 86400000 + 25569));
}

function filtersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    department: params.get("department") || "All",
    status: params.get("status") || "All",
    risk: params.get("risk") || "All",
    search: params.get("search") || "",
  };
}

function filteredProjects() {
  const filters = filtersFromUrl();
  const query = filters.search.toLowerCase();

  return projects.filter((project) => {
    const departmentOk = filters.department === "All" || text(project.Department) === filters.department;
    const statusOk = filters.status === "All" || text(project.Status) === filters.status;
    const riskOk = filters.risk === "All" || text(project["Risk Level"]) === filters.risk;
    const searchOk =
      !query ||
      ["Project Name", "Department", "Owner", "Status", "Strategic Theme"].some((field) =>
        text(project[field]).toLowerCase().includes(query),
      );
    return departmentOk && statusOk && riskOk && searchOk;
  });
}

function progressRows() {
  return filteredProjects()
    .map((project) => ({
      id: text(project["Project ID"]),
      name: text(project["Project Name"]),
      progress: number(project["Progress %"]),
      ownerId: text(project["Owner ID"]),
      owner: text(project.Owner),
      status: text(project.Status),
      priority: text(project.Priority),
      risk: text(project["Risk Level"]),
      targetEndDate: text(project["Target End Date"]),
      budget: number(project["Budget SAR"]),
      spend: number(project["Actual Spend SAR"]),
      strategicTheme: text(project["Strategic Theme"]),
    }))
    .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name));
}

function progressColor(value) {
  if (value >= 80) return progressColors.high;
  if (value >= 50) return progressColors.base;
  if (value >= 25) return progressColors.low;
  return progressColors.none;
}

function averageProgress(rows) {
  return rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) : 0;
}

function bandCount(rows, min, max) {
  return rows.filter((row) => row.progress >= min && row.progress <= max).length;
}

function renderScope() {
  const filters = filtersFromUrl();
  const active = [
    filters.department !== "All" ? filters.department : "",
    filters.status !== "All" ? filters.status : "",
    filters.risk !== "All" ? filters.risk : "",
    filters.search ? `Search: ${filters.search}` : "",
  ].filter(Boolean);

  els.progressScope.textContent = active.length ? active.join(" / ") : "All projects";
}

function renderMetrics(rows) {
  const average = averageProgress(rows);
  const highest = rows[0];
  const lowest = rows[rows.length - 1];
  const complete = rows.filter((row) => row.progress === 100).length;
  const underHalf = rows.filter((row) => row.progress < 50).length;

  const metrics = [
    ["Average", `${average}%`, "Mean progress across projects"],
    ["Projects", rows.length, "Progress rows included"],
    ["Highest", highest ? `${highest.progress}%` : "0%", highest ? highest.name : "No projects"],
    ["Lowest", lowest ? `${lowest.progress}%` : "0%", lowest ? lowest.name : "No projects"],
    ["Complete", complete, "Projects at 100%"],
    ["Under 50%", underHalf, "Projects below halfway"],
  ];

  els.progressMetricGrid.innerHTML = metrics
    .map(
      ([label, value, sub], index) => `
        <article class="metric-card">
          <div class="metric-card__top"><span>${escapeHtml(label)}</span><span>${String(index + 1).padStart(2, "0")}</span></div>
          <div>
            <div class="metric-card__value">${escapeHtml(value)}</div>
            <div class="metric-card__sub">${escapeHtml(sub)}</div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderHero(rows) {
  const average = averageProgress(rows);
  els.progressAverageStat.textContent = `${rows.length} rows`;
  els.progressHero.innerHTML = `
    <div class="progress-hero__value">${average}%</div>
    <div class="bar-track">
      <div class="bar-fill" style="width:${average}%; background:${progressColors.base}"></div>
    </div>
    <p>Average progress across the current project set.</p>
  `;
}

function renderBands(rows) {
  const bands = [
    ["0-24%", bandCount(rows, 0, 24)],
    ["25-49%", bandCount(rows, 25, 49)],
    ["50-74%", bandCount(rows, 50, 74)],
    ["75-99%", bandCount(rows, 75, 99)],
    ["100%", bandCount(rows, 100, 100)],
  ];

  els.progressBands.innerHTML = bands
    .map(([label, count]) => {
      const width = rows.length ? Math.round((count / rows.length) * 100) : 0;
      return `
        <div class="progress-band-row">
          <div class="progress-band-row__top">
            <strong>${escapeHtml(label)}</strong>
            <span>${count}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${width}%; background:${progressColors.base}"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderProjects(rows) {
  const canEdit = canEditOnCurrentRoute();
  els.progressTableCount.textContent = `${rows.length} rows`;

  if (!rows.length) {
    els.progressProjects.innerHTML = `<div class="empty-state">No progress rows</div>`;
    return;
  }

  els.progressProjects.innerHTML = rows
    .map(
      (row) => `
        <article class="progress-project" data-project-id="${escapeHtml(row.id)}">
          <div class="progress-project__top">
            <strong>${escapeHtml(row.name)}</strong>
            <span>${row.progress}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${row.progress}%; background:${progressColor(row.progress)}"></div>
          </div>
          <p>${escapeHtml(row.id)} - ${escapeHtml(row.status)} - ${escapeHtml(row.owner)}</p>
          ${
            canEdit
              ? `<button class="button button--ghost task-edit-toggle" type="button" data-open-project-edit>Edit</button>`
              : ""
          }
        </article>
      `,
    )
    .join("");
}

function setProjectEditMessage(form, message, type = "") {
  const messageEl = form.querySelector("[data-project-edit-message]");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `task-edit-message ${type}`.trim();
}

function projectEditForm(row) {
  return `
    <section class="edit-drawer-summary">
      <span>Project</span>
      <strong>${escapeHtml(row.name)}</strong>
    </section>
    <section class="edit-drawer-card">
      <form class="task-edit-form project-edit-form" data-project-edit-form data-project-id="${escapeHtml(row.id)}">
        <label>
          <span>Project Name</span>
          <input name="projectName" type="text" value="${escapeHtml(row.name)}" required />
        </label>
        <label>
          <span>Owner</span>
          <select name="ownerId">${optionPairs(
            employees
              .slice()
              .sort((a, b) => text(a["Employee Name"]).localeCompare(text(b["Employee Name"])))
              .map((employee) => ({
                value: text(employee["Employee ID"]),
                label: `${text(employee["Employee Name"])} (${text(employee.Department)})`,
              })),
            row.ownerId,
          )}</select>
        </label>
        <label>
          <span>Status</span>
          <select name="status">${optionList(projectStatuses, row.status)}</select>
        </label>
        <label>
          <span>Priority</span>
          <select name="priority">${optionList(projectPriorities, row.priority)}</select>
        </label>
        <label>
          <span>Risk</span>
          <select name="risk">${optionList(projectRiskLevels, row.risk)}</select>
        </label>
        <label>
          <span>Target End</span>
          <input name="targetEndDate" type="date" value="${escapeHtml(excelDateInput(row.targetEndDate))}" />
        </label>
        <label>
          <span>Progress %</span>
          <input name="progress" type="number" min="0" max="100" step="1" value="${escapeHtml(row.progress)}" />
        </label>
        <label>
          <span>Budget SAR</span>
          <input name="budget" type="number" min="0" step="1" value="${escapeHtml(row.budget)}" />
        </label>
        <label>
          <span>Actual Spend</span>
          <input name="spend" type="number" min="0" step="1" value="${escapeHtml(row.spend)}" />
        </label>
        <label>
          <span>Theme</span>
          <input name="strategicTheme" type="text" value="${escapeHtml(row.strategicTheme)}" />
        </label>
        <p class="task-edit-message" data-project-edit-message></p>
        <div class="task-edit-actions">
          <button class="button button--ghost" type="button" data-close-edit-drawer>Cancel</button>
          <button class="button" type="submit">Save Project</button>
        </div>
      </form>
    </section>
  `;
}

function openEditDrawer(title, content) {
  els.editDrawerTitle.textContent = title;
  els.editDrawerBody.innerHTML = content;
  els.editDrawer.classList.add("open");
  els.editDrawer.setAttribute("aria-hidden", "false");
  els.editDrawerScrim.hidden = false;
  requestAnimationFrame(() => els.editDrawerScrim.classList.add("open"));
  els.editDrawerBody.querySelector("input, select, button")?.focus({ preventScroll: true });
}

function closeEditDrawer() {
  els.editDrawer.classList.remove("open");
  els.editDrawer.setAttribute("aria-hidden", "true");
  els.editDrawerScrim.classList.remove("open");
  window.setTimeout(() => {
    if (!els.editDrawerScrim.classList.contains("open")) {
      els.editDrawerScrim.hidden = true;
      els.editDrawerBody.innerHTML = "";
    }
  }, 180);
}

function openProjectEditForm(button) {
  const article = button.closest("[data-project-id]");
  const row = progressRows().find((project) => project.id === text(article?.dataset.projectId));
  if (!row) return;
  openEditDrawer(`Edit ${row.id}`, projectEditForm(row));
}

async function submitProjectEditForm(event) {
  const form = event.target.closest("[data-project-edit-form]");
  if (!form) return;
  event.preventDefault();

  if (!canEditOnCurrentRoute()) {
    setProjectEditMessage(form, "Admin access is required.", "error");
    return;
  }

  const projectId = form.dataset.projectId;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.targetEndDate = dateInputToExcelSerial(payload.targetEndDate);
  const submit = form.querySelector("button[type='submit']");

  submit.disabled = true;
  setProjectEditMessage(form, "Saving project...");

  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: adminRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not update project.");
    }

    const index = projects.findIndex((project) => text(project["Project ID"]) === text(projectId));
    if (index >= 0) {
      projects[index] = { ...projects[index], ...result.project };
    }
    render();
    setProjectEditMessage(form, "Project saved.", "success");
    window.setTimeout(closeEditDrawer, 450);
  } catch (error) {
    setProjectEditMessage(form, error.message, "error");
    submit.disabled = false;
  }
}

function handleProgressProjectAction(event) {
  const openButton = event.target.closest("[data-open-project-edit]");
  if (openButton) {
    openProjectEditForm(openButton);
    return;
  }

}

function handleEditDrawerClick(event) {
  if (event.target.closest("[data-close-edit-drawer]")) {
    closeEditDrawer();
  }
}

function render() {
  const rows = progressRows();
  renderScope();
  renderMetrics(rows);
  renderHero(rows);
  renderBands(rows);
  renderProjects(rows);
}

function init() {
  setDashboardBackLink();
  els.progressProjects.addEventListener("click", handleProgressProjectAction);
  els.editDrawerBody.addEventListener("click", handleEditDrawerClick);
  els.editDrawerBody.addEventListener("submit", submitProjectEditForm);
  els.closeEditDrawer.addEventListener("click", closeEditDrawer);
  els.editDrawerScrim.addEventListener("click", closeEditDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.editDrawer.classList.contains("open")) {
      closeEditDrawer();
    }
  });
  render();
}

init();
