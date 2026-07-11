const data = window.DASHBOARD_DATA || {};

const departments = data.Departments || [];
const employees = data.Employees || [];
const projects = data.Projects || [];
const tasks = data.Tasks || [];
const meetings = data.Meetings || [];
const updates = data["Weekly Updates"] || [];
const activities = data["Activity Log"] || [];
const authSessionKey = "dashboardAuthSession";
const adminSessionKey = "dashboardAdminSession";
const accountStorageKey = "dashboardAuthAccounts";

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

const taskStatuses = ["Backlog", "Not Started", "In Progress", "In Review", "Blocked", "Completed"];
const taskPriorities = ["Low", "Medium", "High", "Critical"];
const statusPaths = {
  "At Risk": "/at-risk",
  Completed: "/completed",
  Planning: "/planning",
  "On Hold": "/on-hold",
  "Not Started": "/not-started",
  "In Review": "/in-review",
  Backlog: "/backlog",
  Blocked: "/blocked",
};
const adminStatusPaths = {
  "At Risk": "/at-risk2admins",
  Completed: "/completed2admins",
  Planning: "/planning2admins",
  "On Hold": "/on-hold2admins",
  "Not Started": "/not-started2admins",
  "In Review": "/in-review2admins",
  Backlog: "/backlog2admins",
  Blocked: "/blocked2admins",
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
  taskPage: 1,
  taskPageSize: 25,
};

const els = {
  authStatus: document.querySelector("#authStatus"),
  accountBlock: document.querySelector("#accountBlock"),
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
  openAddEmployee: document.querySelector("#openAddEmployee"),
  addEmployeePanel: document.querySelector("#addEmployeePanel"),
  addEmployeeForm: document.querySelector("#addEmployeeForm"),
  closeAddEmployee: document.querySelector("#closeAddEmployee"),
  cancelAddEmployee: document.querySelector("#cancelAddEmployee"),
  addEmployeeDepartment: document.querySelector("#addEmployeeDepartment"),
  addEmployeeLevel: document.querySelector("#addEmployeeLevel"),
  addEmployeeLocation: document.querySelector("#addEmployeeLocation"),
  addEmployeeStatus: document.querySelector("#addEmployeeStatus"),
  addEmployeeMessage: document.querySelector("#addEmployeeMessage"),
  employeeSearch: document.querySelector("#employeeSearch"),
  employeeStatusFilter: document.querySelector("#employeeStatusFilter"),
  employeeLocationFilter: document.querySelector("#employeeLocationFilter"),
  employeePageSize: document.querySelector("#employeePageSize"),
  employeeTable: document.querySelector("#employeeTable"),
  employeePrev: document.querySelector("#employeePrev"),
  employeeNext: document.querySelector("#employeeNext"),
  employeePageInfo: document.querySelector("#employeePageInfo"),
  openAddProject: document.querySelector("#openAddProject"),
  addProjectPanel: document.querySelector("#addProjectPanel"),
  addProjectForm: document.querySelector("#addProjectForm"),
  closeAddProject: document.querySelector("#closeAddProject"),
  cancelAddProject: document.querySelector("#cancelAddProject"),
  addProjectDepartment: document.querySelector("#addProjectDepartment"),
  addProjectOwner: document.querySelector("#addProjectOwner"),
  addProjectStatus: document.querySelector("#addProjectStatus"),
  addProjectPriority: document.querySelector("#addProjectPriority"),
  addProjectRisk: document.querySelector("#addProjectRisk"),
  addProjectMessage: document.querySelector("#addProjectMessage"),
  taskTableCount: document.querySelector("#taskTableCount"),
  openAddTask: document.querySelector("#openAddTask"),
  addTaskPanel: document.querySelector("#addTaskPanel"),
  addTaskForm: document.querySelector("#addTaskForm"),
  closeAddTask: document.querySelector("#closeAddTask"),
  cancelAddTask: document.querySelector("#cancelAddTask"),
  addTaskProject: document.querySelector("#addTaskProject"),
  addTaskAssignee: document.querySelector("#addTaskAssignee"),
  addTaskStatus: document.querySelector("#addTaskStatus"),
  addTaskPriority: document.querySelector("#addTaskPriority"),
  addTaskMessage: document.querySelector("#addTaskMessage"),
  taskPageSize: document.querySelector("#taskPageSize"),
  taskTable: document.querySelector("#taskTable"),
  taskPrev: document.querySelector("#taskPrev"),
  taskNext: document.querySelector("#taskNext"),
  taskPageInfo: document.querySelector("#taskPageInfo"),
  tasksSection: document.querySelector("#tasksSection"),
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

function isAdminSession() {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(adminSessionKey) || "null");
    if (session?.ok && session?.token) return true;
  } catch (error) {
    // Fall back to the regular auth session below.
  }

  return false;
}

