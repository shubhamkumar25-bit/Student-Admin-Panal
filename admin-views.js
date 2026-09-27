// Journey, milestone, skill, attendance, project, placement and growth views.

let selectedStudentId = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function progressBar(percent, extraClass = "") {
  return `<span class="bar-track ${extraClass}"><span class="bar-fill" style="width: ${Math.max(0, Math.min(100, percent))}%"></span></span>`;
}

function statusBadge(status) {
  return `<span class="badge ${status.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(status)}</span>`;
}

function openStudentProfile(id) {
  selectedStudentId = id;
  switchSection("profile");
}

function getSelectedStudent() {
  const students = getStudentRecords();
  if (students.length === 0) return null;
  return students.find(student => student.id === selectedStudentId) || students[0];
}

function renderProfileSelect(students, selected) {
  const select = document.getElementById("profileSelect");
  select.innerHTML = students.map(student => `
    <option value="${student.id}" ${student.id === selected.id ? "selected" : ""}>${escapeHtml(student.name)}</option>
  `).join("");
}

function renderProfile() {
  const container = document.getElementById("profileContent");
  const students = getStudentRecords();
  const student = getSelectedStudent();

  if (!student) {
    container.innerHTML = `<p class="empty-note">Abhi koi student record nahi hai.</p>`;
    return;
  }

  selectedStudentId = student.id;
  renderProfileSelect(students, student);

  const initials = student.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();

  container.innerHTML = `
    <article class="profile-card">
      <div class="profile-avatar">${escapeHtml(initials)}</div>
      <div class="profile-meta">
        <h2>${escapeHtml(student.name)}</h2>
        <p>${escapeHtml(student.email)}</p>
        <p>${escapeHtml(student.journeyStage)} · ${escapeHtml(student.phase)}</p>
        <div class="profile-badges">
          ${statusBadge(student.status)}
          ${statusBadge(student.placement.status)}
        </div>
      </div>
      <div class="profile-stats">
        <div><strong>${getJourneyProgress(student)}%</strong><span>Journey</span></div>
        <div><strong>${student.milestoneCompletion}%</strong><span>Milestones</span></div>
        <div><strong>${student.attendance.percent}%</strong><span>Attendance</span></div>
        <div><strong>${student.score.toFixed(1)}</strong><span>Score</span></div>
      </div>
    </article>

    <div class="panel-grid">
      <article class="panel-card">
        <h3>Learning Journey</h3>
        <ol class="timeline">
          ${JOURNEY_STAGES.map((stage, index) => {
            const state = index < student.journeyStageIndex
              ? "done"
              : index === student.journeyStageIndex ? "current" : "pending";
            return `<li class="timeline-item ${state}"><span class="timeline-dot"></span><div><strong>${escapeHtml(stage)}</strong><span>${state === "done" ? "Completed" : state === "current" ? "In Progress" : "Pending"}</span></div></li>`;
          }).join("")}
        </ol>
      </article>

      <article class="panel-card">
        <h3>Skills &amp; Progress</h3>
        <div class="bar-list">
          ${(student.skills.length ? student.skills : SKILL_NAMES.map(name => ({ name, level: 0 }))).map(skill => `
            <div class="bar-row">
              <span class="bar-label">${escapeHtml(skill.name)}</span>
              ${progressBar(skill.level)}
              <span class="bar-value">${skill.level}%</span>
            </div>
          `).join("")}
        </div>
      </article>

      <article class="panel-card">
        <h3>Milestones</h3>
        <div class="mini-list">
          ${student.milestones.map(milestone => `
            <div class="mini-row">
              <span>${escapeHtml(milestone.title)}</span>
              ${statusBadge(milestone.status)}
            </div>
          `).join("")}
        </div>
      </article>

      <article class="panel-card">
        <h3>Projects</h3>
        <div class="mini-list">
          ${student.projects.length === 0
            ? `<p class="empty-note">Abhi koi project submit nahi hua.</p>`
            : student.projects.map(project => `
              <div class="mini-row">
                <span><strong>${escapeHtml(project.name)}</strong> · ${escapeHtml(project.tech)}</span>
                ${statusBadge(project.status)}
              </div>
            `).join("")}
        </div>
      </article>

      <article class="panel-card">
        <h3>Attendance</h3>
        <p class="panel-note">${student.attendance.present} present / ${student.attendance.total} days · ${student.leaveDays} leave days</p>
        ${progressBar(student.attendance.percent)}
      </article>

      <article class="panel-card">
        <h3>Placement Status</h3>
        <p class="panel-note">${statusBadge(student.placement.status)}</p>
        ${student.placement.company
          ? `<p class="panel-note">${escapeHtml(student.placement.company)} · ${escapeHtml(student.placement.role)} · ${escapeHtml(student.placement.package)}</p>`
          : `<p class="panel-note">Placement drive ke liye prepare kar rahe hain.</p>`}
      </article>

      <article class="panel-card wide">
        <h3>Growth &amp; Performance</h3>
        <div class="bar-list">
          ${student.growth.map(point => `
            <div class="bar-row">
              <span class="bar-label">${escapeHtml(point.month)}</span>
              ${progressBar((point.score / 5) * 100)}
              <span class="bar-value">${point.score.toFixed(1)}</span>
            </div>
          `).join("")}
        </div>
      </article>
    </div>
  `;
}

