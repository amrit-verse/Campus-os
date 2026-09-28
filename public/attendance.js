/* Attendance Calculator & OD Simulator Engine for THE QUANTUM QUAD */

const ATTENDANCE_SECTIONS = {
  "SEC-1": {
    name: "IV ECE A (Electronics)",
    dept: "Electronics & Communication",
    subjects: [
      { code: "EC401", name: "VLSI Design & Embedded Systems", target: 75, conducted: 42, attended: 34 },
      { code: "EC402", name: "Optical & Wireless Communication", target: 75, conducted: 38, attended: 29 },
      { code: "EC403", name: "Digital Signal Processing", target: 75, conducted: 40, attended: 26 },
      { code: "EC404L", name: "Embedded Systems Practical Lab", target: 75, conducted: 20, attended: 18 }
    ]
  },
  "SEC-2": {
    name: "IV ECE B (Telecommunication)",
    dept: "Electronics & Communication",
    subjects: [
      { code: "EC405", name: "Computer Networks & Security", target: 75, conducted: 44, attended: 37 },
      { code: "EC406", name: "Antenna Theory & Wave Propagation", target: 75, conducted: 36, attended: 24 },
      { code: "EC407", name: "RF Circuit Design", target: 75, conducted: 32, attended: 25 },
      { code: "EC408L", name: "VLSI CAD Laboratory", target: 75, conducted: 22, attended: 19 }
    ]
  },
  "SEC-3": {
    name: "III ECE DS (Data Science)",
    dept: "Data Science & Signal Processing",
    subjects: [
      { code: "DS301", name: "Machine Learning for Signals", target: 75, conducted: 40, attended: 35 },
      { code: "DS302", name: "Big Data Analytics & Cloud", target: 75, conducted: 36, attended: 28 },
      { code: "DS303", name: "Pattern Recognition & AI Ethics", target: 75, conducted: 30, attended: 21 },
      { code: "DS304L", name: "Data Science Capstone Lab", target: 75, conducted: 18, attended: 16 }
    ]
  }
};

function renderAttendanceCalculator() {
  const container = document.getElementById("attendanceCalculatorSection");
  if (!container) return;

  const secKey = document.getElementById("attSectionSelect") ? document.getElementById("attSectionSelect").value : "SEC-1";
  const section = ATTENDANCE_SECTIONS[secKey] || ATTENDANCE_SECTIONS["SEC-1"];

  let totalConducted = 0;
  let totalAttended = 0;
  let atRiskCount = 0;

  const cardsHtml = section.subjects.map(subj => {
    totalConducted += subj.conducted;
    totalAttended += subj.attended;
    const pct = Math.round((subj.attended / subj.conducted) * 100);
    const isRisk = pct < 75;
    if (isRisk) atRiskCount++;

    const neededTo75 = Math.max(0, Math.ceil((0.75 * subj.conducted - subj.attended) / 0.25));

    return `
      <div class="attendance-card ${isRisk ? 'risk' : 'safe'}">
        <div class="att-card-head">
          <div>
            <strong>${subj.name}</strong>
            <small>${subj.code}</small>
          </div>
          <span class="att-pct ${isRisk ? 'risk' : 'safe'}">${pct}%</span>
        </div>
        <div class="att-progress-bar">
          <div class="att-fill ${isRisk ? 'risk' : 'safe'}" style="width: ${pct}%"></div>
        </div>
        <div class="att-stats">
          <span>Attended: <b>${subj.attended}/${subj.conducted}</b></span>
          <span>${isRisk ? `🚨 Must attend next <b>${neededTo75}</b> classes` : '✅ Safe Standing'}</span>
        </div>
      </div>
    `;
  }).join("");

  const overallPct = Math.round((totalAttended / totalConducted) * 100);

  container.innerHTML = `
    <div class="att-dashboard">
      <div class="att-header">
        <div>
          <span class="kicker">ROUND 1 INTEGRATION • ATTENDANCE CALCULATOR</span>
          <h2>Target Attendance & Risk Advisor</h2>
          <p>Section: <strong>${section.name}</strong> (${section.dept})</p>
        </div>
        <div class="att-overall-badge ${overallPct < 75 ? 'risk' : 'safe'}">
          <small>OVERALL STANDING</small>
          <b>${overallPct}%</b>
          <span>${atRiskCount > 0 ? `⚠️ ${atRiskCount} Course(s) at Risk` : '🌟 Honor Standing'}</span>
        </div>
      </div>

      <div class="att-controls">
        <label>Select Section:</label>
        <select id="attSectionSelect" onchange="renderAttendanceCalculator()">
          <option value="SEC-1">IV ECE A (Electronics)</option>
          <option value="SEC-2">IV ECE B (Telecommunication)</option>
          <option value="SEC-3">III ECE DS (Data Science)</option>
        </select>
        <button class="chip" onclick="applyPreset('detention')">🚨 Simulate Detention Risk</button>
        <button class="chip" onclick="applyPreset('elite')">🌟 Simulate Honor Student (90%)</button>
      </div>

      <div class="att-grid">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function applyPreset(type) {
  if (type === "detention") {
    ATTENDANCE_SECTIONS["SEC-1"].subjects[0].attended = 20; // 47%
    ATTENDANCE_SECTIONS["SEC-1"].subjects[2].attended = 24; // 60%
  } else {
    ATTENDANCE_SECTIONS["SEC-1"].subjects[0].attended = 39; // 92%
    ATTENDANCE_SECTIONS["SEC-1"].subjects[2].attended = 37; // 92%
  }
  renderAttendanceCalculator();
}

window.renderAttendanceCalculator = renderAttendanceCalculator;
window.applyPreset = applyPreset;
