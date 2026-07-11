const data = window.DASHBOARD_DATA || {};
const projects = data.Projects || [];
const tasks = data.Tasks || [];
const adminSessionKey = "dashboardAdminSession";
const taskStatuses = ["Backlog", "Not Started", "In Progress", "In Review", "Blocked", "Completed"];
const taskPriorities = ["Low", "Medium", "High", "Critical"];
const projectStatuses = ["Not Started", "Planning", "In Progress", "At Risk", "On Hold", "Completed"];
const projectPriorities = ["Low", "Medium", "High", "Critical"];
const projectRiskLevels = ["Low", "Medium", "High"];

const statusConfig = {
  "At Risk": {
    type: "project",
    color: "#c98114",
    title: "At Risk Projects",
    detail: "Projects currently marked at risk.",
  },
  Completed: {
    type: "project",
    color: "#2f9b68",
    title: "Completed Projects",
    detail: "Projects currently marked completed.",
  },
  Planning: {
    type: "project",
    color: "#5366c9",
    title: "Planning Projects",
    detail: "Projects currently in planning.",
  },
  "On Hold": {
    type: "project",
    color: "#7a5195",
    title: "On Hold Projects",
    detail: "Projects currently paused.",
  },
  "Not Started": {
    type: "project",
    color: "#667085",
    title: "Not Started Projects",
    detail: "Projects not started yet.",
  },
  "In Review": {
    type: "task",
    color: "#5366c9",
    title: "In Review Tasks",
    detail: "Tasks currently in review.",
  },
  Backlog: {
    type: "task",
    color: "#667085",
    title: "Backlog Tasks",
    detail: "Tasks waiting in backlog.",
  },
  Blocked: {
    type: "task",
    color: "#c2413b",
    title: "Blocked Tasks",
    detail: "Tasks currently blocked.",
  },
};

const taskStatusConfig = {
  Backlog: {
    color: "#667085",
    title: "Backlog Tasks",
    detail: "Tasks waiting in backlog.",
  },
  "Not Started": {
    color: "#667085",
    title: "Not Started Tasks",
    detail: "Tasks not started yet.",
  },
  "In Progress": {
    color: "#16837a",
    title: "In Progress Tasks",
    detail: "Tasks currently in progress.",
  },
  "In Review": {
    color: "#5366c9",
    title: "In Review Tasks",
    detail: "Tasks currently in review.",
  },
  Blocked: {
    color: "#c2413b",
    title: "Blocked Tasks",
    detail: "Tasks currently blocked.",
  },
  Completed: {
    color: "#2f9b68",
    title: "Completed Tasks",
    detail: "Tasks currently completed.",
  },
};

const statusRoutes = {
  "/at-risk": { status: "At Risk", type: "project" },
  "/at-risk2admins": { status: "At Risk", type: "project" },
  "/completed": { status: "Completed", type: "project" },
  "/completed2admins": { status: "Completed", type: "project" },
  "/planning": { status: "Planning", type: "project" },
  "/planning2admins": { status: "Planning", type: "project" },
  "/on-hold": { status: "On Hold", type: "project" },
  "/on-hold2admins": { status: "On Hold", type: "project" },
  "/not-started": { status: "Not Started", type: "project" },
  "/not-started2admins": { status: "Not Started", type: "project" },
  "/in-review": { status: "In Review", type: "task" },
  "/in-review2admins": { status: "In Review", type: "task" },
  "/backlog": { status: "Backlog", type: "task" },
  "/backlog2admins": { status: "Backlog", type: "task" },
  "/blocked": { status: "Blocked", type: "task" },
  "/blocked2admins": { status: "Blocked", type: "task" },
};

const els = {
  dashboardBack: document.querySelector("[data-dashboard-back]"),
  statusPageTitle: document.querySelector("#statusPageTitle"),
  statusScope: document.querySelector("#statusScope"),
  statusMetricGrid: document.querySelector("#statusMetricGrid"),
  statusHeroEyebrow: document.querySelector("#statusHeroEyebrow"),
  statusHeroTitle: document.querySelector("#statusHeroTitle"),
  statusHeroStat: document.querySelector("#statusHeroStat"),
  statusHero: document.querySelector("#statusHero"),
  statusProgressBands: document.querySelector("#statusProgressBands"),
  statusProjectListTitle: document.querySelector("#statusProjectListTitle"),
  statusProjectCount: document.querySelector("#statusProjectCount"),
  statusProjects: document.querySelector("#statusProjects"),
  editDrawerScrim: document.querySelector("#editDrawerScrim"),
  editDrawer: document.querySelector("#editDrawer"),
  editDrawerTitle: document.querySelector("#editDrawerTitle"),
  editDrawerBody: document.querySelector("#editDrawerBody"),
  closeEditDrawer: document.querySelector("#closeEditDrawer"),
};