function isAdminDashboardRoute() {
  return window.location.pathname.includes("2admins");
}

function adminSession() {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(adminSessionKey) || "null");
    return session?.ok ? session : null;
  } catch (error) {
    return null;
  }
}

function adminRequestHeaders() {
  const session = adminSession();
  return {
    "Content-Type": "application/json",
    "X-Admin-Email": text(session?.email).toLowerCase(),
    "X-Admin-Token": text(session?.token),
  };
}

function storedAccounts() {
  try {
    const accounts = JSON.parse(window.localStorage.getItem(accountStorageKey) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch (error) {
    return [];
  }
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

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function renderEmployeeEditForm(employee) {
  if (!isAdminSession()) return "";

  const levels = ["Associate", "Specialist", "Senior Specialist", "Lead", "Manager", "Senior Manager"];
  const statuses = ["Active", "Contractor", "On Leave"];
  const locations = uniqueWithFallback(employees, "Location");
  const employeeId = text(employee["Employee ID"]);

  return `
    <section class="employee-detail-section employee-edit-section" id="employeeEditSection" hidden>
      <h3>Edit Employee</h3>
      <form class="employee-add-form employee-edit-form" data-employee-edit-form data-employee-id="${escapeHtml(employeeId)}">
        <div class="employee-add-grid">
          <label>
            <span>Email</span>
            <input name="email" type="email" value="${escapeHtml(text(employee.Email))}" required />
          </label>
          <label>
            <span>Employee Name</span>
            <input name="employeeName" type="text" value="${escapeHtml(text(employee["Employee Name"]))}" required />
          </label>
          <label>
            <span>Department</span>
            <select name="department" required>
              ${optionList(unique(departments, "Department Name"), employee.Department)}
            </select>
          </label>
          <label>
            <span>Job Title</span>
            <input name="jobTitle" type="text" value="${escapeHtml(text(employee["Job Title"]))}" required />
          </label>
          <label>
            <span>Level</span>
            <select name="level">${optionList(levels, employee.Level)}</select>
          </label>
          <label>
            <span>Manager</span>
            <input name="manager" type="text" value="${escapeHtml(text(employee.Manager))}" />
          </label>
          <label>
            <span>Location</span>
            <select name="location">${optionList(locations, employee.Location)}</select>
          </label>
          <label>
            <span>Status</span>
            <select name="employmentStatus">${optionList(statuses, employee["Employment Status"])}</select>
          </label>
        </div>
        <p class="employee-add-message" data-employee-edit-message></p>
        <div class="employee-add-actions">
          <button class="button button--ghost" type="button" data-cancel-employee-edit>Cancel</button>
          <button class="button" type="submit">Save Employee</button>
        </div>
      </form>
    </section>
  `;
}

function renderProjectEditForm(project) {
  if (!isAdminSession()) return "";

  const projectId = text(project["Project ID"]);
  const departmentOptions = unique(departments, "Department Name");
  const ownerOptions = employees
    .slice()
    .sort((a, b) => text(a["Employee Name"]).localeCompare(text(b["Employee Name"])))
    .map((employee) => ({
      value: text(employee["Employee ID"]),
      label: `${text(employee["Employee Name"])} (${text(employee.Department)})`,
    }));

  return `
    <tr class="project-edit-row" data-project-edit-row="${escapeHtml(projectId)}" hidden>
      <td colspan="9">
        <form class="employee-add-form project-edit-form" data-project-table-edit-form data-project-id="${escapeHtml(projectId)}">
          <div class="project-edit-grid">
            <label>
              <span>Project Name</span>
              <input name="projectName" type="text" value="${escapeHtml(text(project["Project Name"]))}" required />
            </label>
            <label>
              <span>Department</span>
              <select name="department" required>
                ${optionList(departmentOptions, project.Department)}
              </select>
            </label>
            <label>
              <span>Owner</span>
              <select name="ownerId" required>
                ${optionPairs(ownerOptions, project["Owner ID"])}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select name="status">${optionList(["Not Started", "Planning", "In Progress", "At Risk", "On Hold", "Completed"], project.Status)}</select>
            </label>
            <label>
              <span>Priority</span>
              <select name="priority">${optionList(["Low", "Medium", "High", "Critical"], project.Priority)}</select>
            </label>
            <label>
              <span>Risk Level</span>
              <select name="risk">${optionList(["Low", "Medium", "High"], project["Risk Level"])}</select>
            </label>
            <label>
              <span>Start Date</span>
              <input name="startDate" type="date" value="${escapeHtml(excelDateInput(project["Start Date"]))}" required />
            </label>
            <label>
              <span>Target End Date</span>
              <input name="targetEndDate" type="date" value="${escapeHtml(excelDateInput(project["Target End Date"]))}" required />
            </label>
            <label>
              <span>Progress %</span>
              <input name="progress" type="number" min="0" max="100" step="1" value="${escapeHtml(Math.round(number(project["Progress %"])))}" />
            </label>
            <label>
              <span>Budget SAR</span>
              <input name="budget" type="number" min="0" step="0.01" value="${escapeHtml(text(project["Budget SAR"]))}" />
            </label>
            <label>
              <span>Actual Spend SAR</span>
              <input name="spend" type="number" min="0" step="0.01" value="${escapeHtml(text(project["Actual Spend SAR"]))}" />
            </label>
            <label>
              <span>Strategic Theme</span>
              <input name="strategicTheme" type="text" value="${escapeHtml(text(project["Strategic Theme"]))}" />
            </label>
          </div>
          <p class="employee-add-message project-edit-message" data-project-edit-message></p>
          <div class="employee-add-actions">
            <button class="button button--ghost" type="button" data-cancel-project-table-edit>Cancel</button>
            <button class="button" type="submit">Save Project</button>
          </div>
        </form>
      </td>
    </tr>
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

function renderTasks() {
  const rows = filteredTasks().sort((a, b) => {
    const dueDiff = number(a["Due Date"]) - number(b["Due Date"]);
    return dueDiff || text(a["Task ID"]).localeCompare(text(b["Task ID"]));
  });
  const pageSize = state.taskPageSize === "all" ? Math.max(rows.length, 1) : Number(state.taskPageSize);
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1);
  const canEdit = isAdminSession();

  if (state.taskPage > totalPages) state.taskPage = totalPages;

  const start = (state.taskPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  els.taskTableCount.textContent = `${rows.length} of ${tasks.length} tasks`;

  if (!rows.length) {
    els.taskTable.innerHTML = `
      <tr>
        <td colspan="11">No matching tasks</td>
      </tr>
    `;
    els.taskPageInfo.textContent = "0 rows";
    els.taskPrev.disabled = true;
    els.taskNext.disabled = true;
    return;
  }

  els.taskTable.innerHTML = pageRows
    .map((task) => {
      const taskId = text(task["Task ID"]);
      const status = text(task.Status) || "Unassigned";
      const priority = text(task.Priority) || "Unassigned";
      const progress = Math.round(number(task["Completion %"]));
      const actualHours = text(task["Actual Hours"]);
      const estimatedHours = text(task["Estimated Hours"]);
      return `
        <tr class="task-row" data-task-id="${escapeHtml(taskId)}">
          <td><strong>${escapeHtml(taskId)}</strong></td>
          <td>${escapeHtml(text(task["Task Name"]))}</td>
          <td>${escapeHtml(text(task.Project))}</td>
          <td>${escapeHtml(text(task["Assigned To"]) || "Unassigned")}</td>
          <td>${escapeHtml(text(task.Department))}</td>
          <td><span class="pill" style="background:${colors[status] || "#667085"}">${escapeHtml(status)}</span></td>
          <td>${escapeHtml(priority)}</td>
          <td>${escapeHtml(excelDate(task["Due Date"]) || "Not set")}</td>
          <td class="progress-cell">
            <strong>${progress}%</strong>
            <div class="bar-track"><div class="bar-fill" style="width:${progress}%; background:${colors[status] || "#16837a"}"></div></div>
          </td>
          <td>${escapeHtml(actualHours || "0")} / ${escapeHtml(estimatedHours || "0")}</td>
          <td>
            ${
              canEdit
                ? `<button class="button button--ghost task-table-edit" type="button" data-open-task-table-edit>Edit</button>`
                : `<span class="table-muted">View</span>`
            }
          </td>
        </tr>
        ${
          canEdit
            ? `
              <tr class="task-edit-row" data-task-edit-row="${escapeHtml(taskId)}" hidden>
                <td colspan="11">
                  <form class="task-table-edit-form" data-task-table-edit-form data-task-id="${escapeHtml(taskId)}">
                    <label>
                      <span>Task Name</span>
                      <input name="taskName" type="text" value="${escapeHtml(text(task["Task Name"]))}" required />
                    </label>
                    <label>
                      <span>Assigned To</span>
                      <input name="assignedTo" type="text" value="${escapeHtml(text(task["Assigned To"]))}" />
                    </label>
                    <label>
                      <span>Status</span>
                      <select name="status">${optionList(taskStatuses, status)}</select>
                    </label>
                    <label>
                      <span>Priority</span>
                      <select name="priority">${optionList(taskPriorities, priority)}</select>
                    </label>
                    <label>
                      <span>Due Date</span>
                      <input name="dueDate" type="date" value="${escapeHtml(excelDateInput(task["Due Date"]))}" />
                    </label>
                    <label>
                      <span>Estimated Hours</span>
                      <input name="estimatedHours" type="number" min="0" step="0.25" value="${escapeHtml(estimatedHours)}" />
                    </label>
                    <label>
                      <span>Actual Hours</span>
                      <input name="actualHours" type="number" min="0" step="0.25" value="${escapeHtml(actualHours)}" />
                    </label>
                    <label>
                      <span>Completion %</span>
                      <input name="completion" type="number" min="0" max="100" step="1" value="${escapeHtml(progress)}" />
                    </label>
                    <p class="task-edit-message" data-task-edit-message></p>
                    <div class="task-edit-actions">
                      <button class="button button--ghost" type="button" data-cancel-task-table-edit>Cancel</button>
                      <button class="button" type="submit">Save Task</button>
                    </div>
                  </form>
                </td>
              </tr>
            `
            : ""
        }
      `;
    })
    .join("");

  const end = Math.min(start + pageRows.length, rows.length);
  els.taskPageInfo.textContent = `${start + 1}-${end} of ${rows.length}`;
  els.taskPrev.disabled = state.taskPage <= 1;
  els.taskNext.disabled = state.taskPage >= totalPages;
}

function renderEmployeeDetails(employee) {
  const status = text(employee["Employment Status"]) || "Unassigned";
  const related = employeeRelatedRows(employee);
  const canEdit = isAdminSession();
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
      ${
        canEdit
          ? `<button class="button button--ghost employee-detail-edit-button" type="button" data-open-employee-edit>Edit</button>`
          : ""
      }
    </section>

    ${renderEmployeeEditForm(employee)}

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
  const canEdit = isAdminSession();
  els.tableCount.textContent = `${rows.length} rows`;
  if (!rows.length) {
    els.projectTable.innerHTML = `
      <tr>
        <td colspan="9">No matching projects</td>
      </tr>
    `;
    return;
  }
  els.projectTable.innerHTML = rows
    .map((project) => {
      const projectId = text(project["Project ID"]);
      const progress = number(project["Progress %"]);
      return `
        <tr class="project-row" data-project-id="${escapeHtml(projectId)}">
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
          <td>
            ${
              canEdit
                ? `<button class="button button--ghost project-table-edit" type="button" data-open-project-table-edit>Edit</button>`
                : `<span class="table-muted">View</span>`
            }
          </td>
        </tr>
        ${canEdit ? renderProjectEditForm(project) : ""}
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

function setEmployeeEditMessage(form, message, type = "") {
  const messageEl = form.querySelector("[data-employee-edit-message]");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `employee-add-message ${type}`.trim();
}

function setAddEmployeeMessage(message, type = "") {
  if (!els.addEmployeeMessage) return;
  els.addEmployeeMessage.textContent = message;
  els.addEmployeeMessage.className = `employee-add-message ${type}`.trim();
}

function populateAddEmployeeForm() {
  if (!els.addEmployeeForm) return;
  els.addEmployeeDepartment.innerHTML = [
    `<option value="" selected disabled>Choose department</option>`,
    ...unique(departments, "Department Name").map((department) => `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`),
  ].join("");

  els.addEmployeeLevel.innerHTML = optionList(
    ["Associate", "Specialist", "Senior Specialist", "Lead", "Manager", "Senior Manager"],
    "Associate",
  );
  els.addEmployeeLocation.innerHTML = optionList(uniqueWithFallback(employees, "Location"), "Remote");
  els.addEmployeeStatus.innerHTML = optionList(["Active", "Contractor", "On Leave"], "Active");
  els.addEmployeeForm.elements.manager.value = "Department PMO";
}

function openAddEmployeePanel() {
  if (!isAdminDashboardRoute() || !isAdminSession()) return;
  populateAddEmployeeForm();
  els.addEmployeePanel.hidden = false;
  setAddEmployeeMessage("");
  els.addEmployeeForm.elements.email.focus();
}

function closeAddEmployeePanel() {
  if (!els.addEmployeePanel) return;
  els.addEmployeePanel.hidden = true;
  els.addEmployeeForm.reset();
  setAddEmployeeMessage("");
  els.openAddEmployee?.focus();
}

async function submitAddEmployeeForm(event) {
  event.preventDefault();

  if (!isAdminSession()) {
    setAddEmployeeMessage("Admin access is required.", "error");
    return;
  }

  const payload = Object.fromEntries(new FormData(els.addEmployeeForm).entries());
  const submit = els.addEmployeeForm.querySelector("button[type='submit']");

  submit.disabled = true;
  setAddEmployeeMessage("Creating employee...");

  try {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: adminRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not create employee.");
    }

    employees.push(result.employee);
    state.employeePage = 1;
    render();
    setAddEmployeeMessage(`${result.employee["Employee Name"]} was added to the employee directory.`, "success");
    window.setTimeout(closeAddEmployeePanel, 800);
  } catch (error) {
    setAddEmployeeMessage(error.message, "error");
  } finally {
    submit.disabled = false;
  }
}

function setAddProjectMessage(message, type = "") {
  if (!els.addProjectMessage) return;
  els.addProjectMessage.textContent = message;
  els.addProjectMessage.className = `employee-add-message ${type}`.trim();
}

function populateAddProjectForm() {
  if (!els.addProjectForm) return;

  els.addProjectDepartment.innerHTML = [
    `<option value="" selected disabled>Choose department</option>`,
    ...unique(departments, "Department Name").map((department) => `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`),
  ].join("");
  els.addProjectOwner.innerHTML = [
    `<option value="" selected disabled>Choose owner</option>`,
    ...employees
      .slice()
      .sort((a, b) => text(a["Employee Name"]).localeCompare(text(b["Employee Name"])))
      .map(
        (employee) =>
          `<option value="${escapeHtml(text(employee["Employee ID"]))}">${escapeHtml(text(employee["Employee Name"]))} (${escapeHtml(text(employee.Department))})</option>`,
      ),
  ].join("");
  els.addProjectStatus.innerHTML = optionList(["Not Started", "Planning", "In Progress", "At Risk", "On Hold", "Completed"], "Planning");
  els.addProjectPriority.innerHTML = optionList(["Low", "Medium", "High", "Critical"], "Medium");
  els.addProjectRisk.innerHTML = optionList(["Low", "Medium", "High"], "Medium");
  els.addProjectForm.elements.startDate.value = todayInputValue();
}

function openAddProjectPanel() {
  if (!isAdminDashboardRoute() || !isAdminSession()) return;
  populateAddProjectForm();
  els.addProjectPanel.hidden = false;
  setAddProjectMessage("");
  els.addProjectForm.elements.projectName.focus();
}

function closeAddProjectPanel() {
  if (!els.addProjectPanel) return;
  els.addProjectPanel.hidden = true;
  els.addProjectForm.reset();
  setAddProjectMessage("");
  els.openAddProject?.focus();
}

async function submitAddProjectForm(event) {
  event.preventDefault();

  if (!isAdminSession()) {
    setAddProjectMessage("Admin access is required.", "error");
    return;
  }

  const payload = Object.fromEntries(new FormData(els.addProjectForm).entries());
  payload.startDate = dateInputToExcelSerial(payload.startDate);
  payload.targetEndDate = dateInputToExcelSerial(payload.targetEndDate);
  const submit = els.addProjectForm.querySelector("button[type='submit']");

  submit.disabled = true;
  setAddProjectMessage("Creating project...");

  try {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: adminRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not create project.");
    }

    projects.push(result.project);
    render();
    setAddProjectMessage(`${result.project["Project Name"]} was added to the portfolio table.`, "success");
    window.setTimeout(closeAddProjectPanel, 800);
  } catch (error) {
    setAddProjectMessage(error.message, "error");
  } finally {
    submit.disabled = false;
  }
}

function openEmployeeEditForm() {
  const section = document.querySelector("#employeeEditSection");
  if (!section) return;
  section.hidden = false;
  section.scrollIntoView({ block: "nearest", behavior: "smooth" });
  section.querySelector("input, select, button")?.focus({ preventScroll: true });
}

function closeEmployeeEditForm() {
  const section = document.querySelector("#employeeEditSection");
  if (!section) return;
  section.hidden = true;
}

async function submitEmployeeEditForm(event) {
  const form = event.target.closest("[data-employee-edit-form]");
  if (!form) return;
  event.preventDefault();

  if (!isAdminSession()) {
    setEmployeeEditMessage(form, "Admin access is required.", "error");
    return;
  }

  const employeeId = form.dataset.employeeId;
  const payload = Object.fromEntries(new FormData(form).entries());
  const submit = form.querySelector("button[type='submit']");

  submit.disabled = true;
  setEmployeeEditMessage(form, "Saving employee changes...");

  try {
    const response = await fetch(`/api/employees/${encodeURIComponent(employeeId)}`, {
      method: "PATCH",
      headers: adminRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not update employee.");
    }

    const index = employees.findIndex((employee) => text(employee["Employee ID"]) === text(employeeId));
    if (index >= 0) {
      employees[index] = result.employee;
    }
    render();
    renderEmployeeDetails(result.employee);
    const refreshedForm = document.querySelector("[data-employee-edit-form]");
    if (refreshedForm) {
      setEmployeeEditMessage(refreshedForm, "Employee changes saved.", "success");
    }
  } catch (error) {
    setEmployeeEditMessage(form, error.message, "error");
    submit.disabled = false;
  }
}

function handleEmployeeDetailAction(event) {
  if (event.target.closest("[data-open-employee-edit]")) {
    openEmployeeEditForm();
    return;
  }
  if (event.target.closest("[data-cancel-employee-edit]")) {
    closeEmployeeEditForm();
  }
}

function setTaskEditMessage(form, message, type = "") {
  const messageEl = form.querySelector("[data-task-edit-message]");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `task-edit-message ${type}`.trim();
}

function setAddTaskMessage(message, type = "") {
  els.addTaskMessage.textContent = message;
  els.addTaskMessage.className = `task-edit-message ${type}`.trim();
}

function populateAddTaskForm() {
  els.addTaskProject.innerHTML = optionPairs(
    projects
      .slice()
      .sort((a, b) => text(a["Project Name"]).localeCompare(text(b["Project Name"])))
      .map((project) => ({
        value: text(project["Project ID"]),
        label: `${text(project["Project Name"])} (${text(project["Project ID"])})`,
      })),
  );
  els.addTaskAssignee.innerHTML = optionPairs(
    employees
      .slice()
      .sort((a, b) => text(a["Employee Name"]).localeCompare(text(b["Employee Name"])))
      .map((employee) => ({
        value: text(employee["Employee ID"]),
        label: `${text(employee["Employee Name"])} (${text(employee.Department)})`,
      })),
  );
  els.addTaskStatus.innerHTML = optionList(taskStatuses, "Backlog");
  els.addTaskPriority.innerHTML = optionList(taskPriorities, "Medium");
  els.addTaskForm.elements.dueDate.value = todayInputValue();
}

function openAddTaskPanel() {
  if (!isAdminSession()) return;
  populateAddTaskForm();
  els.addTaskPanel.hidden = false;
  setAddTaskMessage("");
  els.addTaskForm.elements.taskName.focus();
}

function closeAddTaskPanel() {
  els.addTaskPanel.hidden = true;
  els.addTaskForm.reset();
  setAddTaskMessage("");
  els.openAddTask.focus();
}

async function submitAddTaskForm(event) {
  event.preventDefault();

  if (!isAdminSession()) {
    setAddTaskMessage("Admin access is required.", "error");
    return;
  }

  const payload = Object.fromEntries(new FormData(els.addTaskForm).entries());
  payload.dueDate = dateInputToExcelSerial(payload.dueDate);
  const submit = els.addTaskForm.querySelector("button[type='submit']");

  submit.disabled = true;
  setAddTaskMessage("Creating task...");

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: adminRequestHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not create task.");
    }

    tasks.push(result.task);
    state.taskPage = 1;
    render();
    setAddTaskMessage(`${result.task["Task ID"]} was added to the task list.`, "success");
    window.setTimeout(closeAddTaskPanel, 800);
  } catch (error) {
    setAddTaskMessage(error.message, "error");
  } finally {
    submit.disabled = false;
  }
}

function openTaskTableEdit(button) {
  const row = button.closest("[data-task-id]");
  const editRow = row?.nextElementSibling;
  if (!editRow?.matches("[data-task-edit-row]")) return;
  editRow.hidden = false;
  editRow.querySelector("input, select, button")?.focus({ preventScroll: true });
}

function closeTaskTableEdit(button) {
  const editRow = button.closest("[data-task-edit-row]");
  const form = editRow?.querySelector("[data-task-table-edit-form]");
  if (form) setTaskEditMessage(form, "");
  if (editRow) editRow.hidden = true;
}

function handleTaskTableAction(event) {
  const openButton = event.target.closest("[data-open-task-table-edit]");
  if (openButton) {
    openTaskTableEdit(openButton);
    return;
  }

  const cancelButton = event.target.closest("[data-cancel-task-table-edit]");
  if (cancelButton) {
    closeTaskTableEdit(cancelButton);
  }
}

async function submitTaskTableEditForm(event) {
  const form = event.target.closest("[data-task-table-edit-form]");
  if (!form) return;
  event.preventDefault();

  if (!isAdminSession()) {
    setTaskEditMessage(form, "Admin access is required.", "error");
    return;
  }

  const taskId = form.dataset.taskId;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.dueDate = dateInputToExcelSerial(payload.dueDate);

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
  } catch (error) {
    setTaskEditMessage(form, error.message, "error");
    submit.disabled = false;
  }
}

