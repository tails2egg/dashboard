const data = window.DASHBOARD_DATA || {};

const departments = data.Departments || [];
const employees = data.Employees || [];
const projects = data.Projects || [];
const tasks = data.Tasks || [];
const meetings = data.Meetings || [];
const updates = data["Weekly Updates"] || [];
const activities = data["Activity Log"] || [];
const authSessionKey = "dashboardAuthSession";
const accountStorageKey = "dashboardAuthAccounts";
const adminSessionKey = "dashboardAdminSession";

const colors = {
  "In Progress": "#16837a",
  Completed: "#2f9b68",
  Planning: "#5366c9",
  "At Risk": "#c98114",
  "On Hold": "#7a5195",
  "Not Started": "#667085",
  Backlog: "#667085",
  "In Review": "#5366c9",
  Blocked: "#c2413b",
  Low: "#2f9b68",
  Medium: "#c98114",
  High: "#c2413b",
  Critical: "#7a5195",
  Green: "#2f9b68",
  Amber: "#c98114",
  Red: "#c2413b",
  Active: "#2f9b68",
  Contractor: "#5366c9",
  "On Leave": "#c98114",
  Unassigned: "#667085",
};

const state = {
  department: "All",
  status: "All",
  risk: "All",
  search: "",
  employeeSearch: "",
  employeeStatus: "All",
  employeeLocation: "All",
  employeePage: 1,
  employeePageSize: 12,
};

const els = {
  authStatus: document.querySelector("#authStatus"),
  accountBlock: document.querySelector("#accountBlock"),
  adminButton: document.querySelector("#adminButton"),
  logoutButton: document.querySelector("#logoutButton"),
  refreshDate: document.querySelector("#refreshDate"),
  departmentFilter: document.querySelector("#departmentFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  riskFilter: document.querySelector("#riskFilter"),
  searchFilter: document.querySelector("#searchFilter"),
  resetFilters: document.querySelector("#resetFilters"),
  sheetPullTab: document.querySelector("#sheetPullTab"),
  closeStatusDrawer: document.querySelector("#closeStatusDrawer"),
  statusDrawer: document.querySelector("#statusDrawer"),
  sheetScrim: document.querySelector("#sheetScrim"),
  statusDrawerBody: document.querySelector("#statusDrawerBody"),
  adminPasswordScrim: document.querySelector("#adminPasswordScrim"),
  adminPasswordModal: document.querySelector("#adminPasswordModal"),
  adminPasswordForm: document.querySelector("#adminPasswordForm"),
  closeAdminPassword: document.querySelector("#closeAdminPassword"),
  cancelAdminPassword: document.querySelector("#cancelAdminPassword"),
  adminPasswordInput: document.querySelector("#adminPasswordInput"),
  adminPasswordMessage: document.querySelector("#adminPasswordMessage"),
  employeeDetailScrim: document.querySelector("#employeeDetailScrim"),
  employeeDetailDrawer: document.querySelector("#employeeDetailDrawer"),
  employeeDetailTitle: document.querySelector("#employeeDetailTitle"),
  employeeDetailBody: document.querySelector("#employeeDetailBody"),
  closeEmployeeDetail: document.querySelector("#closeEmployeeDetail"),
  metricGrid: document.querySelector("#metricGrid"),
  portfolioCount: document.querySelector("#portfolioCount"),
  statusDonut: document.querySelector("#statusDonut"),
  statusLegend: document.querySelector("#statusLegend"),
  taskFlow: document.querySelector("#taskFlow"),
  riskPriority: document.querySelector("#riskPriority"),
  departmentLoad: document.querySelector("#departmentLoad"),
  budgetList: document.querySelector("#budgetList"),
  healthTrend: document.querySelector("#healthTrend"),
  activityFeed: document.querySelector("#activityFeed"),
  employeeCount: document.querySelector("#employeeCount"),
  employeeSummary: document.querySelector("#employeeSummary"),
  employeeSearch: document.querySelector("#employeeSearch"),
  employeeStatusFilter: document.querySelector("#employeeStatusFilter"),
  employeeLocationFilter: document.querySelector("#employeeLocationFilter"),
  employeePageSize: document.querySelector("#employeePageSize"),
  openAddEmployee: document.querySelector("#openAddEmployee"),
  addEmployeePanel: document.querySelector("#addEmployeePanel"),
  addEmployeeForm: document.querySelector("#addEmployeeForm"),
  closeAddEmployee: document.querySelector("#closeAddEmployee"),
  cancelAddEmployee: document.querySelector("#cancelAddEmployee"),
  addEmployeeMessage: document.querySelector("#addEmployeeMessage"),
  addEmployeeEmail: document.querySelector("#addEmployeeEmail"),
  addEmployeeName: document.querySelector("#addEmployeeName"),
  addEmployeeDepartment: document.querySelector("#addEmployeeDepartment"),
  addEmployeeLocation: document.querySelector("#addEmployeeLocation"),
  employeeTable: document.querySelector("#employeeTable"),
  employeePrev: document.querySelector("#employeePrev"),
  employeeNext: document.querySelector("#employeeNext"),
  employeePageInfo: document.querySelector("#employeePageInfo"),
  projectTable: document.querySelector("#projectTable"),
  tableCount: document.querySelector("#tableCount"),
};

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value) {
  return String(value || "").trim();
}

function authSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem(authSessionKey) || "null");
    return session && typeof session === "object" ? session : null;
  } catch (error) {
    return null;
  }
}