function isAdminRouteOrSession() {
  return window.location.pathname.includes("2admins") || isAdminSession();
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
  const routeConfig = statusRoutes[window.location.pathname.toLowerCase()];
  const requestedType = params.get("type") || routeConfig?.type;
  const requestedStatus = params.get("status") || routeConfig?.status || "At Risk";
  const type = requestedType === "task" ? "task" : statusConfig[requestedStatus]?.type || "project";
  const status =
    type === "task"
      ? taskStatusConfig[requestedStatus]
        ? requestedStatus
        : "Blocked"
      : statusConfig[requestedStatus]
        ? requestedStatus
        : "At Risk";

  return {
    status,
    type,
    department: params.get("department") || "All",
    risk: params.get("risk") || "All",
    search: params.get("search") || "",
  };
}

function configFor(filters) {
  if (filters.type === "task") {
    return taskStatusConfig[filters.status] || taskStatusConfig.Blocked;
  }
  return statusConfig[filters.status] || statusConfig["At Risk"];
}

function projectMatchesScope(project, filters, query) {
  const departmentOk = filters.department === "All" || text(project.Department) === filters.department;
  const riskOk = filters.risk === "All" || text(project["Risk Level"]) === filters.risk;
  const searchOk =
    !query ||
    ["Project Name", "Department", "Owner", "Strategic Theme"].some((field) =>
      text(project[field]).toLowerCase().includes(query),
    );
  return departmentOk && riskOk && searchOk;
}

function filteredStatusRows() {
  const filters = filtersFromUrl();
  const query = filters.search.toLowerCase();

  if (filters.type === "task") {
    const scopedProjectIds = new Set(
      projects
        .filter((project) => projectMatchesScope(project, filters, query))
        .map((project) => project["Project ID"]),
    );
    const hasProjectScope = filters.risk !== "All" || Boolean(filters.search);

    return tasks
      .filter((task) => {
        const statusOk = text(task.Status) === filters.status;
        const departmentOk = filters.department === "All" || text(task.Department) === filters.department;
        const projectOk = !hasProjectScope || scopedProjectIds.has(task["Project ID"]);
        const searchOk =
          !query ||
          ["Task Name", "Project", "Assigned To", "Department"].some((field) =>
            text(task[field]).toLowerCase().includes(query),
          ) ||
          scopedProjectIds.has(task["Project ID"]);
        return statusOk && departmentOk && projectOk && searchOk;
      })
      .map((task) => ({
        id: text(task["Task ID"]),
        name: text(task["Task Name"]),
        project: text(task.Project),
        assignee: text(task["Assigned To"]),
        priority: text(task.Priority),
        status: text(task.Status),
        progress: number(task["Completion %"]),
        estimatedHours: number(task["Estimated Hours"]),
        actualHours: number(task["Actual Hours"]),
      }))
      .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name));
  }

  return projects
    .filter((project) => {
      const statusOk = text(project.Status) === filters.status;
      return statusOk && projectMatchesScope(project, filters, query);
    })
    .map((project) => ({
      id: text(project["Project ID"]),
      name: text(project["Project Name"]),
      owner: text(project.Owner),
      department: text(project.Department),
      risk: text(project["Risk Level"]),
      priority: text(project.Priority),
      progress: number(project["Progress %"]),
      budget: number(project["Budget SAR"]),
      spend: number(project["Actual Spend SAR"]),
      ownerId: text(project["Owner ID"]),
      targetEndDate: text(project["Target End Date"]),
      strategicTheme: text(project["Strategic Theme"]),
      estimatedHours: 0,
      actualHours: 0,
    }))
    .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name));
}

function averageProgress(rows) {
  return rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) : 0;
}

function progressBand(rows, min, max) {
  return rows.filter((row) => row.progress >= min && row.progress <= max).length;
}

function renderScope() {
  const filters = filtersFromUrl();
  const active = [
    filters.status,
    filters.type === "task" ? "Tasks" : "Projects",
    filters.department !== "All" ? filters.department : "",
    filters.risk !== "All" ? filters.risk : "",
    filters.search ? `Search: ${filters.search}` : "",
  ].filter(Boolean);

  els.statusScope.textContent = active.join(" / ");
}