function setProjectEditMessage(form, message, type = "") {
  const messageEl = form.querySelector("[data-project-edit-message]");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `employee-add-message project-edit-message ${type}`.trim();
}

function openProjectTableEdit(button) {
  const row = button.closest("[data-project-id]");
  const editRow = row?.nextElementSibling;
  if (!editRow?.matches("[data-project-edit-row]")) return;
  editRow.hidden = false;
  editRow.querySelector("input, select, button")?.focus({ preventScroll: true });
}

function closeProjectTableEdit(button) {
  const editRow = button.closest("[data-project-edit-row]");
  const form = editRow?.querySelector("[data-project-table-edit-form]");
  if (form) setProjectEditMessage(form, "");
  if (editRow) editRow.hidden = true;
}

function handleProjectTableAction(event) {
  const openButton = event.target.closest("[data-open-project-table-edit]");
  if (openButton) {
    openProjectTableEdit(openButton);
    return;
  }

  const cancelButton = event.target.closest("[data-cancel-project-table-edit]");
  if (cancelButton) {
    closeProjectTableEdit(cancelButton);
  }
}

async function submitProjectTableEditForm(event) {
  const form = event.target.closest("[data-project-table-edit-form]");
  if (!form) return;
  event.preventDefault();

  if (!isAdminSession()) {
    setProjectEditMessage(form, "Admin access is required.", "error");
    return;
  }

  const projectId = form.dataset.projectId;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.startDate = dateInputToExcelSerial(payload.startDate);
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
  } catch (error) {
    setProjectEditMessage(form, error.message, "error");
    submit.disabled = false;
  }
}

