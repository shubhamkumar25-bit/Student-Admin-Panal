// Load or initialize students
function getStudents() {
  const stored = localStorage.getItem("studentDatabase");
  if (stored) {
    let parsed = [];
    try {
      parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        parsed = [];
      }
    } catch {
      parsed = [];
    }

    if (parsed.length === 0) {
      localStorage.removeItem("studentDatabase");
      return getStudents();
    }

    const shubhamIndex = parsed.findIndex(
      (s) => s.email && s.email.toLowerCase() === "shubham@navgurukul.org"
    );

    // Ensure requested demo account is always available with fixed credentials.
    if (shubhamIndex === -1) {
      parsed.push({
        id: Math.max(...parsed.map((s) => s.id || 0), 100) + 1,
        name: "Shubham",
        email: "shubham@navgurukul.org",
        password: "@123",
        role: "Student",
        phase: "Foundation",
        status: "Active",
        ojtProgress: 0,
        milestoneCompletion: 0,
        score: 0,
        htmlHoursSpent: 0,
        cssHoursSpent: 0,
        jsHoursSpent: 0,
        phaseDays: 0,
        leaveDays: 0
      });
    } else {
      parsed[shubhamIndex] = {
        ...parsed[shubhamIndex],
        name: "Shubham",
        email: "shubham@navgurukul.org",
        password: "@123",
        role: "Student",
        htmlHoursSpent: parsed[shubhamIndex].htmlHoursSpent || 0,
        cssHoursSpent: parsed[shubhamIndex].cssHoursSpent || 0,
        jsHoursSpent: parsed[shubhamIndex].jsHoursSpent || 0,
        phaseDays: parsed[shubhamIndex].phaseDays || 0,
        leaveDays: parsed[shubhamIndex].leaveDays || 0
      };
    }

    localStorage.setItem("studentDatabase", JSON.stringify(parsed));

    return parsed;
  }
  return [
    {
      id: 1,
      name: "Shubham",
      email: "shubham@navgurukul.org",
      password: "@123",
      role: "Student",
      phase: "Foundation",
      status: "Active",
      ojtProgress: 0,
      milestoneCompletion: 0,
      score: 0,
      htmlHoursSpent: 0,
      cssHoursSpent: 0,
      jsHoursSpent: 0,
      phaseDays: 0,
      leaveDays: 0
    },
    {
      id: 2,
      name: "Priya Sharma",
      email: "priya@navgurukul.org",
      password: "priya@2026",
      role: "Student",
      phase: "Intermediate",
      status: "Active",
      ojtProgress: 75,
      milestoneCompletion: 85,
      score: 4.6,
      htmlHoursSpent: 28,
      cssHoursSpent: 22,
      jsHoursSpent: 35,
      phaseDays: 42,
      leaveDays: 2
    },
    {
      id: 3,
      name: "Admin",
      email: "admin@navgurukul.org",
      password: "admin@2026",
      role: "Admin",
      htmlHoursSpent: 0,
      cssHoursSpent: 0,
      jsHoursSpent: 0,
      phaseDays: 0,
      leaveDays: 0
    }
  ];
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase().replaceAll(",", ".").replaceAll(" ", "");
}

function getDirectCredentialUser(email, password) {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail === "shubham@navgurukul.org" && password === "@123") {
    return {
      id: 1,
      name: "Shubham",
      email: "shubham@navgurukul.org",
      role: "Student"
    };
  }

  if (normalizedEmail === "admin@navgurukul.org" && password === "admin@2026") {
    return {
      id: 3,
      name: "Admin",
      email: "admin@navgurukul.org",
      role: "Admin"
    };
  }

  return null;
}

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const statusMessage = document.getElementById("statusMessage");
let autoLoginTimer = null;
let hasLoggedIn = false;

// Toggle between login and signup
let isSignupMode = false;
const toggleLink = document.getElementById("toggleLink");
const signupFields = document.getElementById("signupFields");
const loginBtn = document.getElementById("loginBtn");