function renderMetrics(rows) {
  const filters = filtersFromUrl();
  const config = configFor(filters);
  const average = averageProgress(rows);
  const highest = rows[0];
  const lowest = rows[rows.length - 1];
  const highPriority = rows.filter((row) => row.priority === "High" || row.priority === "Critical").length;
  const highRisk = rows.filter((row) => row.risk === "High").length;
  const overEstimate = rows.filter((row) => row.actualHours > row.estimatedHours && row.estimatedHours > 0).length;
  const averageLabel = filters.type === "task" ? "Average Completion" : "Average Progress";

  const metrics =
    filters.type === "task"
      ? [
          [filters.status, rows.length, config.detail],
          [averageLabel, `${average}%`, "Within this task status only"],
          ["Highest Completion", highest ? `${highest.progress}%` : "0%", highest ? highest.name : "No tasks"],
          ["Lowest Completion", lowest ? `${lowest.progress}%` : "0%", lowest ? lowest.name : "No tasks"],
          ["High Priority", highPriority, "Tasks in this status"],
          ["Over Estimate", overEstimate, "Tasks above estimated hours"],
        ]
      : [
          [filters.status, rows.length, config.detail],
          [averageLabel, `${average}%`, "Within this project status only"],
          ["Highest Progress", highest ? `${highest.progress}%` : "0%", highest ? highest.name : "No projects"],
          ["Lowest Progress", lowest ? `${lowest.progress}%` : "0%", lowest ? lowest.name : "No projects"],
          ["High Priority", highPriority, "Projects in this status"],
          ["High Risk", highRisk, "Projects in this status"],
        ];

  els.statusMetricGrid.innerHTML = metrics
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
  const filters = filtersFromUrl();
  const config = configFor(filters);
  const average = averageProgress(rows);
  const measure = filters.type === "task" ? "completion" : "progress";

  els.statusPageTitle.textContent = config.title;
  els.statusHeroEyebrow.textContent = filters.status;
  els.statusHeroTitle.textContent = config.title;
  els.statusHeroStat.textContent = `${rows.length} rows`;
  els.statusProjectListTitle.textContent = config.title;
  els.statusHero.innerHTML = `
    <div class="status-hero__value" style="color:${config.color}">${rows.length}</div>
    <div class="bar-track">
      <div class="bar-fill" style="width:${average}%; background:${config.color}"></div>
    </div>
    <p>${escapeHtml(config.detail)} Average ${measure} for this status is ${average}%.</p>
  `;
}

