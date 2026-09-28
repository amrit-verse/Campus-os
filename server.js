const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dataFilePath = path.join(__dirname, "data", "timetables.json");

let dataset = {
  floors: ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"],
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  rooms: []
};

function loadDataset() {
  try {
    if (fs.existsSync(dataFilePath)) {
      dataset = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
      console.log(`Loaded dataset with ${dataset.rooms.length} rooms.`);
    }
  } catch (err) {
    console.error("Error loading timetables.json:", err);
  }
}
loadDataset();

const toMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minToTime = (m) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

const getDayName = (dStr) => {
  if (!dStr || dStr.toLowerCase() === "today") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = days[new Date().getDay()];
    return d === "Sunday" ? "Monday" : d;
  }
  const match = dataset.days.find(d => d.toLowerCase() === dStr.toLowerCase());
  return match || "Monday";
};

const getNowMin = (tStr) => {
  if (tStr && tStr !== "now") {
    return toMin(tStr);
  }
  const d = new Date();
  const current = d.getHours() * 60 + d.getMinutes();
  // Default to 10:30 AM (630 mins) if outside standard college hours (08:00 - 18:00)
  if (current < 480 || current > 1080) {
    return 630; // 10:30 AM default test time slot
  }
  return current;
};

function parseIntent(q = "") {
  const s = q.toLowerCase();
  
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

  let duration = 120; // Default 2 hours
  const dm = s.match(/(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)/);
  if (dm) {
    duration = Math.round(Number(dm[1]) * (/min/.test(dm[2]) ? 1 : 60));
  }

  let capacity = 0;
  const cm = s.match(/(?:for|capacity|team of|group of)\s*(\d+)\s*(?:people|persons|students|members|seats)?/);
  if (cm) {
    capacity = Number(cm[1]);
  }

  let day = getDayName();
  for (const d of dataset.days) {
    if (s.includes(d.toLowerCase())) {
      day = d;
      break;
    }
  }

  let startMin = getNowMin();
  const tm = s.match(/at\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (tm) {
    let h = parseInt(tm[1], 10);
    const m = tm[2] ? parseInt(tm[2], 10) : 0;
    if (tm[3] === "pm" && h < 12) h += 12;
    if (tm[3] === "am" && h === 12) h = 0;
    startMin = h * 60 + m;
  }

  return { floor, feature, duration, capacity, day, startMin };
}

function evaluateRoom(room, day, startMin, duration) {
  const daySchedule = (room.schedule && room.schedule[day]) ? room.schedule[day] : [];
  const endMin = startMin + duration;

  // Check current occupying class
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

  // Check collision for requested duration window
  const hasConflict = daySchedule.some(slot => {
    const s = toMin(slot[0]);
    const e = toMin(slot[1]);
    return startMin < e && endMin > s;
  });

  // Find next upcoming class start after startMin
  let nextClassStartMin = 1080; // Default end of day (18:00)
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
    status, // "FREE", "SOON", "BUSY"
    currentClass,
    nextClass,
    freeUntil: minToTime(nextClassStartMin),
    freeMinutesRemaining: freeMinutes,
    queryDay: day,
    queryTime: minToTime(startMin)
  };
}

// API Routes
app.get("/api/data", (req, res) => {
  res.json(dataset);
});

app.get("/api/rooms", (req, res) => {
  const day = getDayName(req.query.day);
  const time = getNowMin(req.query.time);
  const duration = req.query.duration ? parseInt(req.query.duration, 10) : 120;

  const evaluated = dataset.rooms.map(room => evaluateRoom(room, day, time, duration));
  res.json({ day, time: minToTime(time), rooms: evaluated });
});

app.post("/api/search", (req, res) => {
  const queryText = req.body.query || "";
  const intent = parseIntent(queryText);
  if (req.body.day) intent.day = getDayName(req.body.day);
  if (req.body.time) intent.startMin = getNowMin(req.body.time);

  const candidates = dataset.rooms.filter(r =>
    (!intent.floor || r.floor === intent.floor) &&
    (!intent.feature || (r.features && r.features.includes(intent.feature))) &&
    (!intent.capacity || r.capacity >= intent.capacity)
  );

  const results = candidates.map(r => evaluateRoom(r, intent.day, intent.startMin, intent.duration));
  const availableRooms = results.filter(r => r.available);

  res.json({
    intent: {
      ...intent,
      startTime: minToTime(intent.startMin)
    },
    results,
    availableCount: availableRooms.length,
    available: availableRooms
  });
});

app.post("/api/import", (req, res) => {
  if (!Array.isArray(req.body.rooms)) {
    return res.status(400).json({ error: "rooms array required" });
  }
  dataset.rooms = req.body.rooms;
  fs.writeFileSync(dataFilePath, JSON.stringify(dataset, null, 2));
  res.json({ ok: true, count: dataset.rooms.length });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`SmartSearch Floor Manager PRO running at http://localhost:${PORT}`));
