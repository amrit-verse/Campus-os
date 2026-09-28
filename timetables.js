/**
 * Timetable Dataset & Academic Calendar Configuration
 * Comprehensive data for 10 Class Sections (CSE, ECE, MECH, CIVIL, IT, AI-DS, EEE)
 * Includes room allocations, faculty profiles, syllabus credits, and preset profiles.
 */

const ACADEMIC_CALENDAR = {
  semesterName: "Odd Semester 2026-2027",
  university: "National Institute of Engineering & Technology",
  semesterStartDate: "2026-08-03", // 3rd August 2026
  semesterEndDate: "2026-10-31",   // 31st October 2026 (Before November)
  dangerThresholdDefault: 75,      // Minimum statutory percentage (75%)
  eliteThresholdDefault: 90,       // Elite target percentage (90%)
  timeSlots: [
    { period: 1, time: "09:00 - 10:00", label: "Period 1" },
    { period: 2, time: "10:00 - 11:00", label: "Period 2" },
    { period: "break", time: "11:00 - 11:15", label: "Tea Break", isBreak: true },
    { period: 3, time: "11:15 - 12:15", label: "Period 3" },
    { period: "lunch", time: "12:15 - 01:15", label: "Lunch Break", isBreak: true },
    { period: 4, time: "01:15 - 02:15", label: "Period 4" },
    { period: 5, time: "02:15 - 03:15", label: "Period 5" },
    { period: 6, time: "03:15 - 04:15", label: "Period 6" }
  ],
  holidays: [
    { date: "2026-08-15", name: "Independence Day", type: "National Holiday" },
    { date: "2026-08-28", name: "Onam Festival", type: "Festival Holiday" },
    { date: "2026-09-04", name: "Janmashtami", type: "Festival Holiday" },
    { date: "2026-09-17", name: "Ganesh Chaturthi", type: "Festival Holiday" },
    { date: "2026-10-02", name: "Gandhi Jayanti", type: "National Holiday" },
    { date: "2026-10-19", name: "Ayudha Pooja", type: "Festival Holiday" },
    { date: "2026-10-20", name: "Vijayadashami (Dussehra)", type: "Festival Holiday" },
    { date: "2026-10-29", name: "Deepavali Festival", type: "Festival Holiday" }
  ]
};

// Preset Student Profiles for 1-Click Demos & Fast Testing
const STUDENT_PRESETS = {
  detention: {
    name: "🚨 Detention Emergency (Demo)",
    description: "Simulates very low attendance in Chemistry (56%) and Maths (60%) to trigger the Irreversible Detention Warning.",
    badge: "Detained",
    badgeColor: "bg-red-500",
    percentages: {
      "CS101": 78,
      "CH102": 56, // Low -> Irreversible Detention!
      "MA103": 60, // Low -> Danger Zone!
      "CS104": 74,
      "EN105": 85,
      "CS106L": 82,
      "CH107L": 62
    }
  },
  borderline: {
    name: "⚠️ Borderline Risk (74%)",
    description: "Attendance hovering right around 73-75% where missing even 1 class causes detention.",
    badge: "Borderline",
    badgeColor: "bg-amber-500",
    percentages: {
      "CS101": 74,
      "CH102": 72,
      "MA103": 76,
      "CS104": 73,
      "EN105": 80,
      "CS106L": 75,
      "CH107L": 74
    }
  },
  elite: {
    name: "🌟 Dean's Honor Roll (92%)",
    description: "High performance student maintaining >90% with plenty of safe bunks buffer.",
    badge: "Honor Roll",
    badgeColor: "bg-emerald-500",
    percentages: {
      "CS101": 94,
      "CH102": 91,
      "MA103": 95,
      "CS104": 90,
      "EN105": 96,
      "CS106L": 92,
      "CH107L": 90
    }
  },
  balanced: {
    name: "⚡ Balanced Regular Student",
    description: "Healthy average student (~80-84%) with manageable attendance requirements.",
    badge: "Good Standing",
    badgeColor: "bg-blue-500",
    percentages: {
      "CS101": 84,
      "CH102": 79,
      "MA103": 82,
      "CS104": 86,
      "EN105": 88,
      "CS106L": 85,
      "CH107L": 80
    }
  }
};

