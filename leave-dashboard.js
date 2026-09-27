let currentLeaveRows = [];
let currentLeaveRange = { from: "", to: "" };

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

function normalizeLeaveStudent(student) {
  const phaseDays = Number(student.phaseDays) || 0;
  const leaveDays = Number(student.leaveDays) || 0;
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
    leaveDays,
    phaseStartDate: toISODate(phaseStart),
    phaseEndDate: toISODate(phaseEnd)
  };
}

function getLeaveStudents() {
  return getStudentRecords().map(normalizeLeaveStudent);
}

function getRiskLabel(leaveDays) {
  if (leaveDays >= 4) return { text: "High", className: "high" };
  if (leaveDays >= 2) return { text: "Medium", className: "medium" };
  return { text: "Low", className: "low" };
}

function toCsvField(value) {
  const safe = String(value ?? "").replace(/"/g, '""');
  return `"${safe}"`;
}

function exportLeaveCsv() {
  const rows = [
    ["Student", "Email", "Phase", "From", "To", "Phase Days (Range)", "Leave Days (Range)", "Attendance Score"]
  ];

  currentLeaveRows.forEach(student => {
    const attendance = student.rangePhaseDays > 0
      ? Math.max(0, ((1 - student.rangeLeaveDays / student.rangePhaseDays) * 100)).toFixed(1)
      : "0.0";
    rows.push([
      student.name,
      student.email || "N/A",
      student.phase,
      currentLeaveRange.from,
      currentLeaveRange.to,
      student.rangePhaseDays,
      student.rangeLeaveDays,
      `${attendance}%`
    ]);
  });

  const csv = rows.map(row => row.map(toCsvField).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leave-dashboard-report-${currentLeaveRange.from}-to-${currentLeaveRange.to}.csv`;
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

      const ratio = student.phaseDays > 0 ? activeDays / student.phaseDays : 0;
      const rangeLeaveDays = Number((student.leaveDays * ratio).toFixed(1));

      return {
        ...student,
        rangePhaseDays: activeDays,
        rangeLeaveDays
      };
    })
    .filter(Boolean);
}

function renderLeaveDashboard(fromValue, toValue) {
  const session = JSON.parse(localStorage.getItem("studentPortalSession") || "{}");
  const allStudents = getLeaveStudents();
  const isStudent = session.role === "Student";
  const currentEmail = (session.email || "").toLowerCase();
  const baseStudents = isStudent ? allStudents.filter(student => (student.email || "").toLowerCase() === currentEmail) : allStudents;

  document.getElementById("leaveUserEmail").textContent = session.email || "Guest";

  const allStartDates = baseStudents.map(student => parseISODate(student.phaseStartDate)).filter(Boolean);
  const allEndDates = baseStudents.map(student => parseISODate(student.phaseEndDate)).filter(Boolean);
  const fallbackFrom = allStartDates.length ? new Date(Math.min(...allStartDates.map(date => date.getTime()))) : new Date();
  const fallbackTo = allEndDates.length ? new Date(Math.max(...allEndDates.map(date => date.getTime()))) : new Date();

  const fromDate = parseISODate(fromValue) || fallbackFrom;
  const toDate = parseISODate(toValue) || fallbackTo;
  const validFrom = fromDate <= toDate ? fromDate : toDate;
  const validTo = toDate >= fromDate ? toDate : fromDate;

  const fromInput = document.getElementById("leaveRangeFrom");
  const toInput = document.getElementById("leaveRangeTo");
  if (fromInput && toInput) {
    fromInput.value = toISODate(validFrom);
    toInput.value = toISODate(validTo);
  }

  currentLeaveRange = { from: toISODate(validFrom), to: toISODate(validTo) };
  const students = getRangeFilteredStudents(baseStudents, validFrom, validTo);
  currentLeaveRows = students;

  const totalLeave = students.reduce((sum, student) => sum + student.rangeLeaveDays, 0);
  const totalPhaseDays = students.reduce((sum, student) => sum + student.rangePhaseDays, 0);
  const avgLeave = students.length ? (totalLeave / students.length).toFixed(1) : "0.0";
  const avgAttendance = totalPhaseDays > 0 ? Math.max(0, ((1 - totalLeave / totalPhaseDays) * 100)).toFixed(1) : "0.0";
  const maxLeave = students.reduce((max, student) => Math.max(max, student.rangeLeaveDays), 0);

  document.getElementById("leaveStats").innerHTML = `
    <article class="stat">
      <div class="stat-label">Students Tracked</div>
      <div class="stat-value">${students.length}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Total Leave Days</div>
      <div class="stat-value">${totalLeave.toFixed(1)}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Average Leave Days</div>
      <div class="stat-value">${avgLeave}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Highest Leave Days</div>
      <div class="stat-value">${Number(maxLeave).toFixed(1)}</div>
    </article>
    <article class="stat">
      <div class="stat-label">Avg Attendance Score</div>
      <div class="stat-value">${avgAttendance}%</div>
    </article>
  `;

  const maxBar = Math.max(...students.map(student => student.rangeLeaveDays), 1);
  document.getElementById("leaveBars").innerHTML = students
    .slice()
    .sort((a, b) => b.rangeLeaveDays - a.rangeLeaveDays)
    .map(student => `
      <div class="bar-row">
        <span>${student.name.split(" ")[0]}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${(student.rangeLeaveDays / maxBar) * 100}%;"></div>
        </div>
        <strong>${student.rangeLeaveDays.toFixed(1)} days</strong>
      </div>
    `)
    .join("");

  document.getElementById("leaveRisk").innerHTML = students
    .slice()
    .sort((a, b) => b.rangeLeaveDays - a.rangeLeaveDays)
    .map(student => {
      const risk = getRiskLabel(student.rangeLeaveDays);
      return `
        <div class="risk-item">
          <div>
            <div>${student.name}</div>
            <small>${student.phase} phase</small>
          </div>
          <span class="risk-badge ${risk.className}">${risk.text}</span>
        </div>
      `;
    })
    .join("");

  document.getElementById("leaveTableBody").innerHTML = students
    .map(student => {
      const attendanceScore = student.rangePhaseDays > 0
        ? Math.max(0, ((1 - student.rangeLeaveDays / student.rangePhaseDays) * 100)).toFixed(1)
        : "0.0";
      return `
        <tr>
          <td>${student.name}</td>
          <td>${student.email || "N/A"}</td>
          <td>${student.phase}</td>
          <td>${student.rangePhaseDays}</td>
          <td>${student.rangeLeaveDays.toFixed(1)}</td>
          <td>${attendanceScore}%</td>
        </tr>
      `;
    })
    .join("");
}

function initLeaveDashboard() {
  const applyBtn = document.getElementById("leaveApplyBtn");
  const resetBtn = document.getElementById("leaveResetBtn");
  const exportBtn = document.getElementById("leaveExportCsvBtn");
  const fromInput = document.getElementById("leaveRangeFrom");
  const toInput = document.getElementById("leaveRangeTo");

  renderLeaveDashboard();

  applyBtn.addEventListener("click", () => {
    renderLeaveDashboard(fromInput.value, toInput.value);
  });

  resetBtn.addEventListener("click", () => {
    fromInput.value = "";
    toInput.value = "";
    renderLeaveDashboard();
  });

  exportBtn.addEventListener("click", exportLeaveCsv);
}

document.addEventListener("DOMContentLoaded", initLeaveDashboard);

