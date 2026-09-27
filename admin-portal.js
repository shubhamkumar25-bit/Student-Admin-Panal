// NavGurukul Student Admin Panel - overview, student list and student records.

let editingStudentId = null;

function initAdminPortal() {
  const session = JSON.parse(localStorage.getItem("studentPortalSession") || "{}");

  if (!session.email) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("adminEmail").textContent = session.email;
  populateFilters();
  loadDashboardData();
  loadStudentsTable();
  setupEventListeners();
  syncAutoPhaseField();
}

function getStudents() {
  return getStudentRecords();
}

function getJourneyProgress(student) {
  return Math.round((student.journeyStageIndex / (JOURNEY_STAGES.length - 1)) * 100);
}

function syncAutoPhaseField() {
  const phaseDaysInput = document.getElementById("studentPhaseDays");
  const phaseField = document.getElementById("studentPhase");

  if (!phaseDaysInput || !phaseField) return;

  phaseField.value = getLearningPhaseFromDays(phaseDaysInput.value);
}

function populateFilters() {
  const stageFilter = document.getElementById("stageFilter");
  const stageSelect = document.getElementById("studentStage");

  JOURNEY_STAGES.forEach(stage => {
    stageFilter.insertAdjacentHTML("beforeend", `<option value="${stage}">${stage}</option>`);
    if (stageSelect) {
      stageSelect.insertAdjacentHTML("beforeend", `<option value="${stage}">${stage}</option>`);
    }
  });
}

function setupEventListeners() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      const section = link.dataset.section;
      if (!section) return;

      e.preventDefault();
      switchSection(section);
    });
  });

  document.getElementById("addStudentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (editingStudentId !== null) {
      updateStudent();
      return;
    }
    addNewStudent();
  });

  document.getElementById("searchInput").addEventListener("input", loadStudentsTable);
  document.getElementById("stageFilter").addEventListener("change", loadStudentsTable);
  document.getElementById("statusFilter").addEventListener("change", loadStudentsTable);
  document.getElementById("placementFilter").addEventListener("change", loadStudentsTable);
  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("stageFilter").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("placementFilter").value = "";
    loadStudentsTable();
  });

  document.getElementById("studentPhaseDays").addEventListener("input", syncAutoPhaseField);

  document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.querySelector(".admin-layout").classList.toggle("nav-open");
  });

  document.getElementById("adminLogoutBtn").addEventListener("click", () => {
    localStorage.removeItem("studentPortalSession");
    window.location.href = "index.html";
  });

  document.getElementById("restoreFile").addEventListener("change", restoreFromBackup);
}

function switchSection(sectionId) {
  document.querySelectorAll(".admin-section").forEach(section => {
    section.classList.remove("active");
  });

  document.getElementById(sectionId).classList.add("active");

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    if (link.dataset.section === sectionId) {
      link.classList.add("active");
    }
  });

  document.querySelector(".admin-layout").classList.remove("nav-open");

  if (sectionId === "dashboard") {
    loadDashboardData();
  }

  if (sectionId === "students") {
    loadStudentsTable();
  }

  if (typeof renderAnalyticsSection === "function") {
    renderAnalyticsSection(sectionId);
  }

  if (sectionId === "add-student" && editingStudentId === null) {
    const heading = document.querySelector("#add-student .section-header h1");
    if (heading) heading.textContent = "Add New Student";

    const form = document.getElementById("addStudentForm");
    if (form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = "Add Student";
    }
  }
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function loadDashboardData() {
  const allStudents = getStudents();

  const placed = allStudents.filter(s => s.placement.status === "Placed").length;
  const atRisk = allStudents.filter(s => s.status === "At Risk").length;
  const active = allStudents.filter(s => s.status === "Active").length;

  document.getElementById("totalStudents").textContent = allStudents.length;
  document.getElementById("journeyStageCount").textContent = JOURNEY_STAGES.length;
  document.getElementById("placedStudents").textContent = placed;
  document.getElementById("atRiskStudents").textContent = atRisk;
  document.getElementById("activeStudents").textContent = active;
  document.getElementById("avgJourneyProgress").textContent =
    `${Math.round(average(allStudents.map(getJourneyProgress)))}%`;
  document.getElementById("avgAttendance").textContent =
    `${Math.round(average(allStudents.map(s => s.attendance.percent)))}%`;
  document.getElementById("avgScore").textContent =
    average(allStudents.map(s => s.score)).toFixed(1);

  renderStageDistribution(allStudents);
  renderNeedsAttention(allStudents);
}

