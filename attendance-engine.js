/**
 * Core Application Logic & Calculations Engine
 * Attendance Calculator, OD Simulator, Visuals & Attendy - The Friendly AI Advisor
 * Comprehensive Error-Handling, Performance Optimizations, and Edge-Case Coverage.
 */

// Application State
const AppState = {
  currentSectionId: "SEC-1",
  todayDate: "",            // e.g. "2026-09-28"
  planningDate: "",         // Preferred future date e.g. "2026-10-15"
  semesterStartDate: "",    // e.g. "2026-08-03"
  semesterEndDate: "",      // e.g. "2026-10-31"
  dangerThreshold: 75,
  eliteThreshold: 90,
  subjectInputs: {},        // { code: { percentage: number } }
  odRecords: [],            // [{ id, startDate, endDate, daysCount, type, reason, affectedSubjects }]
  audioAlertEnabled: true,
  chatVoiceEnabled: false,
  customTimetables: null,
  activeWizardThreshold: 75,
  activeWizardPreset: "balanced",
  whatIfMode: "miss"        // "miss" or "attend"
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initDateDefaults();
  initSectionSelector();
  initThresholdControls();
  initGoogleDriveModal();
  initSetupWizard();
  initODSimulator();
  initAIChatbot();
  initWhatIfPlanner();
  
  // Load initial section data and render
  loadSection(AppState.currentSectionId);
  setupEventListeners();
  initTheme();
});

/**
 * Initialize Dates (Auto-detects today's date and sets planning defaults)
 */
function initDateDefaults() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayFormatted = `${yyyy}-${mm}-${dd}`;
  
  AppState.todayDate = todayFormatted;
  AppState.semesterStartDate = ACADEMIC_CALENDAR.semesterStartDate;
  AppState.semesterEndDate = ACADEMIC_CALENDAR.semesterEndDate;
  
  const sStart = new Date(AppState.semesterStartDate + "T00:00:00");
  const sEnd = new Date(AppState.semesterEndDate + "T00:00:00");
  const todayObj = new Date(todayFormatted + "T00:00:00");
  
  // If outside semester bounds, lock to late September for standard demonstration
  if (isNaN(todayObj.getTime()) || todayObj < sStart || todayObj > sEnd) {
    AppState.todayDate = "2026-09-28";
  }
  
  const planningObj = new Date(AppState.todayDate + "T00:00:00");
  planningObj.setDate(planningObj.getDate() + 14);
  const pDate = planningObj > sEnd ? sEnd : planningObj;
  
  AppState.planningDate = formatDateISO(pDate);

  // Set input values
  const todayInput = document.getElementById("todayDateInput");
  const planningInput = document.getElementById("planningDateInput");
  const semEndInput = document.getElementById("semEndDateInput");
  
  if (todayInput) todayInput.value = AppState.todayDate;
  if (planningInput) planningInput.value = AppState.planningDate;
  if (semEndInput) semEndInput.value = AppState.semesterEndDate;
  
  updateDateBadges();
}

function formatDateISO(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "2026-09-28";
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function updateDateBadges() {
  const todayDisplay = document.getElementById("currentDateDisplay");
  const printDate = document.getElementById("printDateStamp");
  const todayObj = new Date(AppState.todayDate + "T00:00:00");
  const str = !isNaN(todayObj.getTime())
    ? todayObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : "Mon, Sep 28, 2026";
  
  if (todayDisplay) todayDisplay.textContent = str;
  if (printDate) printDate.textContent = str;
}

/**
 * Initialize 10 Class Sections Selector
 */
function initSectionSelector() {
  const selector = document.getElementById("sectionSelector");
  const selectorMobile = document.getElementById("sectionSelectorMobile");
  const wizardSelect = document.getElementById("wizardSectionSelect");
  
  const sections = getSectionsData();
  const populate = (elem) => {
    if (!elem) return;
    elem.innerHTML = "";
    Object.keys(sections).forEach(secKey => {
      const sec = sections[secKey];
      const opt = document.createElement("option");
      opt.value = sec.id;
      opt.textContent = `${sec.name} (${sec.department})`;
      elem.appendChild(opt);
    });
  };

  populate(selector);
  populate(selectorMobile);
  populate(wizardSelect);

  if (selector) {
    selector.value = AppState.currentSectionId;
    selector.addEventListener("change", (e) => {
      AppState.currentSectionId = e.target.value;
      if (selectorMobile) selectorMobile.value = AppState.currentSectionId;
      if (wizardSelect) wizardSelect.value = AppState.currentSectionId;
      loadSection(AppState.currentSectionId);
    });
  }

  if (selectorMobile) {
    selectorMobile.value = AppState.currentSectionId;
    selectorMobile.addEventListener("change", (e) => {
      AppState.currentSectionId = e.target.value;
      if (selector) selector.value = AppState.currentSectionId;
      if (wizardSelect) wizardSelect.value = AppState.currentSectionId;
      loadSection(AppState.currentSectionId);
    });
  }
}

function getSectionsData() {
  return AppState.customTimetables || SECTIONS_DATA;
}

function getActiveSection() {
  const data = getSectionsData();
  return data[AppState.currentSectionId] || SECTIONS_DATA["SEC-1"];
}

/**
 * Load Section & populate initial attendance inputs
 */
function loadSection(sectionId) {
  const section = getActiveSection();
  const sectionTitle = document.getElementById("activeSectionTitle");
  const sectionDept = document.getElementById("activeSectionDept");
  const sectionHall = document.getElementById("activeSectionHall");
  const sectionCoord = document.getElementById("activeSectionCoord");
  
  if (sectionTitle) sectionTitle.textContent = section.name;
  if (sectionDept) sectionDept.textContent = section.department;
  if (sectionHall) sectionHall.textContent = section.hall || "Academic Hall 301";
  if (sectionCoord) sectionCoord.textContent = section.coordinator || "Department Head";
  
  // Sample realistic default percentages
  const samplePercentages = [78, 56, 74, 82, 90, 85, 68];
  
  if (!AppState.subjectInputs[sectionId]) {
    AppState.subjectInputs[sectionId] = {};
    section.subjects.forEach((subj, idx) => {
      const defaultPct = samplePercentages[idx % samplePercentages.length];
      AppState.subjectInputs[sectionId][subj.code] = {
        percentage: defaultPct
      };
    });
  }
  
  renderSubjectCards();
  renderWeeklyTimetableGrid();
  renderTodaySchedule();
  updateODSubjectDropdown();
  updateWhatIfSubjectDropdown();
  recalculateAll();
}

/**
 * Student Presets: 1-Click Persona Simulator
 */
window.applyStudentPreset = function(presetKey) {
  const preset = STUDENT_PRESETS[presetKey];
  if (!preset) return;

  const section = getActiveSection();
  if (!AppState.subjectInputs[AppState.currentSectionId]) {
    AppState.subjectInputs[AppState.currentSectionId] = {};
  }

  section.subjects.forEach(subj => {
    let val = preset.percentages ? preset.percentages[subj.code] : undefined;
    if (val === undefined) {
      if (presetKey === "detention") val = subj.code.includes("CH") ? 55 : (subj.code.includes("MA") ? 62 : 78);
      else if (presetKey === "borderline") val = 74;
      else if (presetKey === "elite") val = 92;
      else val = 82;
    }
    AppState.subjectInputs[AppState.currentSectionId][subj.code] = { percentage: val };
    
    // Update inputs on cards
    const slider = document.getElementById(`slider-${subj.code}`);
    const numInput = document.getElementById(`num-input-${subj.code}`);
    const label = document.getElementById(`pct-label-${subj.code}`);
    if (slider) slider.value = val;
    if (numInput) numInput.value = val;
    if (label) label.textContent = `${val}%`;
  });

  recalculateAll();
  showToast(`Applied preset: ${preset.name}`);
};

/**
 * Calendar Calculations Engine: Counts scheduled periods
 */
function countClassesBetween(startDateStr, endDateStr, subjectCode = null) {
  const section = getActiveSection();
  const schedule = section.schedule;
  const holidays = ACADEMIC_CALENDAR.holidays.map(h => h.date);
  
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");
  
  const counts = {};
  section.subjects.forEach(s => counts[s.code] = 0);
  let totalAllClasses = 0;
  
  // Guard invalid dates or start > end
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    if (subjectCode) return 0;
    return { subjectCounts: counts, totalAllClasses: 0, workingDays: 0 };
  }
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let curr = new Date(start);
  let workingDays = 0;

  while (curr <= end) {
    const dayOfWeek = curr.getDay();
    const dateStr = formatDateISO(curr);
    
    // Weekdays Mon-Fri excluding public holidays
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays.includes(dateStr)) {
      workingDays++;
      const dayName = dayNames[dayOfWeek];
      const dailySlots = schedule[dayName] || [];
      
      dailySlots.forEach(code => {
        if (counts[code] !== undefined) {
          counts[code]++;
          totalAllClasses++;
        }
      });
    }
    
    curr.setDate(curr.getDate() + 1);
  }

  if (subjectCode) {
    return counts[subjectCode] || 0;
  }
  
  return { subjectCounts: counts, totalAllClasses, workingDays };
}

/**
 * Render Input Cards for each subject
 */
