const phaseMockStudents = [
  { id: 1, name: "Faiyaz Ahmed", email: "faiyaz25@navgurukul.org", phase: "Foundation", phaseDays: 28, milestoneCompletion: 60 },
  { id: 2, name: "Priya Sharma", email: "priya@navgurukul.org", phase: "Intermediate", phaseDays: 41, milestoneCompletion: 85 },
  { id: 3, name: "Rahul Verma", email: "rahul@navgurukul.org", phase: "Advanced", phaseDays: 55, milestoneCompletion: 95 },
  { id: 4, name: "Aisha Khan", email: "aisha@navgurukul.org", phase: "Foundation", phaseDays: 18, milestoneCompletion: 30 },
  { id: 5, name: "Amit Singh", email: "amit@navgurukul.org", phase: "Intermediate", phaseDays: 36, milestoneCompletion: 70 },
  { id: 6, name: "Neha Gupta", email: "neha@navgurukul.org", phase: "Advanced", phaseDays: 62, milestoneCompletion: 100 },
  { id: 7, name: "Vikram Patel", email: "vikram@navgurukul.org", phase: "Foundation", phaseDays: 15, milestoneCompletion: 25 },
  { id: 8, name: "Divya Singh", email: "divya@navgurukul.org", phase: "Intermediate", phaseDays: 39, milestoneCompletion: 72 }
];

const learningPhases = [
  { index: 1, title: "HTML" },
  { index: 2, title: "CSS" },
  { index: 3, title: "JavaScript" },
  { index: 4, title: "Node.js" },
  { index: 5, title: "Express.js + MongoDB" }
];

const phaseDayThresholds = [12, 26, 44, 60, 80];

let currentMovementRows = [];
let currentMovementRange = { from: "", to: "" };

function toISODate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function parseISODate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetweenInclusive(fromDate, toDate) {
  const ms = 24 * 60 * 60 * 1000;
  return Math.floor((toDate - fromDate) / ms) + 1;
}

function overlapDays(rangeStart, rangeEnd, segmentStart, segmentEnd) {
  const start = new Date(Math.max(rangeStart.getTime(), segmentStart.getTime()));
  const end = new Date(Math.min(rangeEnd.getTime(), segmentEnd.getTime()));
  if (start > end) return 0;
  return daysBetweenInclusive(start, end);
}

function normalizePhaseStudent(student) {
  const phaseDays = Number(student.phaseDays) || 0;
  const today = new Date();

  let phaseStart = parseISODate(student.phaseStartDate);
  if (!phaseStart) {
    phaseStart = new Date(today);
    phaseStart.setDate(phaseStart.getDate() - Math.max(phaseDays - 1, 0));
  }

  let phaseEnd = parseISODate(student.phaseEndDate);
  if (!phaseEnd) {
    phaseEnd = new Date(phaseStart);
    phaseEnd.setDate(phaseEnd.getDate() + Math.max(phaseDays - 1, 0));
  }

  return {
    ...student,
    phase: student.phase || "N/A",
    phaseDays,
    milestoneCompletion: Number(student.milestoneCompletion) || 0,
    phaseStartDate: toISODate(phaseStart),
    phaseEndDate: toISODate(phaseEnd)
  };
}

function getPhaseStudents() {
  const stored = localStorage.getItem("studentDatabase");
  if (!stored) return phaseMockStudents.map(normalizePhaseStudent);

  try {
    const parsed = JSON.parse(stored);
    const normalized = Array.isArray(parsed) ? parsed.map(normalizePhaseStudent) : [];
    return phaseMockStudents.map(normalizePhaseStudent).concat(normalized.filter(student => student.id > 8));
  } catch {
    return phaseMockStudents.map(normalizePhaseStudent);
  }
}

function getMovementStatus(student) {
  if (student.rangePhaseDays <= 25) return { text: "Fast", className: "fast" };
  if (student.rangePhaseDays <= 45) return { text: "Steady", className: "steady" };
  return { text: "Slow", className: "slow" };
}

function getLearningPhaseLabel(student) {
  const phaseDays = Number(student.phaseDays) || 0;

  if (phaseDays <= phaseDayThresholds[0]) return "Phase 1 - HTML";
  if (phaseDays <= phaseDayThresholds[1]) return "Phase 2 - CSS";
  if (phaseDays <= phaseDayThresholds[2]) return "Phase 3 - JavaScript";
  if (phaseDays <= phaseDayThresholds[3]) return "Phase 4 - Node.js";
  if (phaseDays <= phaseDayThresholds[4]) return "Phase 5 - Express.js + MongoDB";
  return "Phase 5 - Express.js + MongoDB";
}

