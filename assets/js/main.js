let tasks = [];
let nextId = 1;
let currentFilter = "all";
let currentSort = "deadline";
let searchQuery = "";
let editingId = null;

function loadFromStorage() {
  const stored = localStorage.getItem("todo_pro_advanced");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.tasks)) {
        tasks = parsed.tasks;
        nextId =
          parsed.nextId ||
          (tasks.length > 0 ? Math.max(...tasks.map((t) => t.id), 0) + 1 : 1);
      }
    } catch (e) {}
  }
}

function saveToStorage() {
  localStorage.setItem("todo_pro_advanced", JSON.stringify({ tasks, nextId }));
}

function isDeadlineExpired(deadlineStr) {
  if (!deadlineStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadlineStr);
  deadlineDate.setHours(0, 0, 0, 0);
  return deadlineDate < today;
}

function getPriorityText(priority) {
  const map = { low: "🟢 کم", medium: "🟡 متوسط", high: "🔴 بالا" };
  return map[priority] || "🟡 متوسط";
}

function addNewTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const deadline = document.getElementById("taskDeadline").value;
  const desc = document.getElementById("taskDesc").value.trim();
  const priority = document.getElementById("taskPriority").value;

  if (!title) {
    alert("لطفاً عنوان کار را وارد کنید!");
    return;
  }
  if (!deadline) {
    alert("لطفاً حداکثر تاریخ را انتخاب کنید!");
    return;
  }

  const newTask = {
    id: nextId++,
    title: title,
    description: desc,
    deadline: deadline,
    priority: priority,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  saveToStorage();
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDeadline").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskPriority").value = "medium";
  renderTasks();
}

function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveToStorage();
    renderTasks();
  }
}

function deleteTask(id) {
  if (confirm("آیا از حذف این کار اطمینان دارید؟")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveToStorage();
    renderTasks();
  }
}

function startEdit(id) {
  editingId = id;
  renderTasks();
}

function saveEdit(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const newTitle = document.getElementById(`edit-title-${id}`).value.trim();
  const newDesc = document.getElementById(`edit-desc-${id}`).value;
  const newDeadline = document.getElementById(`edit-deadline-${id}`).value;
  const newPriority = document.getElementById(`edit-priority-${id}`).value;

  if (!newTitle) {
    alert("عنوان نمی‌تواند خالی باشد!");
    return;
  }
  if (!newDeadline) {
    alert("ددلاین الزامی است!");
    return;
  }

  task.title = newTitle;
  task.description = newDesc;
  task.deadline = newDeadline;
  task.priority = newPriority;

  editingId = null;
  saveToStorage();
  renderTasks();
}

function cancelEdit() {
  editingId = null;
  renderTasks();
}

function getFilteredSortedTasks() {
  let filtered = [...tasks];

  if (currentFilter === "pending")
    filtered = filtered.filter((t) => !t.completed);
  if (currentFilter === "completed")
    filtered = filtered.filter((t) => t.completed);
  if (currentFilter === "expired")
    filtered = filtered.filter(
      (t) => !t.completed && isDeadlineExpired(t.deadline),
    );

  if (searchQuery) {
    filtered = filtered.filter(
      (t) =>
        t.title.includes(searchQuery) ||
        (t.description && t.description.includes(searchQuery)),
    );
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  if (currentSort === "deadline") {
    filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  } else if (currentSort === "priority") {
    filtered.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );
  } else if (currentSort === "title") {
    filtered.sort((a, b) => a.title.localeCompare(b.title, "fa"));
  }

  return filtered;
}

function updateStats() {
  const total = tasks.length;
  const pending = tasks.filter((t) => !t.completed).length;
  const expired = tasks.filter(
    (t) => !t.completed && isDeadlineExpired(t.deadline),
  ).length;
  document.getElementById("statsInfo").innerHTML =
    `📋 ${total} کار | ⏳ ${pending} جاری | ⚠️ ${expired} موعد گذشته`;
}