function renderJourney() {
  const students = getStudentRecords();
  document.getElementById("journeyContent").innerHTML = `
    <div class="students-table-container">
      <table class="students-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Current Stage</th>
            <th>Stage No.</th>
            <th>Journey Progress</th>
            <th>Next Stage</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td><strong>${escapeHtml(student.name)}</strong><br /><span class="muted">${escapeHtml(student.email)}</span></td>
              <td>${escapeHtml(student.journeyStage)}</td>
              <td>${student.journeyStageIndex + 1}</td>
              <td>${progressBar(getJourneyProgress(student), "slim")} ${getJourneyProgress(student)}%</td>
              <td>${escapeHtml(JOURNEY_STAGES[student.journeyStageIndex + 1] || "Journey complete")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStages() {
  const students = getStudentRecords();
  document.getElementById("stagesContent").innerHTML = `
    <ol class="stage-grid">
      ${JOURNEY_STAGES.map((stage, index) => {
        const inStage = students.filter(student => student.journeyStageIndex === index);
        const completed = students.filter(student => student.journeyStageIndex > index).length;
        return `
          <li class="stage-card">
            <span class="stage-index">Stage ${index + 1}</span>
            <h3>${escapeHtml(stage)}</h3>
            <p class="panel-note">${inStage.length} students here · ${completed} completed</p>
            ${progressBar((completed / Math.max(1, students.length)) * 100, "slim")}
          </li>
        `;
      }).join("")}
    </ol>
  `;
}

function renderMilestones() {
  const students = getStudentRecords();
  document.getElementById("milestonesContent").innerHTML = `
    <div class="panel-grid">
      <article class="panel-card wide">
        <h3>Milestone completion by stage</h3>
        <div class="bar-list">
          ${JOURNEY_STAGES.map((stage, index) => {
            const completed = students.filter(student => student.journeyStageIndex > index).length;
            const percent = Math.round((completed / Math.max(1, students.length)) * 100);
            return `
              <div class="bar-row">
                <span class="bar-label">${escapeHtml(stage)}</span>
                ${progressBar(percent)}
                <span class="bar-value">${percent}%</span>
              </div>
            `;
          }).join("")}
        </div>
      </article>
    </div>

    <div class="students-table-container">
      <table class="students-table">
        <thead>
          <tr><th>Student</th><th>Completed</th><th>In Progress</th><th>Pending</th><th>Completion</th></tr>
        </thead>
        <tbody>
          ${students.map(student => {
            const completed = student.milestones.filter(m => m.status === "Completed").length;
            const inProgress = student.milestones.filter(m => m.status === "In Progress").length;
            const pending = student.milestones.filter(m => m.status === "Pending").length;
            return `
              <tr>
                <td><strong>${escapeHtml(student.name)}</strong></td>
                <td>${completed}</td>
                <td>${inProgress}</td>
                <td>${pending}</td>
                <td>${progressBar(student.milestoneCompletion, "slim")} ${student.milestoneCompletion}%</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSkills() {
  const students = getStudentRecords();
  const averages = SKILL_NAMES.map(name => {
    const levels = students
      .map(student => (student.skills.find(skill => skill.name === name) || {}).level || 0);
    return { name, level: Math.round(levels.reduce((sum, value) => sum + value, 0) / Math.max(1, levels.length)) };
  });

  document.getElementById("skillsContent").innerHTML = `
    <article class="panel-card wide">
      <h3>Campus skill averages</h3>
      <div class="bar-list">
        ${averages.map(skill => `
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(skill.name)}</span>
            ${progressBar(skill.level)}
            <span class="bar-value">${skill.level}%</span>
          </div>
        `).join("")}
      </div>
    </article>

    <div class="students-table-container">
      <table class="students-table">
        <thead>
          <tr><th>Student</th>${SKILL_NAMES.map(name => `<th>${escapeHtml(name)}</th>`).join("")}<th>OJT %</th></tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td><strong>${escapeHtml(student.name)}</strong></td>
              ${SKILL_NAMES.map(name => {
                const skill = student.skills.find(item => item.name === name);
                return `<td>${skill ? `${skill.level}%` : "-"}</td>`;
              }).join("")}
              <td>${student.ojtProgress}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAttendance() {
  const students = getStudentRecords();
  const low = students.filter(student => student.attendance.percent < 75).length;
  const campusAverage = Math.round(
    students.reduce((sum, student) => sum + student.attendance.percent, 0) / Math.max(1, students.length)
  );

  document.getElementById("attendanceContent").innerHTML = `
    <div class="dashboard-grid">
      <div class="dashboard-card green">
        <div class="card-number">${campusAverage}%</div>
        <div class="card-label">Campus Average</div>
      </div>
      <div class="dashboard-card purple">
        <div class="card-number">${low}</div>
        <div class="card-label">Below 75%</div>
      </div>
    </div>

    <div class="students-table-container">
      <table class="students-table">
        <thead>
          <tr><th>Student</th><th>Present</th><th>Total Days</th><th>Leave Days</th><th>Attendance</th></tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td><strong>${escapeHtml(student.name)}</strong></td>
              <td>${student.attendance.present}</td>
              <td>${student.attendance.total}</td>
              <td>${student.leaveDays}</td>
              <td>${progressBar(student.attendance.percent, "slim")} ${student.attendance.percent}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderProjects() {
  const students = getStudentRecords();
  const rows = students.flatMap(student =>
    student.projects.map(project => ({ student, project }))
  );

  document.getElementById("projectsContent").innerHTML = `
    <div class="students-table-container">
      <table class="students-table">
        <thead>
          <tr><th>Student</th><th>Project</th><th>Tech Stack</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${rows.length === 0
            ? `<tr><td colspan="4" class="empty-cell">Abhi koi project record nahi hai.</td></tr>`
            : rows.map(({ student, project }) => `
              <tr>
                <td><strong>${escapeHtml(student.name)}</strong></td>
                <td>${escapeHtml(project.name)}</td>
                <td>${escapeHtml(project.tech)}</td>
                <td>${statusBadge(project.status)}</td>
              </tr>
            `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPlacement() {
  const students = getStudentRecords();
  const placed = students.filter(student => student.placement.status === "Placed");
  const interviewing = students.filter(student => student.placement.status === "Interviewing");

  document.getElementById("placementContent").innerHTML = `
    <div class="dashboard-grid">
      <div class="dashboard-card green">
        <div class="card-number">${placed.length}</div>
        <div class="card-label">Placed</div>
      </div>
      <div class="dashboard-card blue">
        <div class="card-number">${interviewing.length}</div>
        <div class="card-label">Interviewing</div>
      </div>
      <div class="dashboard-card orange">
        <div class="card-number">${students.length - placed.length - interviewing.length}</div>
        <div class="card-label">Preparing</div>
      </div>
    </div>

    <div class="students-table-container">
      <table class="students-table">
        <thead>
          <tr><th>Student</th><th>Journey Stage</th><th>Placement</th><th>Company</th><th>Role</th><th>Package</th></tr>
        </thead>
        <tbody>
          ${students.map(student => `
            <tr>
              <td><strong>${escapeHtml(student.name)}</strong></td>
              <td>${escapeHtml(student.journeyStage)}</td>
              <td>${statusBadge(student.placement.status)}</td>
              <td>${escapeHtml(student.placement.company || "-")}</td>
              <td>${escapeHtml(student.placement.role || "-")}</td>
              <td>${escapeHtml(student.placement.package || "-")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderGrowth() {
  const students = getStudentRecords();
  const months = (students.find(student => student.growth.length) || { growth: [] }).growth.map(point => point.month);
  const monthlyAverage = months.map((month, index) => {
    const scores = students
      .filter(student => student.growth[index])
      .map(student => student.growth[index].score);
    return { month, score: scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length) };
  });

  const topPerformers = [...students].sort((a, b) => b.score - a.score).slice(0, 8);

  document.getElementById("growthContent").innerHTML = `
    <div class="panel-grid">
      <article class="panel-card">
        <h3>Campus average score by month</h3>
        <div class="bar-list">
          ${monthlyAverage.map(point => `
            <div class="bar-row">
              <span class="bar-label">${escapeHtml(point.month)}</span>
              ${progressBar((point.score / 5) * 100)}
              <span class="bar-value">${point.score.toFixed(1)}</span>
            </div>
          `).join("")}
        </div>
      </article>

      <article class="panel-card">
        <h3>Top performers</h3>
        <div class="mini-list">
          ${topPerformers.map(student => `
            <div class="mini-row">
              <span>${escapeHtml(student.name)}</span>
              <span>${escapeHtml(student.journeyStage)}</span>
              <span>${student.score.toFixed(1)}</span>
            </div>
          `).join("")}
        </div>
      </article>
    </div>
  `;
}

const SECTION_RENDERERS = {
  profile: renderProfile,
  journey: renderJourney,
  stages: renderStages,
  milestones: renderMilestones,
  skills: renderSkills,
  attendance: renderAttendance,
  projects: renderProjects,
  placement: renderPlacement,
  growth: renderGrowth
};

function renderAnalyticsSection(sectionId) {
  const renderer = SECTION_RENDERERS[sectionId];
  if (renderer) renderer();
}

document.addEventListener("DOMContentLoaded", () => {
  const profileSelect = document.getElementById("profileSelect");
  profileSelect.addEventListener("change", () => {
    selectedStudentId = Number(profileSelect.value);
    renderProfile();
  });
});