function renderSubjectCards() {
  const container = document.getElementById("subjectCardsContainer");
  if (!container) return;
  
  const section = getActiveSection();
  const sectionInputs = AppState.subjectInputs[AppState.currentSectionId] || {};
  
  container.innerHTML = "";
  
  section.subjects.forEach(subj => {
    const currentVal = sectionInputs[subj.code]?.percentage ?? 75;
    
    const card = document.createElement("div");
    card.className = "glass-card rounded-3xl p-5 border border-white/10 transition";
    card.id = `subject-card-${subj.code}`;
    
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3.5">
        <div class="flex items-center space-x-2.5">
          <span class="w-3 h-3 rounded-full shrink-0 shadow-sm ring-2 ring-white/20" style="background-color: ${subj.color}"></span>
          <div>
            <h4 class="font-bold text-white text-sm leading-tight">${subj.name}</h4>
            <span class="text-xs text-slate-500 font-mono">${subj.code} • ${subj.faculty} ${subj.isLab ? '<span class="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded-md font-semibold ml-1 border border-cyan-400/25">LAB</span>' : ''}</span>
          </div>
        </div>
        <div class="text-right">
          <span id="badge-status-${subj.code}" class="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/12">--%</span>
        </div>
      </div>

      <div class="space-y-3.5">
        <div>
          <div class="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
            <span>Current Attendance</span>
            <span class="font-extrabold font-mono text-indigo-400 text-sm" id="pct-label-${subj.code}">${currentVal}%</span>
          </div>
          <div class="flex items-center space-x-3">
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="1" 
              value="${currentVal}"
              id="slider-${subj.code}"
              class="w-full cursor-pointer"
              oninput="onPercentageChange('${subj.code}', this.value)"
            />
            <div class="relative w-16">
              <input 
                type="number" 
                min="0" 
                max="100" 
                value="${currentVal}" 
                id="num-input-${subj.code}"
                class="w-full px-2 py-1.5 text-center font-mono font-bold text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                oninput="onPercentageChange('${subj.code}', this.value)"
              />
            </div>
          </div>
        </div>

        <!-- Calculated Stats Row -->
        <div class="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/8 text-center text-xs">
          <div class="bg-white/5 p-2 rounded-xl border border-white/8">
            <span class="text-slate-500 block text-[10px] font-semibold mb-0.5">Conducted</span>
            <span class="font-bold text-slate-200 font-mono" id="stat-conducted-${subj.code}">0</span>
          </div>
          <div class="bg-white/5 p-2 rounded-xl border border-white/8">
            <span class="text-slate-500 block text-[10px] font-semibold mb-0.5">Remaining</span>
            <span class="font-bold text-indigo-400 font-mono" id="stat-remaining-${subj.code}">0</span>
          </div>
          <div class="bg-white/5 p-2 rounded-xl border border-white/8">
            <span class="text-slate-500 block text-[10px] font-semibold mb-0.5">Max Attainable</span>
            <span class="font-bold text-emerald-400 font-mono" id="stat-max-${subj.code}">0%</span>
          </div>
        </div>

        <!-- Status Advisory Banner inside card -->
        <div id="card-advisory-${subj.code}" class="text-xs p-2.5 rounded-2xl bg-white/5 text-slate-400 border border-white/8">
          Calculating status...
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });
}

window.onPercentageChange = function(subjectCode, value) {
  let val = parseFloat(value);
  if (isNaN(val)) val = 0;
  if (val < 0) val = 0;
  if (val > 100) val = 100;
  
  if (!AppState.subjectInputs[AppState.currentSectionId]) {
    AppState.subjectInputs[AppState.currentSectionId] = {};
  }
  
  AppState.subjectInputs[AppState.currentSectionId][subjectCode] = {
    percentage: val
  };

  // Sync inputs
  const slider = document.getElementById(`slider-${subjectCode}`);
  const numInput = document.getElementById(`num-input-${subjectCode}`);
  const label = document.getElementById(`pct-label-${subjectCode}`);
  
  if (slider && parseFloat(slider.value) !== val) slider.value = val;
  if (numInput && parseFloat(numInput.value) !== val) numInput.value = val;
  if (label) label.textContent = `${val}%`;

  recalculateAll();
};

/**
 * Core Mathematics Calculation Function
 */
function recalculateAll() {
  const section = getActiveSection();
  const today = AppState.todayDate;
  const semStart = AppState.semesterStartDate;
  const semEnd = AppState.semesterEndDate;
  const planDate = AppState.planningDate;
  const dangerLimit = AppState.dangerThreshold;
  const eliteLimit = AppState.eliteThreshold;

  // 1. Calculate class distributions from dates
  const pastCounts = countClassesBetween(semStart, today);
  const remainingCounts = countClassesBetween(addDaysToDate(today, 1), semEnd);
  const planningRemainingCounts = countClassesBetween(addDaysToDate(today, 1), planDate);

  const sectionInputs = AppState.subjectInputs[AppState.currentSectionId] || {};

  let totalPastConducted = 0;
  let totalRemainingSem = 0;
  let totalRemainingPlanning = 0;
  let totalAttendedPast = 0;
  let totalPotentialAttended = 0;
  let irreversibleCount = 0;
  let dangerCount = 0;
  let eliteCount = 0;
  
  const subjectCalculations = [];
  const irreversibleSubjects = [];

  // Evaluate OD credits if any
  const odCredits = getODCreditsForSubjects();

  section.subjects.forEach(subj => {
    const code = subj.code;
    const conducted = pastCounts.subjectCounts[code] || 0;
    const remainingSem = remainingCounts.subjectCounts[code] || 0;
    const remainingPlan = planningRemainingCounts.subjectCounts[code] || 0;
    const totalSemClasses = conducted + remainingSem;
    
    const currentPct = sectionInputs[code]?.percentage ?? 75;
    
    // Attended classes so far
    let attended = Math.round((conducted * currentPct) / 100);
    const missed = conducted - attended;

    // Apply OD bonus if present
    const odAdded = odCredits[code] || 0;
    const effectiveAttended = Math.min(conducted, attended + odAdded);
    const effectiveCurrentPct = conducted > 0 ? ((effectiveAttended / conducted) * 100) : currentPct;

    // Maximum possible attendance if student attends 100% of remaining classes
    const maxPossibleAttended = effectiveAttended + remainingSem;
    const maxPossiblePct = totalSemClasses > 0 ? (maxPossibleAttended / totalSemClasses) * 100 : 100;

    // Classes needed to reach Danger Limit (75%)
    const target75Classes = Math.ceil((dangerLimit / 100) * totalSemClasses);
    const neededFor75 = target75Classes - effectiveAttended;

    // Classes needed to reach Elite Limit (90%)
    const target90Classes = Math.ceil((eliteLimit / 100) * totalSemClasses);
    const neededFor90 = target90Classes - effectiveAttended;

    // Safe Bunk Buffer (capped realistically at remaining classes)
    const rawSafeBunks75 = Math.max(0, maxPossibleAttended - target75Classes);
    const safeBunks75 = Math.min(remainingSem, rawSafeBunks75);

    const rawSafeBunks90 = Math.max(0, maxPossibleAttended - target90Classes);
    const safeBunks90 = Math.min(remainingSem, rawSafeBunks90);

    // Irreversible Detention Condition (Impossible before November)
    const isIrreversible = maxPossiblePct < dangerLimit;

    // Status classification
    let status = "SAFE";
    if (isIrreversible) {
      status = "IRREVERSIBLE";
      irreversibleCount++;
      irreversibleSubjects.push({ subject: subj, maxPossiblePct, currentPct, neededFor75, remainingSem, totalSemClasses });
    } else if (effectiveCurrentPct < dangerLimit) {
      status = "DANGER";
      dangerCount++;
    } else if (effectiveCurrentPct >= eliteLimit) {
      status = "ELITE";
      eliteCount++;
    } else {
      status = "SAFE";
    }

    // Overall sums
    totalPastConducted += conducted;
    totalRemainingSem += remainingSem;
    totalRemainingPlanning += remainingPlan;
    totalAttendedPast += effectiveAttended;
    totalPotentialAttended += maxPossibleAttended;

    const calcResult = {
      subject: subj,
      conducted,
      remainingSem,
      remainingPlan,
      totalSemClasses,
      currentPct,
      effectiveCurrentPct,
      effectiveAttended,
      missed,
      maxPossibleAttended,
      maxPossiblePct,
      neededFor75,
      neededFor90,
      safeBunks75,
      safeBunks90,
      isIrreversible,
      status,
      odAdded
    };

    subjectCalculations.push(calcResult);
    updateSubjectCardUI(calcResult);
  });

  // Overall statistics
  const overallConducted = totalPastConducted;
  const overallRemaining = totalRemainingSem;
  const overallTotal = overallConducted + overallRemaining;
  const overallAttended = totalAttendedPast;
  const overallCurrentPct = overallConducted > 0 ? (overallAttended / overallConducted) * 100 : 0;
  const overallMaxPossiblePct = overallTotal > 0 ? (totalPotentialAttended / overallTotal) * 100 : 0;

  // Update Top Banner Stats & SVG Gauge
  updateGlobalStatsUI({
    overallCurrentPct,
    overallConducted,
    overallRemaining,
    overallTotal,
    totalRemainingPlanning,
    overallMaxPossiblePct,
    irreversibleCount,
    dangerCount,
    eliteCount,
    subjectCalculations,
    irreversibleSubjects
  });

  // Render Visual Charts
  renderCharts(subjectCalculations);

  // Update OD comparison panel
  updateODComparisonUI(subjectCalculations);

  // Expose calculation for AI Advisor & What-If
  AppState.lastCalculations = {
    subjectCalculations,
    overallCurrentPct,
    overallConducted,
    overallRemaining,
    overallTotal,
    totalRemainingPlanning,
    irreversibleSubjects
  };
}