function renderStageDistribution(allStudents) {
  const container = document.getElementById("stageDistribution");
  const counts = JOURNEY_STAGES.map(stage => ({
    stage,
    count: allStudents.filter(student => student.journeyStage === stage).length
  }));
  const max = Math.max(1, ...counts.map(item => item.count));

  container.innerHTML = counts.map(item => `
    <div class="bar-row">
      <span class="bar-label">${item.stage}</span>
      <span class="bar-track"><span class="bar-fill" style="width: ${(item.count / max) * 100}%"></span></span>
      <span class="bar-value">${item.count}</span>
    </div>
  `).join("");
}

function renderNeedsAttention(allStudents) {
  const container = document.getElementById("needsAttentionList");
  const flagged = allStudents
    .filter(student => student.status === "At Risk" || student.attendance.percent < 75)
    .sort((a, b) => a.attendance.percent - b.attendance.percent)
    .slice(0, 6);

  if (flagged.length === 0) {
    container.innerHTML = `<p class="empty-note">Har student track par hai.</p>`;
    return;
  }

  container.innerHTML = flagged.map(student => `
    <div class="mini-row">
      <span>${student.name}</span>
      <span class="badge ${student.status.toLowerCase().replace(" ", "-")}">${student.status}</span>
      <span>${student.attendance.percent}% attendance</span>
    </div>
  `).join("");
}

function getFilteredStudents() {
  const query = (document.getElementById("searchInput").value || "").toLowerCase();
  const stage = document.getElementById("stageFilter").value;
  const status = document.getElementById("statusFilter").value;
  const placement = document.getElementById("placementFilter").value;

  return getStudents().filter(student => {
    const matchesQuery = !query
      || student.name.toLowerCase().includes(query)
      || student.email.toLowerCase().includes(query);
    const matchesStage = !stage || student.journeyStage === stage;
    const matchesStatus = !status || student.status === status;
    const matchesPlacement = !placement || student.placement.status === placement;

    return matchesQuery && matchesStage && matchesStatus && matchesPlacement;
  });
}

