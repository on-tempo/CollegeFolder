const API = "https://collegefolder-backend.onrender.com";
let token = localStorage.getItem("token");
let currentSemesterId = null;
let currentCourseId = null;

// ==================== AUTH ====================

async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    if (res.ok) {
        const data = await res.json();
        token = data.access_token;
        localStorage.setItem("token", token);
        showMainSection();
    } else {
        alert("Invalid email or password");
    }
}

async function register() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    if (res.ok) {
        alert("Registered! Please login.");
        showLogin();
    } else {
        alert("Email already registered");
    }
}

function logout() {
    localStorage.removeItem("token");
    token = null;
    document.getElementById("auth-section").classList.remove("hidden");
    document.getElementById("main-section").classList.add("hidden");
}

function showRegister() {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.remove("hidden");
}

function showLogin() {
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
}

function showMainSection() {
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("main-section").classList.remove("hidden");
    loadSemesters();
    checkUpcomingExams();
}

// ==================== HELPERS ====================

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// ==================== EXAMS WARNING ====================

async function checkUpcomingExams() {
    const res = await fetch(`${API}/exams/upcoming`, {
        headers: authHeaders()
    });
    if (!res.ok) return;

    const exams = await res.json();
    const banner = document.getElementById("exam-warning");

    if (exams.length > 0) {
        const today = new Date();
        const messages = exams.map(exam => {
            const examDate = new Date(exam.date);
            const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
            return `⚠️ D-${diff}: Good luck with your ${exam.name}!`;
        });
        banner.innerHTML = messages.join("<br>");
        banner.classList.remove("hidden");
    }
}

// ==================== SEMESTERS ====================

async function loadSemesters() {
    const res = await fetch(`${API}/semesters/`, { headers: authHeaders() });
    const semesters = await res.json();

    const list = document.getElementById("semester-list");
    list.innerHTML = "";

    semesters.forEach(s => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <span onclick="openSemester(${s.id}, '${s.name}')">${s.name}</span>
            <button class="delete-btn" onclick="deleteSemester(${s.id})">Delete</button>
        `;
        list.appendChild(card);
    });
}

async function createSemester() {
    const name = document.getElementById("semester-name").value;
    if (!name) return;

    await fetch(`${API}/semesters/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name })
    });

    document.getElementById("semester-name").value = "";
    loadSemesters();
}

async function deleteSemester(id) {
    await fetch(`${API}/semesters/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    loadSemesters();
}

function openSemester(id, name) {
    currentSemesterId = id;
    document.getElementById("semester-section").classList.add("hidden");
    document.getElementById("course-section").classList.remove("hidden");
    document.getElementById("course-section-title").textContent = name;
    loadCourses();
}

function backToSemesters() {
    document.getElementById("course-section").classList.add("hidden");
    document.getElementById("semester-section").classList.remove("hidden");
}

// ==================== COURSES ====================

async function loadCourses() {
    const res = await fetch(`${API}/semesters/${currentSemesterId}/courses`, {
        headers: authHeaders()
    });
    const courses = await res.json();

    const list = document.getElementById("course-list");
    list.innerHTML = "";

    courses.forEach(c => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <span onclick="openCourse(${c.id}, '${c.name}')">${c.name}</span>
            <button class="delete-btn" onclick="deleteCourse(${c.id})">Delete</button>
        `;
        list.appendChild(card);
    });
}

async function createCourse() {
    const name = document.getElementById("course-name").value;
    if (!name) return;

    await fetch(`${API}/semesters/${currentSemesterId}/courses`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name })
    });

    document.getElementById("course-name").value = "";
    loadCourses();
}

async function deleteCourse(id) {
    await fetch(`${API}/courses/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    loadCourses();
}

function openCourse(id, name) {
    currentCourseId = id;
    document.getElementById("course-section").classList.add("hidden");
    document.getElementById("todo-section").classList.remove("hidden");
    document.getElementById("todo-section-title").textContent = name;
    loadTodos();
    loadExams();
}

function backToCourses() {
    document.getElementById("todo-section").classList.add("hidden");
    document.getElementById("course-section").classList.remove("hidden");
}

// ==================== TODOS ====================

async function loadTodos() {
    const res = await fetch(`${API}/courses/${currentCourseId}/todos`, {
        headers: authHeaders()
    });
    const todos = await res.json();

    const list = document.getElementById("todo-list");
    list.innerHTML = "";

    todos.forEach(t => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <span class="${t.is_done ? 'done' : ''}" onclick="toggleTodo(${t.id}, ${t.is_done})">${t.content}</span>
            <button class="delete-btn" onclick="deleteTodo(${t.id})">Delete</button>
        `;
        list.appendChild(card);
    });
}

async function createTodo() {
    const content = document.getElementById("todo-content").value;
    if (!content) return;

    await fetch(`${API}/courses/${currentCourseId}/todos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content })
    });

    document.getElementById("todo-content").value = "";
    loadTodos();
}

async function toggleTodo(id, currentStatus) {
    await fetch(`${API}/courses/${currentCourseId}/todos/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_done: !currentStatus })
    });
    loadTodos();
}

async function deleteTodo(id) {
    await fetch(`${API}/courses/${currentCourseId}/todos/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    loadTodos();
}

// ==================== EXAMS ====================

async function loadExams() {
    const res = await fetch(`${API}/exams`, {
        headers: authHeaders()
    });
    const exams = await res.json();
    const courseExams = exams.filter(e => e.course_id === currentCourseId);

    const list = document.getElementById("exam-list");
    list.innerHTML = "";

    courseExams.forEach(e => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <span>${e.name} - ${e.date}</span>
            <button class="delete-btn" onclick="deleteExam(${e.id})">Delete</button>
        `;
        list.appendChild(card);
    });
}

async function createExam() {
    const name = document.getElementById("exam-name").value;
    const date = document.getElementById("exam-date").value;
    if (!name || !date) return;

    await fetch(`${API}/courses/${currentCourseId}/exams`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, date })
    });

    document.getElementById("exam-name").value = "";
    document.getElementById("exam-date").value = "";
    loadExams();
}

async function deleteExam(id) {
    await fetch(`${API}/exams/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    loadExams();
}

// ==================== INIT ====================

// Auto login if token exists
if (token) {
    showMainSection();
}