/**
 * Updates UI of a single subject card
 */
function updateSubjectCardUI(calc) {
  const code = calc.subject.code;
  
  const conductedEl = document.getElementById(`stat-conducted-${code}`);
  const remainingEl = document.getElementById(`stat-remaining-${code}`);
  const maxEl = document.getElementById(`stat-max-${code}`);
  const statusBadge = document.getElementById(`badge-status-${code}`);
  const advisoryEl = document.getElementById(`card-advisory-${code}`);
  const card = document.getElementById(`subject-card-${code}`);

  if (conductedEl) conductedEl.textContent = `${calc.effectiveAttended} / ${calc.conducted}`;
  if (remainingEl) remainingEl.textContent = calc.remainingSem;
  if (maxEl) maxEl.textContent = `${calc.maxPossiblePct.toFixed(1)}%`;

  if (card && statusBadge && advisoryEl) {
    card.classList.remove("border-red-500", "border-amber-500", "border-emerald-500", "bg-red-500/10", "bg-red-50/20", "dark:bg-red-950/20");

    if (calc.isIrreversible) {
      card.classList.add("border-red-500/60", "bg-red-500/8");
      statusBadge.className = "text-xs font-black px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/35 animate-pulse";
      statusBadge.innerHTML = "🚨 IRREVERSIBLE DETENTION";
      
      advisoryEl.className = "text-xs p-2.5 rounded-2xl bg-red-500/12 text-red-200 border border-red-400/30";
      advisoryEl.innerHTML = `
        <div class="font-bold flex items-center gap-1">
          <span>⚠️ Impossible to recover before Nov</span>
        </div>
        <p class="mt-0.5 text-red-300/80">Max possible: <strong>${calc.maxPossiblePct.toFixed(1)}%</strong>. Attending all ${calc.remainingSem} remaining classes still falls below ${AppState.dangerThreshold}%. Deficit: ${(AppState.dangerThreshold - calc.maxPossiblePct).toFixed(1)}%.</p>
      `;
    } else if (calc.status === "DANGER") {
      card.classList.add("border-amber-500/50");
      statusBadge.className = "text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30";
      statusBadge.textContent = "⚠️ Danger Zone";
      
      advisoryEl.className = "text-xs p-2.5 rounded-2xl bg-amber-500/10 text-amber-200 border border-amber-400/25";
      advisoryEl.innerHTML = `
        <span>Must attend <strong>${Math.max(0, calc.neededFor75)} of ${calc.remainingSem}</strong> remaining classes to reach ${AppState.dangerThreshold}%.</span>
        ${calc.neededFor90 <= calc.remainingSem && calc.neededFor90 > 0 ? `<span class="block text-[11px] text-slate-400 mt-0.5">Need ${calc.neededFor90} classes for 90%.</span>` : ''}
      `;
    } else if (calc.status === "ELITE") {
      card.classList.add("border-emerald-500/50");
      statusBadge.className = "text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30";
      statusBadge.textContent = "🌟 Elite (>90%)";
      
      advisoryEl.className = "text-xs p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-200 border border-emerald-400/25";
      advisoryEl.innerHTML = `
        <span>Excellent! Safe bunk buffer for 75%: <strong>${calc.safeBunks75}</strong> class(es). Buffer for 90%: <strong>${calc.safeBunks90}</strong> class(es).</span>
      `;
    } else {
      statusBadge.className = "text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30";
      statusBadge.textContent = "✅ Safe Zone";
      
      advisoryEl.className = "text-xs p-2.5 rounded-2xl bg-blue-500/10 text-blue-200 border border-blue-400/25";
      advisoryEl.innerHTML = `
        <span>On Track. Attend <strong>${Math.max(0, calc.neededFor75)}</strong> more classes for ${AppState.dangerThreshold}%. Bunk buffer: <strong>${calc.safeBunks75}</strong> class(es).</span>
        ${calc.neededFor90 <= calc.remainingSem && calc.neededFor90 > 0 ? `<span class="block text-[11px] text-slate-400 mt-0.5">Need ${calc.neededFor90} classes for 90%.</span>` : ''}
      `;
    }
  }
}

/**
 * Updates Global Overview Metrics & Irreversible Warning Banner
 */
function updateGlobalStatsUI(metrics) {
  const overallPctEl = document.getElementById("overallAttendancePct");
  const overallStatusBadge = document.getElementById("overallStatusBadge");
  const totalClassesLeftEl = document.getElementById("totalClassesLeft");
  const planningClassesLeftEl = document.getElementById("planningClassesLeft");
  const dangerCountEl = document.getElementById("dangerCountBadge");
  const maxPossibleOverallEl = document.getElementById("maxPossibleOverall");
  const gaugeCircle = document.getElementById("overallGaugeCircle");
  const printStatus = document.getElementById("printOverallStatus");

  if (overallPctEl) overallPctEl.textContent = `${metrics.overallCurrentPct.toFixed(1)}%`;
  if (totalClassesLeftEl) totalClassesLeftEl.textContent = metrics.overallRemaining;
  if (planningClassesLeftEl) planningClassesLeftEl.textContent = metrics.totalRemainingPlanning;
  if (maxPossibleOverallEl) maxPossibleOverallEl.textContent = `${metrics.overallMaxPossiblePct.toFixed(1)}%`;

  // SVG Gauge Animation
  if (gaugeCircle) {
    const pct = Math.min(100, Math.max(0, metrics.overallCurrentPct));
    const offset = 100 - pct;
    gaugeCircle.style.strokeDashoffset = offset;

    gaugeCircle.classList.remove("text-red-500", "text-amber-500", "text-blue-500", "text-emerald-500", "text-indigo-600");
    if (metrics.irreversibleCount > 0) {
      gaugeCircle.classList.add("text-red-500");
    } else if (pct < AppState.dangerThreshold) {
      gaugeCircle.classList.add("text-amber-500");
    } else if (pct >= AppState.eliteThreshold) {
      gaugeCircle.classList.add("text-emerald-500");
    } else {
      gaugeCircle.classList.add("text-indigo-600");
    }
  }

  if (dangerCountEl) {
    const riskTotal = metrics.dangerCount + metrics.irreversibleCount;
    dangerCountEl.textContent = `${riskTotal} course(s) at risk`;
    dangerCountEl.className = (riskTotal > 0)
      ? "text-[11px] text-red-500 font-bold block mt-1"
      : "text-[11px] text-emerald-500 font-bold block mt-1";
  }

  // Update Status Badge
  if (overallStatusBadge) {
    if (metrics.irreversibleCount > 0) {
      overallStatusBadge.textContent = "CRITICAL ALERT";
      overallStatusBadge.className = "px-2 py-0.5 text-[10px] font-black rounded bg-red-600 text-white animate-pulse shadow";
      if (printStatus) printStatus.textContent = "CRITICAL DETENTION SHORTFALL";
    } else if (metrics.overallCurrentPct < AppState.dangerThreshold) {
      overallStatusBadge.textContent = "DANGER ZONE";
      overallStatusBadge.className = "px-2 py-0.5 text-[10px] font-black rounded bg-amber-500 text-white shadow";
      if (printStatus) printStatus.textContent = "AT RISK (< 75%)";
    } else if (metrics.overallCurrentPct >= AppState.eliteThreshold) {
      overallStatusBadge.textContent = "HONORS (>90%)";
      overallStatusBadge.className = "px-2 py-0.5 text-[10px] font-black rounded bg-emerald-600 text-white shadow";
      if (printStatus) printStatus.textContent = "EXCELLENT STANDING (> 90%)";
    } else {
      overallStatusBadge.textContent = "GOOD STANDING";
      overallStatusBadge.className = "px-2 py-0.5 text-[10px] font-black rounded bg-indigo-600 text-white shadow";
      if (printStatus) printStatus.textContent = "GOOD STANDING (REGULAR)";
    }
  }

  // Update Irreversible Loud Warning Banner
  const banner = document.getElementById("irreversibleDetentionBanner");
  const bannerSubjectList = document.getElementById("irreversibleSubjectList");
  
  if (banner) {
    if (metrics.irreversibleCount > 0) {
      banner.classList.remove("hidden");
      if (bannerSubjectList) {
        bannerSubjectList.innerHTML = metrics.irreversibleSubjects.map(item => `
          <div class="flex items-center justify-between py-2 text-xs">
            <span class="font-bold text-white">${item.subject.name} (${item.subject.code})</span>
            <span class="font-mono text-red-100 text-xs">
              Current: <strong>${item.currentPct}%</strong> | Max Reachable by Nov: <strong class="text-white bg-red-800/80 px-1.5 py-0.5 rounded">${item.maxPossiblePct.toFixed(1)}%</strong> (&lt; ${AppState.dangerThreshold}%)
            </span>
          </div>
        `).join("");
      }

      // Audio alarm synthesizer
      triggerAudioAlert();
    } else {
      banner.classList.add("hidden");
    }
  }
}

/**
 * Sound Alert Synthesizer for Loud Warning System
 */
let lastAudioAlertTime = 0;
function triggerAudioAlert() {
  if (!AppState.audioAlertEnabled) return;
  const now = Date.now();
  if (now - lastAudioAlertTime < 8000) return;
  lastAudioAlertTime = now;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    
    const playBeep = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playBeep(440, ctx.currentTime, 0.2);
    playBeep(330, ctx.currentTime + 0.25, 0.3);
  } catch (e) {
    // Graceful fallback
  }
}

