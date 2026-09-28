/* SmartSearch Floor Manager PRO - Application Core (THE QUANTUM QUAD) */

let currentData = {
  day: "Monday",
  time: "10:30",
  rooms: [],
  intent: null
};

let countdownTimerInterval = null;
let activeModalRoom = null;
let localDataset = null;

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// Helper Utilities
function escapeHTML(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function fmtDuration(mins) {
  if (mins % 60 === 0) return `${mins / 60}h`;
  return `${mins}m`;
}

function showToast(msg) {
  const t = $("#toastNotification");
  if (!t) return;
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, 3000);
}

const toMin = (t) => {
  if (!t) return 630;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minToTime = (m) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

// Client-Side Evaluator Fallback (for static GitHub Pages hosting)
async function getLocalDataset() {
  if (localDataset) return localDataset;
  try {
    const res = await fetch("./data/timetables.json");
    localDataset = await res.json();
  } catch (err) {
    console.error("Failed to load local dataset:", err);
  }
  return localDataset;
}

function evaluateRoomClient(room, day, startMin, duration) {
  const daySchedule = (room.schedule && room.schedule[day]) ? room.schedule[day] : [];
  const endMin = startMin + duration;

  let currentClass = null;
  for (const slot of daySchedule) {
    const s = toMin(slot[0]);
    const e = toMin(slot[1]);
    if (startMin >= s && startMin < e) {
      currentClass = {
        title: slot[2] || "Scheduled Class",
        section: slot[3] || "",
        start: slot[0],
        end: slot[1]
      };
      break;
    }
  }

  const hasConflict = daySchedule.some(slot => {
    const s = toMin(slot[0]);
    const e = toMin(slot[1]);
    return startMin < e && endMin > s;
  });

  let nextClassStartMin = 1080;
  let nextClass = null;
  for (const slot of daySchedule) {
    const s = toMin(slot[0]);
    if (s > startMin && s < nextClassStartMin) {
      nextClassStartMin = s;
      nextClass = {
        title: slot[2] || "Upcoming Class",
        section: slot[3] || "",
        start: slot[0],
        end: slot[1]
      };
    }
  }

  const freeMinutes = currentClass ? 0 : Math.max(0, nextClassStartMin - startMin);

  let status = "FREE";
  if (currentClass) {
    status = "BUSY";
  } else if (hasConflict || freeMinutes < 30) {
    status = "SOON";
  }

  return {
    ...room,
    available: !hasConflict && !currentClass,
    status,
    currentClass,
    nextClass,
    freeUntil: minToTime(nextClassStartMin),
    freeMinutesRemaining: freeMinutes,
    queryDay: day,
    queryTime: minToTime(startMin)
  };
}

// Data Fetching
async function fetchRooms() {
  const day = $("#daySelect").value;
  const time = $("#timeSelect").value;
  
  try {
    const res = await fetch(`./api/rooms?day=${encodeURIComponent(day)}&time=${encodeURIComponent(time)}`);
    if (!res.ok) throw new Error("API not available, fallback to client-side");
    const data = await res.json();
    currentData.day = data.day;
    currentData.time = data.time;
    currentData.rooms = data.rooms;
  } catch (err) {
    // Client-side fallback for GitHub Pages
    const dataset = await getLocalDataset();
    if (dataset) {
      const startMin = time === "now" ? 630 : toMin(time);
      currentData.day = day;
      currentData.time = minToTime(startMin);
      currentData.rooms = dataset.rooms.map(r => evaluateRoomClient(r, day, startMin, 120));
    }
  }
  
  updateStats();
  renderFloorGrid();
  if (window.update3DMapRooms) {
    window.update3DMapRooms(currentData.rooms);
  }
}

async function performAISearch() {
  const query = $("#aiSearchQuery").value.trim();
  if (!query) return;

  $("#aiStatusTag").textContent = "ANALYZING…";
  const day = $("#daySelect").value;
  const time = $("#timeSelect").value;

  try {
    const res = await fetch("./api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, day, time })
    });
    if (!res.ok) throw new Error("API not available");
    const data = await res.json();
    $("#aiStatusTag").textContent = "MATCHED";

    currentData.intent = data.intent;
    currentData.rooms = data.results;

    renderIntentBanner(data.intent, data.availableCount);
  } catch (err) {
    // Client-Side AI Intent Parser fallback for GitHub Pages
    const dataset = await getLocalDataset();
    if (dataset) {
      const s = query.toLowerCase();
      let floor = null;
      if (/ground/.test(s)) floor = "Ground Floor";
      else if (/1st|first/.test(s)) floor = "1st Floor";
      else if (/2nd|second/.test(s)) floor = "2nd Floor";
      else if (/3rd|third/.test(s)) floor = "3rd Floor";

      let feature = null;
      if (/\bac\b|air[- ]?condition/.test(s)) feature = "AC";
      else if (/projector/.test(s)) feature = "Projector";
      else if (/\blab\b/.test(s)) feature = "Lab";
      else if (/smart\s*board/.test(s)) feature = "Smart Board";

      let duration = 120;
      const dm = s.match(/(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)/);
      if (dm) duration = Math.round(Number(dm[1]) * (/min/.test(dm[2]) ? 1 : 60));

      let capacity = 0;
      const cm = s.match(/(?:for|capacity|team of|group of)\s*(\d+)\s*(?:people|persons|students|members|seats)?/);
      if (cm) capacity = Number(cm[1]);

      const startMin = time === "now" ? 630 : toMin(time);

      const intent = { floor, feature, duration, capacity, day, startTime: minToTime(startMin) };
      
      const candidates = dataset.rooms.filter(r =>
        (!floor || r.floor === floor) &&
        (!feature || (r.features && r.features.includes(feature))) &&
        (!capacity || r.capacity >= capacity)
      );

      const results = candidates.map(r => evaluateRoomClient(r, day, startMin, duration));
      const availableCount = results.filter(r => r.available).length;

      currentData.intent = intent;
      currentData.rooms = results;

      $("#aiStatusTag").textContent = "MATCHED";
      renderIntentBanner(intent, availableCount);
    }
  }

  updateStats();
  renderFloorGrid();
  if (window.update3DMapRooms) {
    window.update3DMapRooms(currentData.rooms);
  }
}

