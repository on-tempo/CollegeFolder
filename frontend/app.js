// =========================================================
// CollegeFolder — frontend app
// Vanilla JS. Talks to the FastAPI backend over fetch + JWT.
// =========================================================

const API = "https://collegefolder-backend.onrender.com";

// ----- App state (single source of truth) -----
const S = {
  token: localStorage.getItem("token"),
  email: localStorage.getItem("cf_email") || "",
  semesters: [],
  currentSemesterId: numOrNull(localStorage.getItem("cf_semester")),
  courses: [],
  todos: new Map(),       // courseId -> Todo[]
  exams: [],              // exams in current semester
  upcomingExams: [],      // server-side D-3 list
  view: localStorage.getItem("cf_view") || "month",
  viewDate: new Date(),
  theme: localStorage.getItem("cf_theme") || "warm",
  query: "",
  bannerDismissed: false,
  menuOpen: false,
  sidebarOpen: false,
  semPickerOpen: false,
};

function numOrNull(v) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; }

// ----- Tiny helpers -----
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const today = () => new Date();

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function daysBetween(later, earlier) {
  return Math.floor((startOfDay(later) - startOfDay(earlier)) / 86400000);
}
const COLOR_NAMES = ["c1","c2","c3","c4","c5","c6","c7","c8"];
function colorFor(id) {
  const c = S.courses.find(x => x.id === id);
  if (c?.color) return c.color;
  return `c${((Math.abs(Number(id) || 1) - 1) % 8) + 1}`;
}
function courseById(id) { return S.courses.find(c => c.id === id); }

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

// ----- Inline SVG icons -----
const SVG = {
  search:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  plus:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
  chevL:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`,
  chevR:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
  chevDown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  cal:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>`,
  list:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
  week:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 11h18M9 6v14"/></svg>`,
  check:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>`,
  x:        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  trash:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></svg>`,
  bell:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 16v-5a6 6 0 10-12 0v5l-2 3h16l-2-3zM10 21a2 2 0 004 0"/></svg>`,
  cap:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5a6 6 0 0012 0v-5"/></svg>`,
  capSm:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5a6 6 0 0012 0v-5"/></svg>`,
  menu:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  cog:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  sun:      `<svg class="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  moon:     `<svg class="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  layout:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  logout:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>`,
};

const LOGO = (size = 22) => `
  <svg width="${size}" height="${size}" viewBox="0 0 64 50" fill="currentColor" aria-hidden="true">
    <path d="M 16 9 L 32 3 L 48 9 L 32 15 Z"/>
    <path d="M 26 15 L 37.5 15 L 36 19 L 27.5 19 Z"/>
    <path d="M 46 11 L 46 19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <circle cx="46" cy="21.2" r="1.8"/>
    <path d="M 47.6 29 A 18 18 0 1 0 47.6 47 L 41.5 43.5 A 11 11 0 1 1 41.5 32.5 Z"/>
  </svg>`;

// =========================================================
// API
// =========================================================
async function apiFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (S.token) headers["Authorization"] = `Bearer ${S.token}`;
  let res;
  try {
    res = await fetch(API + path, { ...opts, headers });
  } catch (e) {
    throw new Error("Could not reach the server. Check your connection.");
  }
  if (res.status === 401) {
    handleLogout();
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!res.ok) {
    let detail = "Request failed";
    try { const j = await res.json(); detail = j.detail || detail; } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  try { return await res.json(); } catch { return null; }
}

