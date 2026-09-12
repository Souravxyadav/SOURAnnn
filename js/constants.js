const APPLICATION_STATUSES = [
  "Not Started",
  "Registration Done",
  "Application Started",
  "Form Filled",
  "Documents Pending",
  "Documents Uploaded",
  "Submitted",
  "Under Verification",
  "Deficiency / Correction Required",
  "Approved",
  "Rejected",
  "Payment Processing",
  "Partially Received",
  "Amount Received",
  "Closed",
];

const STATUS_PROGRESS = {
  "Not Started": 0,
  "Registration Done": 15,
  "Application Started": 25,
  "Form Filled": 40,
  "Documents Pending": 50,
  "Documents Uploaded": 60,
  "Submitted": 70,
  "Under Verification": 80,
  "Deficiency / Correction Required": 55,
  "Approved": 90,
  "Rejected": 100,
  "Payment Processing": 92,
  "Partially Received": 95,
  "Amount Received": 100,
  "Closed": 100,
};

// Semantic Tailwind color badge mappings
const STATUS_COLORS = {
  "Not Started": "bg-slate-100 text-slate-600 border border-slate-200",
  "Registration Done": "bg-blue-50 text-blue-700 border border-blue-200",
  "Application Started": "bg-blue-50 text-blue-700 border border-blue-200",
  "Form Filled": "bg-blue-50 text-blue-700 border border-blue-200",
  "Documents Pending": "bg-amber-50 text-amber-700 border border-amber-200",
  "Documents Uploaded": "bg-amber-50 text-amber-700 border border-amber-200",
  "Submitted": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "Under Verification": "bg-purple-50 text-purple-700 border border-purple-200",
  "Deficiency / Correction Required": "bg-orange-50 text-orange-700 border border-orange-200",
  "Approved": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Rejected": "bg-red-50 text-red-700 border border-red-200",
  "Payment Processing": "bg-purple-50 text-purple-700 border border-purple-200",
  "Partially Received": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Amount Received": "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold",
  "Closed": "bg-slate-100 text-slate-700 border border-slate-200",
};

const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "Passport Photo",
  "Previous Year Marksheet",
  "Income Certificate",
  "Caste / Category Certificate",
  "Residence / Domicile Certificate",
  "Bank Passbook / Cancelled Cheque",
  "College / School ID Card",
  "Bonafide Certificate",
  "Fee Receipt / Admission Letter",
  "Self Declaration Affidavit",
  "Other Document",
];

const DOCUMENT_STATUSES = [
  "Not Required",
  "Required",
  "Pending",
  "Uploaded",
  "Verified",
  "Rejected",
  "Expired",
];

const PAYMENT_STATUSES = ["Received", "Pending", "Failed", "Reversed"];

const DEFAULT_ACADEMIC_YEARS = [
  "2026-2027",
  "2025-2026",
  "2024-2025",
  "2023-2024",
  "2022-2023",
];

const DEFAULT_STUDENT_CATEGORIES = [
  "General",
  "OBC",
  "EWS",
  "SC",
  "ST",
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];

const PWD_OPTIONS = ["No", "Yes"];

const RELIGION_OPTIONS = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Buddhist",
  "Jain",
  "Parsi",
  "Other",
];

const ADMISSION_YEARS = [
  "2027",
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
];

const SEMESTER_YEAR_OPTIONS = [
  "1st Year (Sem 1)",
  "1st Year (Sem 2)",
  "2nd Year (Sem 3)",
  "2nd Year (Sem 4)",
  "3rd Year (Sem 5)",
  "3rd Year (Sem 6)",
  "4th Year (Sem 7)",
  "4th Year (Sem 8)",
  "5th Year (Sem 9)",
  "5th Year (Sem 10)",
  "Class 11",
  "Class 12",
  "Other",
];