if (toggleLink) {
  toggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    isSignupMode = !isSignupMode;
    if (isSignupMode) {
      signupFields.style.display = "block";
      loginBtn.textContent = "Create Account";
      toggleLink.textContent = "Already have account?";
    } else {
      signupFields.style.display = "none";
      loginBtn.textContent = "Sign In";
      toggleLink.textContent = "Create new account";
    }
  });
}

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.classList.remove("error", "success");
  if (type) {
    statusMessage.classList.add(type);
  }
}

function findUser(email, password) {
  const directUser = getDirectCredentialUser(email, password);
  if (directUser) return directUser;

  const users = getStudents();
  const normalizedEmail = normalizeEmail(email);

  const matched = users.find(
    (u) => normalizeEmail(u.email) === normalizedEmail && u.password === password
  );

  if (matched) return matched;

  // Compatibility fallback for previously used typo/email-password pair.
  const isShubhamEmail = [
    "shubham@navgurukul.org",
    "shubham@navgurukyl,org",
    "shubham@navgurukyl.org"
  ].includes(normalizedEmail);
  const isShubhamPassword = ["@123", "banda@123"].includes(password);

  if (isShubhamEmail && isShubhamPassword) {
    return {
      id: 1,
      name: "Shubham",
      email: "shubham@navgurukul.org",
      role: "Student"
    };
  }

  return null;
}

function loginUser(user) {
  if (hasLoggedIn) return;
  hasLoggedIn = true;
  const session = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    loginAt: new Date().toISOString()
  };

  localStorage.setItem("studentPortalSession", JSON.stringify(session));
  setStatus(`Login successful. ${user.role} dashboard open ho raha hai...`, "success");

  setTimeout(() => {
   if (user.role === "Admin") {
     window.location.href = "admin-portal.html";
   } else {
     window.location.href = "dashboard.html";
   }
  }, 700);
}

function attemptLogin() {
  const email = normalizeEmail(emailInput.value);
  const password = passwordInput.value;

  if (!email || !password) {
    setStatus("Email aur password dono fill karein.", "error");
    return;
  }

  if (isSignupMode) {
    attemptSignup();
    return;
  }

  const matched = findUser(email, password);
  if (!matched) {
    setStatus("Sign in failed. Demo credentials sahi se dalen.", "error");
    return;
  }

  loginUser(matched);
}

function attemptSignup() {
  const name = document.getElementById("signupName")?.value.trim();
  const email = normalizeEmail(emailInput.value);
  const password = passwordInput.value;

  if (!name || !email || !password) {
    setStatus("Saari fields fill karein.", "error");
    return;
  }

  const allStudents = getStudents();
  if (allStudents.find(s => s.email.toLowerCase() === email.toLowerCase())) {
    setStatus("Email pehle se register hai.", "error");
    return;
  }

  const newStudent = {
    id: Math.max(...allStudents.map(s => s.id || 0)) + 1,
    name: name,
    email: email,
    password: password,
    role: "Student",
    phase: "Foundation",
    status: "Active",
    ojtProgress: 0,
    milestoneCompletion: 0,
    score: 0,
    htmlHoursSpent: 0,
    cssHoursSpent: 0,
    jsHoursSpent: 0,
    phaseDays: 0,
    leaveDays: 0
  };

  allStudents.push(newStudent);
  localStorage.setItem("studentDatabase", JSON.stringify(allStudents));
  setStatus("Account create ho gaya! Ab login karein.", "success");

  setTimeout(() => {
    isSignupMode = false;
    signupFields.style.display = "none";
    loginBtn.textContent = "Sign In";
    toggleLink.textContent = "Create new account";
    emailInput.value = email;
    passwordInput.value = password;
    emailInput.focus();
  }, 800);
}

function handlePasswordInput() {
  if (hasLoggedIn) return;

  clearTimeout(autoLoginTimer);
  setStatus("Password type detect hua. Auto-login check ho raha hai...");

  autoLoginTimer = setTimeout(() => {
    const email = normalizeEmail(emailInput.value);
    const password = passwordInput.value;

    if (!email || !password) {
      setStatus("Email aur password dono required hain.", "error");
      return;
    }

    const matched = findUser(email, password);
    if (matched) {
      loginUser(matched);
    }
  }, 350);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  attemptLogin();
});

passwordInput.addEventListener("input", handlePasswordInput);
