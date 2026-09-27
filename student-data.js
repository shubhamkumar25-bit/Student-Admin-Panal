// Shared student dataset for the NavGurukul Student Admin Panel.
// Data lives in localStorage so every dashboard page reads the same records.

const STUDENT_DB_KEY = "studentDatabase";

const JOURNEY_STAGES = [
  "Orientation",
  "Foundation Bootcamp",
  "HTML Basics",
  "CSS Layouts",
  "Responsive Design",
  "JavaScript Basics",
  "DOM and Events",
  "Git and Collaboration",
  "React Fundamentals",
  "Node.js and Express",
  "Databases with MongoDB",
  "Capstone Project",
  "Placement Readiness"
];

const SKILL_NAMES = ["HTML", "CSS", "JavaScript", "React", "Node.js", "Communication"];

const PROJECT_POOL = [
  { name: "Portfolio Site", tech: "HTML, CSS" },
  { name: "Campus Notice Board", tech: "HTML, CSS, JS" },
  { name: "Expense Tracker", tech: "JavaScript" },
  { name: "Quiz App", tech: "JavaScript" },
  { name: "Recipe Finder", tech: "React" },
  { name: "Attendance API", tech: "Node.js, Express" },
  { name: "Library Manager", tech: "MERN" },
  { name: "Placement Tracker", tech: "MERN" }
];

const PLACEMENT_COMPANIES = [
  { company: "Zoho", role: "Junior Developer", package: "4.5 LPA" },
  { company: "Thoughtworks", role: "Application Developer", package: "6.0 LPA" },
  { company: "Chaitanya India", role: "Frontend Developer", package: "3.8 LPA" }
];

const FIRST_NAMES = [
  "Aarti", "Abhishek", "Anjali", "Ankit", "Anushka", "Arjun", "Asha", "Bhavna", "Chandni",
  "Deepak", "Divya", "Farhan", "Gaurav", "Geeta", "Harsh", "Isha", "Jyoti", "Kajal",
  "Karan", "Komal", "Lalit", "Mamta", "Manish", "Meena", "Mohit", "Neha", "Nikhil",
  "Nisha", "Pankaj", "Pooja", "Prakash", "Preeti", "Rahul", "Rajesh", "Rekha", "Ritu",
  "Rohit", "Sachin", "Sakshi", "Sandeep", "Sapna", "Shivani", "Simran", "Sonu", "Suman",
  "Sunil", "Swati", "Tanvi", "Uday", "Vandana", "Vikas", "Yash"
];

const LAST_NAMES = [
  "Kumar", "Sharma", "Verma", "Thakur", "Rana", "Negi", "Chauhan", "Devi", "Katoch",
  "Guleria", "Pathania", "Bhardwaj", "Rathore", "Sood", "Mehra"
];

