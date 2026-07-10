const adminSessionKey = "dashboardAdminSession";
const data = window.DASHBOARD_DATA || {};
const employees = data.Employees || [];
const projects = data.Projects || [];
const tasks = data.Tasks || [];

const els = {
  adminStatus: document.querySelector("#adminStatus"),
  adminMetricGrid: document.querySelector("#adminMetricGrid"),
  adminEmployeeCount: document.querySelector("#adminEmployeeCount"),
  adminDepartmentList: document.querySelector("#adminDepartmentList"),
};

function text(value) {
  return String(value || "").trim();
}

function compact(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

function byCount(rows, key) {
  return rows.reduce((acc, row) => {
    const label = text(row[key]) || "Unassigned";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function requireAdmin() {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(adminSessionKey) || "null");
    if (session?.ok) return session;
  } catch (error) {
    // Fall through to redirect.
  }

  window.location.replace("index.html");
  return null;
}

function renderMetrics() {
  const active = employees.filter((employee) => text(employee["Employment Status"]) === "Active").length;
  const contractor = employees.filter((employee) => text(employee["Employment Status"]) === "Contractor").length;
  const onLeave = employees.filter((employee) => text(employee["Employment Status"]) === "On Leave").length;
  const departments = Object.keys(byCount(employees, "Department")).length;

  const metrics = [
    ["Employees", compact(employees.length), `${compact(active)} active`],
    ["Departments", compact(departments), "With employee records"],
    ["Contractors", compact(contractor), `${compact(onLeave)} on leave`],
    ["Projects", compact(projects.length), "In workbook"],
    ["Tasks", compact(tasks.length), "In workbook"],
    ["Next ID", `E${String(employees.length + 1).padStart(4, "0")}`, "Next add employee"],
  ];

  els.adminMetricGrid.innerHTML = metrics
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

function renderDepartmentList() {
  const counts = byCount(employees, "Department");
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map((entry) => entry[1]), 1);

  els.adminEmployeeCount.textContent = `${employees.length} employees`;
  els.adminDepartmentList.innerHTML = entries
    .map(
      ([department, count]) => `
        <div class="rank-row">
          <div class="rank-row__top">
            <span class="rank-name">${department}</span>
            <span class="rank-value">${count} employees</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
        </div>
      `,
    )
    .join("");
}

function init() {
  const session = requireAdmin();
  if (!session) return;

  els.adminStatus.textContent = "Admin mode active";
  renderMetrics();
  renderDepartmentList();
}

init();