function storedAccounts() {
  try {
    const accounts = JSON.parse(window.localStorage.getItem(accountStorageKey) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch (error) {
    return [];
  }
}

function removeUsedAccounts() {
  const employeeEmails = new Set(employees.map((employee) => text(employee.Email).toLowerCase()));
  const availableAccounts = storedAccounts().filter(
    (account) => !employeeEmails.has(text(account.email).toLowerCase()),
  );
  window.localStorage.setItem(accountStorageKey, JSON.stringify(availableAccounts));
  return availableAccounts;
}

function signedUpEmployeeEmails() {
  const existing = new Set(employees.map((employee) => text(employee.Email).toLowerCase()));
  return removeUsedAccounts()
    .map((account) => text(account.email).toLowerCase())
    .filter((email) => email && !existing.has(email))
    .sort();
}

function nameFromEmail(email) {
  return text(email)
    .split("@")[0]
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function excelDate(serial, includeTime = false) {
  const value = Number(serial);
  if (!Number.isFinite(value)) return "";

  const millis = Math.round((value - 25569) * 86400 * 1000);
  const date = new Date(millis);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: includeTime ? undefined : "numeric",
    hour: includeTime ? "numeric" : undefined,
    minute: includeTime ? "2-digit" : undefined,
  }).format(date);
}

function compact(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function percent(value) {
  return `${Math.round(number(value))}%`;
}

function byCount(rows, key) {
  return rows.reduce((acc, row) => {
    const label = text(row[key]) || "Unassigned";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function sortEntries(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function unique(rows, key) {
  return [...new Set(rows.map((row) => text(row[key])).filter(Boolean))].sort();
}

function uniqueWithFallback(rows, key, fallback = "Unassigned") {
  return [...new Set(rows.map((row) => text(row[key]) || fallback))].sort();
}

function includesSearch(row, fields) {
  if (!state.search) return true;
  const query = state.search.toLowerCase();
  return fields.some((field) => text(row[field]).toLowerCase().includes(query));
}

function departmentMatches(row) {
  return state.department === "All" || text(row.Department) === state.department;
}

function filteredProjects() {
  return projects.filter((project) => {
    const departmentOk = departmentMatches(project);
    const statusOk = state.status === "All" || text(project.Status) === state.status;
    const riskOk = state.risk === "All" || text(project["Risk Level"]) === state.risk;
    const searchOk = includesSearch(project, [
      "Project Name",
      "Department",
      "Owner",
      "Status",
      "Strategic Theme",
    ]);
    return departmentOk && statusOk && riskOk && searchOk;
  });
}

function filteredTasks() {
  const projectIds = new Set(filteredProjects().map((project) => project["Project ID"]));
  const hasProjectScope = state.risk !== "All" || state.search !== "";
  return tasks.filter((task) => {
    const departmentOk = departmentMatches(task);
    const projectOk = !hasProjectScope || projectIds.has(task["Project ID"]);
    const statusOk = state.status === "All" || text(task.Status) === state.status;
    const searchOk =
      !state.search ||
      includesSearch(task, ["Task Name", "Project", "Assigned To", "Department"]) ||
      projectIds.has(task["Project ID"]);
    return departmentOk && projectOk && statusOk && searchOk;
  });
}

function filteredEmployees() {
  return employees.filter((employee) => {
    const departmentOk = departmentMatches(employee);
    const globalSearchOk = includesSearch(employee, [
      "Employee ID",
      "Employee Name",
      "Email",
      "Department",
      "Job Title",
      "Level",
      "Manager",
      "Location",
      "Employment Status",
    ]);
    const employeeQuery = state.employeeSearch.toLowerCase();
    const employeeSearchOk =
      !employeeQuery ||
      [
        "Employee ID",
        "Employee Name",
        "Email",
        "Department",
        "Job Title",
        "Level",
        "Manager",
        "Location",
        "Employment Status",
      ].some((field) => text(employee[field]).toLowerCase().includes(employeeQuery));
    const statusOk =
      state.employeeStatus === "All" ||
      text(employee["Employment Status"] || "Unassigned") === state.employeeStatus;
    const locationOk =
      state.employeeLocation === "All" ||
      text(employee.Location || "Unassigned") === state.employeeLocation;

    return departmentOk && globalSearchOk && employeeSearchOk && statusOk && locationOk;
  });
}

function filteredUpdates() {
  const projectIds = new Set(filteredProjects().map((project) => project["Project ID"]));
  const hasProjectScope = state.status !== "All" || state.risk !== "All" || state.search !== "";
  return updates.filter((update) => {
    const departmentOk = departmentMatches(update);
    const projectOk = !hasProjectScope || projectIds.has(update["Project ID"]);
    return departmentOk && projectOk;
  });
}

function filteredActivities() {
  return activities.filter((activity) => {
    const departmentOk = departmentMatches(activity);
    const searchOk = includesSearch(activity, [
      "Employee",
      "Project",
      "Task ID",
      "Activity Type",
      "Impact",
      "Source",
    ]);
    return departmentOk && searchOk;
  });
}

function fillSelect(select, values, current) {
  select.innerHTML = ["All", ...values]
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
  select.value = current;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function employeeById(employeeId) {
  return employees.find((employee) => text(employee["Employee ID"]) === text(employeeId));
}

function employeeRelatedRows(employee) {
  const employeeId = text(employee["Employee ID"]);
  const employeeName = text(employee["Employee Name"]);

  return {
    department: departments.find(
      (department) =>
        text(department["Department ID"]) === text(employee["Department ID"]) ||
        text(department["Department Name"]) === text(employee.Department),
    ),
    directReports: employees.filter((row) => text(row.Manager) === employeeName),
    ownedProjects: projects.filter((project) => text(project.Owner) === employeeName),
    assignedTasks: tasks.filter(
      (task) => text(task["Assigned To ID"]) === employeeId || text(task["Assigned To"]) === employeeName,
    ),
    organizedMeetings: meetings.filter(
      (meeting) => text(meeting["Organizer ID"]) === employeeId || text(meeting.Organizer) === employeeName,
    ),
    activities: activities.filter(
      (activity) => text(activity["Employee ID"]) === employeeId || text(activity.Employee) === employeeName,
    ),
  };
}

function detailValue(label, value) {
  return `
    <div class="employee-detail-field">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(text(value) || "Unassigned")}</strong>
    </div>
  `;
}

function detailStat(label, value) {
  return `
    <div class="employee-detail-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function employeeDetailList(title, rows, emptyText, renderItem) {
  const body = rows.length
    ? rows.map(renderItem).join("")
    : `<div class="employee-detail-empty">${escapeHtml(emptyText)}</div>`;

  return `
    <section class="employee-detail-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="employee-detail-list">${body}</div>
    </section>
  `;
}

function renderMetrics() {
  const projectRows = filteredProjects();
  const taskRows = filteredTasks();
  const employeeRows = filteredEmployees();
  const updateRows = filteredUpdates();
  const activeEmployees = employeeRows.filter((employee) => text(employee["Employment Status"]) === "Active").length;
  const atRisk = projectRows.filter((project) => text(project.Status) === "At Risk" || text(project["Risk Level"]) === "High").length;
  const blocked = taskRows.filter((task) => text(task.Status) === "Blocked").length;
  const spend = projectRows.reduce((sum, project) => sum + number(project["Actual Spend SAR"]), 0);
  const budget = projectRows.reduce((sum, project) => sum + number(project["Budget SAR"]), 0);
  const avgProgress =
    projectRows.reduce((sum, project) => sum + number(project["Progress %"]), 0) /
    Math.max(projectRows.length, 1);
  const redUpdates = updateRows.filter((update) => text(update.Health) === "Red").length;

  const metrics = [
    ["Employees", compact(activeEmployees), `${compact(employeeRows.length)} total people`],
    ["Projects", compact(projectRows.length), `${compact(projects.length)} in workbook`],
    ["At Risk", compact(atRisk), `${compact(redUpdates)} red weekly updates`],
    ["Blocked Tasks", compact(blocked), `${compact(taskRows.length)} visible tasks`],
    ["Budget", currency(budget), `${currency(spend)} actual spend`],
    ["Avg Progress", percent(avgProgress), `${Math.round((spend / Math.max(budget, 1)) * 100)}% budget used`],
  ];

  els.metricGrid.innerHTML = metrics
    .map(
      ([label, value, sub], index) => `
        <article class="metric-card">
          <div class="metric-card__top"><span>${label}</span><span>${String(index + 1).padStart(2, "0")}</span></div>
          <div>
            <div class="metric-card__value">${value}</div>
            <div class="metric-card__sub">${sub}</div>
          </div>
        </article>
      `,
    )
    .join("");
}

function polarToCartesian(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function donutArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function renderDonut() {
  const rows = filteredProjects();
  const entries = sortEntries(byCount(rows, "Status"));
  const total = rows.length || 1;
  let angle = 0;

  if (!rows.length) {
    els.statusDonut.innerHTML = `
      <circle cx="110" cy="110" r="78" fill="none" stroke="#eef3f8" stroke-width="30"></circle>
      <text x="110" y="108" class="donut-center">0</text>
      <text x="110" y="130" class="donut-label">projects</text>
    `;
    els.statusLegend.innerHTML = `<div class="empty-state">No matching projects</div>`;
    els.portfolioCount.textContent = "0 visible";
    return;
  }

  const arcs = entries
    .map(([label, count]) => {
      const size = (count / total) * 360;
      const arc = `<path d="${donutArc(110, 110, 78, angle, angle + size)}" fill="none" stroke="${colors[label] || "#5366c9"}" stroke-width="30" stroke-linecap="butt"></path>`;
      angle += size;
      return arc;
    })
    .join("");

  els.statusDonut.innerHTML = `
    <circle cx="110" cy="110" r="78" fill="none" stroke="#eef3f8" stroke-width="30"></circle>
    ${arcs}
    <text x="110" y="108" class="donut-center">${rows.length}</text>
    <text x="110" y="130" class="donut-label">projects</text>
  `;

  els.statusLegend.innerHTML = entries
    .map(
      ([label, count]) => `
        <div class="legend-item">
          <span class="swatch" style="background:${colors[label] || "#5366c9"}"></span>
          <span class="legend-label">${escapeHtml(label)}</span>
          <span class="legend-value">${count}</span>
        </div>
      `,
    )
    .join("");
  els.portfolioCount.textContent = `${rows.length} visible`;
}

function renderTaskFlow() {
  const rows = filteredTasks();
  const entries = sortEntries(byCount(rows, "Status"));
  const max = Math.max(...entries.map((entry) => entry[1]), 1);

  if (!rows.length) {
    els.taskFlow.innerHTML = `<div class="empty-state">No matching tasks</div>`;
    return;
  }

  els.taskFlow.innerHTML = entries
    .map(
      ([label, count]) => `
        <div class="stack-row">
          <div class="stack-row__top">
            <span class="stack-name">${escapeHtml(label)}</span>
            <span class="stack-value">${count}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%; background:${colors[label] || "#16837a"}"></div></div>
        </div>
      `,
    )
    .join("");
}

function renderRiskPriority() {
  const rows = filteredProjects();
  const riskEntries = ["Low", "Medium", "High"].map((label) => [
    label,
    rows.filter((project) => text(project["Risk Level"]) === label).length,
  ]);
  const priorityEntries = ["Low", "Medium", "High", "Critical"].map((label) => [
    label,
    rows.filter((project) => text(project.Priority) === label).length,
  ]);

  els.riskPriority.innerHTML = `
    <div class="matrix-grid">
      ${riskEntries
        .map(
          ([label, count]) => `
            <div class="matrix-cell">
              <strong style="color:${colors[label]}">${count}</strong>
              <span>${label} risk</span>
            </div>
          `,
        )
        .join("")}
      ${priorityEntries
        .map(
          ([label, count]) => `
            <div class="matrix-cell">
              <strong style="color:${colors[label]}">${count}</strong>
              <span>${label} priority</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderDepartmentLoad() {
  const taskCounts = byCount(tasks.filter((task) => text(task.Department)), "Department");
  const projectCounts = byCount(projects.filter((project) => text(project.Department)), "Department");
  const employeeCounts = byCount(employees.filter((employee) => text(employee.Department)), "Department");
  const entries = departments
    .map((department) => {
      const name = text(department["Department Name"]);
      return {
        name,
        tasks: taskCounts[name] || 0,
        projects: projectCounts[name] || 0,
        headcount: employeeCounts[name] || 0,
      };
    })
    .sort((a, b) => b.tasks + b.projects * 12 - (a.tasks + a.projects * 12))
    .slice(0, 10);
  const max = Math.max(...entries.map((entry) => entry.tasks + entry.projects * 12), 1);

  els.departmentLoad.innerHTML = entries
    .map((entry) => {
      const score = entry.tasks + entry.projects * 12;
      return `
        <div class="rank-row" data-department="${escapeHtml(entry.name)}">
          <div class="rank-row__top">
            <span class="rank-name">${escapeHtml(entry.name)}</span>
            <span class="rank-value">${entry.projects} projects - ${entry.tasks} tasks - ${entry.headcount} HC</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${(score / max) * 100}%"></div></div>
        </div>
      `;
    })
    .join("");

  els.departmentLoad.querySelectorAll("[data-department]").forEach((row) => {
    row.addEventListener("click", () => {
      state.department = row.dataset.department;
      els.departmentFilter.value = state.department;
      render();
    });
  });
}

function renderBudgets() {
  const rows = filteredProjects()
    .map((project) => ({
      name: text(project["Project Name"]),
      budget: number(project["Budget SAR"]),
      spend: number(project["Actual Spend SAR"]),
    }))
    .filter((project) => project.budget > 0)
    .sort((a, b) => b.spend / b.budget - a.spend / a.budget)
    .slice(0, 8);

  if (!rows.length) {
    els.budgetList.innerHTML = `<div class="empty-state">No budget rows</div>`;
    return;
  }

  els.budgetList.innerHTML = rows
    .map((project) => {
      const usage = Math.min((project.spend / project.budget) * 100, 140);
      const tone = usage > 90 ? colors.High : usage > 70 ? colors.Medium : colors.Low;
      return `
        <div class="rank-row">
          <div class="rank-row__top">
            <span class="rank-name">${escapeHtml(project.name)}</span>
            <span class="rank-value">${Math.round(usage)}%</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.min(usage, 100)}%; background:${tone}"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderHealthTrend() {
  const rows = filteredUpdates();
  const grouped = rows.reduce((acc, update) => {
    const week = text(update["Week Starting"]);
    if (!week) return acc;
    if (!acc[week]) acc[week] = { Green: 0, Amber: 0, Red: 0 };
    const health = text(update.Health);
    if (acc[week][health] !== undefined) acc[week][health] += 1;
    return acc;
  }, {});

  const weeks = Object.keys(grouped).sort((a, b) => number(a) - number(b)).slice(-10);
  const series = ["Green", "Amber", "Red"];
  const width = 640;
  const height = 260;
  const padding = 34;
  const max = Math.max(
    ...weeks.flatMap((week) => series.map((health) => grouped[week][health])),
    1,
  );

  const chartPoints = (health) =>
    weeks.map((week, index) => ({
      x: padding + (index * (width - padding * 2)) / Math.max(weeks.length - 1, 1),
      y: height - padding - (grouped[week][health] / max) * (height - padding * 2),
      value: grouped[week][health],
    }));

  const smoothPath = (points) => {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    return points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;

      const previous = points[index - 1];
      const controlOffset = (point.x - previous.x) * 0.5;
      return `${path} C ${previous.x + controlOffset} ${previous.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`;
    }, "");
  };

  const areaPath = (points) => {
    if (!points.length) return "";
    const baseline = height - padding;
    return `${smoothPath(points)} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
  };

  if (!weeks.length) {
    els.healthTrend.innerHTML = `
      <text x="320" y="130" fill="#667085" font-size="18" text-anchor="middle" font-weight="700">No weekly updates</text>
    `;
    return;
  }

  els.healthTrend.innerHTML = `
    <defs>
      ${series
        .map(
          (health) => `
            <linearGradient id="healthGradient${health}" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="${colors[health]}" stop-opacity="0.18" />
              <stop offset="100%" stop-color="${colors[health]}" stop-opacity="0.02" />
            </linearGradient>
          `,
        )
        .join("")}
    </defs>
    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#d9e1ea" stroke-width="1.4" stroke-linecap="round" />
    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#d9e1ea" stroke-width="1.4" stroke-linecap="round" />
    ${[0.25, 0.5, 0.75]
      .map((ratio) => {
        const y = padding + ratio * (height - padding * 2);
        return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#eef3f8" stroke-width="1" />`;
      })
      .join("")}
    ${series
      .map(
        (health) => {
          const points = chartPoints(health);
          return `
          <path d="${areaPath(points)}" fill="url(#healthGradient${health})" />
          <path d="${smoothPath(points)}" fill="none" stroke="${colors[health]}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
          ${points
            .map(
              (point) => `
                <circle cx="${point.x}" cy="${point.y}" r="4.5" fill="#fff" stroke="${colors[health]}" stroke-width="2.5">
                  <title>${health}: ${point.value}</title>
                </circle>
              `,
            )
            .join("")}
        `;
        },
      )
      .join("")}
    ${weeks
      .map((week, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(weeks.length - 1, 1);
        const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
          new Date(Math.round((number(week) - 25569) * 86400 * 1000)),
        );
        return `<text x="${x}" y="${height - 8}" fill="#667085" font-size="12" text-anchor="middle">${label}</text>`;
      })
      .join("")}
  `;
}

function renderActivity() {
  const rows = filteredActivities()
    .slice()
    .sort((a, b) => number(b.Timestamp) - number(a.Timestamp))
    .slice(0, 12);

  if (!rows.length) {
    els.activityFeed.innerHTML = `<div class="empty-state">No matching activity</div>`;
    return;
  }

  els.activityFeed.innerHTML = rows
    .map(
      (activity) => `
        <div class="activity-item">
          <span class="activity-dot" style="background:${colors[text(activity.Impact)] || "#16837a"}"></span>
          <div class="activity-body">
            <span class="activity-title">${escapeHtml(text(activity["Activity Type"]) || "Activity")}</span>
            <div class="activity-sub">${escapeHtml(text(activity.Project))} - ${escapeHtml(text(activity.Employee))}</div>
          </div>
          <span class="activity-meta">${excelDate(activity.Timestamp, true)}</span>
        </div>
      `,
    )
    .join("");
}

function renderEmployees() {
  const rows = filteredEmployees().sort((a, b) =>
    text(a["Employee Name"]).localeCompare(text(b["Employee Name"])),
  );
  const active = rows.filter((employee) => text(employee["Employment Status"]) === "Active").length;
  const contractor = rows.filter((employee) => text(employee["Employment Status"]) === "Contractor").length;
  const onLeave = rows.filter((employee) => text(employee["Employment Status"]) === "On Leave").length;
  const unassigned = rows.filter((employee) => !text(employee["Employment Status"])).length;
  const pageSize =
    state.employeePageSize === "all" ? Math.max(rows.length, 1) : Number(state.employeePageSize);
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);

  if (state.employeePage > totalPages) state.employeePage = totalPages;

  const start = (state.employeePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  els.employeeCount.textContent = `${rows.length} of ${employees.length} employees`;
  els.employeeSummary.innerHTML = [
    ["Visible", rows.length],
    ["Active", active],
    ["Contractor", contractor],
    ["On Leave", onLeave],
    ["Unassigned", unassigned],
  ]
    .map(
      ([label, value]) => `
        <div class="employee-summary-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");

  if (!rows.length) {
    els.employeeTable.innerHTML = `
      <tr>
        <td colspan="10">No matching employees</td>
      </tr>
    `;
    els.employeePageInfo.textContent = "0 rows";
    els.employeePrev.disabled = true;
    els.employeeNext.disabled = true;
    return;
  }

  els.employeeTable.innerHTML = pageRows
    .map((employee) => {
      const status = text(employee["Employment Status"]) || "Unassigned";
      const employeeId = text(employee["Employee ID"]);
      const employeeName = text(employee["Employee Name"]);
      return `
        <tr class="employee-row" tabindex="0" data-employee-id="${escapeHtml(employeeId)}" aria-label="Open details for ${escapeHtml(employeeName)}">
          <td><strong>${escapeHtml(employeeId)}</strong></td>
          <td>${escapeHtml(employeeName)}</td>
          <td><a href="mailto:${escapeHtml(text(employee.Email))}">${escapeHtml(text(employee.Email))}</a></td>
          <td>${escapeHtml(text(employee.Department))}</td>
          <td>${escapeHtml(text(employee["Job Title"]))}</td>
          <td>${escapeHtml(text(employee.Level))}</td>
          <td>${escapeHtml(text(employee.Manager))}</td>
          <td>${escapeHtml(text(employee.Location) || "Unassigned")}</td>
          <td>${escapeHtml(excelDate(employee["Hire Date"]))}</td>
          <td><span class="pill" style="background:${colors[status] || (status === "Unassigned" ? "#667085" : "#16837a")}">${escapeHtml(status)}</span></td>
        </tr>
      `;
    })
    .join("");

  const end = Math.min(start + pageRows.length, rows.length);
  els.employeePageInfo.textContent = `${start + 1}-${end} of ${rows.length}`;
  els.employeePrev.disabled = state.employeePage <= 1;
  els.employeeNext.disabled = state.employeePage >= totalPages;
}

function renderEmployeeDetails(employee) {
  const status = text(employee["Employment Status"]) || "Unassigned";
  const related = employeeRelatedRows(employee);
  const completedTasks = related.assignedTasks.filter((task) => text(task.Status) === "Completed").length;
  const openTasks = related.assignedTasks.length - completedTasks;
  const blockedTasks = related.assignedTasks.filter((task) => text(task.Status) === "Blocked").length;
  const recentActivities = related.activities
    .slice()
    .sort((a, b) => number(b.Timestamp) - number(a.Timestamp));
  const upcomingTasks = related.assignedTasks
    .slice()
    .sort((a, b) => number(a["Due Date"]) - number(b["Due Date"]));
  const meetingsByDate = related.organizedMeetings
    .slice()
    .sort((a, b) => number(b["Date/Time"]) - number(a["Date/Time"]));

  els.employeeDetailTitle.textContent = text(employee["Employee Name"]) || "Employee Details";
  els.employeeDetailBody.innerHTML = `
    <section class="employee-detail-hero">
      <div class="employee-detail-avatar" aria-hidden="true">${escapeHtml((text(employee["Employee Name"]) || "?").charAt(0))}</div>
      <div>
        <h3>${escapeHtml(text(employee["Employee Name"]) || "Unnamed Employee")}</h3>
        <p>${escapeHtml(text(employee["Job Title"]) || "Unassigned role")} - ${escapeHtml(text(employee.Department) || "Unassigned department")}</p>
        <span class="pill" style="background:${colors[status] || (status === "Unassigned" ? "#667085" : "#16837a")}">${escapeHtml(status)}</span>
      </div>
    </section>

    <section class="employee-detail-grid" aria-label="Employee profile">
      ${detailValue("Employee ID", employee["Employee ID"])}
      ${detailValue("Email", employee.Email)}
      ${detailValue("Level", employee.Level)}
      ${detailValue("Manager", employee.Manager)}
      ${detailValue("Location", employee.Location)}
      ${detailValue("Hire Date", excelDate(employee["Hire Date"]))}
      ${detailValue("Department ID", employee["Department ID"])}
      ${detailValue("Department Director", related.department?.Director)}
    </section>

    <section class="employee-detail-stats" aria-label="Employee related records">
      ${detailStat("Owned Projects", related.ownedProjects.length)}
      ${detailStat("Assigned Tasks", related.assignedTasks.length)}
      ${detailStat("Open Tasks", openTasks)}
      ${detailStat("Blocked", blockedTasks)}
      ${detailStat("Meetings", related.organizedMeetings.length)}
      ${detailStat("Activity", related.activities.length)}
    </section>

    ${employeeDetailList(
      "Owned Projects",
      related.ownedProjects,
      "No owned projects in the workbook.",
      (project) => `
        <article class="employee-detail-item">
          <div>
            <strong>${escapeHtml(text(project["Project Name"]))}</strong>
            <span>${escapeHtml(text(project.Department))} - ${escapeHtml(percent(project["Progress %"]))} complete</span>
          </div>
          <span class="pill" style="background:${colors[text(project.Status)] || "#667085"}">${escapeHtml(text(project.Status))}</span>
        </article>
      `,
    )}

    ${employeeDetailList(
      "Assigned Tasks",
      upcomingTasks.slice(0, 8),
      "No assigned tasks in the workbook.",
      (task) => `
        <article class="employee-detail-item">
          <div>
            <strong>${escapeHtml(text(task["Task Name"]))}</strong>
            <span>${escapeHtml(text(task.Project))} - Due ${escapeHtml(excelDate(task["Due Date"]) || "not set")}</span>
          </div>
          <span class="pill" style="background:${colors[text(task.Status)] || "#667085"}">${escapeHtml(text(task.Status))}</span>
        </article>
      `,
    )}

    ${employeeDetailList(
      "Direct Reports",
      related.directReports.slice(0, 8),
      "No direct reports in the workbook.",
      (report) => `
        <article class="employee-detail-item">
          <div>
            <strong>${escapeHtml(text(report["Employee Name"]))}</strong>
            <span>${escapeHtml(text(report["Job Title"]))} - ${escapeHtml(text(report.Location) || "Unassigned")}</span>
          </div>
          <span class="pill" style="background:${colors[text(report["Employment Status"])] || "#667085"}">${escapeHtml(text(report["Employment Status"]) || "Unassigned")}</span>
        </article>
      `,
    )}

    ${employeeDetailList(
      "Recent Activity",
      recentActivities.slice(0, 8),
      "No activity records in the workbook.",
      (activity) => `
        <article class="employee-detail-item">
          <div>
            <strong>${escapeHtml(text(activity["Activity Type"]))}</strong>
            <span>${escapeHtml(text(activity.Project))} - ${escapeHtml(excelDate(activity.Timestamp, true))}</span>
          </div>
          <span class="pill" style="background:${colors[text(activity.Impact)] || "#667085"}">${escapeHtml(text(activity.Impact))}</span>
        </article>
      `,
    )}

    ${employeeDetailList(
      "Organized Meetings",
      meetingsByDate.slice(0, 6),
      "No organized meetings in the workbook.",
      (meeting) => `
        <article class="employee-detail-item">
          <div>
            <strong>${escapeHtml(text(meeting["Meeting Type"]))}</strong>
            <span>${escapeHtml(text(meeting.Project))} - ${escapeHtml(excelDate(meeting["Date/Time"], true))}</span>
          </div>
          <span>${escapeHtml(text(meeting["Location/Channel"]) || "Unassigned")}</span>
        </article>
      `,
    )}
  `;
}

function openEmployeeDetails(employeeId) {
  const employee = employeeById(employeeId);
  if (!employee) return;

  renderEmployeeDetails(employee);
  els.employeeDetailDrawer.classList.add("open");
  els.employeeDetailDrawer.setAttribute("aria-hidden", "false");
  els.employeeDetailScrim.hidden = false;
  requestAnimationFrame(() => els.employeeDetailScrim.classList.add("open"));
  els.closeEmployeeDetail.focus();
}

function closeEmployeeDetails() {
  els.employeeDetailDrawer.classList.remove("open");
  els.employeeDetailDrawer.setAttribute("aria-hidden", "true");
  els.employeeDetailScrim.classList.remove("open");
  window.setTimeout(() => {
    if (!els.employeeDetailScrim.classList.contains("open")) {
      els.employeeDetailScrim.hidden = true;
    }
  }, 180);
}

function handleEmployeeTableClick(event) {
  if (event.target.closest("a, button")) return;

  const row = event.target.closest("[data-employee-id]");
  if (row) {
    openEmployeeDetails(row.dataset.employeeId);
  }
}

function handleEmployeeTableKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest("a, button")) return;

  const row = event.target.closest("[data-employee-id]");
  if (!row) return;

  event.preventDefault();
  openEmployeeDetails(row.dataset.employeeId);
}

function renderTable() {
  const rows = filteredProjects().sort((a, b) => number(b["Progress %"]) - number(a["Progress %"]));
  els.tableCount.textContent = `${rows.length} rows`;
  if (!rows.length) {
    els.projectTable.innerHTML = `
      <tr>
        <td colspan="8">No matching projects</td>
      </tr>
    `;
    return;
  }
  els.projectTable.innerHTML = rows
    .map((project) => {
      const progress = number(project["Progress %"]);
      return `
        <tr>
          <td><strong>${escapeHtml(text(project["Project Name"]))}</strong></td>
          <td>${escapeHtml(text(project.Department))}</td>
          <td>${escapeHtml(text(project.Owner))}</td>
          <td><span class="pill" style="background:${colors[text(project.Status)] || "#667085"}">${escapeHtml(text(project.Status))}</span></td>
          <td><span class="pill" style="background:${colors[text(project["Risk Level"])] || "#667085"}">${escapeHtml(text(project["Risk Level"]))}</span></td>
          <td class="progress-cell">
            ${progress}%
            <div class="bar-track"><div class="bar-fill" style="width:${progress}%; background:${progress >= 80 ? colors.Green : progress >= 45 ? colors.Medium : colors["In Review"]}"></div></div>
          </td>
          <td>${currency(number(project["Budget SAR"]))}</td>
          <td>${currency(number(project["Actual Spend SAR"]))}</td>
        </tr>
      `;
    })
    .join("");
}

function downloadCsv(filename, headers, rows) {
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] || "").replaceAll('"', '""')}"`)
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportEmployeeCsv() {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Email",
    "Department ID",
    "Department",
    "Job Title",
    "Level",
    "Manager",
    "Location",
    "Hire Date",
    "Employment Status",
  ];
  downloadCsv("employees_export.csv", headers, filteredEmployees());
}

