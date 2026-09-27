function normalizeStudent(student) {
  const htmlDays = Number(student.htmlDaysSpent ?? student.htmlHoursSpent) || 0;
  const cssDays = Number(student.cssDaysSpent ?? student.cssHoursSpent) || 0;
  const jsDays = Number(student.jsDaysSpent ?? student.jsHoursSpent) || 0;
  const phaseDays = Number(student.phaseDays) || 0;
  const phaseLabel = getCurrentLearningPhaseFromDays(phaseDays);

  return {
    ...student,
    phase: phaseLabel,
    status: student.status || "Pending",
    ojtProgress: Number(student.ojtProgress) || 0,
    milestoneCompletion: Number(student.milestoneCompletion) || 0,
    score: Number(student.score) || 0,
    htmlDaysSpent: htmlDays,
    cssDaysSpent: cssDays,
    jsDaysSpent: jsDays,
    htmlHoursSpent: htmlDays,
    cssHoursSpent: cssDays,
    jsHoursSpent: jsDays,
    phaseDays,
    leaveDays: Number(student.leaveDays) || 0
  };
}

function getStudentsFromStorage() {
  return getStudentRecords().map(normalizeStudent);
}

const statusColors = {
  Active: "#3de0b0",
  Pending: "#ff7744",
  Placed: "#0d8f55",
  "At Risk": "#c32035"
};

const phaseColors = {
  "Phase 1 - HTML": "#ff7744",
  "Phase 2 - CSS": "#3de0b0",
  "Phase 3 - JavaScript": "#5b9eff",
  "Phase 4 - Node.js": "#b897ff",
  "Phase 5 - Express.js + MongoDB": "#0d8f55",
  Foundation: "#ff7744",
  Intermediate: "#3de0b0",
  Advanced: "#5b9eff"
};

const defaultLearningPhases = [
  { phase: 1, title: "HTML", passDays: 12, leaveDays: 1, goal: "Semantic tags and forms" },
  { phase: 2, title: "CSS", passDays: 14, leaveDays: 1, goal: "Layout, responsive design, UI" },
  { phase: 3, title: "JavaScript", passDays: 18, leaveDays: 2, goal: "DOM, logic, and API basics" },
  { phase: 4, title: "Node.js", passDays: 16, leaveDays: 1, goal: "Runtime, modules, backend setup" },
  { phase: 5, title: "Express.js + MongoDB", passDays: 20, leaveDays: 2, goal: "REST APIs and database CRUD" }
];

const phaseDayThresholds = [12, 26, 44, 60, 80];

const roadmapStorageKey = "dashboardLearningPhases";
const studentRoadmapStorageKey = "dashboardLearningPhasesByStudent";
const templateRoadmapTarget = "__template__";
let learningPhases = getLearningPhases();
let isAdminSession = false;
let currentRoadmapTarget = templateRoadmapTarget;
let trackedStudentEmail = "";

function cloneDefaultPhases() {
  return defaultLearningPhases.map(item => ({ ...item }));
}

function normalizeRoadmapPhases(rawPhases, fallbackPhases = defaultLearningPhases) {
  if (!Array.isArray(rawPhases)) {
    return fallbackPhases.map(item => ({ ...item }));
  }

  return fallbackPhases.map((fallback, index) => {
    const source = rawPhases[index] || {};
    const passDays = Number(source.passDays);
    const leaveDays = Number(source.leaveDays);
    return {
      ...fallback,
      passDays: Number.isFinite(passDays) ? Math.max(0, passDays) : fallback.passDays,
      leaveDays: Number.isFinite(leaveDays) ? Math.max(0, leaveDays) : fallback.leaveDays
    };
  });
}

function normalizeStudentKey(email) {
  return (email || "").trim().toLowerCase();
}

function getCurrentLearningPhaseFromDays(phaseDays) {
  const totalDays = Number(phaseDays) || 0;

  if (totalDays <= phaseDayThresholds[0]) return "Phase 1 - HTML";
  if (totalDays <= phaseDayThresholds[1]) return "Phase 2 - CSS";
  if (totalDays <= phaseDayThresholds[2]) return "Phase 3 - JavaScript";
  if (totalDays <= phaseDayThresholds[3]) return "Phase 4 - Node.js";
  return "Phase 5 - Express.js + MongoDB";
}