function progressPageUrl() {
  const params = new URLSearchParams();
  if (state.department !== "All") params.set("department", state.department);
  if (state.risk !== "All") params.set("risk", state.risk);
  if (state.search) params.set("search", state.search);

  const query = params.toString();
  const path = isAdminSession() ? "/progress2admins" : "/progress";
  return `${path}${query ? `?${query}` : ""}`;
}

function statusPageUrl(status, type = "project") {
  const params = new URLSearchParams();
  const statusPath = isAdminSession()
    ? adminStatusPaths[status] || statusPaths[status] || ""
    : statusPaths[status] || "";
  if (!statusPath) {
    params.set("status", status);
    params.set("type", type);
  }
  if (state.department !== "All") params.set("department", state.department);
  if (state.risk !== "All") params.set("risk", state.risk);
  if (state.search) params.set("search", state.search);

  const path = statusPath || "/status";
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}`;
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

async function logout() {
  window.localStorage.removeItem(authSessionKey);
  window.sessionStorage.removeItem(adminSessionKey);
  document.documentElement.classList.remove("has-auth-session");
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    // The local session is already cleared; the login page will re-check access.
  }
  window.location.href = "/signup";
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
  renderTasks();
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
  if (els.openAddTask) {
    els.openAddTask.hidden = !isAdminSession();
  }
  if (els.openAddEmployee) {
    if (!isAdminDashboardRoute()) {
      els.openAddEmployee.remove();
      els.openAddEmployee = null;
    } else {
      els.openAddEmployee.hidden = !isAdminSession();
    }
  }
  if (els.openAddProject) {
    if (!isAdminDashboardRoute()) {
      els.openAddProject.remove();
      els.openAddProject = null;
    } else {
      els.openAddProject.hidden = !isAdminSession();
    }
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
    state.taskPage = 1;
    render();
  });
  els.statusFilter.addEventListener("change", (event) => {
    state.status = event.target.value;
    state.taskPage = 1;
    render();
  });
  els.riskFilter.addEventListener("change", (event) => {
    state.risk = event.target.value;
    state.taskPage = 1;
    render();
  });
  els.searchFilter.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    state.employeePage = 1;
    state.taskPage = 1;
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
    state.taskPage = 1;
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
  els.logoutButton.addEventListener("click", logout);
  document.addEventListener("keydown", (event) => {
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
  els.employeeDetailBody.addEventListener("click", handleEmployeeDetailAction);
  els.employeeDetailBody.addEventListener("submit", submitEmployeeEditForm);
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
  if (isAdminSession() && els.openAddEmployee) {
    els.openAddEmployee.addEventListener("click", openAddEmployeePanel);
    els.closeAddEmployee.addEventListener("click", closeAddEmployeePanel);
    els.cancelAddEmployee.addEventListener("click", closeAddEmployeePanel);
    els.addEmployeeForm.addEventListener("submit", submitAddEmployeeForm);
  }
  if (isAdminSession() && els.openAddProject) {
    els.openAddProject.addEventListener("click", openAddProjectPanel);
    els.closeAddProject.addEventListener("click", closeAddProjectPanel);
    els.cancelAddProject.addEventListener("click", closeAddProjectPanel);
    els.addProjectForm.addEventListener("submit", submitAddProjectForm);
  }
  els.taskPageSize.addEventListener("change", (event) => {
    state.taskPageSize = event.target.value === "all" ? "all" : Number(event.target.value);
    state.taskPage = 1;
    renderTasks();
  });
  els.taskPrev.addEventListener("click", () => {
    state.taskPage = Math.max(state.taskPage - 1, 1);
    renderTasks();
  });
  els.taskNext.addEventListener("click", () => {
    state.taskPage += 1;
    renderTasks();
  });
  els.taskTable.addEventListener("click", handleTaskTableAction);
  els.taskTable.addEventListener("submit", submitTaskTableEditForm);

  if (isAdminSession() && els.openAddTask) {
    els.openAddTask.addEventListener("click", openAddTaskPanel);
    els.closeAddTask.addEventListener("click", closeAddTaskPanel);
    els.cancelAddTask.addEventListener("click", closeAddTaskPanel);
    els.addTaskForm.addEventListener("submit", submitAddTaskForm);
  }
  if (els.projectTable) {
    els.projectTable.addEventListener("click", handleProjectTableAction);
    els.projectTable.addEventListener("submit", submitProjectTableEditForm);
  }

  render();
}

init();
