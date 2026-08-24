// Admin Portal JavaScript

let editingStudentId = null;

function initAdminPortal() {
  const session = JSON.parse(localStorage.getItem("studentPortalSession") || "{}");

  // Check if user is admin
  if (session.role !== "Admin") {
    alert("Access denied. Admin only.");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("adminEmail").textContent = session.email || "Admin";
  loadDashboardData();
  loadStudentsTable();
  setupEventListeners();
  syncAutoPhaseField();
}

function normalizeStudent(student) {
  const phaseDays = Number(student.phaseDays) || 0;
  const autoPhase = getLearningPhaseFromDays(phaseDays);

  return {
    ...student,
    phase: autoPhase,
    status: student.status || "Pending",
    ojtProgress: Number(student.ojtProgress) || 0,
    milestoneCompletion: Number(student.milestoneCompletion) || 0,
    score: Number(student.score) || 0,
    htmlHoursSpent: Number(student.htmlHoursSpent) || 0,
    cssHoursSpent: Number(student.cssHoursSpent) || 0,
    jsHoursSpent: Number(student.jsHoursSpent) || 0,
    phaseDays,
    leaveDays: Number(student.leaveDays) || 0
  };
}

function getLearningPhaseFromDays(phaseDays) {
  const totalDays = Number(phaseDays) || 0;
  if (totalDays <= 12) return "Phase 1 - HTML";
  if (totalDays <= 26) return "Phase 2 - CSS";
  if (totalDays <= 44) return "Phase 3 - JavaScript";
  if (totalDays <= 60) return "Phase 4 - Node.js";
  return "Phase 5 - Express.js + MongoDB";
}

function syncAutoPhaseField() {
  const phaseDaysInput = document.getElementById("studentPhaseDays");
  const phaseField = document.getElementById("studentPhase");

  if (!phaseDaysInput || !phaseField) return;

  const autoPhase = getLearningPhaseFromDays(phaseDaysInput.value);
  phaseField.value = autoPhase;
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      const section = link.dataset.section;
      if (!section) {
        return;
      }

      e.preventDefault();
      switchSection(section);
    });
  });

  // Form submission
  document.getElementById("addStudentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (editingStudentId !== null) {
      updateStudent();
      return;
    }
    addNewStudent();
  });

  // Search
  document.getElementById("searchInput").addEventListener("input", filterStudentsTable);

  document.getElementById("studentPhaseDays").addEventListener("input", syncAutoPhaseField);

  // Logout
  document.getElementById("adminLogoutBtn").addEventListener("click", () => {
    localStorage.removeItem("studentPortalSession");
    window.location.href = "login.html";
  });

  // Restore file input
  document.getElementById("restoreFile").addEventListener("change", restoreFromBackup);
}

function switchSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".admin-section").forEach(section => {
    section.classList.remove("active");
  });

  // Show selected section
  document.getElementById(sectionId).classList.add("active");

  // Update nav links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    if (link.dataset.section === sectionId) {
      link.classList.add("active");
    }
  });

  // Reload data if needed
  if (sectionId === "students") {
    loadStudentsTable();
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

function loadDashboardData() {
  const allStudents = getStudentsFromStorage();

  const total = allStudents.length;
  const active = allStudents.filter(s => s.status === "Active").length;
  const placed = allStudents.filter(s => s.status === "Placed").length;
  const atRisk = allStudents.filter(s => s.status === "At Risk").length;
  const avgPhaseDays = total ? Math.round(allStudents.reduce((sum, student) => sum + (student.phaseDays || 0), 0) / total) : 0;
  const avgLeaveDays = total ? Math.round(allStudents.reduce((sum, student) => sum + (student.leaveDays || 0), 0) / total) : 0;

  document.getElementById("totalStudents").textContent = total;
  document.getElementById("activeStudents").textContent = active;
  document.getElementById("placedStudents").textContent = placed;
  document.getElementById("atRiskStudents").textContent = atRisk;
  const avgPhaseDaysEl = document.getElementById("avgPhaseDays");
  const avgLeaveDaysEl = document.getElementById("avgLeaveDays");
  if (avgPhaseDaysEl) avgPhaseDaysEl.textContent = avgPhaseDays;
  if (avgLeaveDaysEl) avgLeaveDaysEl.textContent = avgLeaveDays;
}

function getStudentsFromStorage() {
  const stored = localStorage.getItem("studentDatabase");
  if (!stored) return [];
  try {
    const students = JSON.parse(stored);
    if (!Array.isArray(students)) return [];
    return students.map(normalizeStudent);
  } catch {
    return [];
  }
}

function loadStudentsTable() {
  const allStudents = getStudentsFromStorage();
  const tbody = document.getElementById("studentsTableBody");

  if (allStudents.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="13" style="text-align: center; padding: 20px; color: var(--text-fade);">
          कोई students नहीं। 
          <a href="#" onclick="switchSection('add-student'); return false;" style="color: var(--accent);">नया student add करें</a>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = allStudents.map(student => `
    <tr>
      <td><strong>${student.name}</strong></td>
      <td>${student.email}</td>
      <td>${getLearningPhaseFromDays(student.phaseDays)}</td>
      <td><span class="badge ${student.status.toLowerCase().replace(" ", "-")}">${student.status}</span></td>
      <td>${student.ojtProgress || 0}%</td>
      <td>${student.milestoneCompletion || 0}%</td>
      <td>${student.htmlHoursSpent || 0}</td>
      <td>${student.cssHoursSpent || 0}</td>
      <td>${student.jsHoursSpent || 0}</td>
      <td>${student.phaseDays || 0}</td>
      <td>${student.leaveDays || 0}</td>
      <td>${(student.score || 0).toFixed(1)}</td>
      <td>
        <div class="action-icons">
          <button class="icon-btn" onclick="editStudent(${student.id})" title="Edit">✏️</button>
          <button class="icon-btn delete" onclick="deleteStudent(${student.id})" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function filterStudentsTable() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const allStudents = getStudentsFromStorage();
  const filtered = allStudents.filter(s => 
    s.name.toLowerCase().includes(query) || 
    s.email.toLowerCase().includes(query)
  );

  const tbody = document.getElementById("studentsTableBody");
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="13" style="text-align: center; padding: 20px; color: var(--text-fade);">कोई students नहीं मिले।</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(student => `
    <tr>
      <td><strong>${student.name}</strong></td>
      <td>${student.email}</td>
      <td>${getLearningPhaseFromDays(student.phaseDays)}</td>
      <td><span class="badge ${student.status.toLowerCase().replace(" ", "-")}">${student.status}</span></td>
      <td>${student.ojtProgress || 0}%</td>
      <td>${student.milestoneCompletion || 0}%</td>
      <td>${student.htmlHoursSpent || 0}</td>
      <td>${student.cssHoursSpent || 0}</td>
      <td>${student.jsHoursSpent || 0}</td>
      <td>${student.phaseDays || 0}</td>
      <td>${student.leaveDays || 0}</td>
      <td>${(student.score || 0).toFixed(1)}</td>
      <td>
        <div class="action-icons">
          <button class="icon-btn" onclick="editStudent(${student.id})" title="Edit">✏️</button>
          <button class="icon-btn delete" onclick="deleteStudent(${student.id})" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function addNewStudent() {
  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const password = document.getElementById("studentPassword").value;
  const selectedPhase = document.getElementById("studentPhase").value;
  const status = document.getElementById("studentStatus").value;
  const ojtProgress = parseInt(document.getElementById("studentOJT").value) || 0;
  const milestoneCompletion = parseInt(document.getElementById("studentMilestone").value) || 0;
  const score = parseFloat(document.getElementById("studentScore").value) || 0;
  const htmlHoursSpent = parseFloat(document.getElementById("studentHtmlHours").value) || 0;
  const cssHoursSpent = parseFloat(document.getElementById("studentCssHours").value) || 0;
  const jsHoursSpent = parseFloat(document.getElementById("studentJsHours").value) || 0;
  const phaseDays = parseInt(document.getElementById("studentPhaseDays").value) || 0;
  const leaveDays = parseInt(document.getElementById("studentLeaveDays").value) || 0;
  const learningPhase = selectedPhase || getLearningPhaseFromDays(phaseDays);

  const msg = document.getElementById("formMessage");

  // Validation
  if (!name || !email || !password || !status) {
    msg.textContent = "सभी आवश्यक fields भरें।";
    msg.classList.remove("success");
    msg.classList.add("error");
    return;
  }

  const allStudents = getStudentsFromStorage();
  if (allStudents.find(s => s.email.toLowerCase() === email.toLowerCase())) {
    msg.textContent = "यह email पहले से registered है।";
    msg.classList.remove("success");
    msg.classList.add("error");
    return;
  }

  // Create new student
  const newStudent = {
    id: Math.max(...allStudents.map(s => s.id || 0), 100) + 1,
    name,
    email,
    password,
    role: "Student",
    phase: learningPhase,
    status,
    ojtProgress,
    milestoneCompletion,
    score,
    htmlHoursSpent,
    cssHoursSpent,
    jsHoursSpent,
    learningPhase,
    phaseDays,
    leaveDays
  };

  allStudents.push(newStudent);
  localStorage.setItem("studentDatabase", JSON.stringify(allStudents));

  // Success message
  msg.textContent = `✅ Student "${name}" successfully added!`;
  msg.classList.remove("error");
  msg.classList.add("success");

  // Reset form
  document.getElementById("addStudentForm").reset();
  syncAutoPhaseField();
  loadDashboardData();

  // Auto-switch to students list after 1.5s
  setTimeout(() => {
    switchSection("students");
  }, 1500);
}

function editStudent(id) {
  const allStudents = getStudentsFromStorage();
  const student = allStudents.find(s => s.id === id);

  if (!student) {
    alert("Student not found");
    return;
  }

  editingStudentId = id;

  // Populate form
  document.getElementById("studentName").value = student.name;
  document.getElementById("studentEmail").value = student.email;
  document.getElementById("studentPassword").value = student.password;
  document.getElementById("studentPhase").value = student.learningPhase || getLearningPhaseFromDays(student.phaseDays);
  document.getElementById("studentStatus").value = student.status;
  document.getElementById("studentOJT").value = student.ojtProgress || 0;
  document.getElementById("studentMilestone").value = student.milestoneCompletion || 0;
  document.getElementById("studentScore").value = student.score || 0;
  document.getElementById("studentHtmlHours").value = student.htmlHoursSpent || 0;
  document.getElementById("studentCssHours").value = student.cssHoursSpent || 0;
  document.getElementById("studentJsHours").value = student.jsHoursSpent || 0;
  document.getElementById("studentPhaseDays").value = student.phaseDays || 0;
  document.getElementById("studentLeaveDays").value = student.leaveDays || 0;

  // Change button text
  const form = document.getElementById("addStudentForm");
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "Update Student";

  const heading = document.querySelector("#add-student .section-header h1");
  if (heading) heading.textContent = "Edit Student";

  switchSection("add-student");
}

function updateStudent() {
  const id = editingStudentId;
  if (id === null) return;

  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const password = document.getElementById("studentPassword").value;
  const selectedPhase = document.getElementById("studentPhase").value;
  const status = document.getElementById("studentStatus").value;
  const ojtProgress = parseInt(document.getElementById("studentOJT").value) || 0;
  const milestoneCompletion = parseInt(document.getElementById("studentMilestone").value) || 0;
  const score = parseFloat(document.getElementById("studentScore").value) || 0;
  const htmlHoursSpent = parseFloat(document.getElementById("studentHtmlHours").value) || 0;
  const cssHoursSpent = parseFloat(document.getElementById("studentCssHours").value) || 0;
  const jsHoursSpent = parseFloat(document.getElementById("studentJsHours").value) || 0;
  const phaseDays = parseInt(document.getElementById("studentPhaseDays").value) || 0;
  const leaveDays = parseInt(document.getElementById("studentLeaveDays").value) || 0;
  const learningPhase = selectedPhase || getLearningPhaseFromDays(phaseDays);

  const msg = document.getElementById("formMessage");

  if (!name || !email || !password || !status) {
    msg.textContent = "सभी आवश्यक fields भरें।";
    msg.classList.remove("success");
    msg.classList.add("error");
    return;
  }

  let allStudents = getStudentsFromStorage();
  const studentIndex = allStudents.findIndex(s => s.id === id);

  if (studentIndex === -1) {
    msg.textContent = "Student not found";
    msg.classList.remove("success");
    msg.classList.add("error");
    return;
  }

  const duplicate = allStudents.find(s => s.id !== id && s.email.toLowerCase() === email.toLowerCase());
  if (duplicate) {
    msg.textContent = "यह email पहले से registered है।";
    msg.classList.remove("success");
    msg.classList.add("error");
    return;
  }

  // Update student
  allStudents[studentIndex] = {
    ...allStudents[studentIndex],
    name,
    email,
    password,
    status,
    ojtProgress,
    milestoneCompletion,
    score,
    htmlHoursSpent,
    cssHoursSpent,
    jsHoursSpent,
    phase: learningPhase,
    learningPhase,
    phaseDays,
    leaveDays
  };

  localStorage.setItem("studentDatabase", JSON.stringify(allStudents));

  msg.textContent = `✅ Student "${name}" updated successfully!`;
  msg.classList.remove("error");
  msg.classList.add("success");

  // Reset form
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
  if (!confirm("क्या आप इस student को delete करना चाहते हैं?")) return;

  let allStudents = getStudentsFromStorage();
  allStudents = allStudents.filter(s => s.id !== id);
  localStorage.setItem("studentDatabase", JSON.stringify(allStudents));

  loadStudentsTable();
  loadDashboardData();
}

function backupStudentData() {
  const allStudents = getStudentsFromStorage();
  const data = {
    timestamp: new Date().toISOString(),
    students: allStudents
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
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

      localStorage.setItem("studentDatabase", JSON.stringify(data.students));
      alert("✅ Backup restored successfully!");
      location.reload();
    } catch (error) {
      alert("Error reading backup file: " + error.message);
    }
  };
  reader.readAsText(file);
}

function resetCustomStudents() {
  if (!confirm("क्या आप सभी custom students को delete करना चाहते हैं? यह action reverse नहीं हो सकता।")) return;

  localStorage.removeItem("studentDatabase");
  alert("✅ Custom student data cleared!");
  location.reload();
}

function generateDemoStudents() {
  const demoStudents = [
    { id: 101, name: "Demo Student 1", email: "demo1@navgurukul.org", password: "demo@2026", role: "Student", phase: "Foundation", status: "Active", ojtProgress: 50, milestoneCompletion: 60, score: 4.2, htmlHoursSpent: 18, cssHoursSpent: 16, jsHoursSpent: 20, phaseDays: 30, leaveDays: 1 },
    { id: 102, name: "Demo Student 2", email: "demo2@navgurukul.org", password: "demo@2026", role: "Student", phase: "Intermediate", status: "Active", ojtProgress: 70, milestoneCompletion: 80, score: 4.5, htmlHoursSpent: 26, cssHoursSpent: 24, jsHoursSpent: 31, phaseDays: 44, leaveDays: 2 },
    { id: 103, name: "Demo Student 3", email: "demo3@navgurukul.org", password: "demo@2026", role: "Student", phase: "Advanced", status: "Placed", ojtProgress: 100, milestoneCompletion: 100, score: 4.9, htmlHoursSpent: 34, cssHoursSpent: 30, jsHoursSpent: 40, phaseDays: 60, leaveDays: 0 }
  ];

  let allStudents = getStudentsFromStorage();
  allStudents.push(...demoStudents);
  localStorage.setItem("studentDatabase", JSON.stringify(allStudents));

  alert("✅ Demo students added!");
  location.reload();
}

// Initialize on load
document.addEventListener("DOMContentLoaded", initAdminPortal);