function createRandom(seed) {
  let state = seed;
  return function random() {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

function buildMilestones(stageIndex) {
  return JOURNEY_STAGES.map((stage, index) => ({
    title: stage,
    status: index < stageIndex ? "Completed" : index === stageIndex ? "In Progress" : "Pending"
  }));
}

function buildSkills(stageIndex, random) {
  const base = Math.round(((stageIndex + 1) / JOURNEY_STAGES.length) * 100);
  return SKILL_NAMES.map((skill, index) => {
    const drift = Math.round(random() * 22) - 11 - index * 2;
    return { name: skill, level: Math.max(8, Math.min(100, base + drift)) };
  });
}

function buildProjects(stageIndex, random) {
  const count = Math.min(PROJECT_POOL.length, 1 + Math.floor(stageIndex / 3));
  return PROJECT_POOL.slice(0, count).map((project, index) => ({
    ...project,
    status: index < count - 1 ? "Completed" : random() > 0.4 ? "In Progress" : "Completed"
  }));
}

function buildGrowth(score, random) {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  return months.map((month, index) => ({
    month,
    score: Math.max(1, Math.min(5, Number((score - 0.9 + index * 0.18 + random() * 0.2).toFixed(1))))
  }));
}

function buildStudent(index, random) {
  const stageIndex = Math.min(JOURNEY_STAGES.length - 1, Math.floor(random() * JOURNEY_STAGES.length));
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(index * 3) % LAST_NAMES.length];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@navgurukul.org`;
  const phaseDays = 4 + Math.round((stageIndex / (JOURNEY_STAGES.length - 1)) * 68);
  const attendanceTotal = 120;
  const attendancePresent = Math.round(attendanceTotal * (0.68 + random() * 0.3));
  const ojtProgress = Math.round(((stageIndex + 1) / JOURNEY_STAGES.length) * 100);
  const score = Number((2.8 + random() * 2.1).toFixed(1));

  return {
    id: 1000 + index,
    name,
    email,
    password: `ng@${2026 + index}`,
    role: "Student",
    status: "Active",
    joinedOn: `2026-0${1 + (index % 6)}-1${index % 9}`,
    journeyStage: JOURNEY_STAGES[stageIndex],
    journeyStageIndex: stageIndex,
    milestones: buildMilestones(stageIndex),
    milestoneCompletion: Math.round((stageIndex / (JOURNEY_STAGES.length - 1)) * 100),
    ojtProgress,
    score,
    skills: buildSkills(stageIndex, random),
    attendance: {
      present: attendancePresent,
      total: attendanceTotal,
      percent: Math.round((attendancePresent / attendanceTotal) * 100)
    },
    projects: buildProjects(stageIndex, random),
    placement: { status: stageIndex >= 11 ? "Interviewing" : "Preparing", company: "", role: "", package: "" },
    growth: buildGrowth(score, random),
    phase: getLearningPhaseFromDays(phaseDays),
    phaseDays,
    leaveDays: Math.round(random() * 6),
    htmlHoursSpent: Math.round(12 + random() * 26),
    cssHoursSpent: Math.round(10 + random() * 24),
    jsHoursSpent: Math.round(8 + random() * 32)
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

function buildSeedStudents() {
  const random = createRandom(20260924);
  const students = [];

  for (let index = 0; index < 53; index += 1) {
    students.push(buildStudent(index, random));
  }

  // Exactly three students are placed, three need attention.
  PLACEMENT_COMPANIES.forEach((placement, index) => {
    const student = students[index * 7 + 2];
    student.status = "Placed";
    student.journeyStageIndex = JOURNEY_STAGES.length - 1;
    student.journeyStage = JOURNEY_STAGES[JOURNEY_STAGES.length - 1];
    student.milestones = buildMilestones(JOURNEY_STAGES.length - 1);
    student.milestoneCompletion = 100;
    student.ojtProgress = 100;
    student.placement = { status: "Placed", ...placement };
  });

  [5, 19, 33, 47].forEach(position => {
    students[position].status = "At Risk";
  });

  [8, 24, 40].forEach(position => {
    students[position].status = "Pending";
  });

  // Demo account requested for the panel, kept as the first student record.
  students[0] = {
    ...students[0],
    id: 1,
    name: "Shubham Kumar",
    email: "shubham@navgurukul.org",
    password: "@123",
    status: "Active"
  };

  students.push({
    id: 900,
    name: "Campus Admin",
    email: "admin@navgurukul.org",
    password: "admin@2026",
    role: "Admin",
    status: "Active",
    phase: getLearningPhaseFromDays(0),
    phaseDays: 0,
    leaveDays: 0,
    htmlHoursSpent: 0,
    cssHoursSpent: 0,
    jsHoursSpent: 0,
    ojtProgress: 0,
    milestoneCompletion: 0,
    score: 0
  });

  return students;
}

function normalizeStudentRecord(student) {
  const stageIndex = Number.isInteger(student.journeyStageIndex)
    ? student.journeyStageIndex
    : Math.max(0, JOURNEY_STAGES.indexOf(student.journeyStage || ""));
  const safeStageIndex = stageIndex < 0 ? 0 : stageIndex;
  const attendance = student.attendance || { present: 0, total: 0, percent: 0 };

  return {
    ...student,
    role: student.role || "Student",
    status: student.status || "Pending",
    journeyStageIndex: safeStageIndex,
    journeyStage: student.journeyStage || JOURNEY_STAGES[safeStageIndex],
    milestones: Array.isArray(student.milestones) ? student.milestones : buildMilestones(safeStageIndex),
    skills: Array.isArray(student.skills) ? student.skills : [],
    projects: Array.isArray(student.projects) ? student.projects : [],
    growth: Array.isArray(student.growth) ? student.growth : [],
    placement: student.placement || { status: "Preparing", company: "", role: "", package: "" },
    attendance: {
      present: Number(attendance.present) || 0,
      total: Number(attendance.total) || 0,
      percent: Number(attendance.percent) || 0
    },
    ojtProgress: Number(student.ojtProgress) || 0,
    milestoneCompletion: Number(student.milestoneCompletion) || 0,
    score: Number(student.score) || 0,
    phaseDays: Number(student.phaseDays) || 0,
    leaveDays: Number(student.leaveDays) || 0,
    htmlHoursSpent: Number(student.htmlHoursSpent) || 0,
    cssHoursSpent: Number(student.cssHoursSpent) || 0,
    jsHoursSpent: Number(student.jsHoursSpent) || 0,
    phase: getLearningPhaseFromDays(student.phaseDays)
  };
}

function saveStudents(students) {
  localStorage.setItem(STUDENT_DB_KEY, JSON.stringify(students));
}

function loadStudents() {
  let stored = [];
  try {
    const raw = localStorage.getItem(STUDENT_DB_KEY);
    stored = raw ? JSON.parse(raw) : [];
  } catch {
    stored = [];
  }

  if (!Array.isArray(stored) || stored.length === 0) {
    const seeded = buildSeedStudents();
    saveStudents(seeded);
    return seeded.map(normalizeStudentRecord);
  }

  return stored.map(normalizeStudentRecord);
}

function getStudentRecords() {
  return loadStudents().filter(student => student.role !== "Admin");
}