function renderTasks() {
  const taskListEl = document.getElementById("taskList");
  const filtered = getFilteredSortedTasks();

  if (filtered.length === 0) {
    taskListEl.innerHTML = `<li class="empty-msg">✨ هیچ کاری در این بخش نیست. وقتشه یه کار جدید اضافه کنی!</li>`;
    updateStats();
    return;
  }

  taskListEl.innerHTML = filtered
    .map((task) => {
      if (editingId === task.id) {
        return `
                    <li class="task-item priority-${task.priority}">
                        <div class="edit-form">
                            <input type="text" id="edit-title-${task.id}" value="${escapeHtml(task.title)}" placeholder="عنوان">
                            <textarea id="edit-desc-${task.id}" rows="2" placeholder="توضیحات">${escapeHtml(task.description || "")}</textarea>
                            <input type="date" id="edit-deadline-${task.id}" value="${task.deadline}">
                            <select id="edit-priority-${task.id}">
                                <option value="low" ${task.priority === "low" ? "selected" : ""}>🟢 کم</option>
                                <option value="medium" ${task.priority === "medium" ? "selected" : ""}>🟡 متوسط</option>
                                <option value="high" ${task.priority === "high" ? "selected" : ""}>🔴 بالا</option>
                            </select>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="save-btn" onclick="saveEdit(${task.id})">✓ ذخیره</button>
                                <button class="cancel-btn" onclick="cancelEdit()">✗ انصراف</button>
                            </div>
                        </div>
                    </li>
                `;
      }

      const isExpired = !task.completed && isDeadlineExpired(task.deadline);
      const deadlineClass = isExpired ? "deadline-expired" : "";
      const formattedDeadline = task.deadline.replace(/-/g, "/");
      const completedClass = task.completed
        ? 'style="text-decoration: line-through; opacity:0.7;"'
        : "";

      return `
                <li class="task-item priority-${task.priority}">
                    <div class="task-check">
                        <input type="checkbox" ${task.completed ? "checked" : ""} class="task-complete" data-id="${task.id}">
                    </div>
                    <div class="task-content">
                        <div class="task-header">
                            <span class="task-title" ${completedClass}>${escapeHtml(task.title)}</span>
                            <span class="priority-badge">${getPriorityText(task.priority)}</span>
                        </div>
                        ${task.description ? `<div class="task-desc" ${completedClass}>${escapeHtml(task.description)}</div>` : ""}
                        <div class="task-meta">
                            <span class="deadline-badge ${deadlineClass}">
                                📅 ددلاین: ${formattedDeadline} ${isExpired ? "⏰ (گذشته)" : ""}
                            </span>
                            <span>🕒 ایجاد: ${new Date(task.createdAt).toLocaleDateString("fa-IR")}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" data-id="${task.id}">✏️</button>
                        <button class="delete-btn" data-id="${task.id}">🗑️</button>
                    </div>
                </li>
            `;
    })
    .join("");

  document.querySelectorAll(".task-complete").forEach((cb) => {
    cb.addEventListener("change", (e) =>
      toggleComplete(parseInt(cb.dataset.id)),
    );
  });
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => startEdit(parseInt(btn.dataset.id)));
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => deleteTask(parseInt(btn.dataset.id)));
  });

  updateStats();
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  renderTasks();
}

function init() {
  loadFromStorage();
  const today = new Date();
  const defaultDeadline = new Date(today.setDate(today.getDate() + 3))
    .toISOString()
    .split("T")[0];
  document.getElementById("taskDeadline").value = defaultDeadline;
  renderTasks();

  document.getElementById("addBtn").addEventListener("click", addNewTask);
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });
  document.getElementById("taskTitle").addEventListener("keypress", (e) => {
    if (e.key === "Enter") addNewTask();
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderTasks();
  });

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderTasks();
  });

  const themeToggle = document.getElementById("themeToggle");
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ روشن";
  }
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    themeToggle.textContent = isDark ? "☀️ روشن" : "🌙 دارک";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.startEdit = startEdit;
window.deleteTask = deleteTask;

init();
