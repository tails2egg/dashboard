const data = window.DASHBOARD_DATA || {};
const projects = data.Projects || [];
const tasks = data.Tasks || [];

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

const els = {
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
};

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

function filtersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedStatus = params.get("status") || "At Risk";
  const status = statusConfig[requestedStatus] ? requestedStatus : "At Risk";
  const requestedType = params.get("type") || statusConfig[status].type;
  const type = requestedType === "task" ? "task" : "project";

  return {
    status,
    type,
    department: params.get("department") || "All",
    risk: params.get("risk") || "All",
    search: params.get("search") || "",
  };
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
  const config = statusConfig[filters.status];
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
  const config = statusConfig[filters.status];
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
  const config = statusConfig[filters.status];
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
  const config = statusConfig[filters.status];
  els.statusProjectCount.textContent = `${rows.length} rows`;

  if (!rows.length) {
    els.statusProjects.innerHTML = `<div class="empty-state">No ${escapeHtml(filters.status)} rows</div>`;
    return;
  }

  els.statusProjects.innerHTML = rows
    .map(
      (row) => `
        <article class="status-project">
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
                `
                : `
                  <span>${escapeHtml(row.owner)}</span>
                  <span>${escapeHtml(row.department)}</span>
                  <span>${escapeHtml(row.priority)}</span>
                  <span>${escapeHtml(row.risk)}</span>
                `
            }
          </div>
        </article>
      `,
    )
    .join("");
}

function init() {
  const rows = filteredStatusRows();
  renderScope();
  renderMetrics(rows);
  renderHero(rows);
  renderProgressBands(rows);
  renderProjects(rows);
}

init();