// 10 Class Sections with comprehensive engineering curriculums
const SECTIONS_DATA = {
  "SEC-1": {
    id: "SEC-1",
    name: "Section 1: CSE - A (Computer Science)",
    department: "Computer Science & Engineering",
    hall: "Lecture Hall LH-301",
    coordinator: "Dr. Arvind Sharma (arvind@niet.edu)",
    subjects: [
      { code: "CS101", name: "Data Structures & Algorithms", faculty: "Dr. A. Sharma", color: "#3b82f6", credits: 4, room: "LH-301" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. R. Ramanujan", color: "#10b981", credits: 3, room: "LH-301" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. S. Iyer", color: "#8b5cf6", credits: 4, room: "LH-301" },
      { code: "CS104", name: "Digital Logic & Computer Design", faculty: "Prof. V. Gupta", color: "#f59e0b", credits: 3, room: "LH-301" },
      { code: "EN105", name: "Professional Communication", faculty: "Dr. N. Menon", color: "#ec4899", credits: 2, room: "Lang-Lab" },
      { code: "CS106L", name: "DSA Practical Laboratory", faculty: "Dr. A. Sharma & Labs", color: "#06b6d4", credits: 2, isLab: true, room: "CS Lab 2" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. R. Ramanujan & Labs", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["CS101", "MA103", "CH102", "CS104", "CS106L", "CS106L"],
      "Tuesday": ["MA103", "CS101", "CS104", "EN105", "CH102", "CS101"],
      "Wednesday": ["CH102", "MA103", "CS101", "CH107L", "CH107L", "EN105"],
      "Thursday": ["CS104", "CH102", "MA103", "CS101", "CS104", "MA103"],
      "Friday": ["EN105", "CS101", "CH102", "MA103", "CS104", "CS101"]
    }
  },
  "SEC-2": {
    id: "SEC-2",
    name: "Section 2: CSE - B (Artificial Intelligence)",
    department: "Computer Science (AI & ML)",
    hall: "AI Center Hall 102",
    coordinator: "Dr. K. Swaminathan (swami@niet.edu)",
    subjects: [
      { code: "AI201", name: "Machine Learning Foundations", faculty: "Dr. K. Swaminathan", color: "#6366f1", credits: 4, room: "AI-102" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. P. Mukherjee", color: "#10b981", credits: 3, room: "AI-102" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. S. Iyer", color: "#8b5cf6", credits: 4, room: "AI-102" },
      { code: "CS101", name: "Data Structures & Algorithms", faculty: "Prof. T. Reddy", color: "#3b82f6", credits: 4, room: "AI-102" },
      { code: "EN105", name: "Professional Communication", faculty: "Dr. N. Menon", color: "#ec4899", credits: 2, room: "Lang-Lab" },
      { code: "AI202L", name: "Python for AI Laboratory", faculty: "Dr. K. Swaminathan", color: "#06b6d4", credits: 2, isLab: true, room: "AI Lab 1" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. P. Mukherjee", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["AI201", "MA103", "CS101", "CH102", "AI202L", "AI202L"],
      "Tuesday": ["CS101", "AI201", "MA103", "CH102", "EN105", "MA103"],
      "Wednesday": ["CH102", "CS101", "AI201", "CH107L", "CH107L", "EN105"],
      "Thursday": ["MA103", "CH102", "AI201", "CS101", "AI201", "CS101"],
      "Friday": ["EN105", "MA103", "CH102", "AI201", "CS101", "MA103"]
    }
  },
  "SEC-3": {
    id: "SEC-3",
    name: "Section 3: CSE - C (Cyber Security)",
    department: "Computer Science (Cyber Security)",
    hall: "Cyber Defense Block 204",
    coordinator: "Dr. Hitesh Patel (hitesh@niet.edu)",
    subjects: [
      { code: "CY301", name: "Network Security Fundamentals", faculty: "Dr. H. Patel", color: "#ef4444", credits: 4, room: "CB-204" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. R. Ramanujan", color: "#10b981", credits: 3, room: "CB-204" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. M. Joshi", color: "#8b5cf6", credits: 4, room: "CB-204" },
      { code: "CS101", name: "Data Structures & Algorithms", faculty: "Prof. T. Reddy", color: "#3b82f6", credits: 4, room: "CB-204" },
      { code: "CS104", name: "Digital Logic & Computer Design", faculty: "Prof. V. Gupta", color: "#f59e0b", credits: 3, room: "CB-204" },
      { code: "CY302L", name: "Cyber Defense Laboratory", faculty: "Dr. H. Patel", color: "#f97316", credits: 2, isLab: true, room: "Sec Lab" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. R. Ramanujan", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["CY301", "CH102", "MA103", "CS101", "CY302L", "CY302L"],
      "Tuesday": ["MA103", "CS104", "CY301", "CH102", "CS101", "CY301"],
      "Wednesday": ["CS101", "MA103", "CH102", "CH107L", "CH107L", "CS104"],
      "Thursday": ["CY301", "CS101", "MA103", "CH102", "CS104", "MA103"],
      "Friday": ["CS104", "CY301", "CH102", "CS101", "MA103", "CY301"]
    }
  },
  "SEC-4": {
    id: "SEC-4",
    name: "Section 4: ECE - A (Electronics & Comm)",
    department: "Electronics & Communication",
    hall: "ECE Block LH-401",
    coordinator: "Dr. M. Varadhan (varadhan@niet.edu)",
    subjects: [
      { code: "EC401", name: "Electronic Circuits & Devices", faculty: "Dr. M. Varadhan", color: "#8b5cf6", credits: 4, room: "LH-401" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. S. Chakraborty", color: "#10b981", credits: 3, room: "LH-401" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. S. Iyer", color: "#3b82f6", credits: 4, room: "LH-401" },
      { code: "EC402", name: "Signals and Systems", faculty: "Prof. G. Nambiar", color: "#f59e0b", credits: 4, room: "LH-401" },
      { code: "EN105", name: "Professional Communication", faculty: "Dr. N. Menon", color: "#ec4899", credits: 2, room: "Lang-Lab" },
      { code: "EC403L", name: "Analog Circuits Laboratory", faculty: "Dr. M. Varadhan", color: "#06b6d4", credits: 2, isLab: true, room: "Analog Lab" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. S. Chakraborty", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["EC401", "MA103", "CH102", "EC402", "EC403L", "EC403L"],
      "Tuesday": ["EC402", "EC401", "MA103", "CH102", "EN105", "EC401"],
      "Wednesday": ["CH102", "EC402", "MA103", "CH107L", "CH107L", "EN105"],
      "Thursday": ["MA103", "CH102", "EC401", "EC402", "EC401", "MA103"],
      "Friday": ["EN105", "EC401", "CH102", "EC402", "MA103", "EC402"]
    }
  },
  "SEC-5": {
    id: "SEC-5",
    name: "Section 5: ECE - B (VLSI & Embedded)",
    department: "Electronics & Communication",
    hall: "VLSI Center LH-405",
    coordinator: "Dr. P. Sundaram (sundaram@niet.edu)",
    subjects: [
      { code: "EC501", name: "Digital System Design & HDL", faculty: "Dr. P. Sundaram", color: "#f97316", credits: 4, room: "LH-405" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. S. Chakraborty", color: "#10b981", credits: 3, room: "LH-405" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. M. Joshi", color: "#3b82f6", credits: 4, room: "LH-405" },
      { code: "EC401", name: "Electronic Circuits & Devices", faculty: "Prof. B. Thomas", color: "#8b5cf6", credits: 4, room: "LH-405" },
      { code: "EN105", name: "Professional Communication", faculty: "Dr. N. Menon", color: "#ec4899", credits: 2, room: "Lang-Lab" },
      { code: "EC502L", name: "HDL Simulation Laboratory", faculty: "Dr. P. Sundaram", color: "#06b6d4", credits: 2, isLab: true, room: "VLSI Lab" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. S. Chakraborty", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["EC501", "CH102", "MA103", "EC401", "EC502L", "EC502L"],
      "Tuesday": ["MA103", "EC501", "CH102", "EC401", "EN105", "EC501"],
      "Wednesday": ["CH102", "MA103", "EC501", "CH107L", "CH107L", "EC401"],
      "Thursday": ["EC401", "CH102", "MA103", "EC501", "EC501", "MA103"],
      "Friday": ["EN105", "EC401", "CH102", "EC501", "MA103", "EC401"]
    }
  },
  "SEC-6": {
    id: "SEC-6",
    name: "Section 6: MECH - A (Mechanical Engg)",
    department: "Mechanical Engineering",
    hall: "Mechanical Block M-101",
    coordinator: "Dr. K. Rao (krao@niet.edu)",
    subjects: [
      { code: "ME601", name: "Engineering Thermodynamics", faculty: "Dr. K. Rao", color: "#ef4444", credits: 4, room: "M-101" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. R. Ramanujan", color: "#10b981", credits: 3, room: "M-101" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. S. Iyer", color: "#3b82f6", credits: 4, room: "M-101" },
      { code: "ME602", name: "Fluid Mechanics & Machinery", faculty: "Dr. V. Nair", color: "#0ea5e9", credits: 4, room: "M-101" },
      { code: "ME603", name: "Material Science & Metallurgy", faculty: "Prof. R. Sen", color: "#d97706", credits: 3, room: "M-101" },
      { code: "ME604L", name: "Thermal Engineering Laboratory", faculty: "Dr. K. Rao & Staff", color: "#84cc16", credits: 2, isLab: true, room: "Thermal Lab" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. R. Ramanujan", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["ME601", "MA103", "CH102", "ME602", "ME604L", "ME604L"],
      "Tuesday": ["ME602", "ME601", "MA103", "CH102", "ME603", "ME601"],
      "Wednesday": ["CH102", "ME603", "MA103", "CH107L", "CH107L", "ME602"],
      "Thursday": ["MA103", "CH102", "ME601", "ME602", "ME603", "MA103"],
      "Friday": ["ME603", "ME601", "CH102", "ME602", "MA103", "ME602"]
    }
  },
  "SEC-7": {
    id: "SEC-7",
    name: "Section 7: CIVIL - A (Civil Engineering)",
    department: "Civil Engineering",
    hall: "Civil Block C-202",
    coordinator: "Dr. B. Kulkarni (kulkarni@niet.edu)",
    subjects: [
      { code: "CE701", name: "Mechanics of Solids", faculty: "Dr. B. Kulkarni", color: "#84cc16", credits: 4, room: "C-202" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. P. Mukherjee", color: "#10b981", credits: 3, room: "C-202" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. M. Joshi", color: "#3b82f6", credits: 4, room: "C-202" },
      { code: "CE702", name: "Surveying & Geomatics", faculty: "Prof. D. Bose", color: "#059669", credits: 4, room: "C-202" },
      { code: "EN105", name: "Professional Communication", faculty: "Dr. N. Menon", color: "#ec4899", credits: 2, room: "Lang-Lab" },
      { code: "CE703L", name: "Surveying Field Work Lab", faculty: "Prof. D. Bose & Staff", color: "#eab308", credits: 2, isLab: true, room: "Field Grounds" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. P. Mukherjee", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["CE701", "MA103", "CH102", "CE702", "CE703L", "CE703L"],
      "Tuesday": ["CE702", "CE701", "MA103", "CH102", "EN105", "CE701"],
      "Wednesday": ["CH102", "CE702", "MA103", "CH107L", "CH107L", "EN105"],
      "Thursday": ["MA103", "CH102", "CE701", "CE702", "CE701", "MA103"],
      "Friday": ["EN105", "CE701", "CH102", "CE702", "MA103", "CE702"]
    }
  },
  "SEC-8": {
    id: "SEC-8",
    name: "Section 8: IT - A (Information Tech)",
    department: "Information Technology",
    hall: "IT Block IT-101",
    coordinator: "Dr. L. Narayanan (narayanan@niet.edu)",
    subjects: [
      { code: "IT801", name: "Database Management Systems", faculty: "Dr. L. Narayanan", color: "#0284c7", credits: 4, room: "IT-101" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. S. Chakraborty", color: "#10b981", credits: 3, room: "IT-101" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. S. Iyer", color: "#3b82f6", credits: 4, room: "IT-101" },
      { code: "CS101", name: "Data Structures & Algorithms", faculty: "Dr. A. Sharma", color: "#8b5cf6", credits: 4, room: "IT-101" },
      { code: "EN105", name: "Professional Communication", faculty: "Dr. N. Menon", color: "#ec4899", credits: 2, room: "Lang-Lab" },
      { code: "IT802L", name: "DBMS Practical Laboratory", faculty: "Dr. L. Narayanan", color: "#06b6d4", credits: 2, isLab: true, room: "IT Lab 2" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. S. Chakraborty", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["IT801", "MA103", "CH102", "CS101", "IT802L", "IT802L"],
      "Tuesday": ["CS101", "IT801", "MA103", "CH102", "EN105", "IT801"],
      "Wednesday": ["CH102", "CS101", "MA103", "CH107L", "CH107L", "EN105"],
      "Thursday": ["MA103", "CH102", "IT801", "CS101", "IT801", "MA103"],
      "Friday": ["EN105", "IT801", "CH102", "CS101", "MA103", "CS101"]
    }
  },
  "SEC-9": {
    id: "SEC-9",
    name: "Section 9: AI & DS (Data Science)",
    department: "Artificial Intelligence & Data Science",
    hall: "Data Science Hub DS-302",
    coordinator: "Dr. G. Mishra (mishra@niet.edu)",
    subjects: [
      { code: "DS901", name: "Probability & Applied Statistics", faculty: "Dr. G. Mishra", color: "#8b5cf6", credits: 4, room: "DS-302" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. R. Ramanujan", color: "#10b981", credits: 3, room: "DS-302" },
      { code: "DS902", name: "Data Wrangling & Visualization", faculty: "Prof. C. Verma", color: "#f59e0b", credits: 4, room: "DS-302" },
      { code: "CS101", name: "Data Structures & Algorithms", faculty: "Prof. T. Reddy", color: "#3b82f6", credits: 4, room: "DS-302" },
      { code: "EN105", name: "Professional Communication", faculty: "Dr. N. Menon", color: "#ec4899", credits: 2, room: "Lang-Lab" },
      { code: "DS903L", name: "Data Science R & Python Lab", faculty: "Prof. C. Verma", color: "#06b6d4", credits: 2, isLab: true, room: "DS Lab 1" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. R. Ramanujan", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["DS901", "DS902", "CH102", "CS101", "DS903L", "DS903L"],
      "Tuesday": ["CS101", "DS901", "DS902", "CH102", "EN105", "DS901"],
      "Wednesday": ["CH102", "CS101", "DS901", "CH107L", "CH107L", "EN105"],
      "Thursday": ["DS902", "CH102", "DS901", "CS101", "DS902", "DS901"],
      "Friday": ["EN105", "DS901", "CH102", "CS101", "DS902", "CS101"]
    }
  },
  "SEC-10": {
    id: "SEC-10",
    name: "Section 10: EEE (Electrical & Electronics)",
    department: "Electrical & Electronics Engineering",
    hall: "Power Systems Block E-105",
    coordinator: "Dr. U. Chandran (chandran@niet.edu)",
    subjects: [
      { code: "EE1001", name: "Electric Circuit Analysis", faculty: "Dr. U. Chandran", color: "#eab308", credits: 4, room: "E-105" },
      { code: "CH102", name: "Engineering Chemistry", faculty: "Dr. P. Mukherjee", color: "#10b981", credits: 3, room: "E-105" },
      { code: "MA103", name: "Engineering Mathematics III", faculty: "Prof. S. Iyer", color: "#3b82f6", credits: 4, room: "E-105" },
      { code: "EE1002", name: "Electrical Machines - I", faculty: "Prof. J. Abraham", color: "#d97706", credits: 4, room: "E-105" },
      { code: "EN105", name: "Professional Communication", faculty: "Dr. N. Menon", color: "#ec4899", credits: 2, room: "Lang-Lab" },
      { code: "EE1003L", name: "Electric Circuits Laboratory", faculty: "Dr. U. Chandran", color: "#06b6d4", credits: 2, isLab: true, room: "Power Lab" },
      { code: "CH107L", name: "Chemistry Laboratory", faculty: "Dr. P. Mukherjee", color: "#14b8a6", credits: 2, isLab: true, room: "Chem Lab" }
    ],
    schedule: {
      "Monday": ["EE1001", "MA103", "CH102", "EE1002", "EE1003L", "EE1003L"],
      "Tuesday": ["EE1002", "EE1001", "MA103", "CH102", "EN105", "EE1001"],
      "Wednesday": ["CH102", "EE1002", "MA103", "CH107L", "CH107L", "EN105"],
      "Thursday": ["MA103", "CH102", "EE1001", "EE1002", "EE1001", "MA103"],
      "Friday": ["EN105", "EE1001", "CH102", "EE1002", "MA103", "EE1002"]
    }
  }
};

// Export to window
if (typeof window !== "undefined") {
  window.ACADEMIC_CALENDAR = ACADEMIC_CALENDAR;
  window.SECTIONS_DATA = SECTIONS_DATA;
  window.STUDENT_PRESETS = STUDENT_PRESETS;
}