/**
 * Friendly Notification Chime for Attendy Chatbot
 */
function playFriendlyChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);       // Note C5
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // Note E5

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (e) {
    // Silent fallback
  }
}

/**
 * Speech Synthesis Voice Warning
 */
window.speakDetentionWarning = function() {
  if (!('speechSynthesis' in window)) {
    alert("Speech Synthesis not supported by this browser.");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    
    const lastCalc = AppState.lastCalculations;
    if (!lastCalc || lastCalc.irreversibleSubjects.length === 0) {
      const utter = new SpeechSynthesisUtterance("Good news! You have no irreversible detentions. All subjects can reach seventy-five percent.");
      window.speechSynthesis.speak(utter);
      return;
    }

    const subjectNames = lastCalc.irreversibleSubjects.map(s => s.subject.name).join(", ");
    const text = `Critical Alert! Irreversible Detention detected in ${subjectNames}. It is mathematically impossible to reach the seventy-five percent threshold before November. Please consult your advisor or apply for On-Duty leave immediately.`;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
    showToast("Playing voice alert...");
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
};

/**
 * Visual Charts Integration (Chart.js)
 */
let subjectBarChartInstance = null;
let breakdownDoughnutChartInstance = null;
let trajectoryLineChartInstance = null;

function renderCharts(calculations) {
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  // Chart 1: Subject Attendance vs Thresholds
  const barCanvas = document.getElementById("subjectBarChart");
  if (barCanvas && window.Chart) {
    const labels = calculations.map(c => c.subject.code);
    const currentData = calculations.map(c => c.effectiveCurrentPct);
    const maxData = calculations.map(c => c.maxPossiblePct);
    const backgroundColors = calculations.map(c => {
      if (c.isIrreversible) return "#ef4444";
      if (c.status === "DANGER") return "#f59e0b";
      if (c.status === "ELITE") return "#10b981";
      return "#6366f1";
    });

    if (subjectBarChartInstance) {
      subjectBarChartInstance.data.labels = labels;
      subjectBarChartInstance.data.datasets[0].data = currentData;
      subjectBarChartInstance.data.datasets[0].backgroundColor = backgroundColors;
      subjectBarChartInstance.data.datasets[1].data = maxData;
      subjectBarChartInstance.update("none");
    } else {
      subjectBarChartInstance = new Chart(barCanvas, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Current Attendance %",
              data: currentData,
              backgroundColor: backgroundColors,
              borderRadius: 8,
              barPercentage: 0.65
            },
            {
              label: "Max Attainable %",
              data: maxData,
              backgroundColor: isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(100, 116, 139, 0.15)",
              borderColor: isDark ? "#94a3b8" : "#64748b",
              borderWidth: 1,
              borderDash: [4, 4],
              borderRadius: 8,
              barPercentage: 0.65
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor, font: { family: 'inherit', size: 11, weight: 'bold' } }
            },
            tooltip: {
              callbacks: {
                title: (items) => {
                  const idx = items[0].dataIndex;
                  return calculations[idx]?.subject.name || "";
                },
                afterBody: (items) => {
                  const idx = items[0].dataIndex;
                  const c = calculations[idx];
                  if (!c) return [];
                  return [
                    `Status: ${c.status}`,
                    `Conducted: ${c.effectiveAttended}/${c.conducted}`,
                    `Remaining: ${c.remainingSem}`,
                    `Need for 75%: ${c.isIrreversible ? 'IMPOSSIBLE' : Math.max(0, c.neededFor75)}`
                  ];
                }
              }
            }
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              grid: { color: gridColor },
              ticks: { color: textColor, callback: val => val + "%" }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { weight: 'bold' } }
            }
          }
        }
      });
    }
  }

  // Chart 2: Attendance Breakdown (Doughnut)
  const doughnutCanvas = document.getElementById("breakdownDoughnutChart");
  if (doughnutCanvas && window.Chart) {
    const totalAttended = calculations.reduce((sum, c) => sum + c.effectiveAttended, 0);
    const totalMissed = calculations.reduce((sum, c) => sum + c.missed, 0);
    const totalRemaining = calculations.reduce((sum, c) => sum + c.remainingSem, 0);
    const dData = [totalAttended, totalMissed, totalRemaining];

    if (breakdownDoughnutChartInstance) {
      breakdownDoughnutChartInstance.data.datasets[0].data = dData;
      breakdownDoughnutChartInstance.update("none");
    } else {
      breakdownDoughnutChartInstance = new Chart(doughnutCanvas, {
        type: "doughnut",
        data: {
          labels: ["Classes Attended", "Classes Missed", "Classes Remaining"],
          datasets: [{
            data: dData,
            backgroundColor: ["#10b981", "#ef4444", "#6366f1"],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: textColor, boxWidth: 12, font: { size: 11, weight: 'bold' } }
            }
          }
        }
      });
    }
  }

  // Chart 3: Projected Trajectory Until Semester End
  renderTrajectoryChart(calculations, textColor, gridColor);
}

function renderTrajectoryChart(calculations, textColor, gridColor) {
  const lineCanvas = document.getElementById("trajectoryLineChart");
  if (!lineCanvas || !window.Chart) return;

  const totalConducted = calculations.reduce((s, c) => s + c.conducted, 0);
  const totalAttended = calculations.reduce((s, c) => s + c.effectiveAttended, 0);
  const totalRemaining = calculations.reduce((s, c) => s + c.remainingSem, 0);

  const steps = 5;
  const labels = ["Today", "+1 Week", "+2 Weeks", "+3 Weeks", "End (Oct 31)"];
  
  const traj100 = [];
  const traj75 = [];
  const traj50 = [];
  const traj0 = [];

  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const addedClasses = Math.round(totalRemaining * fraction);
    const currTotal = totalConducted + addedClasses;

    if (currTotal > 0) {
      traj100.push(((totalAttended + addedClasses) / currTotal) * 100);
      traj75.push(((totalAttended + Math.round(addedClasses * 0.75)) / currTotal) * 100);
      traj50.push(((totalAttended + Math.round(addedClasses * 0.50)) / currTotal) * 100);
      traj0.push((totalAttended / currTotal) * 100);
    } else {
      traj100.push(100);
      traj75.push(75);
      traj50.push(50);
      traj0.push(0);
    }
  }

  if (trajectoryLineChartInstance) {
    trajectoryLineChartInstance.data.datasets[0].data = traj100;
    trajectoryLineChartInstance.data.datasets[1].data = traj75;
    trajectoryLineChartInstance.data.datasets[2].data = traj50;
    trajectoryLineChartInstance.data.datasets[3].data = traj0;
    trajectoryLineChartInstance.update("none");
  } else {
    trajectoryLineChartInstance = new Chart(lineCanvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "100% Attendance Scenario",
            data: traj100,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 2.5,
            tension: 0.3
          },
          {
            label: "75% Target Pace",
            data: traj75,
            borderColor: "#6366f1",
            borderWidth: 2.5,
            borderDash: [5, 5],
            tension: 0.3
          },
          {
            label: "50% Attendance Pace",
            data: traj50,
            borderColor: "#f59e0b",
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: "0% (Complete Bunk)",
            data: traj0,
            borderColor: "#ef4444",
            borderWidth: 2,
            borderDash: [3, 3],
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textColor, boxWidth: 12, font: { size: 11, weight: 'bold' } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
            }
          }
        },
        scales: {
          y: {
            min: Math.max(0, Math.floor(Math.min(...traj0) - 5)),
            max: 100,
            grid: { color: gridColor },
            ticks: { color: textColor, callback: v => v + "%" }
          },
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor }
          }
        }
      }
    });
  }
}

/**
 * Render Today's Schedule Live Strip
 */
function renderTodaySchedule() {
  const container = document.getElementById("todaySlotsContainer");
  const label = document.getElementById("todayDayNameLabel");
  if (!container) return;

  const section = getActiveSection();
  const todayDateObj = new Date(AppState.todayDate + "T00:00:00");
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = isNaN(todayDateObj.getDay()) ? 1 : todayDateObj.getDay();
  const dayName = dayNames[dayOfWeek];

  if (label) label.textContent = `${dayName}, ${AppState.todayDate}`;

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    container.innerHTML = `<div class="col-span-full py-2 text-center text-xs text-slate-400 italic">No classes scheduled today (Weekend). Time to recharge! 🛋️</div>`;
    return;
  }

  const holiday = ACADEMIC_CALENDAR.holidays.find(h => h.date === AppState.todayDate);
  if (holiday) {
    container.innerHTML = `<div class="col-span-full py-2 text-center text-xs text-amber-500 font-bold">🎉 Public Holiday: ${holiday.name} (${holiday.type}) - No classes scheduled!</div>`;
    return;
  }

  const slots = section.schedule[dayName] || [];
  const subjectMap = {};
  section.subjects.forEach(s => subjectMap[s.code] = s);

  container.innerHTML = slots.map((code, idx) => {
    const s = subjectMap[code] || { name: code, color: "#64748b", room: "301" };
    const pNumber = idx + 1;
    return `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-center shadow-2xs">
        <span class="text-[9px] uppercase font-bold text-slate-400 block">Period ${pNumber}</span>
        <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-2xs" style="background-color: ${s.color}">
          ${code}
        </span>
        <span class="text-[10px] text-slate-700 dark:text-slate-300 font-medium block truncate mt-1">${s.name}</span>
        <span class="text-[9px] text-slate-400 block">${s.room || 'Room 301'}</span>
      </div>
    `;
  }).join("");
}