function getNextLearningPhaseLabel(student) {
  const phaseDays = Number(student.phaseDays) || 0;

  if (phaseDays < phaseDayThresholds[0]) return "Next: Phase 2 - CSS";
  if (phaseDays < phaseDayThresholds[1]) return "Next: Phase 3 - JavaScript";
  if (phaseDays < phaseDayThresholds[2]) return "Next: Phase 4 - Node.js";
  if (phaseDays < phaseDayThresholds[3]) return "Next: Phase 5 - Express.js + MongoDB";
  if (phaseDays < phaseDayThresholds[4]) return "Next: Graduation / Placement";
  return "Completed";
}

function toCsvField(value) {
  const safe = String(value ?? "").replace(/"/g, '""');
  return `"${safe}"`;
}

function exportPhaseCsv() {
  const rows = [
    ["Student", "Email", "Learning Phase", "Next Phase", "From", "To", "Phase Days (Range)", "Milestone %", "Movement Status"]
  ];

  currentMovementRows.forEach(student => {
    const status = getMovementStatus(student);
    rows.push([
      student.name,
      student.email || "N/A",
      student.learningPhaseLabel,
      student.nextLearningPhaseLabel,
      currentMovementRange.from,
      currentMovementRange.to,
      student.rangePhaseDays,
      student.milestoneCompletion,
      status.text
    ]);
  });

  const csv = rows.map(row => row.map(toCsvField).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `phase-movement-report-${currentMovementRange.from}-to-${currentMovementRange.to}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getRangeFilteredStudents(students, fromDate, toDate) {
  return students
    .map(student => {
      const phaseStart = parseISODate(student.phaseStartDate);
      const phaseEnd = parseISODate(student.phaseEndDate);
      if (!phaseStart || !phaseEnd) return null;

      const activeDays = overlapDays(fromDate, toDate, phaseStart, phaseEnd);
      if (activeDays <= 0) return null;

      return {
        ...student,
        rangePhaseDays: activeDays,
        learningPhaseLabel: getLearningPhaseLabel(student),
        nextLearningPhaseLabel: getNextLearningPhaseLabel(student)
      };
    })
    .filter(Boolean);
}

function renderPhaseDashboard(fromValue, toValue) {
  const session = JSON.parse(localStorage.getItem("studentPortalSession") || "{}");
  const allStudents = getPhaseStudents();
  const isStudent = session.role === "Student";
  const currentEmail = (session.email || "").toLowerCase();
  const baseStudents = isStudent ? allStudents.filter(student => (student.email || "").toLowerCase() === currentEmail) : allStudents;

  document.getElementById("phaseUserEmail").textContent = session.email || "Guest";

  const allStartDates = baseStudents.map(student => parseISODate(student.phaseStartDate)).filter(Boolean);
  const allEndDates = baseStudents.map(student => parseISODate(student.phaseEndDate)).filter(Boolean);
  const fallbackFrom = allStartDates.length ? new Date(Math.min(...allStartDates.map(date => date.getTime()))) : new Date();
  const fallbackTo = allEndDates.length ? new Date(Math.max(...allEndDates.map(date => date.getTime()))) : new Date();

  const fromDate = parseISODate(fromValue) || fallbackFrom;
  const toDate = parseISODate(toValue) || fallbackTo;
  const validFrom = fromDate <= toDate ? fromDate : toDate;
  const validTo = toDate >= fromDate ? toDate : fromDate;

  const fromInput = document.getElementById("phaseRangeFrom");
  const toInput = document.getElementById("phaseRangeTo");
  if (fromInput && toInput) {
    fromInput.value = toISODate(validFrom);
    toInput.value = toISODate(validTo);
  }

  currentMovementRange = { from: toISODate(validFrom), to: toISODate(validTo) };
  const students = getRangeFilteredStudents(baseStudents, validFrom, validTo);
  currentMovementRows = students;

  const phaseCounts = students.reduce((acc, student) => {
    const label = student.learningPhaseLabel;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const phase1Html = phaseCounts["Phase 1 - HTML"] || 0;
  const phase2Css = phaseCounts["Phase 2 - CSS"] || 0;
  const phase3Js = phaseCounts["Phase 3 - JavaScript"] || 0;
  const phase4Node = phaseCounts["Phase 4 - Node.js"] || 0;
  const phase5Express = phaseCounts["Phase 5 - Express.js + MongoDB"] || 0;
  const avgPhaseDays = students.length
    ? (students.reduce((sum, student) => sum + student.rangePhaseDays, 0) / students.length).toFixed(1)
    : "0.0";
  const avgMilestone = students.length
    ? (students.reduce((sum, student) => sum + student.milestoneCompletion, 0) / students.length).toFixed(1)
    : "0.0";

  document.getElementById("phaseStats").innerHTML = `
    <article class="stat">
      <div class="stat-label">Students Tracked</div>
      <div class="stat-value">${students.length}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Phase 1 (HTML)</div>
      <div class="stat-value">${phase1Html}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Phase 2 (CSS)</div>
      <div class="stat-value">${phase2Css}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Phase 3 (JavaScript)</div>
      <div class="stat-value">${phase3Js}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Phase 4 (Node.js)</div>
      <div class="stat-value">${phase4Node}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Phase 5 (Express + MongoDB)</div>
      <div class="stat-value">${phase5Express}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Avg Phase Days</div>
      <div class="stat-value">${avgPhaseDays}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Avg Milestone</div>
      <div class="stat-value">${avgMilestone}%</div>
    </article>
  `;

  document.getElementById("phasePipeline").innerHTML = `
    <div class="phase-node">
      <h3>Phase 1 - HTML</h3>
      <p>${phase1Html} students</p>
      <p>Semantic HTML, forms, structure basics.</p>
    </div>
    <div class="phase-node">
      <h3>Phase 2 - CSS</h3>
      <p>${phase2Css} students</p>
      <p>Layouts, responsive design, styling system.</p>
    </div>
    <div class="phase-node">
      <h3>Phase 3 - JavaScript</h3>
      <p>${phase3Js} students</p>
      <p>Logic, DOM and app behavior.</p>
    </div>
    <div class="phase-node">
      <h3>Phase 4 - Node.js</h3>
      <p>${phase4Node} students</p>
      <p>Backend runtime and modules.</p>
    </div>
    <div class="phase-node">
      <h3>Phase 5 - Express.js + MongoDB</h3>
      <p>${phase5Express} students</p>
      <p>API development and database integration.</p>
    </div>
  `;

  const phaseGroups = learningPhases.reduce((acc, item) => {
    const label = `Phase ${item.index} - ${item.title}`;
    acc[label] = students.filter(student => student.learningPhaseLabel === label);
    return acc;
  }, {});

  const maxAvg = Math.max(
    1,
    ...Object.values(phaseGroups).map(group => group.length ? group.reduce((sum, student) => sum + student.rangePhaseDays, 0) / group.length : 0)
  );

  document.getElementById("avgPhaseDays").innerHTML = Object.entries(phaseGroups)
    .map(([phaseName, group]) => {
      const avgDays = group.length ? (group.reduce((sum, student) => sum + student.rangePhaseDays, 0) / group.length) : 0;
      return `
        <div class="bar-row">
          <span>${phaseName}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(avgDays / maxAvg) * 100}%;"></div>
          </div>
          <strong>${avgDays.toFixed(1)}d</strong>
        </div>
      `;
    })
    .join("");

  document.getElementById("movementTableBody").innerHTML = students
    .slice()
    .sort((a, b) => b.rangePhaseDays - a.rangePhaseDays)
    .map(student => {
      const status = getMovementStatus(student);
      return `
        <tr>
          <td>${student.name}</td>
          <td>${student.learningPhaseLabel}</td>
          <td>${student.nextLearningPhaseLabel}</td>
          <td>${student.rangePhaseDays}</td>
          <td>${student.milestoneCompletion}%</td>
          <td><span class="status-chip ${status.className}">${status.text}</span></td>
        </tr>
      `;
    })
    .join("");
}

function initPhaseDashboard() {
  const applyBtn = document.getElementById("phaseApplyBtn");
  const resetBtn = document.getElementById("phaseResetBtn");
  const exportBtn = document.getElementById("phaseExportCsvBtn");
  const fromInput = document.getElementById("phaseRangeFrom");
  const toInput = document.getElementById("phaseRangeTo");

  renderPhaseDashboard();

  applyBtn.addEventListener("click", () => {
    renderPhaseDashboard(fromInput.value, toInput.value);
  });

  resetBtn.addEventListener("click", () => {
    fromInput.value = "";
    toInput.value = "";
    renderPhaseDashboard();
  });

  exportBtn.addEventListener("click", exportPhaseCsv);
}

document.addEventListener("DOMContentLoaded", initPhaseDashboard);