function renderProgressBands(rows) {
  const filters = filtersFromUrl();
  const config = configFor(filters);
  const bands = [
    ["0-24%", progressBand(rows, 0, 24)],
    ["25-49%", progressBand(rows, 25, 49)],
    ["50-74%", progressBand(rows, 50, 74)],
    ["75-99%", progressBand(rows, 75, 99)],
    ["100%", progressBand(rows, 100, 100)],
  ];

  els.statusProgressBands.innerHTML = bands
    .map(([label, count]) => {
      const width = rows.length ? Math.round((count / rows.length) * 100) : 0;
      return `
        <div class="progress-band-row">
          <div class="progress-band-row__top">
            <strong>${escapeHtml(label)}</strong>
            <span>${count}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${width}%; background:${config.color}"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderProjects(rows) {
  const filters = filtersFromUrl();
  const config = configFor(filters);
  const canEdit = canEditOnCurrentRoute();
  const canEditTasks = filters.type === "task" && canEdit;
  const canEditProjects = filters.type === "project" && canEdit;
  els.statusProjectCount.textContent = `${rows.length} rows`;

  if (!rows.length) {
    els.statusProjects.innerHTML = `<div class="empty-state">No ${escapeHtml(filters.status)} rows</div>`;
    return;
  }

  els.statusProjects.innerHTML = rows
    .map(
      (row) => `
        <article class="status-project" data-task-id="${escapeHtml(row.id)}">
          <div class="status-project__top">
            <strong>${escapeHtml(row.name)}</strong>
            <span style="color:${config.color}">${row.progress}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${row.progress}%; background:${config.color}"></div>
          </div>
          <div class="status-project__meta">
            <span>${escapeHtml(row.id)}</span>
            ${
              filters.type === "task"
                ? `
                  <span>${escapeHtml(row.project)}</span>
                  <span>${escapeHtml(row.assignee)}</span>
                  <span>${escapeHtml(row.priority)}</span>
                  <span>${row.estimatedHours}h est</span>
                  <span>${row.actualHours}h actual</span>
                  ${
                    canEditTasks
                      ? `<button class="button button--ghost task-edit-toggle" type="button" data-open-task-edit>Edit</button>`
                      : ""
                  }
                `
                : `
                  <span>${escapeHtml(row.owner)}</span>
                  <span>${escapeHtml(row.department)}</span>
                  <span>${escapeHtml(row.priority)}</span>
                  <span>${escapeHtml(row.risk)}</span>
                  ${
                    canEditProjects
                      ? `<button class="button button--ghost task-edit-toggle" type="button" data-open-project-edit>Edit</button>`
                      : ""
                  }
                `
            }
          </div>
        </article>
      `,
    )
    .join("");
}

function setTaskEditMessage(form, message, type = "") {
  const messageEl = form.querySelector("[data-task-edit-message]");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `task-edit-message ${type}`.trim();
}

function setProjectEditMessage(form, message, type = "") {
  const messageEl = form.querySelector("[data-project-edit-message]");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `task-edit-message ${type}`.trim();
}

function employeesForOptions() {
  return (window.DASHBOARD_DATA?.Employees || [])
    .slice()
    .sort((a, b) => text(a["Employee Name"]).localeCompare(text(b["Employee Name"])));
}

function taskEditForm(row) {
  return `
    <section class="edit-drawer-summary">
      <span>Task</span>
      <strong>${escapeHtml(row.name)}</strong>
    </section>
    <section class="edit-drawer-card">
      <form class="task-edit-form" data-task-edit-form data-task-id="${escapeHtml(row.id)}">
        <label>
          <span>Status</span>
          <select name="status">${optionList(taskStatuses, row.status)}</select>
        </label>
        <label>
          <span>Priority</span>
          <select name="priority">${optionList(taskPriorities, row.priority)}</select>
        </label>
        <label>
          <span>Completion %</span>
          <input name="completion" type="number" min="0" max="100" step="1" value="${escapeHtml(row.progress)}" />
        </label>
        <label>
          <span>Actual Hours</span>
          <input name="actualHours" type="number" min="0" step="0.25" value="${escapeHtml(row.actualHours || "")}" />
        </label>
        <p class="task-edit-message" data-task-edit-message></p>
        <div class="task-edit-actions">
          <button class="button button--ghost" type="button" data-close-edit-drawer>Cancel</button>
          <button class="button" type="submit">Save</button>
        </div>
      </form>
    </section>
  `;
}

function projectEditForm(row, filters) {
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
            employeesForOptions().map((employee) => ({
              value: text(employee["Employee ID"]),
              label: `${text(employee["Employee Name"])} (${text(employee.Department)})`,
            })),
            row.ownerId,
          )}</select>
        </label>
        <label>
          <span>Status</span>
          <select name="status">${optionList(projectStatuses, filters.status)}</select>
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

function openTaskEditForm(button) {
  const article = button.closest("[data-task-id]");
  const row = filteredStatusRows().find((record) => record.id === text(article?.dataset.taskId));
  if (!row) return;
  openEditDrawer(`Edit ${row.id}`, taskEditForm(row));
}

function openProjectEditForm(button) {
  const article = button.closest("[data-task-id]");
  const row = filteredStatusRows().find((record) => record.id === text(article?.dataset.taskId));
  if (!row) return;
  openEditDrawer(`Edit ${row.id}`, projectEditForm(row, filtersFromUrl()));
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

async function submitTaskEditForm(event) {
  const form = event.target.closest("[data-task-edit-form]");
  if (!form) return;
  event.preventDefault();

  if (!canEditOnCurrentRoute()) {
    setTaskEditMessage(form, "Admin access is required.", "error");
    return;
  }

  const taskId = form.dataset.taskId;
  const payload = Object.fromEntries(new FormData(form).entries());
  const submit = form.querySelector("button[type='submit']");

  submit.disabled = true;
  setTaskEditMessage(form, "Saving task...");

  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      headers: adminRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not update task.");
    }

    const index = tasks.findIndex((task) => text(task["Task ID"]) === text(taskId));
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...result.task };
    }

    render();
    setTaskEditMessage(form, "Task saved.", "success");
    window.setTimeout(closeEditDrawer, 450);
  } catch (error) {
    setTaskEditMessage(form, error.message, "error");
    submit.disabled = false;
  }
}

function handleStatusProjectClick(event) {
  const openProjectButton = event.target.closest("[data-open-project-edit]");
  if (openProjectButton) {
    openProjectEditForm(openProjectButton);
    return;
  }

  const openButton = event.target.closest("[data-open-task-edit]");
  if (openButton) {
    openTaskEditForm(openButton);
    return;
  }
}

function handleEditDrawerClick(event) {
  if (event.target.closest("[data-close-edit-drawer]")) {
    closeEditDrawer();
  }
}

function render() {
  const rows = filteredStatusRows();
  renderScope();
  renderMetrics(rows);
  renderHero(rows);
  renderProgressBands(rows);
  renderProjects(rows);
}

function init() {
  setDashboardBackLink();
  els.statusProjects.addEventListener("click", handleStatusProjectClick);
  els.editDrawerBody.addEventListener("click", handleEditDrawerClick);
  els.editDrawerBody.addEventListener("submit", submitTaskEditForm);
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