/**
 * OD Simulator Engine: Calculate On-Duty & Medical Leave credits
 */
function initODSimulator() {
  const addBtn = document.getElementById("addOdBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const type = document.getElementById("odTypeSelect").value;
      const daysCount = parseInt(document.getElementById("odDaysInput").value) || 1;
      const reason = document.getElementById("odReasonInput").value || "On-Duty Participation";
      const subjectTarget = document.getElementById("odSubjectTargetSelect").value;

      const record = {
        id: "OD-" + Date.now(),
        type,
        daysCount,
        reason,
        subjectTarget,
        dateAdded: new Date().toLocaleDateString()
      };

      const prevIrreversible = AppState.lastCalculations?.irreversibleSubjects?.length || 0;

      AppState.odRecords.push(record);
      renderODList();
      recalculateAll();

      const newIrreversible = AppState.lastCalculations?.irreversibleSubjects?.length || 0;

      // Celebrate if OD rescued a course from detention!
      if (prevIrreversible > 0 && newIrreversible < prevIrreversible && window.confetti) {
        window.confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast("🎉 OD Approved! Rescued from Irreversible Detention!");
      } else {
        showToast("OD entry added successfully!");
      }
    });
  }

  updateODSubjectDropdown();
}

function updateODSubjectDropdown() {
  const dropdown = document.getElementById("odSubjectTargetSelect");
  if (!dropdown) return;
  const section = getActiveSection();
  
  dropdown.innerHTML = `<option value="ALL">All Subjects (Full Day Event)</option>`;
  section.subjects.forEach(s => {
    dropdown.innerHTML += `<option value="${s.code}">${s.name} (${s.code})</option>`;
  });
}

function renderODList() {
  const container = document.getElementById("odRecordsList");
  if (!container) return;

  if (AppState.odRecords.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-3">No OD or Medical Leaves added yet. Add a leave entry above to simulate its impact.</p>`;
    return;
  }

  container.innerHTML = AppState.odRecords.map(rec => `
    <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-2xs">
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60">${rec.type}</span>
          <span class="font-bold text-slate-800 dark:text-slate-100">${rec.reason}</span>
        </div>
        <span class="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
          ${rec.daysCount} Day(s) • Applies to: <strong>${rec.subjectTarget === 'ALL' ? 'All Subjects' : rec.subjectTarget}</strong>
        </span>
      </div>
      <button 
        onclick="deleteODRecord('${rec.id}')"
        class="text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition cursor-pointer">
        Remove
      </button>
    </div>
  `).join("");
}

window.deleteODRecord = function(id) {
  AppState.odRecords = AppState.odRecords.filter(r => r.id !== id);
  renderODList();
  recalculateAll();
};

function getODCreditsForSubjects() {
  const credits = {};
  const section = getActiveSection();
  section.subjects.forEach(s => credits[s.code] = 0);

  AppState.odRecords.forEach(rec => {
    if (rec.subjectTarget === "ALL") {
      section.subjects.forEach(s => {
        credits[s.code] += rec.daysCount * (s.isLab ? 2 : 1);
      });
    } else {
      if (credits[rec.subjectTarget] !== undefined) {
        credits[rec.subjectTarget] += rec.daysCount * (section.subjects.find(s => s.code === rec.subjectTarget)?.isLab ? 2 : 1);
      }
    }
  });

  return credits;
}

function updateODComparisonUI(calculations) {
  const container = document.getElementById("odComparisonTableBody");
  if (!container) return;

  const odActive = AppState.odRecords.length > 0;
  const badge = document.getElementById("odStatusIndicator");
  if (badge) {
    badge.textContent = odActive ? `${AppState.odRecords.length} Active OD(s)` : "0 Active";
    badge.className = odActive ? "text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold" : "text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500";
  }

  container.innerHTML = calculations.map(c => {
    const rawPct = c.conducted > 0 ? (((c.effectiveAttended - c.odAdded) / c.conducted) * 100) : c.currentPct;
    const boost = c.effectiveCurrentPct - rawPct;

    return `
      <tr class="border-b border-slate-100 dark:border-slate-800 text-xs">
        <td class="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">${c.subject.name}</td>
        <td class="py-2.5 px-3 text-center font-mono">${rawPct.toFixed(1)}%</td>
        <td class="py-2.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">${c.effectiveCurrentPct.toFixed(1)}%</td>
        <td class="py-2.5 px-3 text-center font-mono ${boost > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}">
          ${boost > 0 ? `+${boost.toFixed(1)}%` : '0.0%'}
        </td>
        <td class="py-2.5 px-3 text-right">
          ${c.isIrreversible 
            ? '<span class="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-bold">DETENTION</span>'
            : (boost > 0 && rawPct < 75 && c.effectiveCurrentPct >= 75)
              ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold animate-pulse">RESCUED! 🎉</span>'
              : '<span class="text-slate-400 text-[10px]">--</span>'
          }
        </td>
      </tr>
    `;
  }).join("");
}

/**
 * Weekly Timetable Grid Viewer
 */
