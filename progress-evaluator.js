// Learning Progress Evaluator
class ProgressEvaluator {
  constructor() {
    this.phases = [
      { label: "Phase 1 - HTML", next: "Phase 2 - CSS" },
      { label: "Phase 2 - CSS", next: "Phase 3 - JavaScript" },
      { label: "Phase 3 - JavaScript", next: "Phase 4 - Node.js" },
      { label: "Phase 4 - Node.js", next: "Phase 5 - Express.js + MongoDB" },
      { label: "Phase 5 - Express.js + MongoDB", next: null }
    ];

    this.promotionRules = {
      milestoneCompletion: 90, // >= 90%
      leaveDays: 5, // < 5
      skillScore: 3.5, // >= 3.5 out of 5 (70%)
      minHours: 10 // minimum hours in current phase
    };
  }

  /**
   * Evaluate student based on promotion criteria
   */
  evaluate(student, metrics) {
    const evaluation = {
      promote: false,
      currentPhase: this.normalizePhaseLabel(student.phase),
      nextPhase: this.getNextPhase(this.normalizePhaseLabel(student.phase)),
      reason: "",
      strengths: [],
      weaknesses: [],
      feedback: "",
      criteria: []
    };

    // Criterion 1: Milestone Completion >= 90%
    const milestonePassed = metrics.milestoneCompletion >= this.promotionRules.milestoneCompletion;
    evaluation.criteria.push({
      name: "Milestone Completion",
      required: `>= ${this.promotionRules.milestoneCompletion}%`,
      actual: `${metrics.milestoneCompletion}%`,
      passed: milestonePassed
    });

    // Criterion 2: Leave Days < 5
    const leaveDaysPassed = metrics.leaveDays < this.promotionRules.leaveDays;
    evaluation.criteria.push({
      name: "Leave Days",
      required: `< ${this.promotionRules.leaveDays}`,
      actual: `${metrics.leaveDays}`,
      passed: leaveDaysPassed
    });

    // Criterion 3: Skill Score >= 70% (3.5 out of 5)
    const skillScore = parseFloat(metrics.score);
    const skillScorePassed = skillScore >= this.promotionRules.skillScore;
    evaluation.criteria.push({
      name: "Skill Score",
      required: `>= ${this.promotionRules.skillScore} (${(this.promotionRules.skillScore / 5 * 100).toFixed(0)}%)`,
      actual: `${skillScore.toFixed(1)} (${(skillScore / 5 * 100).toFixed(0)}%)`,
      passed: skillScorePassed
    });

    // Criterion 4: Assignments Completed
    const assignmentsPassed = metrics.assignmentsCompleted > 0;
    evaluation.criteria.push({
      name: "Assignments",
      required: "> 0",
      actual: `${metrics.assignmentsCompleted}`,
      passed: assignmentsPassed
    });

    // Check if all criteria are met
    const allCriteriaMet = milestonePassed && leaveDaysPassed && skillScorePassed && assignmentsPassed;

    // Generate strengths and weaknesses
    if (metrics.milestoneCompletion >= 95) {
      evaluation.strengths.push("Exceptional milestone completion");
    } else if (metrics.milestoneCompletion >= 90) {
      evaluation.strengths.push("Strong milestone completion");
    }

    if (metrics.leaveDays <= 1) {
      evaluation.strengths.push("Excellent attendance");
    }

    if (skillScore >= 4.5) {
      evaluation.strengths.push("Outstanding technical skills");
    } else if (skillScore >= 4) {
      evaluation.strengths.push("Strong technical foundation");
    }

    if (metrics.assignmentsCompleted >= 10) {
      evaluation.strengths.push("Completed all assignments");
    }

    if (!milestonePassed) {
      evaluation.weaknesses.push(`Milestone completion at ${metrics.milestoneCompletion}% (target: ${this.promotionRules.milestoneCompletion}%)`);
    }

    if (!leaveDaysPassed) {
      evaluation.weaknesses.push(`Leave days exceed threshold (${metrics.leaveDays} vs ${this.promotionRules.leaveDays})`);
    }

    if (!skillScorePassed) {
      evaluation.weaknesses.push(`Skill score below requirement (${skillScore.toFixed(1)} vs ${this.promotionRules.skillScore})`);
    }

    if (!assignmentsPassed) {
      evaluation.weaknesses.push("No assignments completed");
    }

    // Determine promotion status
    if (allCriteriaMet) {
      evaluation.promote = true;
      evaluation.reason = "All promotion criteria have been met successfully.";
      evaluation.feedback = this.generatePromotionFeedback(student, evaluation, metrics);
    } else {
      evaluation.promote = false;
      evaluation.reason = "Student does not meet all promotion criteria.";
      evaluation.feedback = this.generateHoldFeedback(student, evaluation, metrics);
    }

    return evaluation;
  }