function loadStudentsTable() {
  const filtered = getFilteredStudents();
  const tbody = document.getElementById("studentsTableBody");
  const countLabel = document.getElementById("studentCountLabel");

  countLabel.textContent = `${filtered.length} of ${getStudents().length} students`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-cell">Koi student nahi mila. Filters reset karein.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(student => `
    <tr>
      <td><strong>${student.name}</strong></td>
      <td>${student.email}</td>
      <td>${student.journeyStage}</td>
      <td><span class="badge ${student.status.toLowerCase().replace(" ", "-")}">${student.status}</span></td>
      <td>
        <span class="bar-track slim"><span class="bar-fill" style="width: ${getJourneyProgress(student)}%"></span></span>
        ${getJourneyProgress(student)}%
      </td>
      <td>${student.milestoneCompletion}%</td>
      <td>${student.attendance.percent}%</td>
      <td>${student.placement.status}</td>
      <td>${student.score.toFixed(1)}</td>
      <td>
        <div class="action-icons">
          <button class="icon-btn" onclick="openStudentProfile(${student.id})" title="View profile">👁️</button>
          <button class="icon-btn" onclick="editStudent(${student.id})" title="Edit">✏️</button>
          <button class="icon-btn delete" onclick="deleteStudent(${student.id})" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function readStudentForm() {
  const phaseDays = parseInt(document.getElementById("studentPhaseDays").value, 10) || 0;
  const stage = document.getElementById("studentStage").value || JOURNEY_STAGES[0];
  const stageIndex = Math.max(0, JOURNEY_STAGES.indexOf(stage));
  const attendancePresent = parseInt(document.getElementById("studentAttendance").value, 10) || 0;
  const attendanceTotal = 120;

  return {
    name: document.getElementById("studentName").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    password: document.getElementById("studentPassword").value,
    status: document.getElementById("studentStatus").value,
    journeyStage: stage,
    journeyStageIndex: stageIndex,
    milestones: JOURNEY_STAGES.map((title, index) => ({
      title,
      status: index < stageIndex ? "Completed" : index === stageIndex ? "In Progress" : "Pending"
    })),
    milestoneCompletion: parseInt(document.getElementById("studentMilestone").value, 10) || 0,
    ojtProgress: parseInt(document.getElementById("studentOJT").value, 10) || 0,
    score: parseFloat(document.getElementById("studentScore").value) || 0,
    attendance: {
      present: attendancePresent,
      total: attendanceTotal,
      percent: Math.round((attendancePresent / attendanceTotal) * 100)
    },
    phase: getLearningPhaseFromDays(phaseDays),
    phaseDays,
    leaveDays: parseInt(document.getElementById("studentLeaveDays").value, 10) || 0,
    htmlHoursSpent: parseFloat(document.getElementById("studentHtmlHours").value) || 0,
    cssHoursSpent: parseFloat(document.getElementById("studentCssHours").value) || 0,
    jsHoursSpent: parseFloat(document.getElementById("studentJsHours").value) || 0
  };
}

function setFormMessage(text, type) {
  const msg = document.getElementById("formMessage");
  msg.textContent = text;
  msg.classList.remove("success", "error");
  msg.classList.add(type);
}

function addNewStudent() {
  const values = readStudentForm();

  if (!values.name || !values.email || !values.password || !values.status) {
    setFormMessage("Sabhi required fields bharein.", "error");
    return;
  }

  const allStudents = loadStudents();
  if (allStudents.find(s => s.email.toLowerCase() === values.email.toLowerCase())) {
    setFormMessage("Yeh email pehle se registered hai.", "error");
    return;
  }

  allStudents.push({
    id: Math.max(...allStudents.map(s => s.id || 0), 1000) + 1,
    role: "Student",
    skills: [],
    projects: [],
    growth: [],
    placement: { status: values.status === "Placed" ? "Placed" : "Preparing", company: "", role: "", package: "" },
    ...values
  });
  saveStudents(allStudents);

  setFormMessage(`Student "${values.name}" successfully added!`, "success");

  document.getElementById("addStudentForm").reset();
  syncAutoPhaseField();
  loadDashboardData();

  setTimeout(() => switchSection("students"), 1200);
}

function editStudent(id) {
  const student = loadStudents().find(s => s.id === id);

  if (!student) {
    alert("Student not found");
    return;
  }

  editingStudentId = id;

  document.getElementById("studentName").value = student.name;
  document.getElementById("studentEmail").value = student.email;
  document.getElementById("studentPassword").value = student.password || "";
  document.getElementById("studentStage").value = student.journeyStage;
  document.getElementById("studentStatus").value = student.status;
  document.getElementById("studentOJT").value = student.ojtProgress;
  document.getElementById("studentMilestone").value = student.milestoneCompletion;
  document.getElementById("studentScore").value = student.score;
  document.getElementById("studentAttendance").value = student.attendance.present;
  document.getElementById("studentHtmlHours").value = student.htmlHoursSpent;
  document.getElementById("studentCssHours").value = student.cssHoursSpent;
  document.getElementById("studentJsHours").value = student.jsHoursSpent;
  document.getElementById("studentPhaseDays").value = student.phaseDays;
  document.getElementById("studentLeaveDays").value = student.leaveDays;
  syncAutoPhaseField();

  const form = document.getElementById("addStudentForm");
  form.querySelector('button[type="submit"]').textContent = "Update Student";

  const heading = document.querySelector("#add-student .section-header h1");
  if (heading) heading.textContent = "Edit Student";

  switchSection("add-student");
}

function updateStudent() {
  const id = editingStudentId;
  if (id === null) return;

  const values = readStudentForm();

  if (!values.name || !values.email || !values.password || !values.status) {
    setFormMessage("Sabhi required fields bharein.", "error");
    return;
  }

  const allStudents = loadStudents();
  const studentIndex = allStudents.findIndex(s => s.id === id);

  if (studentIndex === -1) {
    setFormMessage("Student not found", "error");
    return;
  }

  if (allStudents.find(s => s.id !== id && s.email.toLowerCase() === values.email.toLowerCase())) {
    setFormMessage("Yeh email pehle se registered hai.", "error");
    return;
  }

  allStudents[studentIndex] = { ...allStudents[studentIndex], ...values };
  saveStudents(allStudents);

  setFormMessage(`Student "${values.name}" updated successfully!`, "success");

  setTimeout(() => {
    const form = document.getElementById("addStudentForm");
    form.reset();
    editingStudentId = null;
    form.querySelector('button[type="submit"]').textContent = "Add Student";
    const heading = document.querySelector("#add-student .section-header h1");
    if (heading) heading.textContent = "Add New Student";
    syncAutoPhaseField();
    switchSection("students");
  }, 1000);
}

function deleteStudent(id) {
  if (!confirm("Kya aap is student ko delete karna chahte hain?")) return;

  saveStudents(loadStudents().filter(s => s.id !== id));

  loadStudentsTable();
  loadDashboardData();
}

function backupStudentData() {
  const data = {
    timestamp: new Date().toISOString(),
    students: loadStudents()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `student-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function restoreFromBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.students)) {
        alert("Invalid backup file format");
        return;
      }

      saveStudents(data.students);
      alert("Backup restored successfully!");
      location.reload();
    } catch (error) {
      alert("Error reading backup file: " + error.message);
    }
  };
  reader.readAsText(file);
}

function resetCustomStudents() {
  if (!confirm("Kya aap saara student data campus seed par reset karna chahte hain?")) return;

  localStorage.removeItem("studentDatabase");
  alert("Student data reset ho gaya!");
  location.reload();
}

document.addEventListener("DOMContentLoaded", initAdminPortal);