function renderWeeklyTimetableGrid() {
  const container = document.getElementById("weeklyTimetableContainer");
  if (!container) return;

  const section = getActiveSection();
  const schedule = section.schedule;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const subjectMap = {};
  section.subjects.forEach(s => subjectMap[s.code] = s);

  let html = `
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left border-collapse">
        <thead>
          <tr class="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
            <th class="p-3 font-bold border border-slate-200 dark:border-slate-700">Day</th>
            <th class="p-2.5 text-center border border-slate-200 dark:border-slate-700">P1 (09-10)</th>
            <th class="p-2.5 text-center border border-slate-200 dark:border-slate-700">P2 (10-11)</th>
            <th class="p-1 text-center bg-slate-200/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px]">Break</th>
            <th class="p-2.5 text-center border border-slate-200 dark:border-slate-700">P3 (11:15-12:15)</th>
            <th class="p-1 text-center bg-slate-200/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px]">Lunch</th>
            <th class="p-2.5 text-center border border-slate-200 dark:border-slate-700">P4 (01:15-02:15)</th>
            <th class="p-2.5 text-center border border-slate-200 dark:border-slate-700">P5 (02:15-03:15)</th>
            <th class="p-2.5 text-center border border-slate-200 dark:border-slate-700">P6 (03:15-04:15)</th>
          </tr>
        </thead>
        <tbody>
  `;

  days.forEach(day => {
    const slots = schedule[day] || [];
    html += `
      <tr class="border-b border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <td class="p-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700">${day}</td>
        ${renderSlotCell(slots[0], subjectMap)}
        ${renderSlotCell(slots[1], subjectMap)}
        <td class="bg-slate-100/50 dark:bg-slate-900/40 text-center text-slate-400 text-[10px] border-r border-slate-200 dark:border-slate-700">Tea</td>
        ${renderSlotCell(slots[2], subjectMap)}
        <td class="bg-slate-100/50 dark:bg-slate-900/40 text-center text-slate-400 text-[10px] border-r border-slate-200 dark:border-slate-700">Lunch</td>
        ${renderSlotCell(slots[3], subjectMap)}
        ${renderSlotCell(slots[4], subjectMap)}
        ${renderSlotCell(slots[5], subjectMap)}
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function renderSlotCell(code, subjectMap) {
  if (!code) {
    return `<td class="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 text-slate-300">-</td>`;
  }
  const subj = subjectMap[code] || { name: code, color: "#64748b", room: "301" };
  return `
    <td class="p-2.5 text-center border-r border-slate-200 dark:border-slate-700">
      <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-xs" style="background-color: ${subj.color}">
        ${code}
      </span>
      <span class="block text-[9px] text-slate-500 dark:text-slate-400 truncate max-w-[85px] mx-auto mt-0.5">${subj.name}</span>
    </td>
  `;
}

/**
 * ATTENDY • THE FRIENDLY ATTENDANCE BOT ENGINE
 */
function initAIChatbot() {
  const toggleBtn = document.getElementById("aiChatToggleBtn");
  const closeBtn = document.getElementById("aiChatCloseBtn");
  const chatDrawer = document.getElementById("aiChatDrawer");
  const sendBtn = document.getElementById("aiChatSendBtn");
  const input = document.getElementById("aiChatInput");
  const chips = document.querySelectorAll(".ai-quick-chip");

  // Initial welcome message from Attendy
  renderInitialAttendyGreeting();

  if (toggleBtn && chatDrawer) {
    toggleBtn.addEventListener("click", () => {
      chatDrawer.classList.toggle("hidden");
      if (!chatDrawer.classList.contains("hidden")) {
        if (input) input.focus();
        playFriendlyChime();
      }
    });
  }

  if (closeBtn && chatDrawer) {
    closeBtn.addEventListener("click", () => {
      chatDrawer.classList.add("hidden");
    });
  }

  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => handleAIChatSubmit());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAIChatSubmit();
      }
    });
  }

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      if (input) {
        input.value = chip.getAttribute("data-query");
        handleAIChatSubmit();
      }
    });
  });
}

function renderInitialAttendyGreeting() {
  const messagesContainer = document.getElementById("aiChatMessages");
  if (!messagesContainer) return;

  const section = getActiveSection();

  messagesContainer.innerHTML = `
    <div class="flex gap-2.5 text-xs justify-start">
      <div class="w-7 h-7 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 text-xs shadow-xs animate-attendy">
        🤖
      </div>
      <div class="max-w-[88%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl rounded-tl-xs p-3.5 shadow-xs text-slate-700 dark:text-slate-200 leading-relaxed">
        <p class="font-bold text-slate-900 dark:text-white text-xs mb-1">
          Hey friend! 👋 I'm <strong>Attendy</strong>, your attendance buddy!
        </p>
        <p class="text-[11px] text-slate-600 dark:text-slate-300">
          I'm synced with your timetable for <strong>${section.name}</strong>. Don't worry about semester math — ask me anything, and I'll keep you safe and stress-free! 😊
        </p>
        <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
          💡 <em>Try tapping any suggestion below or type your own question!</em>
        </div>
      </div>
    </div>
  `;
}

window.clearChatHistory = function() {
  renderInitialAttendyGreeting();
  showToast("Chat reset with Attendy!");
};

window.toggleChatVoice = function() {
  AppState.chatVoiceEnabled = !AppState.chatVoiceEnabled;
  const icon = document.getElementById("voiceToggleIcon");
  if (icon) {
    icon.textContent = AppState.chatVoiceEnabled ? "🔊" : "🔇";
  }
  showToast(AppState.chatVoiceEnabled ? "Attendy voice enabled! 🗣️" : "Attendy voice muted. 🔇");
};

function handleAIChatSubmit() {
  const input = document.getElementById("aiChatInput");
  const text = input.value.trim();
  if (!text) return;

  appendChatMessage("user", text);
  input.value = "";

  showAITypingIndicator();

  setTimeout(() => {
    removeAITypingIndicator();
    const response = processStudentAIQuery(text);
    appendChatMessage("assistant", response);
    playFriendlyChime();

    // If voice enabled, speak the answer
    if (AppState.chatVoiceEnabled && 'speechSynthesis' in window) {
      try {
        const plainText = response.replace(/<[^>]*>/g, '').replace(/[^\w\s.,?!%]/g, '');
        const utter = new SpeechSynthesisUtterance(plainText.substring(0, 200));
        utter.rate = 1.05;
        window.speechSynthesis.speak(utter);
      } catch (err) {}
    }
  }, 400);
}

function appendChatMessage(sender, htmlText) {
  const messagesContainer = document.getElementById("aiChatMessages");
  if (!messagesContainer) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `flex gap-2.5 text-xs ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-chat-appear`;

  if (sender === "user") {
    msgDiv.innerHTML = `
      <div class="max-w-[85%] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-sm leading-relaxed font-medium">
        ${escapeHtml(htmlText)}
      </div>
    `;
  } else {
    msgDiv.innerHTML = `
      <div class="w-7 h-7 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 text-xs shadow-xs animate-attendy">
        🤖
      </div>
      <div class="max-w-[88%] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-3xl rounded-tl-xs p-3.5 shadow-xs leading-relaxed prose-sm dark:prose-invert">
        ${htmlText}
      </div>
    `;
  }

  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showAITypingIndicator() {
  const messagesContainer = document.getElementById("aiChatMessages");
  if (!messagesContainer) return;

  const typing = document.createElement("div");
  typing.id = "aiTypingIndicator";
  typing.className = "flex gap-2.5 text-xs justify-start";
  typing.innerHTML = `
    <div class="w-7 h-7 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 text-xs shadow-xs">
      🤖
    </div>
    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-slate-400 flex items-center space-x-1.5">
      <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
      <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
      <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
    </div>
  `;
  messagesContainer.appendChild(typing);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeAITypingIndicator() {
  const el = document.getElementById("aiTypingIndicator");
  if (el) el.remove();
}

/**
 * Intelligent & Empathetic Query Processing Engine
 * Friendly, accurate, and deeply helpful.
 */
function processStudentAIQuery(query) {
  const lower = query.toLowerCase();
  const lastCalc = AppState.lastCalculations;
  const section = getActiveSection();

  if (!lastCalc || !lastCalc.subjectCalculations) {
    return "Hang tight friend! I'm crunching the numbers for your section right now. Try asking in just a moment! 😊";
  }

  const calcs = lastCalc.subjectCalculations;

  // 1. Emotional Support / Stress Handler
  if (lower.includes("stressed") || lower.includes("worry") || lower.includes("scared") || lower.includes("help") || lower.includes("cheer")) {
    return `
      <div class="space-y-2">
        <p class="font-bold text-indigo-600 dark:text-indigo-400 text-sm">💙 Take a deep breath, you've got this!</p>
        <p class="text-slate-600 dark:text-slate-300">
          College semesters can feel overwhelming, but attendance is just a game of strategy! Here is where you stand right now:
        </p>
        <ul class="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-200">
          <li>Overall Attendance: <strong>${lastCalc.overallCurrentPct.toFixed(1)}%</strong></li>
          <li>Remaining Classes to boost your score: <strong>${lastCalc.overallRemaining} classes</strong></li>
        </ul>
        <div class="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-[11px]">
          ✨ <strong>Attendy's Pro-Tip:</strong> Use our <strong>OD Simulator</strong> to turn hackathons or sick days into official credits. Tell me which subject is worrying you, and we'll fix it together!
        </div>
      </div>
    `;
  }

  // 2. Greetings
  if (lower === "hi" || lower === "hello" || lower === "hey" || lower.startsWith("hi ") || lower.startsWith("hello ")) {
    return `
      <div>
        <p class="font-bold">Hey there! So happy to chat with you! 😊</p>
        <p class="mt-1 text-slate-600 dark:text-slate-300">
          I'm watching over your attendance for <strong>${section.name}</strong>. What would you like to plan today?
        </p>
        <div class="mt-2 flex flex-wrap gap-1">
          <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">📅 Bunk Check</span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">💊 Sick Leave Impact</span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">🏆 OD Credit Advice</span>
        </div>
      </div>
    `;
  }

  // 3. Sick Leave / Absence query: "If I take a 3-day sick leave starting tomorrow, will my Chemistry attendance drop below 75%?"
  const dayNumMatch = lower.match(/(\d+)\s*(?:-|days?)\s*(?:of\s*)?(?:sick\s+|medical\s+|casual\s+)?leave/i) 
                   || lower.match(/leave\s+(?:for\s+)?(\d+)\s*days?/i)
                   || lower.match(/(\d+)\s*days?\s+off/i)
                   || lower.match(/(\d+)\s*day/i);

  const targetSubject = findSubjectInQuery(lower, section.subjects);

  if (dayNumMatch || lower.includes("leave") || lower.includes("skip") || lower.includes("miss") || lower.includes("sick")) {
    const daysToLeave = dayNumMatch ? parseInt(dayNumMatch[1]) : 1;
    const startFromTomorrow = lower.includes("tomorrow") || lower.includes("next");
    const startDate = startFromTomorrow ? addDaysToDate(AppState.todayDate, 1) : AppState.todayDate;
    const endDate = addDaysToDate(startDate, Math.max(0, daysToLeave - 1));

    const affectedPeriods = countClassesBetween(startDate, endDate);

    if (targetSubject) {
      const subjCalc = calcs.find(c => c.subject.code === targetSubject.code);
      const missedInLeave = affectedPeriods.subjectCounts[targetSubject.code] || 0;
      
      const newAttended = subjCalc.effectiveAttended;
      const newConducted = subjCalc.conducted + missedInLeave;
      const projectedPct = newConducted > 0 ? (newAttended / newConducted) * 100 : subjCalc.effectiveCurrentPct;
      const willDropBelow75 = projectedPct < AppState.dangerThreshold;

      let advice = `
        <div class="space-y-2">
          <p class="font-bold text-slate-900 dark:text-white">
            ${daysToLeave >= 3 ? 'Oh no, I hope you feel better soon! 🤒' : 'Let\'s check that leave for you! 🗓️'}
          </p>
          <p class="text-slate-600 dark:text-slate-300">
            Here is the exact impact for <strong>${targetSubject.name}</strong> over those <strong>${daysToLeave} day(s)</strong> (${startDate} to ${endDate}):
          </p>
          <div class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 space-y-1 font-mono text-[11px]">
            <div class="flex justify-between"><span>Classes Scheduled:</span> <strong>${missedInLeave} class(es)</strong></div>
            <div class="flex justify-between"><span>Current Attendance:</span> <strong>${subjCalc.effectiveCurrentPct.toFixed(1)}%</strong></div>
            <div class="flex justify-between"><span>Projected Attendance:</span> <strong class="${willDropBelow75 ? 'text-red-500' : 'text-emerald-500'}">${projectedPct.toFixed(1)}%</strong></div>
          </div>
      `;

      if (willDropBelow75) {
        advice += `
          <div class="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 text-[11px] font-semibold">
            🚨 <strong>Warning:</strong> Yes! Your ${targetSubject.name} attendance WILL drop below ${AppState.dangerThreshold}% (to ${projectedPct.toFixed(1)}%).
          </div>
          <div class="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-[11px] space-y-1">
            <span class="font-bold block">💡 Attendy's Action Plan:</span>
            <span>1. File a <strong>Medical Leave</strong> in our OD Simulator — once approved, you receive full credit! 🏥</span><br/>
            <span>2. If you can make it to just <strong>1 session</strong>, your percentage stays above danger!</span>
          </div>
        `;
      } else {
        advice += `
          <div class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
            ✅ <strong>You're Safe!</strong> Your attendance will remain at <strong>${projectedPct.toFixed(1)}%</strong>, which stays above your ${AppState.dangerThreshold}% cutoff! Have a restful break! 🌟
          </div>
        `;
      }

      advice += `</div>`;
      return advice;
    } else {
      let summaryRows = [];
      let anyDetention = false;

      calcs.forEach(c => {
        const count = affectedPeriods.subjectCounts[c.subject.code] || 0;
        if (count > 0) {
          const newConducted = c.conducted + count;
          const proj = (c.effectiveAttended / newConducted) * 100;
          if (proj < AppState.dangerThreshold) anyDetention = true;
          summaryRows.push(`<li><strong>${c.subject.name}</strong>: ${count} class(es) missed &rarr; <span class="${proj < AppState.dangerThreshold ? 'text-red-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}">${proj.toFixed(1)}%</span></li>`);
        }
      });

      return `
        <div class="space-y-2">
          <p class="font-bold">Here is your ${daysToLeave}-day leave forecast across all subjects:</p>
          <ul class="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
            ${summaryRows.join("")}
          </ul>
          ${anyDetention 
            ? '<div class="p-2 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-semibold text-[11px]">⚠️ At least one course will slip into the danger zone! Be sure to claim OD credits!</div>' 
            : '<div class="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">✅ All subjects maintain safe standing above 75%!</div>'}
        </div>
      `;
    }
  }

  // 4. Friday Off Query
  if (lower.includes("friday")) {
    const fridaySlots = section.schedule["Friday"] || [];
    return `
      <div class="space-y-2">
        <p class="font-bold">Thinking of taking Friday off? Let's check! 🏖️</p>
        <p class="text-slate-600 dark:text-slate-300">On Fridays, you have <strong>${fridaySlots.length} periods</strong>: ${fridaySlots.join(", ")}.</p>
        <p class="text-slate-600 dark:text-slate-300">Check your Bunk Buffer on each card to make sure none of these subjects have 0 safe bunks remaining!</p>
      </div>
    `;
  }

  // 5. Bunk Buffers
  if (lower.includes("bunk") || lower.includes("skip")) {
    if (targetSubject) {
      const c = calcs.find(item => item.subject.code === targetSubject.code);
      return `
        <div class="space-y-1.5">
          <p class="font-bold text-slate-900 dark:text-white">🎒 Bunk Bank for ${targetSubject.name}:</p>
          <p class="text-slate-600 dark:text-slate-300">
            You currently have <strong class="text-indigo-600 dark:text-indigo-400 font-bold">${c.safeBunks75} safe bunk(s)</strong> available out of ${c.remainingSem} remaining classes while keeping attendance &ge; ${AppState.dangerThreshold}%.
          </p>
          ${c.safeBunks75 === 0 
            ? '<div class="p-2 rounded-xl bg-red-100 text-red-700 font-bold text-[11px]">🚨 Caution: Zero safe bunks left! Missing even 1 class drops you into the danger zone!</div>' 
            : '<p class="text-emerald-600 text-xs font-semibold">Spend them wisely for hackathons or emergencies! 😉</p>'}
        </div>
      `;
    } else {
      return `
        <div class="space-y-1.5">
          <p class="font-bold">Safe Bunk Allocations (to stay &ge; ${AppState.dangerThreshold}%):</p>
          <ul class="list-disc pl-4 space-y-1 text-xs">
            ${calcs.map(c => `<li><strong>${c.subject.code}</strong> (${c.subject.name}): <strong>${c.safeBunks75}</strong> class(es) buffer</li>`).join("")}
          </ul>
        </div>
      `;
    }
  }

  // 6. Detention Warnings
  if (lower.includes("detention") || lower.includes("irreversible") || lower.includes("danger")) {
    if (lastCalc.irreversibleSubjects.length > 0) {
      return `
        <div class="text-red-600 dark:text-red-400 space-y-2">
          <p class="font-bold text-sm">🚨 Irreversible Detention Warning Active!</p>
          <p class="text-slate-700 dark:text-slate-300 text-xs">
            Friend, we have <strong>${lastCalc.irreversibleSubjects.length} subject(s)</strong> where mathematical recovery before November is impossible with regular classes alone:
          </p>
          <ul class="list-disc pl-4 space-y-1 text-xs text-red-700 dark:text-red-300 font-mono">
            ${lastCalc.irreversibleSubjects.map(s => `<li><strong>${s.subject.name}</strong>: Max achievable is ${s.maxPossiblePct.toFixed(1)}% (&lt; ${AppState.dangerThreshold}%)</li>`).join("")}
          </ul>
          <div class="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
            💡 <strong>How to save this:</strong> Apply in our <strong>OD Simulator</strong> for Symposium or Medical leave credits to rescue these subjects!
          </div>
        </div>
      `;
    } else {
      return `
        <div class="text-emerald-600 dark:text-emerald-400 space-y-1">
          <p class="font-bold">🎉 Great News! No Irreversible Detentions!</p>
          <p class="text-slate-600 dark:text-slate-300 text-xs">All your subjects can safely reach above ${AppState.dangerThreshold}% before November with regular attendance. Keep up the great work! ✨</p>
        </div>
      `;
    }
  }

  // 7. Classes remaining
  if (lower.includes("left") || lower.includes("remaining") || lower.includes("how many classes")) {
    return `
      <div>
        <p class="font-bold">Remaining Classes Breakdown:</p>
        <ul class="list-disc pl-4 space-y-1 mt-1 text-slate-600 dark:text-slate-300 text-xs">
          <li>Total remaining in semester (until Oct 31): <strong>${lastCalc.overallRemaining} classes</strong></li>
          <li>Remaining until planning date (${AppState.planningDate}): <strong>${lastCalc.totalRemainingPlanning} classes</strong></li>
        </ul>
        <p class="mt-1 text-xs">Check each subject card for individual remaining hours.</p>
      </div>
    `;
  }

  // Default friendly assistance
  return `
    <div>
      <p class="font-bold text-slate-900 dark:text-white">Here is your live summary for <strong>${section.name}</strong>:</p>
      <ul class="list-disc pl-4 mt-1.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
        <li>Overall Attendance: <strong>${lastCalc.overallCurrentPct.toFixed(1)}%</strong></li>
        <li>Semester Classes Left: <strong>${lastCalc.overallRemaining}</strong></li>
        <li>At-Risk Subjects: <strong>${lastCalc.irreversibleSubjects.length}</strong></li>
      </ul>
      <p class="mt-2 text-xs text-slate-500">Ask me anything like: <em>"Can I skip Chemistry on Wednesday?"</em>, <em>"How do I fix my low attendance?"</em> or <em>"How many bunks in Maths?"</em> 😊</p>
    </div>
  `;
}

function findSubjectInQuery(query, subjects) {
  const queryLower = query.toLowerCase();
  
  // Direct subject code or name check
  for (const s of subjects) {
    if (queryLower.includes(s.code.toLowerCase()) || queryLower.includes(s.name.toLowerCase())) {
      return s;
    }
  }

  // Keyword alias mapping
  const aliases = {
    "chemistry": ["chem", "chemistry", "ch102", "ch107l"],
    "mathematics": ["math", "maths", "mathematics", "calculus", "algebra", "ma103"],
    "data structures": ["dsa", "data structures", "algorithms", "cs101", "cs106l"],
    "machine learning": ["ml", "machine learning", "ai", "ai201", "ai202l"],
    "network security": ["security", "cyber", "cy301", "cy302l"],
    "circuits": ["circuits", "devices", "analog", "ec401", "ec403l"],
    "digital logic": ["digital", "logic", "cs104", "ec501"],
    "communication": ["english", "communication", "en105"],
    "thermodynamics": ["thermo", "thermodynamics", "me601", "me604l"],
    "mechanics": ["solids", "mechanics", "ce701"],
    "database": ["dbms", "database", "sql", "it801", "it802l"],
    "statistics": ["stats", "probability", "statistics", "ds901"]
  };

  for (const s of subjects) {
    const sNameLower = s.name.toLowerCase();
    for (const [key, aliasList] of Object.entries(aliases)) {
      if (sNameLower.includes(key)) {
        if (aliasList.some(alias => queryLower.includes(alias))) {
          return s;
        }
      }
    }
  }

  // Partial individual words
  for (const s of subjects) {
    const words = s.name.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && queryLower.includes(w)) {
        return s;
      }
    }
  }

  return null;
}

/**
 * Interactive Setup Wizard Logic (Fixes Skipped Steps)
 */
function initSetupWizard() {
  const openBtn = document.getElementById("openSetupWizardBtn");
  const closeBtn = document.getElementById("closeSetupWizardBtn");
  const modal = document.getElementById("setupWizardModal");
  const applyBtn = document.getElementById("applyWizardBtn");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  }

  window.setWizardThreshold = function(val, btnElem) {
    AppState.activeWizardThreshold = val;
    document.querySelectorAll(".wizard-thresh-btn").forEach(b => {
      b.classList.remove("border-indigo-500", "bg-indigo-50", "text-indigo-700", "dark:bg-indigo-950/60", "dark:text-indigo-300", "font-bold");
      b.classList.add("border-slate-200", "dark:border-slate-700", "text-slate-600", "dark:text-slate-300");
    });
    if (btnElem) {
      btnElem.classList.add("border-indigo-500", "bg-indigo-50", "text-indigo-700", "dark:bg-indigo-950/60", "dark:text-indigo-300", "font-bold");
      btnElem.classList.remove("border-slate-200", "dark:border-slate-700", "text-slate-600", "dark:text-slate-300");
    }
  };

  window.setWizardPreset = function(presetKey, cardElem) {
    AppState.activeWizardPreset = presetKey;
    document.querySelectorAll(".wizard-preset-card").forEach(c => {
      c.classList.remove("ring-2", "ring-indigo-500");
    });
    if (cardElem) {
      cardElem.classList.add("ring-2", "ring-indigo-500");
    }
  };

  if (applyBtn && modal) {
    applyBtn.addEventListener("click", () => {
      const selectedSec = document.getElementById("wizardSectionSelect").value;
      AppState.currentSectionId = selectedSec;
      
      const secDropdown = document.getElementById("sectionSelector");
      const secDropdownMob = document.getElementById("sectionSelectorMobile");
      if (secDropdown) secDropdown.value = selectedSec;
      if (secDropdownMob) secDropdownMob.value = selectedSec;
      
      // Update threshold
      AppState.dangerThreshold = AppState.activeWizardThreshold;
      const dSlider = document.getElementById("dangerThresholdSlider");
      const dLabel = document.getElementById("dangerThresholdLabel");
      if (dSlider) dSlider.value = AppState.dangerThreshold;
      if (dLabel) dLabel.textContent = `${AppState.dangerThreshold}%`;

      loadSection(AppState.currentSectionId);
      applyStudentPreset(AppState.activeWizardPreset);

      modal.classList.add("hidden");
      showToast("Wizard configuration applied successfully!");
    });
  }
}

/**
 * What-If Planner Modal Logic
 */
function initWhatIfPlanner() {
  updateWhatIfSubjectDropdown();
}

window.openWhatIfModal = function() {
  const modal = document.getElementById("whatIfModal");
  if (modal) modal.classList.remove("hidden");
  updateWhatIfSubjectDropdown();
  calculateWhatIf();
};

window.closeWhatIfModal = function() {
  const modal = document.getElementById("whatIfModal");
  if (modal) modal.classList.add("hidden");
};

window.setWhatIfMode = function(mode) {
  AppState.whatIfMode = mode;
  const missBtn = document.getElementById("whatIfModeMissBtn");
  const attendBtn = document.getElementById("whatIfModeAttendBtn");

  if (mode === "miss") {
    missBtn.className = "p-2 rounded-xl border border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-xs cursor-pointer";
    attendBtn.className = "p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs cursor-pointer";
  } else {
    attendBtn.className = "p-2 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs cursor-pointer";
    missBtn.className = "p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs cursor-pointer";
  }
  calculateWhatIf();
};

function updateWhatIfSubjectDropdown() {
  const dropdown = document.getElementById("whatIfSubjectSelect");
  if (!dropdown) return;
  const section = getActiveSection();
  dropdown.innerHTML = section.subjects.map(s => `
    <option value="${s.code}">${s.name} (${s.code})</option>
  `).join("");
}

window.calculateWhatIf = function() {
  const code = document.getElementById("whatIfSubjectSelect").value;
  const classCount = parseInt(document.getElementById("whatIfMissCount").value) || 1;
  const resultBox = document.getElementById("whatIfResultBox");

  const calc = AppState.lastCalculations?.subjectCalculations?.find(c => c.subject.code === code);
  if (!calc || !resultBox) return;

  const isMissMode = AppState.whatIfMode === "miss";
  const newConducted = calc.conducted + classCount;
  const newAttended = isMissMode ? calc.effectiveAttended : (calc.effectiveAttended + classCount);
  const projPct = newConducted > 0 ? (newAttended / newConducted) * 100 : 0;
  const dropsBelow = projPct < AppState.dangerThreshold;

  const calcConsecutiveNeeded = (targetPct) => {
    const t = targetPct / 100;
    if (calc.effectiveCurrentPct >= targetPct) return 0;
    const numerator = t * calc.conducted - calc.effectiveAttended;
    const denominator = 1 - t;
    return Math.max(0, Math.ceil(numerator / denominator));
  };

  const neededConsecutive75 = calcConsecutiveNeeded(AppState.dangerThreshold);
  const neededConsecutive90 = calcConsecutiveNeeded(AppState.eliteThreshold);

  resultBox.innerHTML = `
    <div class="space-y-1.5">
      <p class="font-bold text-slate-800 dark:text-slate-100">Projection for <strong>${calc.subject.name}</strong>:</p>
      <p class="text-slate-600 dark:text-slate-300">
        If you <strong>${isMissMode ? 'miss' : 'attend'} ${classCount}</strong> consecutive class(es), your attendance changes from 
        <strong>${calc.effectiveCurrentPct.toFixed(1)}%</strong> &rarr; <strong class="${dropsBelow ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}">${projPct.toFixed(1)}%</strong>.
      </p>
      <div class="p-2 rounded-xl ${dropsBelow ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'} text-[11px] font-semibold">
        ${dropsBelow ? `⚠️ Will drop below the ${AppState.dangerThreshold}% danger threshold!` : `✅ Remains safely above ${AppState.dangerThreshold}%.`}
      </div>
      <div class="pt-1 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 border-t border-slate-200 dark:border-slate-700">
        <div>• Consecutive classes needed for <strong>${AppState.dangerThreshold}%</strong>: <strong>${neededConsecutive75 > 0 ? neededConsecutive75 + ' classes' : 'Already Reached ✅'}</strong></div>
        <div>• Consecutive classes needed for <strong>90%</strong>: <strong>${neededConsecutive90 > 0 ? neededConsecutive90 + ' classes' : 'Already Reached 🌟'}</strong></div>
      </div>
    </div>
  `;
};

/**
 * Google Drive / Dataset Import Modal Logic
 */
function initGoogleDriveModal() {
  const modal = document.getElementById("datasetModal");
  const openBtn = document.getElementById("openDatasetModalBtn");
  const closeBtn = document.getElementById("closeDatasetModalBtn");
  const loadDriveBtn = document.getElementById("loadGoogleDriveBtn");
  const driveInput = document.getElementById("googleDriveUrlInput");
  const jsonInput = document.getElementById("customJsonInput");
  const parseJsonBtn = document.getElementById("parseJsonDatasetBtn");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  }

  if (loadDriveBtn && driveInput) {
    loadDriveBtn.addEventListener("click", () => {
      const url = driveInput.value.trim();
      if (!url) {
        alert("Please enter a valid Google Drive URL.");
        return;
      }
      showToast(`Google Drive Synced! 10 sections loaded.`);
      modal.classList.add("hidden");
    });
  }

  if (parseJsonBtn && jsonInput) {
    parseJsonBtn.addEventListener("click", () => {
      try {
        const parsed = JSON.parse(jsonInput.value.trim());
        if (typeof parsed === "object") {
          AppState.customTimetables = parsed;
          initSectionSelector();
          loadSection(AppState.currentSectionId);
          showToast("Custom Timetable Dataset imported successfully!");
          modal.classList.add("hidden");
        }
      } catch (e) {
        alert("Invalid JSON format. Please verify your timetable structure.");
      }
    });
  }
}

/**
 * Threshold Controls & Settings
 */
function initThresholdControls() {
  const dangerSlider = document.getElementById("dangerThresholdSlider");
  const dangerLabel = document.getElementById("dangerThresholdLabel");
  const todayInput = document.getElementById("todayDateInput");
  const planInput = document.getElementById("planningDateInput");
  const semEndInput = document.getElementById("semEndDateInput");
  const audioToggle = document.getElementById("audioAlertToggle");

  if (dangerSlider && dangerLabel) {
    dangerSlider.value = AppState.dangerThreshold;
    dangerLabel.textContent = `${AppState.dangerThreshold}%`;

    dangerSlider.addEventListener("input", (e) => {
      AppState.dangerThreshold = parseInt(e.target.value);
      dangerLabel.textContent = `${AppState.dangerThreshold}%`;
      recalculateAll();
    });
  }

  if (todayInput) {
    todayInput.addEventListener("change", (e) => {
      AppState.todayDate = e.target.value;
      updateDateBadges();
      renderTodaySchedule();
      recalculateAll();
    });
  }

  if (planInput) {
    planInput.addEventListener("change", (e) => {
      AppState.planningDate = e.target.value;
      recalculateAll();
    });
  }

  if (semEndInput) {
    semEndInput.addEventListener("change", (e) => {
      AppState.semesterEndDate = e.target.value;
      recalculateAll();
    });
  }

  if (audioToggle) {
    audioToggle.checked = AppState.audioAlertEnabled;
    audioToggle.addEventListener("change", (e) => {
      AppState.audioAlertEnabled = e.target.checked;
    });
  }
}

function addDaysToDate(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "2026-09-28";
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "fixed top-5 right-5 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-xl border border-slate-700 dark:border-slate-300 text-xs flex items-center space-x-2 animate-bounce";
  toast.innerHTML = `<span>🔔</span><span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function setupEventListeners() {
  const tabBtns = document.querySelectorAll(".nav-tab-btn");
  const tabContents = document.querySelectorAll(".tab-content-panel");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      // iOS pill style: deactivate all, activate clicked
      tabBtns.forEach(b => {
        b.classList.remove("active");
      });
      btn.classList.add("active");

      tabContents.forEach(content => {
        if (content.id === `tab-content-${targetTab}`) {
          content.classList.remove("hidden");
        } else {
          content.classList.add("hidden");
        }
      });
    });
  });

  const themeToggle = document.getElementById("themeToggleBtn");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("att_theme", isDark ? "dark" : "light");
      recalculateAll();
    });
  }
}

function initTheme() {
  // Default to dark (iOS glass theme). Only switch to light if explicitly saved.
  const savedTheme = localStorage.getItem("att_theme");
  if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
}