function renderIntentBanner(intent, matchCount) {
  const banner = $("#aiIntentResult");
  if (!banner) return;

  const parts = [];
  parts.push(`Floor: <b>${intent.floor || "Any"}</b>`);
  parts.push(`Feature: <b>${intent.feature || "Any"}</b>`);
  if (intent.capacity) parts.push(`Capacity: <b>${intent.capacity}+ seats</b>`);
  parts.push(`Duration: <b>${fmtDuration(intent.duration)}</b>`);
  parts.push(`Query Time: <b>${currentData.day} @ ${intent.startTime}</b>`);

  banner.innerHTML = `✓ <strong>Extracted Intent:</strong> ${parts.join(" &nbsp;•&nbsp; ")} &nbsp; | &nbsp; <strong>${matchCount} room(s) available</strong>`;
  banner.style.display = "block";
}

function updateStats() {
  const total = currentData.rooms.length;
  const free = currentData.rooms.filter(r => r.status === "FREE").length;

  $("#statTotalRooms").textContent = total;
  $("#statFreeRooms").textContent = free;
}

// Floor Grid View Renderer
function renderFloorGrid() {
  const container = $("#floorGridContainer");
  if (!container) return;

  const filterFloor = $("#filterFloor").value;
  const filterFeature = $("#filterFeature").value;
  const filterCap = Number($("#filterCapacity").value);
  const filterStatus = $("#filterStatus").value;

  let filtered = currentData.rooms.filter(r => {
    if (filterFloor && r.floor !== filterFloor) return false;
    if (filterFeature && (!r.features || !r.features.includes(filterFeature))) return false;
    if (filterCap && r.capacity < filterCap) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const floors = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"];
  
  container.innerHTML = floors.map(floorName => {
    const roomsOnFloor = filtered.filter(r => r.floor === floorName);
    if (roomsOnFloor.length === 0 && filterFloor && filterFloor !== floorName) return "";

    const freeCount = roomsOnFloor.filter(r => r.status === "FREE").length;

    return `
      <section class="floor-section">
        <div class="floor-head">
          <h3>${escapeHTML(floorName)}</h3>
          <span class="floor-count">${freeCount}/${roomsOnFloor.length} Available Free</span>
        </div>
        <div class="room-grid">
          ${roomsOnFloor.length > 0 ? roomsOnFloor.map(room => renderRoomCard(room)).join("") : '<div class="no-rooms">No matching rooms on this floor.</div>'}
        </div>
      </section>
    `;
  }).join("");

  // Attach click listener to room cards
  $$(".room-card").forEach(card => {
    card.onclick = () => {
      const roomId = card.dataset.id;
      const room = currentData.rooms.find(r => r.id === roomId);
      if (room) openRoomModal(room);
    };
  });
}

function renderRoomCard(room) {
  const statusClass = room.status.toLowerCase();
  const badgeText = room.status === "FREE" ? "FREE" : (room.status === "SOON" ? "ENDING SOON" : "BUSY");
  const subText = room.currentClass 
    ? `Occupied: ${escapeHTML(room.currentClass.title)}` 
    : `Free until ${room.freeUntil || "end of day"}`;

  return `
    <div class="room-card ${statusClass}" data-id="${escapeHTML(room.id)}">
      <div class="room-card-header">
        <div>
          <span class="room-id">${escapeHTML(room.id)}</span>
          <span class="room-subname">${escapeHTML(room.name)}</span>
        </div>
        <span class="badge ${statusClass}">${badgeText}</span>
      </div>
      <p class="room-details-p">👥 ${room.capacity} seats &nbsp;•&nbsp; ${subText}</p>
      <div class="tags-list">
        ${(room.features || []).map(f => `<span class="tag">${escapeHTML(f)}</span>`).join("")}
      </div>
    </div>
  `;
}

// Modal & Countdown & Squad Share logic
function openRoomModal(room) {
  activeModalRoom = room;
  const modal = $("#roomModal");
  if (!modal) return;

  $("#modalRoomFloor").textContent = room.floor.toUpperCase();
  $("#modalRoomTitle").textContent = room.id;
  $("#modalRoomName").textContent = room.name;
  
  const statusBadge = $("#modalStatusBadge");
  statusBadge.className = `status-badge ${room.status.toLowerCase()}`;
  statusBadge.textContent = room.status;

  $("#modalCapacity").textContent = `${room.capacity} Seats`;
  $("#modalFeatures").innerHTML = (room.features || []).map(f => `<span class="tag">${escapeHTML(f)}</span>`).join("");
  $("#modalDay").textContent = currentData.day;

  // Render Schedule
  const scheduleList = $("#modalScheduleList");
  const daySchedule = (room.schedule && room.schedule[currentData.day]) ? room.schedule[currentData.day] : [];
  if (daySchedule.length === 0) {
    scheduleList.innerHTML = `<div class="slot-item"><span>No scheduled lectures for ${currentData.day}</span></div>`;
  } else {
    scheduleList.innerHTML = daySchedule.map(slot => `
      <div class="slot-item ${room.currentClass && room.currentClass.start === slot[0] ? 'active-slot' : ''}">
        <b>${slot[0]} - ${slot[1]}</b>
        <span>${escapeHTML(slot[2])} (${escapeHTML(slot[3])})</span>
      </div>
    `).join("");
  }

  // Countdown setup
  startCountdownTimer(room);

  modal.classList.add("active");
}

function startCountdownTimer(room) {
  if (countdownTimerInterval) clearInterval(countdownTimerInterval);

  const timerDisplay = $("#countdownTimer");
  const timerLabel = $("#timerLabel");
  const timerSubtext = $("#timerSubtext");

  let remainingSeconds = (room.freeMinutesRemaining || 60) * 60;

  if (room.currentClass) {
    timerLabel.textContent = "CURRENT CLASS ENDS IN:";
    const [eh, em] = room.currentClass.end.split(":").map(Number);
    const endTotalSec = (eh * 60 + em) * 60;
    const [qh, qm] = (currentData.time || "10:30").split(":").map(Number);
    const currentTotalSec = (qh * 60 + qm) * 60;
    remainingSeconds = Math.max(0, endTotalSec - currentTotalSec);
    timerSubtext.textContent = `Lecture: ${room.currentClass.title}`;
  } else {
    timerLabel.textContent = "FREE TIME REMAINING UNTIL NEXT LECTURE:";
    timerSubtext.textContent = `Free until ${room.freeUntil || "05:00 PM"}`;
  }

  function tick() {
    if (remainingSeconds <= 0) {
      timerDisplay.textContent = "00:00:00";
      return;
    }

    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    const s = remainingSeconds % 60;

    timerDisplay.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    remainingSeconds--;
  }

  tick();
  countdownTimerInterval = setInterval(tick, 1000);
}

function closeModal() {
  const modal = $("#roomModal");
  if (modal) modal.classList.remove("active");
  if (countdownTimerInterval) clearInterval(countdownTimerInterval);
}

// "Call the Squad" WhatsApp Share
function generateSquadMessage(room) {
  const roomName = room.id;
  const floor = room.floor;
  const freeUntil = room.freeUntil || "05:00 PM";
  return `📍 Heading to ${roomName} (${floor}). It's free until ${freeUntil}. Come fast!`;
}

function inviteOnWhatsApp() {
  if (!activeModalRoom) return;
  const text = generateSquadMessage(activeModalRoom);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

function copySquadInvite() {
  if (!activeModalRoom) return;
  const text = generateSquadMessage(activeModalRoom);
  navigator.clipboard.writeText(text).then(() => {
    showToast("📍 Squad invite message copied to clipboard!");
  });
}

// Event Listeners Initialization
function initEventListeners() {
  // Day & Time select
  $("#daySelect").onchange = fetchRooms;
  $("#timeSelect").onchange = fetchRooms;

  // AI Search
  $("#aiSearchBtn").onclick = performAISearch;
  $("#aiSearchQuery").addEventListener("keydown", e => {
    if (e.key === "Enter") performAISearch();
  });

  // Prompt chips
  $$(".prompt-suggestions .chip").forEach(chip => {
    chip.onclick = () => {
      $("#aiSearchQuery").value = chip.dataset.q;
      performAISearch();
    };
  });

  // Grid Filters
  ["filterFloor", "filterFeature", "filterCapacity", "filterStatus"].forEach(id => {
    $("#" + id).onchange = renderFloorGrid;
  });

  // View Switcher Tabs
  const tabs = [
    { btn: "#tab3DMap", view: "#view3DMap", key: "3dmap" },
    { btn: "#tabGrid", view: "#viewGrid", key: "grid" },
    { btn: "#tabAIFinder", view: "#viewGrid", key: "aifinder" },
    { btn: "#tabAttendance", view: "#viewAttendance", key: "attendance" }
  ];

  tabs.forEach(t => {
    $(t.btn).onclick = () => {
      $$(".tab-btn").forEach(b => b.classList.remove("active"));
      $$(".view-panel").forEach(p => p.classList.remove("active"));
      $(t.btn).classList.add("active");
      $(t.view).classList.add("active");

      if (t.key === "3dmap") {
        if (!window.scene) {
          window.init3DMap("map3dContainer");
          window.update3DMapRooms(currentData.rooms);
        }
      } else if (t.key === "attendance") {
        if (window.renderAttendanceCalculator) {
          window.renderAttendanceCalculator();
        }
      }
    };
  });

  // 3D Floor Selector
  $$(".floor-3d-btn").forEach(btn => {
    btn.onclick = () => {
      $$(".floor-3d-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const floor = btn.dataset.floor;
      if (window.filter3DMapByFloor) {
        window.filter3DMapByFloor(floor);
      }
    };
  });

  // Modal Close
  $("#modalCloseBtn").onclick = closeModal;
  $("#roomModal").onclick = e => {
    if (e.target === $("#roomModal")) closeModal();
  };

  // Squad Share Buttons
  $("#squadWhatsAppBtn").onclick = inviteOnWhatsApp;
  $("#squadCopyBtn").onclick = copySquadInvite;
}

// Initial Boot
window.onload = async () => {
  initEventListeners();
  await fetchRooms();

  // Initialize 3D Map
  setTimeout(() => {
    if (window.init3DMap) {
      window.init3DMap("map3dContainer");
      window.update3DMapRooms(currentData.rooms);
    }
  }, 300);
};

window.openRoomModal = openRoomModal;