  /**
   * Generate feedback for promoted students
   */
  generatePromotionFeedback(student, evaluation, metrics) {
    const phaseLabel = this.getPhaseNumber(evaluation.currentPhase);
    let feedback = `${student.name} is ready to advance from ${evaluation.currentPhase} to ${evaluation.nextPhase}. `;

    if (evaluation.strengths.length > 0) {
      feedback += `Strengths: ${evaluation.strengths.slice(0, 2).join(", ")}. `;
    }

    if (evaluation.weaknesses.length > 0) {
      feedback += `Continue improving in: ${evaluation.weaknesses.slice(0, 2).join(", ")}. `;
    }

    feedback += "Great job! Keep up the dedicated learning.";
    return feedback;
  }

  /**
   * Generate feedback for students not ready for promotion
   */
  generateHoldFeedback(student, evaluation, metrics) {
    let feedback = `${student.name} requires further development before advancement. `;

    const failedCriteria = evaluation.criteria.filter(c => !c.passed).map(c => c.name);
    if (failedCriteria.length > 0) {
      feedback += `Focus on: ${failedCriteria.join(", ")}. `;
    }

    if (evaluation.strengths.length > 0) {
      feedback += `Build on your strengths: ${evaluation.strengths[0]}. `;
    }

    feedback += "You're making progress. Continue your efforts!";
    return feedback;
  }

  /**
   * Get the next phase label
   */
  getNextPhase(currentPhase) {
    const current = this.phases.find(p => p.label === currentPhase);
    return current ? current.next : null;
  }

  /**
   * Normalize phase label from various formats
   */
  normalizePhaseLabel(phase) {
    const phaseMap = {
      "Foundation": "Phase 1 - HTML",
      "Intermediate": "Phase 2 - CSS",
      "Advanced": "Phase 3 - JavaScript"
    };

    return phaseMap[phase] || phase;
  }

  /**
   * Get phase number from label
   */
  getPhaseNumber(phaseLabel) {
    const match = phaseLabel.match(/Phase (\d+)/);
    return match ? match[1] : "1";
  }
}

// Initialize evaluator
const evaluator = new ProgressEvaluator();

// DOM Elements
const studentSelect = document.getElementById("studentSelect");
const evaluateBtn = document.getElementById("evaluateBtn");
const resultContainer = document.getElementById("resultContainer");
const evaluatorForm = document.getElementById("evaluatorForm");

// Populate student dropdown
function populateStudentSelect() {
  const students = getStudentsFromStorage();
  const activeStudents = students.filter(s => s.status !== "Placed");

  activeStudents.forEach(student => {
    const option = document.createElement("option");
    option.value = JSON.stringify({
      id: student.id,
      name: student.name,
      email: student.email,
      phase: student.phase
    });
    option.textContent = `${student.name} (${student.phase})`;
    studentSelect.appendChild(option);
  });
}

// Auto-fill form when student is selected
studentSelect.addEventListener("change", function () {
  if (this.value) {
    const student = JSON.parse(this.value);
    const fullStudent = getStudentsFromStorage().find(s => s.id === student.id);

    if (fullStudent) {
      document.getElementById("milestonePct").value = fullStudent.milestoneCompletion;
      document.getElementById("leaveDays").value = fullStudent.leaveDays;
      document.getElementById("scoreValue").value = fullStudent.score;
      document.getElementById("htmlHours").value = fullStudent.htmlHoursSpent;
      document.getElementById("cssHours").value = fullStudent.cssHoursSpent;
      document.getElementById("jsHours").value = fullStudent.jsHoursSpent;
      document.getElementById("assignmentsCompleted").value = Math.round(fullStudent.ojtProgress / 10) || 5;
    }
  }
});

// Evaluate button click
evaluateBtn.addEventListener("click", function () {
  if (!studentSelect.value) {
    alert("Please select a student");
    return;
  }

  const selectedStudent = JSON.parse(studentSelect.value);
  const fullStudent = getStudentsFromStorage().find(s => s.id === selectedStudent.id);

  const metrics = {
    milestoneCompletion: parseFloat(document.getElementById("milestonePct").value),
    leaveDays: parseInt(document.getElementById("leaveDays").value),
    score: parseFloat(document.getElementById("scoreValue").value),
    htmlHours: parseInt(document.getElementById("htmlHours").value),
    cssHours: parseInt(document.getElementById("cssHours").value),
    jsHours: parseInt(document.getElementById("jsHours").value),
    assignmentsCompleted: parseInt(document.getElementById("assignmentsCompleted").value)
  };

  const evaluation = evaluator.evaluate(fullStudent, metrics);
  displayEvaluation(evaluation, fullStudent);
});