const COURSE_LEVEL_OPTIONS = [
  "Any Level",
  "UG (Undergraduate)",
  "PG (Postgraduate)",
  "Diploma / Polytechnic / ITI",
  "School (Class 1 to 12)",
  "Doctorate / Ph.D.",
];

// Comprehensive Map of Indian States & Districts
const INDIAN_STATES_DISTRICTS = {
  "Bihar": [
    "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia", "Begusarai", 
    "Rohtas", "Samastipur", "Nalanda", "Saran (Chhapra)", "Vaishali", "Siwan", "Madhubani", 
    "Gopalganj", "Sitamarhi", "East Champaran (Motihari)", "West Champaran (Bettiah)", 
    "Saharsa", "Katihar", "Munger", "Bhojpur (Arrah)", "Buxar", "Aurangabad", "Nawada", 
    "Jamui", "Banka", "Khagaria", "Madhepura", "Supaul", "Kishanganj", "Araria", 
    "Sheikhpura", "Lakhisarai", "Jehanabad", "Arwal", "Kaimur (Bhabua)", "Sheohar"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur Nagar", "Varanasi", "Agra", "Prayagraj (Allahabad)", "Gautam Buddha Nagar (Noida)", 
    "Ghaziabad", "Meerut", "Aligarh", "Bareilly", "Moradabad", "Gorakhpur", "Jhansi", "Mathura", 
    "Ayodhya", "Muzaffarnagar", "Saharanpur", "Firozabad", "Shahjahanpur", "Rampur", "Bulandshahr", 
    "Sitapur", "Farrukhabad", "Hapur", "Mirzapur", "Bijnor", "Etawah", "Sambhal", "Amroha", 
    "Hardoi", "Fatehpur", "Raebareli", "Jalaun (Orai)", "Bahraich", "Unnao", "Jaunpur", "Lakhimpur Kheri", 
    "Hathras", "Banda", "Pilibhit", "Barabanki", "Mau", "Gonda", "Mainpuri", "Lalitpur", "Basti", 
    "Deoria", "Ghazipur", "Sultanpur", "Azamgarh", "Ballia", "Bhadohi", "Badaun", "Kasganj", "Shamli", "Amethi"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", 
    "Sikar", "Pali", "Sri Ganganagar", "Jhunjhunu", "Churu", "Hanumangarh", "Barmer", "Dausa", 
    "Chittorgarh", "Nagaur", "Tonk", "Banswara", "Dungarpur", "Jhalawar", "Sirohi", "Rajsamand", 
    "Jalore", "Bundi", "Dholpur", "Karauli", "Pratapgarh", "Jaisalmer"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", 
    "Rewa", "Murwara (Katni)", "Singrauli", "Burhanpur", "Khandwa", "Bhind", "Chhindwara", 
    "Guna", "Shivpuri", "Vidisha", "Chhatarpur", "Damoh", "Mandsaur", "Khargone", "Neemuch", 
    "Hoshangabad", "Itarsi", "Sehore", "Morena", "Betul", "Seoni", "Datia", "Dhar"
  ],
  "Delhi": [
    "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", 
    "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
  ],
  "Maharashtra": [
    "Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik", "Chhatrapati Sambhaji Nagar (Aurangabad)", 
    "Solapur", "Amravati", "Kolhapur", "Navi Mumbai", "Jalgaon", "Akola", "Latur", "Dhule", 
    "Ahmednagar", "Chandrapur", "Parbhani", "Jalna", "Beed", "Nanded", "Satara", "Wardha", 
    "Yavatmal", "Ratnagiri", "Gondia", "Dharashiv (Osmanabad)", "Sangli", "Raigad", "Palghar"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Hooghly", "Paschim Medinipur", 
    "Purba Medinipur", "Purba Bardhaman", "Paschim Bardhaman", "Nadia", "Murshidabad", "Birbhum", 
    "Malda", "Jalpaiguri", "Darjeeling", "Siliguri", "Alipurduar", "Cooch Behar", "Uttar Dinajpur", 
    "Dakshin Dinajpur", "Bankura", "Purulia", "Kalimpong", "Jhargram"
  ],
  "Jharkhand": [
    "Ranchi", "Dhanbad", "East Singhbhum (Jamshedpur)", "Bokaro", "Deoghar", "Hazaribagh", 
    "Giridih", "Ramgarh", "Palamu (Medininagar)", "West Singhbhum (Chaibasa)", "Dumka", "Godda", 
    "Sahibganj", "Pakur", "Jamtara", "Simdega", "Gumla", "Khunti", "Lohardaga", "Chatra", 
    "Koderma", "Garhwa", "Seraikela Kharsawan"
  ],
  "Karnataka": [
    "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad", "Dakshina Kannada (Mangaluru)", 
    "Belagavi", "Kalaburagi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", 
    "Raichur", "Bidar", "Gadag", "Hassan", "Udupi", "Mandya", "Chikkamagaluru", "Kolar", "Bagalkote", "Chitradurga"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", 
    "Vellore", "Erode", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Kanchipuram", 
    "Cuddalore", "Pudukkottai", "Nagapattinam", "Namakkal", "Kanyakumari", "Krishnagiri"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", 
    "Gandhinagar", "Anand", "Navsari", "Surendranagar", "Bharuch", "Mehsana", "Kutch (Bhuj)", 
    "Valsad", "Porbandar", "Palanpur", "Patan", "Dahod", "Amreli"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajamahendravaram", 
    "Tirupati", "Kakinada", "Kadapa", "Anantapur", "Vizianagaram", "Eluru", "Ongole", "Chittoor", "Srikakulam"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", 
    "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Siddipet", "Jagtial", "Mancherial", "Nirmal", "Kamareddy"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "SAS Nagar (Mohali)", 
    "Hoshiarpur", "Pathankot", "Moga", "Abohar", "Malerkotla", "Khanna", "Phagwara", "Firozpur", "Kapurthala"
  ],
  "Haryana": [
    "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", 
    "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Jind", "Rewari", "Palwal"
  ],
  "Odisha": [
    "Bhubaneswar (Khurda)", "Cuttack", "Rourkela (Sundargarh)", "Berhampur (Ganjam)", 
    "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada (Mayurbhanj)", "Jharsuguda", "Rayagada", "Angul"
  ],
  "Assam": [
    "Kamrup Metropolitan (Guwahati)", "Silchar (Cachar)", "Dibrugarh", "Jorhat", "Nagaon", 
    "Tinsukia", "Tezpur (Sonitpur)", "Bongaigaon", "Karimganj", "Sivasagar", "Barpeta"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai (Durg)", "Bilaspur", "Korba", "Rajnandgaon", "Jagdalpur (Bastar)", "Raigarh", "Ambikapur (Surguja)"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Haldwani (Nainital)", "Rudrapur (Udham Singh Nagar)", "Rishikesh", "Almora", "Pithoragarh"
  ],
  "Himachal Pradesh": [
    "Shimla", "Dharamshala (Kangra)", "Solan", "Mandi", "Kullu", "Una", "Hamirpur", "Bilaspur", "Chamba"
  ],
  "Jammu and Kashmir": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Kathua", "Pulwama", "Kupwara", "Budgam"
  ],
  "Goa": ["North Goa", "South Goa"],
  "Tripura": ["West Tripura", "North Tripura", "South Tripura", "Dhalai", "Gomati"],
  "Manipur": ["Imphal West", "Imphal East", "Thoubal", "Bishnupur", "Churachandpur"],
  "Meghalaya": ["East Khasi Hills (Shillong)", "West Garo Hills (Tura)", "Ri-Bhoi"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
  "Arunachal Pradesh": ["Itanagar Capital Complex", "Papum Pare", "East Siang", "Tawang"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
  "Sikkim": ["East Sikkim (Gangtok)", "West Sikkim (Gyalshing)", "South Sikkim (Namchi)"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  "Chandigarh": ["Chandigarh"],
  "Ladakh": ["Leh", "Kargil"],
  "Andaman and Nicobar Islands": ["South Andaman (Port Blair)", "North and Middle Andaman", "Nicobar"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Dadra and Nagar Haveli"],
  "Lakshadweep": ["Kavaratti"]
};

// Comprehensive course hierarchy covering School (Class 1-12), Diploma, UG, PG, Doctorate
const COURSE_GROUPS = [
  {
    group: "Undergraduate (UG) Degrees",
    courses: [
      "B.Tech / B.E. (Computer Science & Engg)",
      "B.Tech / B.E. (Information Technology)",
      "B.Tech / B.E. (Mechanical / Civil / Electrical)",
      "BCA (Bachelor of Computer Applications)",
      "B.Sc (General / Honours / IT)",
      "B.Com (General / Honours / Finance)",
      "B.A. (Bachelor of Arts)",
      "BBA (Bachelor of Business Admin)",
      "MBBS (Bachelor of Medicine, Bachelor of Surgery)",
      "BDS (Bachelor of Dental Surgery)",
      "BAMS / BHMS / BUMS",
      "B.Pharm (Bachelor of Pharmacy)",
      "B.Sc Nursing",
      "B.Ed (Bachelor of Education)",
      "LLB (Bachelor of Laws)",
      "B.Des (Bachelor of Design)",
    ]
  },
  {
    group: "Postgraduate (PG) Degrees",
    courses: [
      "M.Tech / M.E. (Master of Engineering)",
      "MCA (Master of Computer Applications)",
      "MBA (Master of Business Admin)",
      "M.Sc (Master of Science)",
      "M.Com (Master of Commerce)",
      "M.A. (Master of Arts)",
      "MD / MS (Doctor of Medicine / Surgery)",
      "M.Pharm (Master of Pharmacy)",
      "LLM (Master of Laws)",
      "M.Ed (Master of Education)",
    ]
  },
  {
    group: "Polytechnic, ITI & Vocational Diplomas",
    courses: [
      "Diploma in Computer Engineering",
      "Diploma in Mechanical Engineering",
      "Diploma in Electrical Engineering",
      "Diploma in Civil Engineering",
      "Diploma in Electronics & Comm.",
      "Diploma in Pharmacy (D.Pharm)",
      "ITI Fitter / Electrician / Welder",
      "General Polytechnic Diploma",
    ]
  },
  {
    group: "School Education (Class 1 to 12)",
    courses: [
      "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
      "Class 6", "Class 7", "Class 8", "Class 9", "Class 10 (Secondary)",
      "Class 11 (Arts / Humanities)", "Class 11 (Commerce)", "Class 11 (Science)",
      "Class 12 (Arts / Humanities)", "Class 12 (Commerce)", "Class 12 (Science)",
    ]
  },
  {
    group: "Doctorate & Research",
    courses: [
      "Ph.D. (Doctor of Philosophy)",
      "M.Phil.",
      "Post-Doctoral Fellowship",
    ]
  }
];

function getCourseOptionsHtml(selectedVal = "", placeholder = "Select Course (UG, PG, Diploma, School)...") {
  let html = `<option value="">${placeholder}</option>`;
  COURSE_GROUPS.forEach(g => {
    html += `<optgroup label="${g.group}">`;
    g.courses.forEach(c => {
      const isSel = String(selectedVal || "").toLowerCase() === c.toLowerCase() ? "selected" : "";
      html += `<option value="${c}" ${isSel}>${c}</option>`;
    });
    html += `</optgroup>`;
  });
  return html;
}

// Helpers for cascading State -> District dropdowns
function getStateOptionsHtml(selectedState = "", placeholder = "Select State...") {
  let html = `<option value="">${placeholder}</option>`;
  const states = Object.keys(INDIAN_STATES_DISTRICTS).sort();
  states.forEach(s => {
    const isSel = (selectedState || "").toLowerCase() === s.toLowerCase() ? "selected" : "";
    html += `<option value="${s}" ${isSel}>${s}</option>`;
  });
  return html;
}

function getDistrictOptionsHtml(stateName, selectedDistrict = "", placeholder = "Select District...") {
  let html = `<option value="">${placeholder}</option>`;
  if (!stateName) return html;
  const districts = INDIAN_STATES_DISTRICTS[stateName] || [];
  districts.forEach(d => {
    const isSel = (selectedDistrict || "").toLowerCase() === d.toLowerCase() ? "selected" : "";
    html += `<option value="${d}" ${isSel}>${d}</option>`;
  });
  return html;
}

// Helpers for Category, Gender, Religion, PwD, Admission Year, Semester, Academic Year dropdowns
function getCategoryOptionsHtml(selectedVal = "", placeholder = "Select Category...") {
  let html = placeholder ? `<option value="">${placeholder}</option>` : "";
  DEFAULT_STUDENT_CATEGORIES.forEach(c => {
    const isSel = String(selectedVal || "").toLowerCase() === c.toLowerCase() ? "selected" : "";
    html += `<option value="${c}" ${isSel}>${c}</option>`;
  });
  return html;
}

function getGenderOptionsHtml(selectedVal = "", placeholder = "Select Gender...") {
  let html = placeholder ? `<option value="">${placeholder}</option>` : "";
  GENDER_OPTIONS.forEach(g => {
    const isSel = String(selectedVal || "").toLowerCase() === g.toLowerCase() ? "selected" : "";
    html += `<option value="${g}" ${isSel}>${g}</option>`;
  });
  return html;
}

function getReligionOptionsHtml(selectedVal = "", placeholder = "Select Religion...") {
  let html = placeholder ? `<option value="">${placeholder}</option>` : "";
  RELIGION_OPTIONS.forEach(r => {
    const isSel = String(selectedVal || "").toLowerCase() === r.toLowerCase() ? "selected" : "";
    html += `<option value="${r}" ${isSel}>${r}</option>`;
  });
  return html;
}

function getPwdOptionsHtml(selectedVal = "", placeholder = "") {
  let html = placeholder ? `<option value="">${placeholder}</option>` : "";
  const norm = String(selectedVal || "").toLowerCase();
  const isYes = norm === "yes" || norm === "true" || norm === "1";
  html += `<option value="No" ${!isYes ? "selected" : ""}>No (General)</option>`;
  html += `<option value="Yes" ${isYes ? "selected" : ""}>Yes (PwD / Divyangjan)</option>`;
  return html;
}

function getAdmissionYearOptionsHtml(selectedVal = "", placeholder = "Select Admission Year...") {
  let html = placeholder ? `<option value="">${placeholder}</option>` : "";
  ADMISSION_YEARS.forEach(y => {
    const isSel = String(selectedVal || "") === String(y) ? "selected" : "";
    html += `<option value="${y}" ${isSel}>${y}</option>`;
  });
  return html;
}

function getSemesterOptionsHtml(selectedVal = "", placeholder = "Select Semester / Class...") {
  let html = placeholder ? `<option value="">${placeholder}</option>` : "";
  SEMESTER_YEAR_OPTIONS.forEach(s => {
    const isSel = String(selectedVal || "").toLowerCase() === s.toLowerCase() ? "selected" : "";
    html += `<option value="${s}" ${isSel}>${s}</option>`;
  });
  return html;
}

function getAcademicYearOptionsHtml(selectedVal = "", placeholder = "Select Academic Year...") {
  let html = placeholder ? `<option value="">${placeholder}</option>` : "";
  DEFAULT_ACADEMIC_YEARS.forEach(y => {
    const isSel = String(selectedVal || "").toLowerCase() === y.toLowerCase() ? "selected" : "";
    html += `<option value="${y}" ${isSel}>${y}</option>`;
  });
  return html;
}

function getCourseLevelOptionsHtml(selectedVal = "", placeholder = "Select Degree Level...") {
  let html = placeholder ? `<option value="">${placeholder}</option>` : "";
  COURSE_LEVEL_OPTIONS.forEach(l => {
    const isSel = String(selectedVal || "").toLowerCase() === l.toLowerCase() ? "selected" : "";
    html += `<option value="${l}" ${isSel}>${l}</option>`;
  });
  return html;
}

// Global Clipboard copy helper with visual feedback
async function copyToClipboard(text, label = "Value") {
  if (!text) {
    if (typeof toast === "function") toast("Nothing to copy", "info");
    return;
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(String(text).trim());
    } else {
      const ta = document.createElement("textarea");
      ta.value = String(text).trim();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    if (typeof toast === "function") {
      toast(`Copied ${label} to clipboard!`, "success");
    }
  } catch (err) {
    console.warn("Clipboard copy error:", err);
    if (typeof toast === "function") toast(`Copied: ${text}`, "success");
  }
}

// Render a sleek copy button inline
function renderCopyButton(value, label, className = "") {
  if (!value) return "";
  const safeVal = escapeHtml(String(value).replace(/'/g, "\\'"));
  const safeLbl = escapeHtml(String(label || "Value").replace(/'/g, "\\'"));
  return `
    <button type="button" onclick="copyToClipboard('${safeVal}', '${safeLbl}'); event.stopPropagation();" 
      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-ink-100 hover:bg-gold-200 text-ink-700 hover:text-ink-950 text-[10px] font-mono font-medium transition cursor-pointer shrink-0 border border-ink-200/80 shadow-2xs ${className}" 
      title="Copy ${safeLbl}">
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
      </svg>
      <span>Copy</span>
    </button>`;
}

// Ensure global accessibility on window object
if (typeof window !== "undefined") {
  window.APPLICATION_STATUSES = APPLICATION_STATUSES;
  window.STATUS_PROGRESS = STATUS_PROGRESS;
  window.STATUS_COLORS = STATUS_COLORS;
  window.DEFAULT_STUDENT_CATEGORIES = DEFAULT_STUDENT_CATEGORIES;
  window.GENDER_OPTIONS = GENDER_OPTIONS;
  window.PWD_OPTIONS = PWD_OPTIONS;
  window.RELIGION_OPTIONS = RELIGION_OPTIONS;
  window.ADMISSION_YEARS = ADMISSION_YEARS;
  window.SEMESTER_YEAR_OPTIONS = SEMESTER_YEAR_OPTIONS;
  window.COURSE_LEVEL_OPTIONS = COURSE_LEVEL_OPTIONS;
  window.DEFAULT_ACADEMIC_YEARS = DEFAULT_ACADEMIC_YEARS;
  window.INDIAN_STATES_DISTRICTS = INDIAN_STATES_DISTRICTS;
  window.COURSE_GROUPS = COURSE_GROUPS;
  window.getCourseOptionsHtml = getCourseOptionsHtml;
  window.getStateOptionsHtml = getStateOptionsHtml;
  window.getDistrictOptionsHtml = getDistrictOptionsHtml;
  window.getCategoryOptionsHtml = getCategoryOptionsHtml;
  window.getGenderOptionsHtml = getGenderOptionsHtml;
  window.getReligionOptionsHtml = getReligionOptionsHtml;
  window.getPwdOptionsHtml = getPwdOptionsHtml;
  window.getAdmissionYearOptionsHtml = getAdmissionYearOptionsHtml;
  window.getSemesterOptionsHtml = getSemesterOptionsHtml;
  window.getAcademicYearOptionsHtml = getAcademicYearOptionsHtml;
  window.getCourseLevelOptionsHtml = getCourseLevelOptionsHtml;
  window.copyToClipboard = copyToClipboard;
  window.renderCopyButton = renderCopyButton;
}
