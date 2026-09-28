/* Attendance Calculator & OD Simulator Engine for THE QUANTUM QUAD - All 10 Sections */

const ATTENDANCE_SECTIONS = {
  "SEC-1": {
    name: "IV ECE A (Electronics & Comm)",
    dept: "Department of ECE",
    subjects: [
      { code: "EC401", name: "VLSI Design & System Architecture", target: 75, conducted: 44, attended: 36 },
      { code: "EC402", name: "Embedded & Real-Time Systems", target: 75, conducted: 40, attended: 31 },
      { code: "EC403", name: "Optical & Wireless Communication", target: 75, conducted: 38, attended: 27 },
      { code: "EC404L", name: "Embedded Systems Practical Lab", target: 75, conducted: 20, attended: 18 }
    ]
  },
  "SEC-2": {
    name: "IV ECE B (Electronics & Comm)",
    dept: "Department of ECE",
    subjects: [
      { code: "EC405", name: "Computer Networks & Security", target: 75, conducted: 45, attended: 38 },
      { code: "EC406", name: "Antenna Theory & Wave Propagation", target: 75, conducted: 36, attended: 25 },
      { code: "EC407", name: "RF Circuit Design & Microwave", target: 75, conducted: 34, attended: 26 },
      { code: "EC408L", name: "Cadence VLSI CAD Laboratory", target: 75, conducted: 22, attended: 19 }
    ]
  },
  "SEC-3": {
    name: "III ECE DS (Data Science & Signal Processing)",
    dept: "Data Science & Signal Processing",
    subjects: [
      { code: "DS301", name: "Machine Learning for Signals", target: 75, conducted: 42, attended: 36 },
      { code: "DS302", name: "Big Data Analytics & Cloud Systems", target: 75, conducted: 38, attended: 29 },
      { code: "DS303", name: "Computer Vision & Pattern Recognition", target: 75, conducted: 32, attended: 22 },
      { code: "DS304L", name: "Data Science Capstone Practical Lab", target: 75, conducted: 20, attended: 17 }
    ]
  },
  "SEC-4": {
    name: "III ECE A (Communications)",
    dept: "Department of ECE",
    subjects: [
      { code: "EC301", name: "Digital Signal Processing", target: 75, conducted: 40, attended: 33 },
      { code: "EC302", name: "Microcontrollers & Interfacing", target: 75, conducted: 36, attended: 28 },
      { code: "EC303", name: "Control Systems & Automation", target: 75, conducted: 34, attended: 24 },
      { code: "EC304L", name: "DSP & Microcontroller Lab", target: 75, conducted: 18, attended: 16 }
    ]
  },
  "SEC-5": {
    name: "III ECE B (Communications)",
    dept: "Department of ECE",
    subjects: [
      { code: "EC305", name: "Linear Integrated Circuits", target: 75, conducted: 42, attended: 35 },
      { code: "EC306", name: "Transmission Lines & Waveguides", target: 75, conducted: 38, attended: 29 },
      { code: "EC307", name: "Electromagnetics & Fields", target: 75, conducted: 32, attended: 23 },
      { code: "EC308L", name: "Analog Communication Lab", target: 75, conducted: 20, attended: 17 }
    ]
  },
  "SEC-6": {
    name: "III BME (Biomedical Engineering)",
    dept: "Biomedical Engineering",
    subjects: [
      { code: "BM301", name: "Diagnostic & Therapeutic Equipment", target: 75, conducted: 40, attended: 34 },
      { code: "BM302", name: "Bio-Fluid Dynamics & Mechanics", target: 75, conducted: 36, attended: 27 },
      { code: "BM303", name: "Medical Optics & Bio-Sensors", target: 75, conducted: 30, attended: 21 },
      { code: "BM304L", name: "Biomedical Instrumentation Lab", target: 75, conducted: 18, attended: 15 }
    ]
  },
  "SEC-7": {
    name: "II ECE DS A (Data Science & Programming)",
    dept: "Data Science Block",
    subjects: [
      { code: "DS201", name: "Object Oriented Programming in C++", target: 75, conducted: 44, attended: 37 },
      { code: "DS202", name: "Probability & Applied Statistics", target: 75, conducted: 38, attended: 30 },
      { code: "DS203", name: "Digital Logic & Circuit Theory", target: 75, conducted: 34, attended: 24 },
      { code: "DS204L", name: "Data Structures Practical Lab", target: 75, conducted: 22, attended: 19 }
    ]
  },
  "SEC-8": {
    name: "II ECE DS B (Data Science & Database)",
    dept: "Data Science Block",
    subjects: [
      { code: "DS205", name: "Database Management & SQL", target: 75, conducted: 42, attended: 35 },
      { code: "DS206", name: "Algorithm Design & Complexity", target: 75, conducted: 36, attended: 28 },
      { code: "DS207", name: "Signals & Systems Fundamentals", target: 75, conducted: 32, attended: 22 },
      { code: "DS208L", name: "Digital Circuits Practical Lab", target: 75, conducted: 20, attended: 17 }
    ]
  },
  "SEC-9": {
    name: "II BME (Biomedical Engineering)",
    dept: "Biomedical Engineering",
    subjects: [
      { code: "BM201", name: "Human Anatomy & Physiology", target: 75, conducted: 40, attended: 33 },
      { code: "BM202", name: "Electronic Devices & Transducers", target: 75, conducted: 36, attended: 27 },
      { code: "BM203", name: "Transforms & Partial Differential Eq", target: 75, conducted: 34, attended: 23 },
      { code: "BM204L", name: "Anatomy & Physiology Lab", target: 75, conducted: 18, attended: 15 }
    ]
  },
  "SEC-10": {
    name: "I Year SEEE (Electrical & Electronics)",
    dept: "School of EEE",
    subjects: [
      { code: "SE101", name: "Engineering Mathematics I", target: 75, conducted: 46, attended: 39 },
      { code: "SE102", name: "Physics for Electrical Sciences", target: 75, conducted: 40, attended: 31 },
      { code: "SE103", name: "Programming in C & Problem Solving", target: 75, conducted: 42, attended: 34 },
      { code: "SE104L", name: "C Programming & Physics Lab", target: 75, conducted: 24, attended: 21 }
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
          <option value="SEC-4">III ECE A (Communications)</option>
          <option value="SEC-5">III ECE B (Communications)</option>
          <option value="SEC-6">III BME (Biomedical Engineering)</option>
          <option value="SEC-7">II ECE DS A (Data Science)</option>
          <option value="SEC-8">II ECE DS B (Database Systems)</option>
          <option value="SEC-9">II BME (Biomedical Engineering)</option>
          <option value="SEC-10">I Year SEEE (Electrical)</option>
        </select>
        <button class="chip" onclick="applyPreset('detention')">🚨 Simulate Risk Scenario</button>
        <button class="chip" onclick="applyPreset('elite')">🌟 Simulate Honor Roll (90%)</button>
      </div>

      <div class="att-grid">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function applyPreset(type) {
  const secKey = document.getElementById("attSectionSelect") ? document.getElementById("attSectionSelect").value : "SEC-1";
  const sec = ATTENDANCE_SECTIONS[secKey] || ATTENDANCE_SECTIONS["SEC-1"];
  
  if (type === "detention") {
    sec.subjects[0].attended = Math.round(sec.subjects[0].conducted * 0.55);
    sec.subjects[2].attended = Math.round(sec.subjects[2].conducted * 0.62);
  } else {
    sec.subjects.forEach(s => s.attended = Math.round(s.conducted * 0.92));
  }
  renderAttendanceCalculator();
}

window.renderAttendanceCalculator = renderAttendanceCalculator;
window.applyPreset = applyPreset;
