let taskArr = [];
let currTask = null;
let tTime = 0;
let timerId = null;
let startAllQueue = [];

const listEl = document.getElementById("listEl");
const currTaskEl = document.getElementById("currTask");
const clockEl = document.getElementById("clock");
const sumEl = document.getElementById("sumEl");
const barEl = document.getElementById("barEl");

function save() {
  localStorage.setItem("taskArr", JSON.stringify(taskArr));
}

function load() {
  try {
    taskArr = JSON.parse(localStorage.getItem("taskArr")) || [];
  } catch {
    taskArr = [];
  }
  showTasks();
  updateSummary();
}

function formatTime(s) {
  let h = String(Math.floor(s / 3600)).padStart(2, "0");
  let m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  let sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function addTask() {
  let name = document.getElementById("taskName").value.trim();
  let time = parseInt(document.getElementById("taskTime").value);
  let date = document.getElementById("taskDate").value;
  let priority = document.getElementById("taskPriority").value;

  if (!name || !time) {
    alert("Please enter a valid name and duration");
    return;
  }

  taskArr.push({
    name: name,
    time: time,
    date: date,
    priority: priority || "low",
    status: "pending",
    remain: null,
  });

  document.getElementById("taskName").value = "";
  document.getElementById("taskTime").value = "";
  document.getElementById("taskDate").value = "";

  save();
  showTasks();
  updateSummary();
}

function showTasks() {
  listEl.innerHTML = "";
  taskArr.forEach((t, i) => {
    let item = document.createElement("div");
    item.className = "task-item";
    item.draggable = true;
    item.dataset.index = i;

    let pr =
      t.priority === "high"
        ? "High"
        : t.priority === "medium"
        ? "Medium"
        : "Low";

    item.innerHTML = `
      <div class="task-text">
        <h3>${t.name} 
          <span class="priority-badge priority-${t.priority}-badge">${pr}</span>
        </h3>
        <div>Time: ${t.time} min ${
          t.date ? `• When: ${new Date(t.date).toLocaleString()}` : ""
        }</div>
      </div>
      <div class="task-buttons">
        <button class="start-btn" onclick="startTask(${i})" ${
      t.status === "running" ? "disabled" : ""
    }>▶</button>
        <button class="pause-btn" onclick="pauseTask(${i})" ${
      t.status !== "running" ? "disabled" : ""
    }>⏸</button>
        <button class="skip-btn" onclick="skipTask(${i})" ${
      t.status === "done" || t.status === "skipped" ? "disabled" : ""
    }>⏭</button>
        <button class="complete-btn" onclick="completeTask(${i})" ${
      t.status === "done" ? "disabled" : ""
    }>✔</button>
        <button class="delete-btn" onclick="deleteTask(${i})">❌</button>
      </div>
    `;

    listEl.appendChild(item);
  });
}

function startTask(i, fromQueue = false) {
  if (currTask !== null && !fromQueue) {
    alert("Another task is already running!");
    return;
  }

  let t = taskArr[i];
  if (!t) return;

  let now = new Date();
  if (t.date && new Date(t.date) > now) {
    alert("This task is scheduled for the future!");
    return;
  }

  if (t.status === "paused") {
    tTime = t.remain;
  } else if (t.status === "pending") {
    tTime = t.time * 60;
    t.status = "running";
  } else {
    return;
  }

  currTask = i;
  currTaskEl.innerText = t.name;

  clearInterval(timerId);
  timerId = setInterval(() => {
    clockEl.innerText = formatTime(tTime);
    barEl.style.width =
      ((t.time * 60 - tTime) / (t.time * 60)) * 100 + "%";

    if (tTime <= 0) {
      clearInterval(timerId);
      t.status = "done";
      currTask = null;
      clockEl.innerText = "00:00:00";
      currTaskEl.innerText = "No task running";
      barEl.style.width = "0%";
      save();
      showTasks();
      updateSummary();

      if (startAllQueue.length > 0) {
        setTimeout(() => {
          startTask(startAllQueue.shift(), true);
        }, 3000);
      }
    }
    tTime--;
  }, 1000);

  save();
  showTasks();
  updateSummary();
}

function pauseTask(i) {
  let t = taskArr[i];
  if (!t || t.status !== "running") return;

  clearInterval(timerId);
  t.status = "paused";
  t.remain = tTime;
  currTask = null;
  clockEl.innerText = "00:00:00";
  currTaskEl.innerText = "No task running";
  barEl.style.width = "0%";
  save();
  showTasks();
  updateSummary();
}

function skipTask(i) {
  let t = taskArr[i];
  if (!t) return;

  if (t.status === "running") {
    clearInterval(timerId);
    currTask = null;
    clockEl.innerText = "00:00:00";
    currTaskEl.innerText = "No task running";
    barEl.style.width = "0%";
  }

  t.status = "skipped";
  save();
  showTasks();
  updateSummary();
}

function completeTask(i) {
  let t = taskArr[i];
  if (!t) return;

  if (t.status === "running") {
    clearInterval(timerId);
    currTask = null;
    clockEl.innerText = "00:00:00";
    currTaskEl.innerText = "No task running";
    barEl.style.width = "0%";
  }

  t.status = "done";
  save();
  showTasks();
  updateSummary();
}

function deleteTask(i) {
  let t = taskArr[i];
  if (!t) return;

  if (t.status === "running") {
    clearInterval(timerId);
    currTask = null;
    clockEl.innerText = "00:00:00";
    currTaskEl.innerText = "No task running";
    barEl.style.width = "0%";
  }

  taskArr.splice(i, 1);
  save();
  showTasks();
  updateSummary();
}

function startAll() {
  startAllQueue = [];
  taskArr.forEach((t, i) => {
    if (t.status === "pending" || t.status === "paused") {
      startAllQueue.push(i);
    }
  });

  if (startAllQueue.length > 0) {
    startTask(startAllQueue.shift(), true);
  } else {
    alert("No pending tasks to start.");
  }
}

function endAll() {
  if (currTask !== null) {
    clearInterval(timerId);
    taskArr[currTask].status = "skipped";
    currTask = null;
    clockEl.innerText = "00:00:00";
    currTaskEl.innerText = "No task running";
    barEl.style.width = "0%";
  }

  taskArr.forEach((t) => {
    if (t.status === "pending" || t.status === "paused")
      t.status = "skipped";
  });

  save();
  showTasks();
  updateSummary();
  alert("All running tasks have been ended.");
}

function updateSummary() {
  let total = taskArr.length;
  let completed = taskArr.filter((t) => t.status === "done").length;
  let pending = taskArr.filter(
    (t) => t.status === "pending" || t.status === "paused"
  ).length;
  let skipped = taskArr.filter((t) => t.status === "skipped").length;

  sumEl.innerHTML = `
    <p>Total Tasks: ${total}</p>
    <p>Completed: ${completed}</p>
    <p>Pending: ${pending}</p>
    <p>Skipped: ${skipped}</p>
  `;
}

load();