// Display evaluation results
function displayEvaluation(evaluation, student) {
  const resultStatus = document.getElementById("resultStatus");
  const resultTitle = document.getElementById("resultTitle");
  const resultPhase = document.getElementById("resultPhase");
  const criteriaList = document.getElementById("criteriaList");
  const strengthsList = document.getElementById("strengthsList");
  const weaknessList = document.getElementById("weaknessList");
  const feedbackText = document.getElementById("feedbackText");
  const promotionActions = document.getElementById("promotionActions");

  // Clear previous results
  criteriaList.innerHTML = "";
  strengthsList.innerHTML = "";
  weaknessList.innerHTML = "";
  promotionActions.innerHTML = "";

  // Status
  resultStatus.className = "result-status";
  if (evaluation.promote) {
    resultStatus.classList.add("promote");
    resultStatus.textContent = "✓";
    resultTitle.textContent = `${student.name} - Ready for Promotion`;
  } else {
    resultStatus.classList.add("hold");
    resultStatus.textContent = "✗";
    resultTitle.textContent = `${student.name} - Promotion Hold`;
  }

  resultPhase.textContent = `Currently in ${evaluation.currentPhase}`;

  // Criteria
  evaluation.criteria.forEach(criterion => {
    const item = document.createElement("div");
    item.className = `criteria-item ${criterion.passed ? "pass" : "fail"}`;
    item.innerHTML = `
      <div class="criteria-icon">${criterion.passed ? "✓" : "✗"}</div>
      <div class="criteria-text">
        <strong>${criterion.name}</strong><br/>
        ${criterion.actual}
      </div>
      <div class="criteria-value">${criterion.required}</div>
    `;
    criteriaList.appendChild(item);
  });

  // Strengths
  if (evaluation.strengths.length > 0) {
    const strengthsTitle = document.createElement("div");
    strengthsTitle.style.fontSize = "14px";
    strengthsTitle.style.fontWeight = "700";
    strengthsTitle.style.marginBottom = "8px";
    strengthsTitle.style.color = "#0d8f55";
    strengthsTitle.textContent = "✓ Strengths";
    strengthsList.appendChild(strengthsTitle);

    evaluation.strengths.forEach(strength => {
      const item = document.createElement("div");
      item.className = "strengths-item";
      item.textContent = "• " + strength;
      strengthsList.appendChild(item);
    });
  }

  // Weaknesses
  if (evaluation.weaknesses.length > 0) {
    const weaknessesTitle = document.createElement("div");
    weaknessesTitle.style.fontSize = "14px";
    weaknessesTitle.style.fontWeight = "700";
    weaknessesTitle.style.marginBottom = "8px";
    weaknessesTitle.style.color = "#ff7744";
    weaknessesTitle.style.marginTop = "12px";
    weaknessesTitle.textContent = "⚠ Areas to Improve";
    weaknessList.appendChild(weaknessesTitle);

    evaluation.weaknesses.forEach(weakness => {
      const item = document.createElement("div");
      item.className = "weaknesses-item";
      item.textContent = "• " + weakness;
      weaknessList.appendChild(item);
    });
  }

  // Feedback
  feedbackText.textContent = evaluation.feedback;

  // Promotion Actions
  if (evaluation.promote && evaluation.nextPhase) {
    const promoteBtn = document.createElement("button");
    promoteBtn.className = "btn btn-promote";
    promoteBtn.textContent = `Promote to ${evaluation.nextPhase}`;
    promoteBtn.addEventListener("click", () => promoteStudent(student, evaluation));
    promotionActions.appendChild(promoteBtn);
  }

  const skipBtn = document.createElement("button");
  skipBtn.className = "btn btn-skip";
  skipBtn.textContent = evaluation.promote ? "Skip Promotion" : "Close";
  skipBtn.addEventListener("click", () => {
    resultContainer.classList.remove("show");
    evaluatorForm.reset();
    studentSelect.value = "";
  });
  promotionActions.appendChild(skipBtn);

  // Show result
  resultContainer.classList.add("show");
}

// Promote student to next phase
function promoteStudent(student, evaluation) {
  const students = getStudentsFromStorage();
  const studentIndex = students.findIndex(s => s.id === student.id);

  if (studentIndex !== -1 && evaluation.nextPhase) {
    students[studentIndex].phase = evaluation.nextPhase;
    localStorage.setItem("studentDatabase", JSON.stringify(students));

    alert(`✓ ${student.name} has been promoted to ${evaluation.nextPhase}`);
    
    // Reset form and hide result
    resultContainer.classList.remove("show");
    evaluatorForm.reset();
    studentSelect.value = "";
    
    // Refresh student dropdown
    studentSelect.innerHTML = '<option value="">-- Choose a student --</option>';
    populateStudentSelect();
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  populateStudentSelect();
  document.getElementById("userEmail").textContent = localStorage.getItem("userEmail") || "Admin";
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", function () {
  localStorage.removeItem("userEmail");
  window.location.href = "login.html";
});