function fillBasicSelect(select, values, placeholder = "") {
  select.innerHTML = [
    placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : "",
    ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`),
  ].join("");
}

function setAddEmployeeMessage(message, type = "") {
  els.addEmployeeMessage.textContent = message;
  els.addEmployeeMessage.className = `employee-add-message ${type}`.trim();
}

function populateAddEmployeeForm() {
  const emails = signedUpEmployeeEmails();
  fillBasicSelect(els.addEmployeeEmail, emails, emails.length ? "Choose signed-up Gmail" : "No signed-up Gmail available");
  fillBasicSelect(els.addEmployeeDepartment, unique(departments, "Department Name"), "Choose department");
  fillBasicSelect(els.addEmployeeLocation, uniqueWithFallback(employees, "Location"), "Choose location");
  els.addEmployeeEmail.disabled = emails.length === 0;
  els.addEmployeeForm.querySelector("button[type='submit']").disabled = emails.length === 0;
  els.addEmployeeName.value = emails.length ? nameFromEmail(emails[0]) : "";
  setAddEmployeeMessage(
    emails.length
      ? "Only Gmail accounts created on the sign-up page can be added here."
      : "No signed-up Gmail accounts are available to add.",
    emails.length ? "" : "error",
  );
}

function openAddEmployeePanel() {
  populateAddEmployeeForm();
  els.addEmployeePanel.hidden = false;
  els.addEmployeeEmail.focus();
}

function closeAddEmployeePanel() {
  els.addEmployeePanel.hidden = true;
  els.addEmployeeForm.reset();
  setAddEmployeeMessage("");
  els.openAddEmployee.focus();
}

function openAdminPasswordModal() {
  els.adminPasswordForm.reset();
  els.adminPasswordMessage.textContent = "";
  els.adminPasswordModal.classList.add("open");
  els.adminPasswordModal.setAttribute("aria-hidden", "false");
  els.adminPasswordScrim.hidden = false;
  requestAnimationFrame(() => els.adminPasswordScrim.classList.add("open"));
  els.adminPasswordInput.focus();
}

function closeAdminPasswordModal() {
  els.adminPasswordModal.classList.remove("open");
  els.adminPasswordModal.setAttribute("aria-hidden", "true");
  els.adminPasswordScrim.classList.remove("open");
  window.setTimeout(() => {
    if (!els.adminPasswordScrim.classList.contains("open")) {
      els.adminPasswordScrim.hidden = true;
    }
  }, 180);
  els.adminButton.focus();
}

function submitAdminPassword(event) {
  event.preventDefault();
  if (els.adminPasswordInput.value !== "password") {
    els.adminPasswordMessage.textContent = "Incorrect password.";
    els.adminPasswordInput.select();
    return;
  }

  window.sessionStorage.setItem(
    adminSessionKey,
    JSON.stringify({
      ok: true,
      signedInAt: new Date().toISOString(),
    }),
  );
  window.location.href = "admin.html";
}

async function submitAddEmployee(event) {
  event.preventDefault();
  const form = new FormData(els.addEmployeeForm);
  const payload = Object.fromEntries(form.entries());
  const submit = els.addEmployeeForm.querySelector("button[type='submit']");

  if (!payload.email) {
    setAddEmployeeMessage("Choose a signed-up Gmail account first.", "error");
    return;
  }

  submit.disabled = true;
  setAddEmployeeMessage("Adding employee to sample_data.xlsx...");

  try {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not add employee.");
    }

    employees.push(result.employee);
    removeUsedAccounts();
    state.employeePage = 1;
    fillSelect(
      els.employeeStatusFilter,
      uniqueWithFallback(employees, "Employment Status"),
      state.employeeStatus,
    );
    fillSelect(
      els.employeeLocationFilter,
      uniqueWithFallback(employees, "Location"),
      state.employeeLocation,
    );
    render();
    setAddEmployeeMessage(`${result.employee["Employee Name"]} was added to sample_data.xlsx and the dashboard.`, "success");
    window.setTimeout(closeAddEmployeePanel, 900);
  } catch (error) {
    setAddEmployeeMessage(error.message, "error");
    submit.disabled = false;
  }
}

function progressPageUrl() {
  const params = new URLSearchParams();
  if (state.department !== "All") params.set("department", state.department);
  if (state.risk !== "All") params.set("risk", state.risk);
  if (state.search) params.set("search", state.search);

  const query = params.toString();
  return `progress.html${query ? `?${query}` : ""}`;
}

function statusPageUrl(status, type = "project") {
  const params = new URLSearchParams();
  params.set("status", status);
  params.set("type", type);
  if (state.department !== "All") params.set("department", state.department);
  if (state.risk !== "All") params.set("risk", state.risk);
  if (state.search) params.set("search", state.search);

  return `status.html?${params.toString()}`;
}

function drawerProjectRows() {
  return projects.filter((project) => {
    const departmentOk = departmentMatches(project);
    const riskOk = state.risk === "All" || text(project["Risk Level"]) === state.risk;
    const searchOk = includesSearch(project, [
      "Project Name",
      "Department",
      "Owner",
      "Status",
      "Strategic Theme",
    ]);
    return departmentOk && riskOk && searchOk;
  });
}

function drawerTaskRows() {
  const scopedProjects = drawerProjectRows();
  const projectIds = new Set(scopedProjects.map((project) => project["Project ID"]));
  const hasProjectScope = state.risk !== "All" || state.search !== "";

  return tasks.filter((task) => {
    const departmentOk = departmentMatches(task);
    const projectOk = !hasProjectScope || projectIds.has(task["Project ID"]);
    const searchOk =
      !state.search ||
      includesSearch(task, ["Task Name", "Project", "Assigned To", "Department"]) ||
      projectIds.has(task["Project ID"]);
    return departmentOk && projectOk && searchOk;
  });
}

function statusDrawerItems() {
  const rows = drawerProjectRows();
  const taskRows = drawerTaskRows();
  const averageProgress = rows.length
    ? Math.round(rows.reduce((sum, project) => sum + number(project["Progress %"]), 0) / rows.length)
    : 0;
  const statusCounts = byCount(rows, "Status");
  const taskStatusCounts = byCount(taskRows, "Status");

  return [
    {
      label: "Progress",
      value: `${averageProgress}%`,
      detail: "Average project progress",
      color: colors["In Progress"],
      percent: averageProgress,
      action: "progress",
    },
    {
      label: "At Risk",
      value: statusCounts["At Risk"] || 0,
      detail: "Projects needing attention",
      color: colors["At Risk"],
      percent: rows.length ? ((statusCounts["At Risk"] || 0) / rows.length) * 100 : 0,
      action: "status",
      status: "At Risk",
    },
    {
      label: "Completed",
      value: statusCounts.Completed || 0,
      detail: "Finished projects",
      color: colors.Completed,
      percent: rows.length ? ((statusCounts.Completed || 0) / rows.length) * 100 : 0,
      action: "status",
      status: "Completed",
    },
    {
      label: "Planning",
      value: statusCounts.Planning || 0,
      detail: "Projects in planning",
      color: colors.Planning,
      percent: rows.length ? ((statusCounts.Planning || 0) / rows.length) * 100 : 0,
      action: "status",
      status: "Planning",
    },
    {
      label: "On Hold",
      value: statusCounts["On Hold"] || 0,
      detail: "Paused projects",
      color: colors["On Hold"],
      percent: rows.length ? ((statusCounts["On Hold"] || 0) / rows.length) * 100 : 0,
      action: "status",
      status: "On Hold",
    },
    {
      label: "Not Started",
      value: statusCounts["Not Started"] || 0,
      detail: "Projects not started",
      color: colors["Not Started"],
      percent: rows.length ? ((statusCounts["Not Started"] || 0) / rows.length) * 100 : 0,
      action: "status",
      status: "Not Started",
    },
    {
      label: "In Review",
      value: taskStatusCounts["In Review"] || 0,
      detail: "Tasks currently in review",
      color: colors["In Review"],
      percent: taskRows.length ? ((taskStatusCounts["In Review"] || 0) / taskRows.length) * 100 : 0,
      action: "status",
      status: "In Review",
      type: "task",
    },
    {
      label: "Backlog",
      value: taskStatusCounts.Backlog || 0,
      detail: "Tasks waiting in backlog",
      color: colors.Backlog,
      percent: taskRows.length ? ((taskStatusCounts.Backlog || 0) / taskRows.length) * 100 : 0,
      action: "status",
      status: "Backlog",
      type: "task",
    },
    {
      label: "Blocked",
      value: taskStatusCounts.Blocked || 0,
      detail: "Tasks currently blocked",
      color: colors.Blocked,
      percent: taskRows.length ? ((taskStatusCounts.Blocked || 0) / taskRows.length) * 100 : 0,
      action: "status",
      status: "Blocked",
      type: "task",
    },
  ];
}

function renderStatusDrawer() {
  const total = drawerProjectRows().length;
  els.statusDrawerBody.innerHTML = `
    <div class="status-drawer-summary">
      <span>Filtered Projects</span>
      <strong>${total}</strong>
    </div>
    <div class="status-drawer-list">
      ${statusDrawerItems()
        .map(
          (item) => {
            const tag = item.action ? "button" : "article";
            const attributes =
              item.action === "progress"
                ? `type="button" data-status-action="progress" aria-label="Open progress page"`
                : item.action === "status"
                  ? `type="button" data-status-action="status" data-status="${escapeHtml(item.status)}" data-status-type="${escapeHtml(item.type || "project")}" aria-label="Open ${escapeHtml(item.label)} page"`
                  : "";
            return `
            <${tag} class="status-drawer-card${item.action ? " status-drawer-card--button" : ""}" ${attributes}>
              <div class="status-drawer-card__top">
                <span class="status-dot" style="background:${item.color}"></span>
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.value)}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${item.percent > 0 ? Math.max(2, Math.min(100, item.percent)) : 0}%; background:${item.color}"></div>
              </div>
              <p>${escapeHtml(item.detail)}</p>
            </${tag}>
          `;
          },
        )
        .join("")}
    </div>
  `;
}

function openStatusDrawer() {
  renderStatusDrawer();
  els.statusDrawer.classList.add("open");
  els.statusDrawer.setAttribute("aria-hidden", "false");
  els.sheetScrim.hidden = false;
  requestAnimationFrame(() => els.sheetScrim.classList.add("open"));
  els.sheetPullTab.classList.add("open");
  els.sheetPullTab.setAttribute("aria-expanded", "true");
  els.sheetPullTab.querySelector("span").textContent = "<";
  els.closeStatusDrawer.focus();
}

function closeStatusDrawer() {
  els.statusDrawer.classList.remove("open");
  els.statusDrawer.setAttribute("aria-hidden", "true");
  els.sheetScrim.classList.remove("open");
  els.sheetPullTab.classList.remove("open");
  els.sheetPullTab.setAttribute("aria-expanded", "false");
  els.sheetPullTab.querySelector("span").textContent = ">";
  window.setTimeout(() => {
    if (!els.sheetScrim.classList.contains("open")) {
      els.sheetScrim.hidden = true;
    }
  }, 180);
  els.sheetPullTab.focus();
}

function toggleStatusDrawer() {
  if (els.statusDrawer.classList.contains("open")) {
    closeStatusDrawer();
  } else {
    openStatusDrawer();
  }
}

function handleStatusDrawerAction(event) {
  const control = event.target.closest("[data-status-action]");
  if (!control) return;

  if (control.dataset.statusAction === "progress") {
    window.location.href = progressPageUrl();
    return;
  }

  if (control.dataset.statusAction === "status") {
    window.location.href = statusPageUrl(control.dataset.status, control.dataset.statusType || "project");
  }
}

let statusDrawerDragStart = null;
let statusDrawerDragged = false;

function startStatusDrawerDrag(event) {
  statusDrawerDragStart = event.clientX;
  statusDrawerDragged = false;
  els.sheetPullTab.setPointerCapture?.(event.pointerId);
}

function moveStatusDrawerDrag(event) {
  if (statusDrawerDragStart === null) return;

  const delta = event.clientX - statusDrawerDragStart;
  if (Math.abs(delta) > 8) statusDrawerDragged = true;
  if (delta > 46 && !els.statusDrawer.classList.contains("open")) {
    openStatusDrawer();
  }
  if (delta < -46 && els.statusDrawer.classList.contains("open")) {
    closeStatusDrawer();
  }
}

function endStatusDrawerDrag() {
  statusDrawerDragStart = null;
  window.setTimeout(() => {
    statusDrawerDragged = false;
  }, 0);
}

function handleStatusDrawerTabClick(event) {
  if (statusDrawerDragged) {
    event.preventDefault();
    return;
  }
  toggleStatusDrawer();
}

function logout() {
  window.localStorage.removeItem(authSessionKey);
  document.documentElement.classList.remove("has-auth-session");
  window.location.href = "signup.html";
}

function render() {
  renderMetrics();
  renderDonut();
  renderTaskFlow();
  renderRiskPriority();
  renderDepartmentLoad();
  renderBudgets();
  renderHealthTrend();
  renderActivity();
  renderEmployees();
  renderTable();
  if (els.statusDrawer.classList.contains("open")) {
    renderStatusDrawer();
  }
}

function init() {
  const session = authSession();
  if (els.authStatus && session) {
    els.accountBlock.hidden = false;
    els.authStatus.textContent = session?.employeeName
      ? `Signed in as ${session.employeeName}`
      : session?.email
        ? `Signed in as ${session.email}`
        : "";
  } else if (els.accountBlock) {
    els.accountBlock.hidden = true;
  }

  fillSelect(els.departmentFilter, unique(departments, "Department Name"), state.department);
  fillSelect(els.statusFilter, unique(projects, "Status"), state.status);
  fillSelect(els.riskFilter, unique(projects, "Risk Level"), state.risk);
  fillSelect(
    els.employeeStatusFilter,
    uniqueWithFallback(employees, "Employment Status"),
    state.employeeStatus,
  );
  fillSelect(
    els.employeeLocationFilter,
    uniqueWithFallback(employees, "Location"),
    state.employeeLocation,
  );

  els.refreshDate.textContent = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  els.departmentFilter.addEventListener("change", (event) => {
    state.department = event.target.value;
    state.employeePage = 1;
    render();
  });
  els.statusFilter.addEventListener("change", (event) => {
    state.status = event.target.value;
    render();
  });
  els.riskFilter.addEventListener("change", (event) => {
    state.risk = event.target.value;
    render();
  });
  els.searchFilter.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    state.employeePage = 1;
    render();
  });
  els.resetFilters.addEventListener("click", () => {
    state.department = "All";
    state.status = "All";
    state.risk = "All";
    state.search = "";
    state.employeeSearch = "";
    state.employeeStatus = "All";
    state.employeeLocation = "All";
    state.employeePage = 1;
    els.departmentFilter.value = "All";
    els.statusFilter.value = "All";
    els.riskFilter.value = "All";
    els.searchFilter.value = "";
    els.employeeSearch.value = "";
    els.employeeStatusFilter.value = "All";
    els.employeeLocationFilter.value = "All";
    render();
  });
  els.sheetPullTab.addEventListener("click", handleStatusDrawerTabClick);
  els.sheetPullTab.addEventListener("pointerdown", startStatusDrawerDrag);
  els.sheetPullTab.addEventListener("pointermove", moveStatusDrawerDrag);
  els.sheetPullTab.addEventListener("pointerup", endStatusDrawerDrag);
  els.sheetPullTab.addEventListener("pointercancel", endStatusDrawerDrag);
  els.closeStatusDrawer.addEventListener("click", closeStatusDrawer);
  els.sheetScrim.addEventListener("click", closeStatusDrawer);
  els.statusDrawerBody.addEventListener("click", handleStatusDrawerAction);
  els.adminButton.addEventListener("click", openAdminPasswordModal);
  els.adminPasswordForm.addEventListener("submit", submitAdminPassword);
  els.closeAdminPassword.addEventListener("click", closeAdminPasswordModal);
  els.cancelAdminPassword.addEventListener("click", closeAdminPasswordModal);
  els.adminPasswordScrim.addEventListener("click", closeAdminPasswordModal);
  els.logoutButton.addEventListener("click", logout);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.adminPasswordModal.classList.contains("open")) {
      closeAdminPasswordModal();
      return;
    }
    if (event.key === "Escape" && els.employeeDetailDrawer.classList.contains("open")) {
      closeEmployeeDetails();
      return;
    }
    if (event.key === "Escape" && els.statusDrawer.classList.contains("open")) {
      closeStatusDrawer();
    }
  });
  els.employeeTable.addEventListener("click", handleEmployeeTableClick);
  els.employeeTable.addEventListener("keydown", handleEmployeeTableKeydown);
  els.closeEmployeeDetail.addEventListener("click", closeEmployeeDetails);
  els.employeeDetailScrim.addEventListener("click", closeEmployeeDetails);
  els.openAddEmployee.addEventListener("click", openAddEmployeePanel);
  els.closeAddEmployee.addEventListener("click", closeAddEmployeePanel);
  els.cancelAddEmployee.addEventListener("click", closeAddEmployeePanel);
  els.addEmployeeEmail.addEventListener("change", (event) => {
    if (!els.addEmployeeName.value.trim()) {
      els.addEmployeeName.value = nameFromEmail(event.target.value);
    }
  });
  els.addEmployeeForm.addEventListener("submit", submitAddEmployee);
  els.employeeSearch.addEventListener("input", (event) => {
    state.employeeSearch = event.target.value.trim();
    state.employeePage = 1;
    render();
  });
  els.employeeStatusFilter.addEventListener("change", (event) => {
    state.employeeStatus = event.target.value;
    state.employeePage = 1;
    render();
  });
  els.employeeLocationFilter.addEventListener("change", (event) => {
    state.employeeLocation = event.target.value;
    state.employeePage = 1;
    render();
  });
  els.employeePageSize.addEventListener("change", (event) => {
    state.employeePageSize = event.target.value === "all" ? "all" : Number(event.target.value);
    state.employeePage = 1;
    renderEmployees();
  });
  els.employeePrev.addEventListener("click", () => {
    state.employeePage = Math.max(state.employeePage - 1, 1);
    renderEmployees();
  });
  els.employeeNext.addEventListener("click", () => {
    state.employeePage += 1;
    renderEmployees();
  });

  render();
}

init();
