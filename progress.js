const data = window.DASHBOARD_DATA || {};
const projects = data.Projects || [];

const progressColors = {
  base: "#16837a",
  high: "#2f9b68",
  mid: "#5366c9",
  low: "#c98114",
  none: "#667085",
};

const els = {
  progressScope: document.querySelector("#progressScope"),
  progressMetricGrid: document.querySelector("#progressMetricGrid"),
  progressAverageStat: document.querySelector("#progressAverageStat"),
  progressHero: document.querySelector("#progressHero"),
  progressBands: document.querySelector("#progressBands"),
  progressProjects: document.querySelector("#progressProjects"),
  progressTableCount: document.querySelector("#progressTableCount"),
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
  els.progressTableCount.textContent = `${rows.length} rows`;

  if (!rows.length) {
    els.progressProjects.innerHTML = `<div class="empty-state">No progress rows</div>`;
    return;
  }

  els.progressProjects.innerHTML = rows
    .map(
      (row) => `
        <article class="progress-project">
          <div class="progress-project__top">
            <strong>${escapeHtml(row.name)}</strong>
            <span>${row.progress}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${row.progress}%; background:${progressColor(row.progress)}"></div>
          </div>
          <p>${escapeHtml(row.id)}</p>
        </article>
      `,
    )
    .join("");
}

function init() {
  const rows = progressRows();
  renderScope();
  renderMetrics(rows);
  renderHero(rows);
  renderBands(rows);
  renderProjects(rows);
}

init();