const api = {
  async login(email, password) {
    let res;
    try {
      res = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch { throw new Error("Could not reach the server."); }
    if (!res.ok) {
      let detail = "Invalid email or password";
      try { const j = await res.json(); detail = j.detail || detail; } catch {}
      throw new Error(detail);
    }
    const data = await res.json();
    S.token = data.access_token;
    S.email = email;
    localStorage.setItem("token", S.token);
    localStorage.setItem("cf_email", email);
    return data;
  },
  async register(email, password) {
    let res;
    try {
      res = await fetch(API + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch { throw new Error("Could not reach the server."); }
    if (!res.ok) {
      let detail = "Could not register. Try a different email.";
      try { const j = await res.json(); detail = j.detail || detail; } catch {}
      throw new Error(detail);
    }
    return await res.json();
  },
  semesters: {
    list:   ()        => apiFetch("/semesters/"),
    create: (name)    => apiFetch("/semesters/", { method: "POST", body: JSON.stringify({ name }) }),
    remove: (id)      => apiFetch(`/semesters/${id}`, { method: "DELETE" }),
  },
  courses: {
    list:   (sid)         => apiFetch(`/semesters/${sid}/courses`),
    create: (sid, name)   => apiFetch(`/semesters/${sid}/courses`, { method: "POST", body: JSON.stringify({ name }) }),
    update: (id, data)    => apiFetch(`/semesters/courses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id)          => apiFetch(`/semesters/courses/${id}`, { method: "DELETE" }),
  },
  todos: {
    list:   (cid)               => apiFetch(`/courses/${cid}/todos`),
    create: (cid, content, due_date = null) => apiFetch(`/courses/${cid}/todos`, { method: "POST", body: JSON.stringify({ content, due_date }) }),
    update: (cid, tid, isDone, due_date = null) => apiFetch(`/courses/${cid}/todos/${tid}`, { method: "PATCH", body: JSON.stringify({ is_done: isDone, due_date: due_date ?? null }) }),
    remove: (cid, tid)          => apiFetch(`/courses/${cid}/todos/${tid}`, { method: "DELETE" }),
  },
  exams: {
    listAll:      ()                => apiFetch("/exams"),
    listUpcoming: ()                => apiFetch("/exams/upcoming"),
    create:       (cid, name, date) => apiFetch(`/courses/${cid}/exams`, { method: "POST", body: JSON.stringify({ name, date }) }),
    remove:       (id)              => apiFetch(`/exams/${id}`, { method: "DELETE" }),
  },
};

// =========================================================
// Toast notifications
// =========================================================
function toast(msg, kind = "info") {
  const root = $("#toast-root");
  const el = document.createElement("div");
  el.className = "toast" + (kind === "error" ? " error" : kind === "success" ? " success" : "");
  el.textContent = msg;
  el.addEventListener("click", () => el.remove());
  root.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

// =========================================================
// Data loading
// =========================================================
async function loadAll() {
  try {
    S.semesters = await api.semesters.list();
    // Pick a semester to land on if our saved one is gone
    if (!S.currentSemesterId || !S.semesters.find(s => s.id === S.currentSemesterId)) {
      S.currentSemesterId = S.semesters[0]?.id || null;
      if (S.currentSemesterId) localStorage.setItem("cf_semester", String(S.currentSemesterId));
    }
    await loadSemesterData();
  } catch (e) {
    toast(e.message, "error");
  }
}

async function loadSemesterData() {
  if (!S.currentSemesterId) {
    S.courses = []; S.todos.clear(); S.exams = []; S.upcomingExams = [];
    return;
  }
  try {
    const [courses, allExams, upcoming] = await Promise.all([
      api.courses.list(S.currentSemesterId),
      api.exams.listAll(),
      api.exams.listUpcoming(),
    ]);
    S.courses = courses;
    const courseIds = new Set(courses.map(c => c.id));
    S.exams = allExams.filter(e => courseIds.has(e.course_id));
    S.upcomingExams = upcoming.filter(e => courseIds.has(e.course_id));
    const todoMap = new Map();
    await Promise.all(courses.map(async c => {
      try { todoMap.set(c.id, await api.todos.list(c.id)); }
      catch { todoMap.set(c.id, []); }
    }));
    S.todos = todoMap;
  } catch (e) {
    toast(e.message, "error");
  }
}

function handleLogout() {
  S.token = null; S.email = "";
  localStorage.removeItem("token");
  localStorage.removeItem("cf_email");
  S.semesters = []; S.courses = []; S.todos.clear();
  S.exams = []; S.upcomingExams = [];
  S.currentSemesterId = null;
  S.menuOpen = false; S.semPickerOpen = false; S.sidebarOpen = false;
  closeDrawer(); closeModal();
  render();
}

// =========================================================
// Top-level render
// =========================================================
function render() {
  $("#boot").style.display = "none";
  document.documentElement.dataset.theme = S.theme === "dark" ? "dark" : "warm";

  if (!S.token) {
    $("#app-root").classList.add("hidden");
    $("#auth-root").classList.remove("hidden");
    renderAuth();
  } else {
    $("#auth-root").classList.add("hidden");
    $("#app-root").classList.remove("hidden");
    renderShell();
    renderHeader();
    renderSidebar();
    renderMain();
    renderBanner();
  }
}

// Lighter re-render after a mutation: refresh sidebar/main/banner only.
// Header stays put so the search input doesn't lose focus.
function update() {
  renderSidebar();
  renderMain();
  renderBanner();
}

// =========================================================
// Auth screen
// =========================================================
let authMode = "login";  // 'login' | 'register'

function renderAuth() {
  const root = $("#auth-root");
  const isLogin = authMode === "login";
  root.innerHTML = `
    <main class="auth-page">
      <aside class="auth-art" aria-hidden="true">
        <div class="mark">
          <div class="square">${LOGO(22)}</div>
          CollegeFolder
        </div>
        <div class="deco"></div>
        <div class="mini-cal">
          <h4>This week</h4>
          <div class="row"><span class="d">MON</span><span style="flex:1">Readings</span></div>
          <div class="row"><span class="d">WED</span><span style="flex:1">Problem set due</span></div>
          <div class="row"><span class="d">FRI</span><span style="flex:1; font-weight:600">Midterm</span></div>
        </div>
        <div class="pitch">
          <h2>Your semester, on one page.</h2>
          <p>Track readings, problem sets, and exams in a calendar built for a college schedule.</p>
        </div>
      </aside>
      <section class="auth-form-wrap">
        <form class="auth-form" id="auth-form" novalidate>
          <h1>${isLogin ? "Welcome back" : "Create your folder"}</h1>
          <p class="sub">${isLogin ? "Sign in to pick up where you left off." : "It's free for students — no credit card needed."}</p>
          <div id="auth-msg"></div>
          <div class="field">
            <label for="auth-email">Email</label>
            <input id="auth-email" type="email" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="auth-pw">Password</label>
            <input id="auth-pw" type="password" autocomplete="${isLogin ? "current-password" : "new-password"}" minlength="4" required />
          </div>
          <button type="submit" class="btn btn-primary" id="auth-submit" style="margin-top:8px">
            ${isLogin ? "Sign in" : "Create account"}
          </button>
          <p class="switch">
            ${isLogin ? "New here?" : "Already have an account?"}
            <button type="button" id="auth-switch">${isLogin ? "Create an account" : "Sign in"}</button>
          </p>
        </form>
      </section>
    </main>`;

  $("#auth-form").addEventListener("submit", onAuthSubmit);
  $("#auth-switch").addEventListener("click", () => {
    authMode = isLogin ? "register" : "login";
    renderAuth();
  });
  $("#auth-email").focus();
}

async function onAuthSubmit(e) {
  e.preventDefault();
  const email = $("#auth-email").value.trim();
  const pw = $("#auth-pw").value;
  const msg = $("#auth-msg");
  const btn = $("#auth-submit");
  msg.innerHTML = "";
  if (!email || !pw) {
    msg.innerHTML = `<div class="form-error">Please enter both email and password.</div>`;
    return;
  }
  btn.disabled = true;
  btn.textContent = authMode === "login" ? "Signing in…" : "Creating account…";
  try {
    if (authMode === "login") {
      await api.login(email, pw);
      await loadAll();
      render();
    } else {
      await api.register(email, pw);
      msg.innerHTML = `<div class="form-notice">Account created — please sign in.</div>`;
      authMode = "login";
      setTimeout(renderAuth, 700);
    }
  } catch (err) {
    msg.innerHTML = `<div class="form-error">${escapeHtml(err.message)}</div>`;
    btn.disabled = false;
    btn.textContent = authMode === "login" ? "Sign in" : "Create account";
  }
}

// =========================================================
// App shell
// =========================================================
function renderShell() {
  $("#app-root").innerHTML = `
    <div class="shell">
      <aside class="sidebar ${S.sidebarOpen ? "open" : ""}" id="sidebar" aria-label="Primary"></aside>
      <header class="app-header" id="header" role="banner"></header>
      <main class="main" id="main"></main>
    </div>`;
}

// =========================================================
// Header
// =========================================================
function renderHeader() {
  const h = $("#header");
  if (!h) return;
  const sem = S.semesters.find(s => s.id === S.currentSemesterId);
  h.innerHTML = `
    <button class="hamburger" id="btn-sidebar" aria-label="${S.sidebarOpen ? 'Close menu' : 'Open menu'}">${S.sidebarOpen ? SVG.x : SVG.menu}</button>
    <div class="header-title">
      ${escapeHtml(sem ? sem.name : "CollegeFolder")}
      <small>Plan your semester</small>
    </div>
    <label class="search">
      ${SVG.search}
      <input id="search" type="search" placeholder="Search exams or courses…" aria-label="Search" />
      <kbd>⌘K</kbd>
    </label>
    <button class="btn btn-primary" id="btn-add">${SVG.plus} Add <kbd>N</kbd></button>
    <button class="theme-toggle" id="btn-theme" aria-label="Toggle theme">${SVG.sun}${SVG.moon}</button>
    <button class="menu-trigger" id="btn-menu" aria-haspopup="true" aria-expanded="${S.menuOpen}" aria-label="Settings">${SVG.cog}</button>`;

  $("#btn-sidebar").addEventListener("click", () => {
    S.sidebarOpen = !S.sidebarOpen;
    $("#sidebar").classList.toggle("open", S.sidebarOpen);
    const btn = $("#btn-sidebar");
    if (btn) btn.innerHTML = S.sidebarOpen ? SVG.x : SVG.menu;
  });

  // Close sidebar when clicking outside (registered only once).
  // Uses composedPath() because the click handler replaces #btn-sidebar's innerHTML,
  // detaching the original SVG target — closest() returns null on detached nodes.
  if (!window._sidebarOutsideListener) {
    window._sidebarOutsideListener = true;
    document.addEventListener("click", (e) => {
      if (!S.sidebarOpen) return;
      const path = e.composedPath();
      const hitBtn      = path.some(el => el && el.id === "btn-sidebar");
      const hitSidebar  = path.some(el => el && el.id === "sidebar");
      if (!hitBtn && !hitSidebar) {
        S.sidebarOpen = false;
        $("#sidebar")?.classList.remove("open");
        const btn = $("#btn-sidebar");
        if (btn) btn.innerHTML = SVG.menu;
      }
    });
  }
  $("#search").value = S.query;
  $("#search").addEventListener("input", e => {
    S.query = e.target.value;
    renderMain();
  });
  $("#btn-add").addEventListener("click", () => openComposer({}));
  $("#btn-theme").addEventListener("click", toggleTheme);
  $("#btn-menu").addEventListener("click", toggleSettingsMenu);
}

function toggleTheme() {
  S.theme = S.theme === "dark" ? "warm" : "dark";
  localStorage.setItem("cf_theme", S.theme);
  document.documentElement.dataset.theme = S.theme;
}

// =========================================================
// Settings menu (dropdown from header gear)
// =========================================================
function toggleSettingsMenu() {
  S.menuOpen = !S.menuOpen;
  renderSettingsMenu();
  $("#btn-menu").setAttribute("aria-expanded", S.menuOpen);
}

function renderSettingsMenu() {
  const existing = $("#settings-menu");
  if (existing) existing.remove();
  if (!S.menuOpen) return;
  const m = document.createElement("div");
  m.id = "settings-menu";
  m.className = "menu-dropdown";
  m.setAttribute("role", "menu");
  m.innerHTML = `
    <div class="menu-head">
      <h2>Settings</h2>
      <span class="who">${escapeHtml(S.email)}</span>
    </div>
    <div class="menu-section">
      <div class="menu-section-title">Appearance</div>
      <div class="menu-row">
        <span class="label">${SVG.moon} Dark mode</span>
        <button class="menu-toggle" id="set-dark" role="switch" aria-checked="${S.theme === "dark"}"></button>
      </div>
    </div>
    <div class="menu-section">
      <div class="menu-section-title">Calendar</div>
      <div class="menu-row">
        <span class="label">${SVG.layout} Default view</span>
        <div class="menu-seg" role="group">
          ${["month", "week", "agenda"].map(v =>
            `<button data-set-view="${v}" aria-pressed="${S.view === v}">${v[0].toUpperCase() + v.slice(1)}</button>`
          ).join("")}
        </div>
      </div>
    </div>
    <div class="menu-foot">
      <span class="shortcut-hint"><kbd>N</kbd> new <kbd>T</kbd> today <kbd>⌘K</kbd> search</span>
      <button class="logout" id="set-logout">${SVG.logout} Sign out</button>
    </div>`;
  document.body.appendChild(m);

  $("#set-dark", m).addEventListener("click", () => {
    toggleTheme();
    renderSettingsMenu();
  });
  $$("[data-set-view]", m).forEach(b => {
    b.addEventListener("click", () => {
      S.view = b.dataset.setView;
      localStorage.setItem("cf_view", S.view);
      renderSettingsMenu();
      renderMain();
    });
  });
  $("#set-logout", m).addEventListener("click", () => {
    S.menuOpen = false;
    renderSettingsMenu();
    cleanupMenu();
    handleLogout();
  });

  // Close on outside click / Esc
  setTimeout(() => {
    document.addEventListener("mousedown", outsideMenu);
    document.addEventListener("keydown", escMenu);
  }, 0);
}
function outsideMenu(e) {
  const m = $("#settings-menu");
  const trigger = $("#btn-menu");
  if (!m) return cleanupMenu();
  if (m.contains(e.target) || (trigger && trigger.contains(e.target))) return;
  S.menuOpen = false; renderSettingsMenu();
  $("#btn-menu")?.setAttribute("aria-expanded", "false");
  cleanupMenu();
}
function escMenu(e) {
  if (e.key !== "Escape") return;
  S.menuOpen = false; renderSettingsMenu();
  $("#btn-menu")?.setAttribute("aria-expanded", "false");
  cleanupMenu();
}
function cleanupMenu() {
  document.removeEventListener("mousedown", outsideMenu);
  document.removeEventListener("keydown", escMenu);
}

// =========================================================
// Sidebar
// =========================================================
function renderSidebar() {
  const s = $("#sidebar");
  if (!s) return;
  const sem = S.semesters.find(x => x.id === S.currentSemesterId);

  // Upcoming exams within ~14 days, sorted by date
  const upcoming = S.exams
    .map(e => ({ ev: e, dt: new Date(e.date + "T12:00:00") }))
    .filter(x => startOfDay(x.dt) >= startOfDay(today()))
    .sort((a, b) => a.dt - b.dt)
    .slice(0, 5);

  s.innerHTML = `
    <div class="sb-brand">
      <div class="sb-brand-mark">${LOGO(20)}</div>
      <div class="sb-brand-name">CollegeFolder</div>

    </div>
    <div class="sb-scroll">
      <div style="position:relative">
        <button class="semester-picker" id="sem-toggle" aria-haspopup="listbox" aria-expanded="${S.semPickerOpen}">
          <div class="sp-label">
            <span class="sp-eyebrow">Semester</span>
            <span class="sp-name">${escapeHtml(sem ? sem.name : "Pick a semester")}</span>
          </div>
          ${SVG.chevDown}
        </button>
        ${S.semPickerOpen ? renderSemPopover() : ""}
      </div>

      <div class="sb-section">
        <div class="sb-heading">
          <span>Courses <span class="sb-count">${S.courses.length}</span></span>
        </div>
        ${!S.currentSemesterId
          ? `<p class="sb-empty">Create your first semester to get started.</p>`
          : S.courses.length === 0
            ? `<p class="sb-empty">No courses yet — add one below.</p>`
            : `<div role="list">${S.courses.map(c => {
                const n = (S.todos.get(c.id) || []).filter(t => !t.is_done).length;
                return `
                  <button class="course-row" data-course="${c.id}" aria-label="${escapeHtml(c.name)}">
                    <span class="dot" style="background: var(--${colorFor(c.id)}-dot)"></span>
                    <span class="name">${escapeHtml(c.name)}</span>
                    <span class="count">${n}</span>
                  </button>`;
              }).join("")}</div>`
        }
        ${S.currentSemesterId ? `
          <div class="inline-add">
            <input id="new-course" type="text" placeholder="New course name…" />
            <button id="add-course">+ Add</button>
          </div>` : ""}
      </div>

      <div class="sb-upcoming" role="region" aria-label="Upcoming exams">
        <div class="sb-upcoming-title">Upcoming exams</div>
        ${upcoming.length === 0
          ? `<p style="font-size:13px;color:var(--ink-3);margin:0">No exams scheduled.</p>`
          : upcoming.map(({ ev, dt }) => {
              const c = courseById(ev.course_id);
              const days = daysBetween(dt, today());
              const label = days === 0 ? "TODAY" : `D-${days}`;
              return `
                <button class="upcoming-item" data-jump-course="${ev.course_id}">
                  <span class="dday ${days <= 3 ? "urgent" : ""}">${label}</span>
                  <div>
                    <div class="uname">${escapeHtml(ev.name)}</div>
                    <div class="ucourse">
                      <span style="width:6px;height:6px;border-radius:50%;background:var(--${colorFor(ev.course_id)}-dot);display:inline-block"></span>
                      ${escapeHtml(c?.name || "—")}
                    </div>
                  </div>
                </button>`;
            }).join("")
        }
      </div>
    </div>`;

  // Event wiring
  $("#sem-toggle").addEventListener("click", (e) => {
    e.stopPropagation();
    S.semPickerOpen = !S.semPickerOpen;
    renderSidebar();
  });
  if (S.semPickerOpen) wireSemPopover();

  $$("[data-course]", s).forEach(b => {
    b.addEventListener("click", () => openCourseDrawer(parseInt(b.dataset.course, 10)));
  });
  $$("[data-jump-course]", s).forEach(b => {
    b.addEventListener("click", () => openCourseDrawer(parseInt(b.dataset.jumpCourse, 10)));
  });

  const addCourseInput = $("#new-course", s);
  const addCourseBtn = $("#add-course", s);
  if (addCourseInput && addCourseBtn) {
    const submit = async () => {
      const name = addCourseInput.value.trim();
      if (!name) return;
      addCourseBtn.disabled = true;
      try {
        await api.courses.create(S.currentSemesterId, name);
        await loadSemesterData();
        update();
        toast("Course added", "success");
      } catch (e) { toast(e.message, "error"); }
      finally { addCourseBtn.disabled = false; }
    };
    addCourseBtn.addEventListener("click", submit);
    addCourseInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
  }
}

function renderSemPopover() {
  return `
    <div class="semester-popover" id="sem-pop" role="listbox">
      ${S.semesters.length === 0
        ? `<p style="padding:8px 10px; font-size:13px; color:var(--ink-3); margin:0">No semesters yet.</p>`
        : S.semesters.map(s => `
            <button class="sem-opt ${s.id === S.currentSemesterId ? "active" : ""}" data-sem="${s.id}" role="option">
              <span>${escapeHtml(s.name)}</span>
              <span class="del" data-del-sem="${s.id}" role="button" aria-label="Delete semester">${SVG.trash}</span>
            </button>`).join("")
      }
      <div class="inline-add">
        <input id="new-sem" type="text" placeholder="New semester name…" />
        <button id="add-sem">+ Add</button>
      </div>
    </div>`;
}

function wireSemPopover() {
  const pop = $("#sem-pop");
  if (!pop) return;
  $$("[data-sem]", pop).forEach(b => {
    b.addEventListener("click", async (e) => {
      if (e.target.closest("[data-del-sem]")) return;  // delete is handled separately
      const id = parseInt(b.dataset.sem, 10);
      if (id === S.currentSemesterId) { S.semPickerOpen = false; renderSidebar(); return; }
      S.currentSemesterId = id;
      localStorage.setItem("cf_semester", String(id));
      S.semPickerOpen = false;
      renderHeader();
      renderSidebar();
      renderMain();
      await loadSemesterData();
      update();
    });
  });
  $$("[data-del-sem]", pop).forEach(b => {
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = parseInt(b.dataset.delSem, 10);
      // Count courses/tasks for the specific semester being deleted (may differ from active semester)
      let semCourses = 0, semTasks = 0;
      try {
        const cs = await api.courses.list(id);
        semCourses = cs.length;
        const tCounts = await Promise.all(cs.map(c => api.todos.list(c.id).then(ts => ts.length).catch(() => 0)));
        semTasks = tCounts.reduce((a, b) => a + b, 0);
      } catch {}
      if (!confirm(`Delete this semester? This will also delete ${semCourses} course${semCourses !== 1 ? "s" : ""} and ${semTasks} task${semTasks !== 1 ? "s" : ""}.`)) return;
      try {
        await api.semesters.remove(id);
        if (S.currentSemesterId === id) {
          S.currentSemesterId = null;
          localStorage.removeItem("cf_semester");
        }
        await loadAll();
        S.semPickerOpen = false;
        renderHeader();
        update();
        toast("Semester deleted", "success");
      } catch (err) { toast(err.message, "error"); }
    });
  });
  const newInput = $("#new-sem", pop);
  const addBtn = $("#add-sem", pop);
  const submit = async () => {
    const name = newInput.value.trim();
    if (!name) return;
    addBtn.disabled = true;
    try {
      const created = await api.semesters.create(name);
      S.currentSemesterId = created.id;
      localStorage.setItem("cf_semester", String(created.id));
      await loadAll();
      S.semPickerOpen = false;
      renderHeader();
      update();
      toast("Semester added", "success");
    } catch (err) { toast(err.message, "error"); }
    finally { addBtn.disabled = false; }
  };
  addBtn.addEventListener("click", submit);
  newInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
  newInput.focus();

  // Close popover on outside click
  setTimeout(() => document.addEventListener("mousedown", outsideSemPop), 0);
}
function outsideSemPop(e) {
  const pop = $("#sem-pop");
  const trig = $("#sem-toggle");
  if (!pop) { document.removeEventListener("mousedown", outsideSemPop); return; }
  if (pop.contains(e.target) || (trig && trig.contains(e.target))) return;
  S.semPickerOpen = false;
  renderSidebar();
  document.removeEventListener("mousedown", outsideSemPop);
}

// =========================================================
// Exam banner
// =========================================================
function renderBanner() {
  const main = $("#main");
  if (!main) return;
  const existing = $("#exam-banner");
  if (existing) existing.remove();
  if (S.bannerDismissed || S.upcomingExams.length === 0) return;

  const banner = document.createElement("div");
  banner.id = "exam-banner";
  banner.className = "exam-banner";
  banner.setAttribute("role", "status");
  const lines = S.upcomingExams.slice(0, 2).map(e => {
    const c = courseById(e.course_id);
    const days = daysBetween(new Date(e.date + "T12:00:00"), today());
    const label = days === 0 ? "TODAY" : `D-${days}`;
    return `<div><b style="font-family:var(--font-mono)">${label}</b> · Good luck with your ${escapeHtml(c?.name || "")} ${escapeHtml(e.name)}</div>`;
  }).join("");
  const more = S.upcomingExams.length > 2
    ? `<div style="font-size:12px;opacity:.8;margin-top:2px">+${S.upcomingExams.length - 2} more exams coming up</div>` : "";
  banner.innerHTML = `
    <div class="ic">${SVG.bell}</div>
    <div style="flex:1; line-height:1.4">${lines}${more}</div>
    <button class="close" id="dismiss-banner">Dismiss</button>`;
  main.prepend(banner);
  $("#dismiss-banner").addEventListener("click", () => {
    S.bannerDismissed = true;
    banner.remove();
  });
}

// =========================================================
// Main content (toolbar + view)
// =========================================================
function renderMain() {
  const main = $("#main");
  if (!main) return;

  // Filter exams by search query
  const q = S.query.trim().toLowerCase();
  const filteredExams = !q ? S.exams : S.exams.filter(e => {
    const c = courseById(e.course_id);
    return e.name.toLowerCase().includes(q) || (c?.name || "").toLowerCase().includes(q);
  });

  const title = S.view === "week"
    ? `Week of ${MONTHS[S.viewDate.getMonth()]} ${S.viewDate.getDate()}`
    : MONTHS[S.viewDate.getMonth()];

  main.innerHTML = `
    <div class="toolbar" role="toolbar" aria-label="Calendar controls">
      <h1>${escapeHtml(title)} <span class="year">${S.viewDate.getFullYear()}</span></h1>
      <div class="nav-arrows">
        <button class="btn-icon" id="nav-prev" aria-label="Previous">${SVG.chevL}</button>
        <button class="btn" id="nav-today">Today</button>
        <button class="btn-icon" id="nav-next" aria-label="Next">${SVG.chevR}</button>
      </div>
      <div class="view-toggle" role="tablist">
        <button data-view="month"  aria-pressed="${S.view === "month"}">${SVG.cal} Month</button>
        <button data-view="week"   aria-pressed="${S.view === "week"}">${SVG.week} Week</button>
        <button data-view="agenda" aria-pressed="${S.view === "agenda"}">${SVG.list} Agenda</button>
      </div>
    </div>
    ${(() => {
      const allTodos = [...S.todos.values()].flat().filter(t => t.due_date);
      const filteredTodos = !q ? allTodos : allTodos.filter(t => {
        const c = courseById(t.course_id);
        return t.content.toLowerCase().includes(q) || (c?.name || "").toLowerCase().includes(q);
      });
      return S.view === "month"  ? renderMonth(filteredExams, filteredTodos)
           : S.view === "week"   ? renderWeek(filteredExams, filteredTodos)
           :                       renderAgenda(filteredExams, filteredTodos);
    })()}`;

  $("#nav-prev").addEventListener("click", () => { shiftView(-1); renderMain(); });
  $("#nav-next").addEventListener("click", () => { shiftView(+1); renderMain(); });
  $("#nav-today").addEventListener("click", () => { S.viewDate = new Date(); renderMain(); });
  $$("[data-view]", main).forEach(b => {
    b.addEventListener("click", () => {
      S.view = b.dataset.view;
      localStorage.setItem("cf_view", S.view);
      renderMain();
    });
  });
  // Calendar day clicks
  $$("[data-day]", main).forEach(b => {
    b.addEventListener("click", () => {
      const [y, m, d] = b.dataset.day.split("-").map(n => parseInt(n, 10));
      openDayDrawer(new Date(y, m - 1, d));
    });
  });
  // Agenda exam delete
  $$("[data-del-exam]", main).forEach(b => {
    b.addEventListener("click", async () => {
      const id = parseInt(b.dataset.delExam, 10);
      if (!confirm("Delete this exam?")) return;
      try { await api.exams.remove(id); await loadSemesterData(); update(); toast("Exam deleted", "success"); }
      catch (e) { toast(e.message, "error"); }
    });
  });

  // Agenda task toggle (buttons are in #main, not #drawer-root)
  $$("[data-toggle-todo]", main).forEach(b => {
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = parseInt(b.dataset.toggleTodo, 10);
      const courseId = parseInt(b.dataset.todoCourse, 10);
      if (!courseId) return;
      const todos = S.todos.get(courseId) || [];
      const t = todos.find(x => x.id === id);
      if (!t) return;
      try {
        await api.todos.update(courseId, id, !t.is_done, t.due_date ?? null);
        await loadSemesterData();
        update();
      } catch (e) { toast(e.message, "error"); }
    });
  });

  renderBanner();
}

function shiftView(dir) {
  const d = new Date(S.viewDate);
  if (S.view === "week") d.setDate(d.getDate() + 7 * dir);
  else d.setMonth(d.getMonth() + dir);
  S.viewDate = d;
}

// ----- Month grid -----
function monthMatrix(viewDate) {
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const start = new Date(y, m, 1 - new Date(y, m, 1).getDay());
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const d = new Date(start);
      d.setDate(start.getDate() + r * 7 + c);
      row.push(d);
    }
    rows.push(row);
  }
  return rows;
}

function renderMonth(exams, todos = []) {
  const byDate = new Map();
  exams.forEach(e => {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push({ ...e, _type: "exam" });
  });
  todos.forEach(t => {
    if (!byDate.has(t.due_date)) byDate.set(t.due_date, []);
    byDate.get(t.due_date).push({ ...t, _type: "todo" });
  });
  const todayD = today();
  const cells = monthMatrix(S.viewDate).flat().map(day => {
    const outside = day.getMonth() !== S.viewDate.getMonth();
    const isToday = sameDay(day, todayD);
    const isWknd  = day.getDay() === 0 || day.getDay() === 6;
    const k = iso(day);
    const list = byDate.get(k) || [];
    const shown = list.slice(0, 3);
    const extra = list.length - shown.length;
    return `
      <button class="cal-day ${outside ? "outside" : ""} ${isToday ? "today" : ""} ${isWknd ? "weekend" : ""}"
              data-day="${k}" aria-label="${WEEKDAYS[day.getDay()]}, ${MONTHS[day.getMonth()]} ${day.getDate()}${list.length ? `, ${list.length} exam${list.length > 1 ? "s" : ""}` : ""}">
        <span class="daynum">${day.getDate()}</span>
        <div class="events">
          ${shown.map(ev => {
            const c = courseById(ev.course_id);
            const label = ev._type === "todo" ? ev.content : ev.name;
            const icon  = ev._type === "todo" ? SVG.check : SVG.capSm;
            return `<span class="event-chip" data-c="${colorFor(ev.course_id)}" title="${escapeHtml((c?.name || "") + " · " + label)}">
              <span class="ic">${icon}</span>
              <span class="label">${escapeHtml(label)}</span>
            </span>`;
          }).join("")}
          ${extra > 0 ? `<span class="more-link">+${extra} more</span>` : ""}
        </div>
      </button>`;
  }).join("");

  return `
    <div class="cal-wrap">
      <div class="cal-weekheader" aria-hidden="true">
        ${WEEKDAYS.map((w, i) => `<div class="${i === 0 || i === 6 ? "weekend" : ""}">${w}</div>`).join("")}
      </div>
      <div class="cal-grid" role="grid">${cells}</div>
    </div>`;
}

// ----- Week grid -----
function renderWeek(exams, todos = []) {
  const start = new Date(S.viewDate);
  start.setDate(start.getDate() - start.getDay());
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const byDate = new Map();
  exams.forEach(e => { if (!byDate.has(e.date)) byDate.set(e.date, []); byDate.get(e.date).push({ ...e, _type: "exam" }); });
  todos.forEach(t => { if (!byDate.has(t.due_date)) byDate.set(t.due_date, []); byDate.get(t.due_date).push({ ...t, _type: "todo" }); });
  const todayD = today();

  const cells = days.map(day => {
    const isToday = sameDay(day, todayD);
    const isWknd = day.getDay() === 0 || day.getDay() === 6;
    const k = iso(day);
    const list = byDate.get(k) || [];
    return `
      <button class="cal-day ${isToday ? "today" : ""} ${isWknd ? "weekend" : ""}" data-day="${k}" style="padding:12px 10px">
        <span class="daynum" style="font-size:15px; width:30px; height:28px">${day.getDate()}</span>
        <div class="events" style="margin-top:8px">
          ${list.length === 0
            ? `<span style="font-size:12px;color:var(--ink-mute);font-style:italic;padding:4px 0">Nothing due</span>`
            : list.map(ev => {
                const c = courseById(ev.course_id);
                const wLabel = ev._type === "todo" ? ev.content : ev.name;
                const wIcon  = ev._type === "todo" ? SVG.check : SVG.capSm;
                return `<span class="event-chip" data-c="${colorFor(ev.course_id)}" style="padding:6px 8px; font-size:13px" title="${escapeHtml((c?.name || "") + " · " + wLabel)}">
                  <span class="ic">${wIcon}</span>
                  <span class="label">${escapeHtml(wLabel)}</span>
                </span>`;
              }).join("")
          }
        </div>
      </button>`;
  }).join("");

  return `
    <div class="cal-wrap">
      <div class="cal-weekheader" aria-hidden="true">
        ${days.map((d, i) => `<div class="${i === 0 || i === 6 ? "weekend" : ""}">${WEEKDAYS[d.getDay()]} <span style="color:var(--ink-mute);margin-left:6px">${d.getDate()}</span></div>`).join("")}
      </div>
      <div class="cal-grid" style="grid-auto-rows:1fr;min-height:480px" role="grid">${cells}</div>
    </div>`;
}

// ----- Agenda view -----
function renderAgenda(exams, todos = []) {
  const allItems = [
    ...exams.map(e => ({ ...e, _type: "exam", _sortDate: e.date })),
    ...todos.map(t => ({ ...t, _type: "todo", _sortDate: t.due_date }))
  ];
  if (allItems.length === 0) {
    return `<div class="empty-state">
      <h2>Nothing scheduled.</h2>
      <p>Press N to add an exam.</p>
    </div>`;
  }
  const sorted = allItems.sort((a, b) => a._sortDate.localeCompare(b._sortDate));
  const groups = new Map();
  sorted.forEach(e => { if (!groups.has(e._sortDate)) groups.set(e._sortDate, []); groups.get(e._sortDate).push(e); });
  const todayD = today();
  const html = Array.from(groups.entries()).map(([dateStr, items]) => {
    const dt = new Date(dateStr + "T12:00:00");
    const isToday = sameDay(dt, todayD);
    const isPast = startOfDay(dt) < startOfDay(todayD) && !isToday;
    return `
      <section class="agenda-group">
        <div class="agenda-group-h">
          <span class="date">${MONTHS[dt.getMonth()]} ${dt.getDate()}</span>
          <span class="day ${isToday ? "today" : isPast ? "past" : ""}">
            ${isToday ? "TODAY" : WEEKDAYS[dt.getDay()]}${isPast ? " · past" : ""}
          </span>
        </div>
        ${items.map(ev => {
          const c = courseById(ev.course_id);
          const aLabel = ev._type === "todo" ? ev.content : ev.name;
          const aIcon  = ev._type === "todo" ? SVG.check : SVG.capSm;
          const aTag   = ev._type === "todo" ? `<span class="kind-tag">Task</span>` : `<span class="kind-tag exam">Exam</span>`;
          const aDelete = ev._type === "exam" ? `<button class="btn-icon" data-del-exam="${ev.id}" aria-label="Delete">${SVG.trash}</button>` : "";
          const aCheckAttr = ev._type === "todo" ? `data-toggle-todo="${ev.id}" data-todo-course="${ev.course_id}" aria-pressed="${ev.is_done}"` : "";
          return `
            <div class="agenda-row" data-kind="${ev._type}">
              <button class="check" ${aCheckAttr} aria-label="${escapeHtml(aLabel)}">${ev._type === "todo" && ev.is_done ? SVG.check : ev._type !== "todo" ? aIcon : ""}</button>
              <div class="content">
                <span class="title" style="${ev._type === "todo" && ev.is_done ? "text-decoration:line-through;opacity:.5" : ""}">${escapeHtml(aLabel)}</span>
                <div class="meta">
                  <span class="pill" data-c="${colorFor(ev.course_id)}">
                    <span class="pdot" style="background:var(--${colorFor(ev.course_id)}-dot)"></span>
                    ${escapeHtml(c?.name || "—")}
                  </span>
                  ${aTag}
                </div>
              </div>
              ${aDelete}
            </div>`;
        }).join("")}
      </section>`;
  }).join("");
  return `<div class="agenda">${html}</div>`;
}

// =========================================================
// Day drawer
// =========================================================
function openDayDrawer(date) {
  closeDrawer();
  _openDayDrawerDate = date;
  const root = $("#drawer-root");
  const k = iso(date);
  const examList = S.exams.filter(e => e.date === k);
  const taskList = [...S.todos.values()].flat().filter(t => t.due_date === k);
  root.innerHTML = `
    <div class="drawer-backdrop" data-drawer-close></div>
    <aside class="drawer" role="dialog" aria-label="${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}">
      <div class="drawer-head">
        <div class="date-block">
          <span class="num">${date.getDate()}</span>
          <div class="info">
            <span class="day">${WEEKDAYS[date.getDay()]}</span>
            <span class="month">${MONTHS[date.getMonth()]} ${date.getFullYear()}</span>
          </div>
        </div>
        <button class="btn-icon" data-drawer-close aria-label="Close">${SVG.x}</button>
      </div>
      <div class="drawer-body">
        <div class="drawer-sec-title">
          <span>Exams</span>
          <button class="link" id="add-exam-here">+ Exam</button>
        </div>
        ${examList.length === 0
          ? `<div class="drawer-empty">No exams on this day.</div>`
          : examList.map(ev => {
              const c = courseById(ev.course_id);
              return `
                <div class="agenda-row" data-kind="exam" style="margin:0 0 4px">
                  <button class="check" aria-label="${escapeHtml(ev.name)}">${SVG.capSm}</button>
                  <div class="content">
                    <span class="title">${escapeHtml(ev.name)}</span>
                    <div class="meta">
                      <span class="pill" data-c="${colorFor(ev.course_id)}">
                        <span class="pdot" style="background:var(--${colorFor(ev.course_id)}-dot)"></span>
                        ${escapeHtml(c?.name || "—")}
                      </span>
                    </div>
                  </div>
                  <button class="btn-icon" data-del-exam="${ev.id}" aria-label="Delete">${SVG.trash}</button>
                </div>`;
            }).join("")
        }
        <div class="drawer-sec-title" style="margin-top:18px">
          <span>Tasks</span>
          <button class="link" id="add-task-here">+ Task</button>
        </div>
        ${taskList.length === 0
          ? `<div class="drawer-empty">No tasks on this day.</div>`
          : taskList.map(t => {
              const c = courseById(t.course_id);
              return `
                <div class="agenda-row" data-kind="todo" style="margin:0 0 4px">
                  <button class="check" data-toggle-todo="${t.id}" data-todo-course="${t.course_id}" aria-pressed="${t.is_done}" aria-label="${escapeHtml(t.content)}">${t.is_done ? SVG.check : ""}</button>
                  <div class="content">
                    <span class="title" style="${t.is_done ? "text-decoration:line-through;opacity:.5" : ""}">${escapeHtml(t.content)}</span>
                    <div class="meta">
                      <span class="pill" data-c="${colorFor(t.course_id)}">
                        <span class="pdot" style="background:var(--${colorFor(t.course_id)}-dot)"></span>
                        ${escapeHtml(c?.name || "—")}
                      </span>
                    </div>
                  </div>
                </div>`;
            }).join("")
        }
      </div>
    </aside>`;
  wireDrawerCommon();
  $("#add-exam-here").addEventListener("click", () => {
    closeDrawer();
    openComposer({ kind: "exam", date: iso(date) });
  });
  $("#add-task-here").addEventListener("click", () => {
    closeDrawer();
    openComposer({ kind: "todo", date: iso(date) });
  });
}

// =========================================================
// Course drawer
// =========================================================
function openCourseDrawer(courseId) {
  closeDrawer();
  _openCourseDrawerId = courseId;
  const c = courseById(courseId);
  if (!c) return;
  const todos = S.todos.get(courseId) || [];
  const courseExams = S.exams.filter(e => e.course_id === courseId)
                              .sort((a, b) => a.date.localeCompare(b.date));
  const root = $("#drawer-root");
  root.innerHTML = `
    <div class="drawer-backdrop" data-drawer-close></div>
    <aside class="drawer" role="dialog" aria-label="${escapeHtml(c.name)}">
      <div class="drawer-head">
        <div class="course-block">
          <div class="swatch" style="background:var(--${colorFor(c.id)}-bg);color:var(--${colorFor(c.id)}-fg)">${SVG.cap}</div>
          <div class="info">
            <span class="code">${escapeHtml(c.name)}</span>
            <span class="meta">${todos.length} task${todos.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <button class="btn-icon" data-drawer-close aria-label="Close">${SVG.x}</button>
      </div>
      <div class="drawer-body">
        <div class="drawer-sec-title"><span>Color</span></div>
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
          ${COLOR_NAMES.map(col => `
            <button data-pick-color="${col}" style="
              width:24px;height:24px;border-radius:50%;
              background:var(--${col}-dot);
              border:3px solid ${c.color === col ? "var(--ink-1)" : "transparent"};
              cursor:pointer;padding:0"
              aria-label="${col}"></button>`).join("")}
        </div>
        <div class="drawer-sec-title"><span>Tasks</span></div>
        <div class="drawer-quick-add">
          <input id="quick-todo" type="text" placeholder="Add a task…" />
          <button class="btn btn-primary" id="quick-todo-add" style="height:36px;padding:0 14px">${SVG.plus}</button>
        </div>
        <div id="todo-list">${renderTodos(c.id, todos)}</div>


        <div style="margin-top:28px; padding:0 10px">
          <button class="btn btn-danger" id="del-course" style="width:100%; justify-content:center">
            ${SVG.trash} Delete course
          </button>
        </div>
      </div>
    </aside>`;
  wireDrawerCommon();

  const input = $("#quick-todo");
  const addBtn = $("#quick-todo-add");
  input.focus();

  $$("[data-pick-color]", root).forEach(btn => {
    btn.addEventListener("click", async () => {
      const col = btn.dataset.pickColor;
      try {
        await api.courses.update(c.id, { color: col });
        await loadSemesterData();
        openCourseDrawer(c.id);
        update();
      } catch (e) { toast(e.message, "error"); }
    });
  });

  const submit = async () => {
    const v = input.value.trim();
    if (!v) return;
    addBtn.disabled = true;
    try {
      await api.todos.create(c.id, v);
      await loadSemesterData();
      // Re-render the drawer to show the new todo
      openCourseDrawer(c.id);
      update();
    } catch (e) { toast(e.message, "error"); }
    finally { addBtn.disabled = false; }
  };
  addBtn.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });

  $("#del-course").addEventListener("click", async () => {
    if (!confirm("Delete this course and everything in it?")) return;
    try {
      await api.courses.remove(c.id);
      closeDrawer();
      await loadSemesterData();
      update();
      toast("Course deleted", "success");
    } catch (e) { toast(e.message, "error"); }
  });
}

function renderTodos(courseId, todos) {
  if (todos.length === 0) return `<div class="drawer-empty">No tasks yet.</div>`;
  return todos.map(td => `
    <div class="agenda-row ${td.is_done ? "done" : ""}" style="margin:0 0 4px">
      <button class="check" data-toggle-todo="${td.id}" aria-pressed="${td.is_done}" aria-label="${escapeHtml(td.content)}">${td.is_done ? SVG.check : ""}</button>
      <div class="content"><span class="title">${escapeHtml(td.content)}</span></div>
      <button class="btn-icon" data-del-todo="${td.id}" aria-label="Delete">${SVG.trash}</button>
    </div>`).join("");
}

function wireDrawerCommon() {
  const d = $("#drawer-root");
  $$("[data-drawer-close]", d).forEach(el => el.addEventListener("click", closeDrawer));
  $$("[data-del-exam]", d).forEach(b => {
    b.addEventListener("click", async () => {
      const id = parseInt(b.dataset.delExam, 10);
      if (!confirm("Delete this exam?")) return;
      try {
        await api.exams.remove(id);
        await loadSemesterData();
        closeDrawer();
        update();
        toast("Exam deleted", "success");
      } catch (e) { toast(e.message, "error"); }
    });
  });
  $$("[data-toggle-todo]", $("#drawer-root")).forEach(b => {
    b.addEventListener("click", async () => {
      const id = parseInt(b.dataset.toggleTodo, 10);
      // data-todo-course is set on day-drawer tasks; fall back to open course drawer
      const drawerCourseId = b.dataset.todoCourse
        ? parseInt(b.dataset.todoCourse, 10)
        : findOpenCourseDrawerId();
      if (!drawerCourseId) return;
      const todos = S.todos.get(drawerCourseId) || [];
      const t = todos.find(x => x.id === id);
      if (!t) return;
      try {
        await api.todos.update(drawerCourseId, id, !t.is_done, t.due_date ?? null);
        await loadSemesterData();
        // If this is a day drawer (not course drawer), just re-open the same day
        if (b.dataset.todoCourse) {
          update();
          if (_openDayDrawerDate) openDayDrawer(_openDayDrawerDate);
        } else {
          openCourseDrawer(drawerCourseId);
          update();
        }
      } catch (e) { toast(e.message, "error"); }
    });
  });
  $$("[data-del-todo]", $("#drawer-root")).forEach(b => {
    b.addEventListener("click", async () => {
      const id = parseInt(b.dataset.delTodo, 10);
      const drawerCourseId = findOpenCourseDrawerId();
      if (!drawerCourseId) return;
      if (!confirm("Delete this task?")) return;
      try {
        await api.todos.remove(drawerCourseId, id);
        await loadSemesterData();
        openCourseDrawer(drawerCourseId);
        update();
      } catch (e) { toast(e.message, "error"); }
    });
  });
}

// Tracks which course drawer is currently open so todo handlers know their scope
let _openCourseDrawerId = null;
function findOpenCourseDrawerId() { return _openCourseDrawerId; }
let _openDayDrawerDate = null;

function closeDrawer() {
  _openDayDrawerDate = null;
  $("#drawer-root").innerHTML = "";
  _openCourseDrawerId = null;
}

// =========================================================
// Composer modal (add task or exam)
// =========================================================
function openComposer({ kind = "todo", courseId = null, date = null } = {}) {
  closeModal();
  if (S.courses.length === 0) {
    toast("Add a course first before creating tasks or exams.", "error");
    return;
  }
  const root = $("#modal-root");
  const initialCourseId = courseId || S.courses[0].id;
  const initialDate = date || iso(today());

  // Local form state, kept in closure
  let form = { kind, title: "", courseId: initialCourseId, date: initialDate, busy: false, err: null };

  function paint() {
    root.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal" role="dialog" aria-label="${form.kind === "exam" ? "Add an exam" : "Add a task"}">
          <div class="modal-head">
            <h2>${form.kind === "exam" ? "Add an exam" : "Add a task"}</h2>
            <button class="btn-icon" id="modal-close" aria-label="Close">${SVG.x}</button>
          </div>
          <div class="modal-body">
            <div class="kind-toggle" role="tablist">
              <button data-kind="todo" aria-pressed="${form.kind === "todo"}">${SVG.check} Task</button>
              <button data-kind="exam" aria-pressed="${form.kind === "exam"}">${SVG.cap} Exam</button>
            </div>
            ${form.err ? `<div class="form-error">${escapeHtml(form.err)}</div>` : ""}
            <div class="field">
              <label for="cmp-title">${form.kind === "exam" ? "Exam name" : "What needs doing?"}</label>
              <input id="cmp-title" type="text" class="title-input"
                     placeholder="${form.kind === "exam" ? "e.g. Midterm 2" : "e.g. Finish problem set 5"}"
                     value="${escapeHtml(form.title)}" />
            </div>
            <div class="${form.kind === "exam" ? "field-row" : "field-row single"}">
              <div class="field">
                <label>Course</label>
                <div class="course-picker" role="radiogroup">
                  ${S.courses.map(c => `
                    <button data-cmp-course="${c.id}" aria-pressed="${form.courseId === c.id}">
                      <span class="pdot" style="background:var(--${colorFor(c.id)}-dot)"></span>
                      ${escapeHtml(c.name)}
                    </button>`).join("")}
                </div>
              </div>
              <div class="field">
                <label for="cmp-date">${form.kind === "exam" ? "Exam date" : "Due date (optional)"}</label>
                <input id="cmp-date" type="date" value="${escapeHtml(form.date)}" />
              </div>
            </div>
          </div>
          <div class="modal-foot">
            <div class="help">
              <span><kbd>⌘</kbd>+<kbd>Enter</kbd> save</span>
              <span><kbd>Esc</kbd> cancel</span>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn" id="cmp-cancel">Cancel</button>
              <button class="btn btn-primary" id="cmp-save" ${form.busy ? "disabled" : ""}>
                ${SVG.plus} ${form.busy ? "Saving…" : (form.kind === "exam" ? "Add exam" : "Add task")}
              </button>
            </div>
          </div>
        </div>
      </div>`;
    wireForm();
  }

  function wireForm() {
    const m = $("#modal-root");
    $("#modal-backdrop", m).addEventListener("click", (e) => { if (e.target.id === "modal-backdrop") closeModal(); });
    $("#modal-close", m).addEventListener("click", closeModal);
    $("#cmp-cancel", m).addEventListener("click", closeModal);
    $$("[data-kind]", m).forEach(b => b.addEventListener("click", () => { form.kind = b.dataset.kind; paint(); $("#cmp-title").focus(); }));
    $$("[data-cmp-course]", m).forEach(b => b.addEventListener("click", () => { form.courseId = parseInt(b.dataset.cmpCourse, 10); paint(); $("#cmp-title").focus(); }));
    const title = $("#cmp-title", m);
    title.addEventListener("input", e => form.title = e.target.value);
    title.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); save(); } });
    const dateEl = $("#cmp-date", m);
    if (dateEl) dateEl.addEventListener("input", e => form.date = e.target.value);
    $("#cmp-save", m).addEventListener("click", save);
    title.focus();
  }

  async function save() {
    form.err = null;
    if (!form.title.trim()) { form.err = "Give it a name."; paint(); return; }
    if (!form.courseId) { form.err = "Pick a course."; paint(); return; }
    if (form.kind === "exam" && !form.date) { form.err = "Pick a date."; paint(); return; }
    form.busy = true; paint();
    try {
      if (form.kind === "todo") {
        await api.todos.create(form.courseId, form.title.trim(), form.date || null);
      } else {
        await api.exams.create(form.courseId, form.title.trim(), form.date);
      }
      await loadSemesterData();
      closeModal();
      update();
      toast(form.kind === "exam" ? "Exam added" : "Task added", "success");
    } catch (e) {
      form.err = e.message; form.busy = false; paint();
    }
  }

  paint();
}

function closeModal() { $("#modal-root").innerHTML = ""; }

// =========================================================
// Keyboard shortcuts
// =========================================================
document.addEventListener("keydown", (e) => {
  if (!S.token) return;
  const tag = (document.activeElement?.tagName || "").toLowerCase();
  // ⌘K / Ctrl+K = focus search
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    $("#search")?.focus();
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (tag === "input" || tag === "textarea" || tag === "select") return;
  // Modal/drawer open? Esc closes them; other shortcuts pause.
  const drawerOpen = $("#drawer-root").childNodes.length > 0;
  const modalOpen = $("#modal-root").childNodes.length > 0;
  if (e.key === "Escape") {
    if (modalOpen) { closeModal(); return; }
    if (drawerOpen) { closeDrawer(); return; }
    if (S.menuOpen) { S.menuOpen = false; renderSettingsMenu(); return; }
    return;
  }
  if (drawerOpen || modalOpen) return;
  if (e.key === "n" || e.key === "N") { e.preventDefault(); openComposer({}); }
  else if (e.key === "t" || e.key === "T") { S.viewDate = new Date(); renderMain(); }
  else if (e.key === "[") { shiftView(-1); renderMain(); }
  else if (e.key === "]") { shiftView(+1); renderMain(); }
  else if (e.key === "m" || e.key === "M") { S.view = "month";  localStorage.setItem("cf_view", S.view); renderMain(); }
  else if (e.key === "w" || e.key === "W") { S.view = "week";   localStorage.setItem("cf_view", S.view); renderMain(); }
  else if (e.key === "a" || e.key === "A") { S.view = "agenda"; localStorage.setItem("cf_view", S.view); renderMain(); }
});

// =========================================================
// Boot
// =========================================================
(async function boot() {
  document.documentElement.dataset.theme = S.theme === "dark" ? "dark" : "warm";
  if (S.token) {
    await loadAll();
  }
  render();
})();