function getNextLearningPhaseFromDays(phaseDays) {
  const totalDays = Number(phaseDays) || 0;

  if (totalDays < phaseDayThresholds[0]) return "Next Phase: CSS";
  if (totalDays < phaseDayThresholds[1]) return "Next Phase: JavaScript";
  if (totalDays < phaseDayThresholds[2]) return "Next Phase: Node.js";
  if (totalDays < phaseDayThresholds[3]) return "Next Phase: Express.js + MongoDB";
  return "Completed";
}

function getLearningPhases() {
  const stored = localStorage.getItem(roadmapStorageKey);
  if (!stored) return cloneDefaultPhases();

  try {
    const parsed = JSON.parse(stored);
    return normalizeRoadmapPhases(parsed);
  } catch {
    return cloneDefaultPhases();
  }
}

function persistLearningPhases() {
  localStorage.setItem(roadmapStorageKey, JSON.stringify(learningPhases));
}

function getStudentRoadmapMap() {
  const stored = localStorage.getItem(studentRoadmapStorageKey);
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function getRoadmapForStudent(email) {
  const studentKey = normalizeStudentKey(email);
  const templatePhases = getLearningPhases();
  if (!studentKey) return templatePhases.map(item => ({ ...item }));

  const studentMap = getStudentRoadmapMap();
  const studentPhases = studentMap[studentKey];
  return normalizeRoadmapPhases(studentPhases, templatePhases);
}

function saveRoadmapForStudent(email, phases) {
  const studentKey = normalizeStudentKey(email);
  if (!studentKey) return;

  const studentMap = getStudentRoadmapMap();
  studentMap[studentKey] = normalizeRoadmapPhases(phases, learningPhases);
  localStorage.setItem(studentRoadmapStorageKey, JSON.stringify(studentMap));
}

function removeRoadmapForStudent(email) {
  const studentKey = normalizeStudentKey(email);
  if (!studentKey) return;

  const studentMap = getStudentRoadmapMap();
  delete studentMap[studentKey];
  localStorage.setItem(studentRoadmapStorageKey, JSON.stringify(studentMap));
}

function toCsvField(value) {
  const safeValue = String(value ?? "");
  const escaped = safeValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function exportStudentRoadmapCsv() {
  const students = getStudentsFromStorage().filter(student => student.email);
  const csvRows = [
    ["Student Name", "Email", "Roadmap Type", "Phase", "Skill", "Pass Days", "Leave Days", "Student Total Pass Days", "Student Total Leave Days", "Student Total Calendar Days"]
  ];

  const templateTotals = getLearningPhases();
  const templatePass = templateTotals.reduce((sum, item) => sum + item.passDays, 0);
  const templateLeave = templateTotals.reduce((sum, item) => sum + item.leaveDays, 0);
  const templateCalendar = templatePass + templateLeave;

  csvRows.push(["DEFAULT TEMPLATE", "-", "Template", "All", "All Phases", templatePass, templateLeave, templatePass, templateLeave, templateCalendar]);

  students.forEach(student => {
    const roadmap = getRoadmapForStudent(student.email);
    const passTotal = roadmap.reduce((sum, item) => sum + item.passDays, 0);
    const leaveTotal = roadmap.reduce((sum, item) => sum + item.leaveDays, 0);
    const calendarTotal = passTotal + leaveTotal;
    const roadmapType = getStudentRoadmapMap()[normalizeStudentKey(student.email)] ? "Custom" : "Template";

    roadmap.forEach(item => {
      csvRows.push([
        student.name,
        student.email,
        roadmapType,
        `P${item.phase}`,
        item.title,
        item.passDays,
        item.leaveDays,
        passTotal,
        leaveTotal,
        calendarTotal
      ]);
    });
  });

  const csvContent = csvRows.map(row => row.map(toCsvField).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);

  link.setAttribute("href", downloadUrl);
  link.setAttribute("download", `student-roadmap-report-${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

function renderLearningRoadmap(showEditor = false, studentEmail = "") {
  const flowchart = document.getElementById("learningFlowchart");
  const targetControls = document.getElementById("roadmapTargetControls");
  const exportBtn = document.getElementById("exportRoadmapCsvBtn");
  const tableWrap = document.getElementById("phaseJourneyTable");
  const summary = document.getElementById("journeySummary");
  const editor = document.getElementById("roadmapEditor");

  if (!flowchart || !targetControls || !exportBtn || !tableWrap || !summary || !editor) return;

  exportBtn.style.display = showEditor ? "inline-flex" : "none";
  exportBtn.onclick = showEditor ? exportStudentRoadmapCsv : null;

  if (showEditor) {
    const students = getStudentsFromStorage().filter(student => student.email);
    const options = students.map(student => {
      const key = normalizeStudentKey(student.email);
      const label = `${student.name} (${student.email})`;
      return `<option value="${key}" ${currentRoadmapTarget === key ? "selected" : ""}>${label}</option>`;
    }).join("");

    targetControls.innerHTML = `
      <label for="roadmapTargetSelect">Edit Roadmap For</label>
      <select id="roadmapTargetSelect">
        <option value="${templateRoadmapTarget}" ${currentRoadmapTarget === templateRoadmapTarget ? "selected" : ""}>Default Template (All Students)</option>
        ${options}
      </select>
    `;

    const targetSelect = document.getElementById("roadmapTargetSelect");
    if (targetSelect) {
      targetSelect.addEventListener("change", (event) => {
        currentRoadmapTarget = event.target.value;
        renderLearningRoadmap(true);
      });
    }

    if (currentRoadmapTarget === templateRoadmapTarget) {
      learningPhases = getLearningPhases();
    } else {
      learningPhases = getRoadmapForStudent(currentRoadmapTarget);
    }
  } else {
    targetControls.innerHTML = "";
    learningPhases = studentEmail ? getRoadmapForStudent(studentEmail) : getLearningPhases();
  }

  flowchart.innerHTML = learningPhases.map((item, index) => `
    <div class="flow-node">
      <strong>Phase ${item.phase}: ${item.title}</strong>
      <p>${item.goal}</p>
      <p>Pass: ${item.passDays} days | Leave: ${item.leaveDays} days</p>
    </div>
    ${index < learningPhases.length - 1 ? '<div class="flow-arrow">&#8594;</div>' : ''}
  `).join("");

  tableWrap.innerHTML = `
    <table class="journey-table">
      <thead>
        <tr>
          <th>Phase</th>
          <th>Skill</th>
          <th>Pass Days</th>
          <th>Leave Days</th>
        </tr>
      </thead>
      <tbody>
        ${learningPhases.map(item => `
          <tr>
            <td>P${item.phase}</td>
            <td>${item.title}</td>
            <td>${item.passDays}</td>
            <td>${item.leaveDays}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const totalPassDays = learningPhases.reduce((sum, item) => sum + item.passDays, 0);
  const totalLeaveDays = learningPhases.reduce((sum, item) => sum + item.leaveDays, 0);
  const totalCalendarDays = totalPassDays + totalLeaveDays;

  summary.innerHTML = `
    <div class="summary-chip">
      <span class="label">Total Pass Days</span>
      <span class="value">${totalPassDays}</span>
    </div>
    <div class="summary-chip">
      <span class="label">Total Leave Days</span>
      <span class="value">${totalLeaveDays}</span>
    </div>
    <div class="summary-chip">
      <span class="label">Total Calendar Days</span>
      <span class="value">${totalCalendarDays}</span>
    </div>
  `;

  if (!showEditor) {
    editor.innerHTML = "";
    return;
  }

  editor.innerHTML = `
    <div class="roadmap-editor-grid">
      ${learningPhases.map((item, index) => `
        <div class="roadmap-editor-row">
          <span>Phase ${item.phase}: ${item.title}</span>
          <input type="number" min="0" max="120" value="${item.passDays}" data-index="${index}" data-type="pass" aria-label="Phase ${item.phase} pass days" />
          <input type="number" min="0" max="120" value="${item.leaveDays}" data-index="${index}" data-type="leave" aria-label="Phase ${item.phase} leave days" />
        </div>
      `).join("")}
    </div>
    <div class="roadmap-actions">
      <button id="saveRoadmapBtn" class="roadmap-btn save" type="button">Save Phase Days</button>
      <button id="resetRoadmapBtn" class="roadmap-btn reset" type="button">Reset Default</button>
    </div>
  `;

  const saveBtn = document.getElementById("saveRoadmapBtn");
  const resetBtn = document.getElementById("resetRoadmapBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const inputs = Array.from(editor.querySelectorAll("input[data-index]"));
      const nextPhases = learningPhases.map(item => ({ ...item }));

      inputs.forEach(input => {
        const index = Number(input.dataset.index);
        const value = Math.max(0, Math.min(120, Number(input.value) || 0));

        if (input.dataset.type === "pass") {
          nextPhases[index].passDays = value;
        } else {
          nextPhases[index].leaveDays = value;
        }
      });

      learningPhases = nextPhases;
      if (currentRoadmapTarget === templateRoadmapTarget) {
        persistLearningPhases();
      } else {
        saveRoadmapForStudent(currentRoadmapTarget, learningPhases);
      }
      renderLearningRoadmap(true);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (currentRoadmapTarget === templateRoadmapTarget) {
        learningPhases = cloneDefaultPhases();
        persistLearningPhases();
      } else {
        removeRoadmapForStudent(currentRoadmapTarget);
        learningPhases = getRoadmapForStudent(currentRoadmapTarget);
      }
      renderLearningRoadmap(true);
    });
  }
}

// Initialize dashboard
function initDashboard() {
  const session = JSON.parse(localStorage.getItem("studentPortalSession") || "{}");
  document.getElementById("userEmail").textContent = session.email || "Guest";
  isAdminSession = session.role !== "Student";

  if (session.role === "Student") {
    renderStudentView(session);
    renderLearningRoadmap(false, session.email || "");
  } else {
    renderAdminView();
    renderLearningRoadmap(true);
  }

  setupTrackerControls(session);
}

function populateStudentSuggestions(students) {
  const datalist = document.getElementById("studentSuggestions");
  if (!datalist) return;

  datalist.innerHTML = students.map(student => `
    <option value="${student.email}">${student.name}</option>
  `).join("");
}

function findTrackedStudent(students, query) {
  const normalized = (query || "").trim().toLowerCase();
  if (!normalized) return null;

  return students.find(student => (student.email || "").toLowerCase() === normalized)
    || students.find(student => (student.name || "").toLowerCase() === normalized)
    || students.find(student => (student.email || "").toLowerCase().includes(normalized))
    || students.find(student => (student.name || "").toLowerCase().includes(normalized));
}

function renderTrackedStudentDashboard(student, allStudents) {
  renderStudentStats(student);
  renderStatusChart([student]);
  renderPhaseChart([student]);
  renderStudentProgressCharts(student);
  renderPhaseTracker(student);
  renderLeaveTracker(student);
  renderComparisonWithOthers(student, allStudents);
  renderLearningRoadmap(false, student.email || "");
}

function resetAdminTrackedView() {
  trackedStudentEmail = "";
  renderAdminView();
  renderLearningRoadmap(true);
}

function setupTrackerControls(session) {
  const controls = document.getElementById("studentTrackerControls");
  const input = document.getElementById("trackStudentInput");
  const trackBtn = document.getElementById("trackStudentBtn");
  const clearBtn = document.getElementById("clearTrackBtn");
  const status = document.getElementById("trackStatus");

  if (!controls || !input || !trackBtn || !clearBtn || !status) return;

  if (session.role === "Student") {
    controls.style.display = "none";
    return;
  }

  const students = getStudentsFromStorage();
  populateStudentSuggestions(students);

  const applyTracking = () => {
    const latestStudents = getStudentsFromStorage();
    populateStudentSuggestions(latestStudents);

    const selected = findTrackedStudent(latestStudents, input.value);
    if (!selected) {
      status.textContent = "Student not found. Try full name or email.";
      resetAdminTrackedView();
      return;
    }

    trackedStudentEmail = selected.email || "";
    renderTrackedStudentDashboard(selected, latestStudents);
    status.textContent = `Tracking: ${selected.name} (${selected.email})`;
  };

  trackBtn.addEventListener("click", applyTracking);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyTracking();
    }
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    status.textContent = "Type student name/email and click Track.";
    resetAdminTrackedView();
  });
}

function renderStudentView(session) {
  const allStudents = getStudentsFromStorage();
  const sessionEmail = (session.email || "").toLowerCase();
  const currentStudent = allStudents.find(s => (s.email || "").toLowerCase() === sessionEmail) || 
                         JSON.parse(localStorage.getItem("studentDatabase") || "[]").find(s => (s.email || "").toLowerCase() === sessionEmail);

  if (!currentStudent) {
    document.getElementById("statsContainer").innerHTML = "<p style='color: red;'>Student data not found</p>";
    return;
  }

  // Show only current student's progress
  renderStudentStats(currentStudent);
  renderStudentProgressCharts(currentStudent);
  renderPhaseTracker(currentStudent);
  renderLeaveTracker(currentStudent);
  renderComparisonWithOthers(currentStudent, allStudents);
}

function renderStudentStats(student) {
  const statsContainer = document.getElementById("statsContainer");
  const currentLearningPhase = getCurrentLearningPhaseFromDays(student.phaseDays);
  const nextLearningPhase = getNextLearningPhaseFromDays(student.phaseDays);
  const stats = [
    { label: "Current Phase", value: currentLearningPhase, class: "orange" },
    { label: "Status", value: student.status, class: "green" },
    { label: "Your Score", value: student.score?.toFixed(1) || "N/A", class: "blue" },
    { label: "OJT Progress", value: student.ojtProgress + "%", class: "purple" },
    { label: "HTML Days", value: student.htmlDaysSpent + "d", class: "orange" },
    { label: "CSS Days", value: student.cssDaysSpent + "d", class: "green" },
    { label: "JavaScript Days", value: student.jsDaysSpent + "d", class: "blue" },
    { label: "Next Phase", value: nextLearningPhase, class: "purple" },
    { label: "Leave Days", value: student.leaveDays + "d", class: "purple" }
  ];

  statsContainer.innerHTML = stats.map(stat => `
    <div class="stat-card ${stat.class}">
      <div class="stat-number">${stat.value}</div>
      <div class="stat-label">${stat.label}</div>
    </div>
  `).join("");
}

function renderStudentProgressCharts(student) {
  const ojtChart = document.getElementById("ojtChart");
  const milestoneChart = document.getElementById("milestoneChart");

  // OJT Progress
  ojtChart.innerHTML = `
    <div class="progress-item">
      <div class="progress-label">
        <span>OJT Progress</span>
        <span>${student.ojtProgress}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${student.ojtProgress}%;"></div>
      </div>
    </div>
    <div class="progress-item">
      <div class="progress-label">
        <span>Next Milestone</span>
        <span>${student.ojtProgress + 15 > 100 ? '100' : student.ojtProgress + 15}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${student.ojtProgress + 15 > 100 ? 100 : student.ojtProgress + 15}%; opacity: 0.5;"></div>
      </div>
    </div>
  `;

  // Milestone Completion
  milestoneChart.innerHTML = `
    <div class="progress-item">
      <div class="progress-label">
        <span>Milestone Steps</span>
        <span>${student.milestoneCompletion}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${student.milestoneCompletion}%;"></div>
      </div>
    </div>
    <div class="progress-item">
      <div class="progress-label">
        <span>Learning Phase</span>
        <span>${Math.min(student.milestoneCompletion + 20, 100)}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(student.milestoneCompletion + 20, 100)}%; opacity: 0.5;"></div>
      </div>
    </div>
  `;
}

function renderPhaseTracker(student) {
  const phaseTracker = document.getElementById("phaseTracker");
  if (!phaseTracker) return;

  const currentLearningPhase = getCurrentLearningPhaseFromDays(student.phaseDays);
  const nextLearningPhase = getNextLearningPhaseFromDays(student.phaseDays);

  phaseTracker.innerHTML = `
    <div class="progress-item">
      <div class="progress-label">
        <span>Phase Duration</span>
        <span>${student.phaseDays} days</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(student.phaseDays * 2, 100)}%;"></div>
      </div>
    </div>
    <div class="progress-item">
      <div class="progress-label">
        <span>Current Phase</span>
        <span>${currentLearningPhase}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(student.phaseDays * 2, 100)}%; opacity: 0.55;"></div>
      </div>
    </div>
    <div class="progress-item">
      <div class="progress-label">
        <span>${nextLearningPhase}</span>
        <span>${student.phaseDays >= 80 ? 'Completed' : 'In progress'}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(student.phaseDays * 2, 100)}%; opacity: 0.35;"></div>
      </div>
    </div>
  `;
}

function renderLeaveTracker(student) {
  const leaveTracker = document.getElementById("leaveTracker");
  if (!leaveTracker) return;

  const totalStudyDays = student.htmlDaysSpent + student.cssDaysSpent + student.jsDaysSpent;

  leaveTracker.innerHTML = `
    <div class="progress-item">
      <div class="progress-label">
        <span>Leave Taken</span>
        <span>${student.leaveDays} days</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(student.leaveDays * 10, 100)}%; background: linear-gradient(90deg, #ff7744, #ff5a20);"></div>
      </div>
    </div>
    <div class="progress-item">
      <div class="progress-label">
        <span>Study Days Total</span>
        <span>${totalStudyDays} days</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(totalStudyDays * 2, 100)}%; opacity: 0.55;"></div>
      </div>
    </div>
  `;
}

function renderComparisonWithOthers(currentStudent, allStudents) {
  const topStudentsContainer = document.getElementById("topStudents");
  const needsContainer = document.getElementById("needsAttention");

  // Top students in same phase
  const samePhase = allStudents.filter(s => s.phase === currentStudent.phase && s.id !== currentStudent.id).sort((a, b) => b.score - a.score).slice(0, 5);

  topStudentsContainer.innerHTML = `
    <div style="margin-bottom: 12px; padding: 10px; border-radius: 10px; background: rgba(255, 119, 68, 0.15); border-left: 3px solid #ff7744;">
      <div style="font-weight: 600; margin-bottom: 6px;">आपके Progress</div>
      <div class="student-item" style="background: transparent; border: none; padding: 0; gap: 8px;">
        <div class="student-avatar" style="background: #ff7744; width: 40px; height: 40px; font-size: 1rem;">⭐</div>
        <div class="student-info">
          <div class="student-name">${currentStudent.name}</div>
          <div class="student-meta">${currentStudent.phase} | ${currentStudent.ojtProgress}% OJT</div>
        </div>
        <div class="student-score">${currentStudent.score?.toFixed(1) || 'N/A'}</div>
      </div>
    </div>
    ${samePhase.length > 0 ? `<div style="color: var(--text-fade); font-size: 0.85rem; margin-bottom: 8px;">Top students in ${currentStudent.phase}:</div>` : ''}
    ${samePhase.map(student => {
      const initials = student.name.split(" ").map(n => n[0]).join("");
      return `
        <div class="student-item">
          <div class="student-avatar" style="background: #3de0b0;">${initials}</div>
          <div class="student-info">
            <div class="student-name">${student.name}</div>
            <div class="student-meta">${student.phase}</div>
          </div>
          <div class="student-score">⭐ ${student.score}</div>
        </div>
      `;
    }).join("")}
  `;

  // Recommendations
  const ojtGap = 100 - currentStudent.ojtProgress;
  const milestoneGap = 100 - currentStudent.milestoneCompletion;
  const recommendations = [];

  if (ojtGap > 50) recommendations.push({ icon: "📌", text: "OJT Progress अभी pending है" });
  if (milestoneGap > 50) recommendations.push({ icon: "🎯", text: "अपने Milestones पूरे करें" });
  if (currentStudent.score < 4) recommendations.push({ icon: "📚", text: "Advanced Topics की study करें" });

  needsContainer.innerHTML = recommendations.length > 0 
    ? recommendations.map(rec => `
        <div class="attention-item" style="background: linear-gradient(155deg, rgba(61, 224, 176, 0.15), rgba(61, 224, 176, 0.05)); border-color: rgba(61, 224, 176, 0.3);">
          <div class="attention-icon" style="background: #3de0b0; color: #000;">${rec.icon}</div>
          <div class="attention-content">
            <div class="attention-name" style="color: #3de0b0;">${rec.text}</div>
          </div>
        </div>
      `).join("")
    : `<div style="text-align: center; padding: 20px; color: var(--text-fade);">आप बहुत अच्छे हो! 🎉<br/>आपकी प्रगति सही दिशा में है।</div>`;
}

function renderAdminView() {
  const allStudents = getStudentsFromStorage();
  renderStats(allStudents);
  renderStatusChart(allStudents);
  renderPhaseChart(allStudents);
  renderProgressCharts(allStudents);
  renderTopStudents(allStudents);
  renderNeedsAttention(allStudents);
  renderCampusTrackers(allStudents);
}

function renderCampusTrackers(allStudents) {
  const phaseTracker = document.getElementById("phaseTracker");
  const leaveTracker = document.getElementById("leaveTracker");
  if (!phaseTracker || !leaveTracker || allStudents.length === 0) return;

  const avg = (pick) => Math.round(allStudents.reduce((sum, student) => sum + pick(student), 0) / allStudents.length);
  const avgPhaseDays = avg(student => student.phaseDays);
  const avgLeaveDays = avg(student => student.leaveDays);
  const avgStudyDays = avg(student => student.htmlDaysSpent + student.cssDaysSpent + student.jsDaysSpent);

  const item = (label, value, width, style = "") => `
    <div class="progress-item">
      <div class="progress-label">
        <span>${label}</span>
        <span>${value}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(width, 100)}%; ${style}"></div>
      </div>
    </div>
  `;

  phaseTracker.innerHTML =
    item("Avg Phase Duration", `${avgPhaseDays} days`, avgPhaseDays * 2)
    + item("Campus Phase", getCurrentLearningPhaseFromDays(avgPhaseDays), avgPhaseDays * 2, "opacity: 0.55;")
    + item(getNextLearningPhaseFromDays(avgPhaseDays), "In progress", avgPhaseDays * 2, "opacity: 0.35;");

  leaveTracker.innerHTML =
    item("Avg Leave Taken", `${avgLeaveDays} days`, avgLeaveDays * 10, "background: linear-gradient(90deg, #ff7744, #ff5a20);")
    + item("Avg Study Days", `${avgStudyDays} days`, avgStudyDays * 2, "opacity: 0.55;");
}

// Stats Cards (Admin view)
function renderStats(allStudents = null) {
  const students = allStudents || getStudentsFromStorage();
  const statsContainer = document.getElementById("statsContainer");
  const stats = [
    { label: "Active Students", value: students.filter(s => s.status === "Active").length, class: "orange" },
    { label: "Journey Stages", value: 13, class: "green" },
    { label: "Placed", value: students.filter(s => s.status === "Placed").length, class: "blue" },
    { label: "Avg Completion", value: "12mo", class: "purple" }
  ];

  statsContainer.innerHTML = stats.map(stat => `
    <div class="stat-card ${stat.class}">
      <div class="stat-number">${stat.value}</div>
      <div class="stat-label">${stat.label}</div>
    </div>
  `).join("");
}

// Status Pie Chart
function renderStatusChart(allStudents = null) {
  const students = allStudents || getStudentsFromStorage();
  const statusChart = document.getElementById("statusChart");
  const statusCounts = {};

  students.forEach(s => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  });

  statusChart.innerHTML = Object.entries(statusCounts).map(([status, count]) => `
    <div class="pie-item">
      <div style="margin-bottom: 6px;">
        <span class="pie-color" style="background: ${statusColors[status]}"></span>
        <span style="font-size: 0.85rem;">${status}</span>
      </div>
      <div style="font-weight: 700; font-size: 1.3rem;">${count}</div>
    </div>
  `).join("");
}

// Phase Bar Chart
function renderPhaseChart(allStudents = null) {
  const students = allStudents || getStudentsFromStorage();
  const phaseChart = document.getElementById("phaseChart");
  const phaseCounts = {};

  students.forEach(s => {
    phaseCounts[s.phase] = (phaseCounts[s.phase] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(phaseCounts), 1);

  phaseChart.innerHTML = Object.entries(phaseCounts).map(([phase, count]) => `
    <div class="bar-row">
      <div class="bar-label">${phase}</div>
      <div class="bar-fill" style="background: linear-gradient(90deg, ${phaseColors[phase] || "#5b9eff"}, ${(phaseColors[phase] || "#5b9eff")}99); width: ${(count / maxCount) * 100}%;"></div>
      <div class="bar-value">${count}</div>
    </div>
  `).join("");
}

// Progress Charts (OJT & Milestone)
function renderProgressCharts(allStudents = null) {
  const students = allStudents || getStudentsFromStorage();

  const phaseLabels = [
    "Phase 1 - HTML",
    "Phase 2 - CSS",
    "Phase 3 - JavaScript",
    "Phase 4 - Node.js",
    "Phase 5 - Express.js + MongoDB"
  ];

  const avgByPhase = (label, field) => {
    const group = students.filter(student => getCurrentLearningPhaseFromDays(student.phaseDays) === label);
    if (group.length === 0) return 0;
    return Math.round(group.reduce((sum, student) => sum + (Number(student[field]) || 0), 0) / group.length);
  };

  renderProgressChart("ojtChart", "OJT Progress", [
    { name: phaseLabels[0], value: avgByPhase(phaseLabels[0], "ojtProgress") },
    { name: phaseLabels[1], value: avgByPhase(phaseLabels[1], "ojtProgress") },
    { name: phaseLabels[2], value: avgByPhase(phaseLabels[2], "ojtProgress") },
    { name: phaseLabels[3], value: avgByPhase(phaseLabels[3], "ojtProgress") },
    { name: phaseLabels[4], value: avgByPhase(phaseLabels[4], "ojtProgress") }
  ]);

  renderProgressChart("milestoneChart", "Milestones", [
    { name: phaseLabels[0], value: avgByPhase(phaseLabels[0], "milestoneCompletion") },
    { name: phaseLabels[1], value: avgByPhase(phaseLabels[1], "milestoneCompletion") },
    { name: phaseLabels[2], value: avgByPhase(phaseLabels[2], "milestoneCompletion") },
    { name: phaseLabels[3], value: avgByPhase(phaseLabels[3], "milestoneCompletion") },
    { name: phaseLabels[4], value: avgByPhase(phaseLabels[4], "milestoneCompletion") }
  ]);
}

function renderProgressChart(elementId, title, items) {
  const container = document.getElementById(elementId);
  container.innerHTML = items.map(item => `
    <div class="progress-item">
      <div class="progress-label">
        <span>${item.name}</span>
        <span>${item.value}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${item.value}%;"></div>
      </div>
    </div>
  `).join("");
}

// Top Students
function renderTopStudents(allStudents = null) {
  const students = allStudents || getStudentsFromStorage();
  const topStudentsContainer = document.getElementById("topStudents");
  const sorted = [...students].sort((a, b) => b.score - a.score).slice(0, 5);

  topStudentsContainer.innerHTML = sorted.map(student => {
    const initials = student.name.split(" ").map(n => n[0]).join("");
    const avatarColor = phaseColors[student.phase] || "#5b9eff";
    return `
      <div class="student-item">
        <div class="student-avatar" style="background: ${avatarColor};">${initials}</div>
        <div class="student-info">
          <div class="student-name">${student.name}</div>
          <div class="student-meta">${student.phase}</div>
        </div>
        <div class="student-score">⭐ ${student.score}</div>
      </div>
    `;
  }).join("");
}

// Needs Attention
function renderNeedsAttention(allStudents = null) {
  const students = allStudents || getStudentsFromStorage();
  const needsContainer = document.getElementById("needsAttention");
  const atRisk = students.filter(s => s.status === "At Risk" || s.status === "Pending");

  if (atRisk.length === 0) {
    needsContainer.innerHTML = "<p style='color: var(--text-fade); text-align: center; padding: 20px;'>सभी students ठीक हैं! 🎉</p>";
    return;
  }

  needsContainer.innerHTML = atRisk.map(student => {
    const initials = student.name.split(" ").map(n => n[0]).join("");
    const reason = student.status === "At Risk" ? "Low OJT progress" : "Pending assessment";
    return `
      <div class="attention-item">
        <div class="attention-icon">!</div>
        <div class="attention-content">
          <div class="attention-name">${student.name}</div>
          <div class="attention-reason">🔴 ${reason}</div>
        </div>
      </div>
    `;
  }).join("");
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("studentPortalSession");
  window.location.href = "index.html";
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", initDashboard);
