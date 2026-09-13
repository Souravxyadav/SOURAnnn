// ScholarLedger Admin - Enhanced Student Profile Manager
const studentId = getParam("id");
let currentStudent = null;
let currentApps = [];
let studentInquiries = [];

const STUDENT_DOCS = [
  { id: "aadhaar", name: "Aadhaar Card", required: true, defaultStatus: "Verified" },
  { id: "marksheet_10", name: "10th Standard Marksheet", required: true, defaultStatus: "Verified" },
  { id: "marksheet_12", name: "12th / Diploma Marksheet", required: true, defaultStatus: "Verified" },
  { id: "bonafide", name: "College Bonafide / Current Marksheet", required: true, defaultStatus: "Verified" },
  { id: "income_cert", name: "Annual Income Certificate (Tehsildar)", required: true, defaultStatus: "Verified" },
  { id: "caste_cert", name: "Caste / Category Certificate", required: false, defaultStatus: "Pending" },
  { id: "bank_passbook", name: "Bank Passbook / Cancelled Cheque (DBT)", required: true, defaultStatus: "Verified" }
];

(async function init() {
  await requireAuth();
  renderLayout("students", "Student Profile");

  if (!studentId) {
    toast("No student ID specified.", "error");
    window.location.href = "students.html";
    return;
  }

  const quickElig = document.getElementById("btn-quick-eligibility");
  if (quickElig) {
    quickElig.addEventListener("click", (e) => {
      e.preventDefault();
      switchProfileTab("eligibility");
    });
  }

  const newAppBtn = document.getElementById("new-application-btn");
  if (newAppBtn) {
    newAppBtn.addEventListener("click", () => {
      window.location.href = `application.html?student_id=${studentId}`;
    });
  }

  await loadStudentProfile();

  const urlTab = getParam("tab");
  if (urlTab) switchProfileTab(urlTab);
})();

async function loadStudentProfile() {
  const sb = window.supabaseClient;
  const { data: student, error } = await sb.from("students").select("*").eq("id", studentId).single();

  if (error || !student) {
    toast("Student record not found.", "error");
    window.location.href = "students.html";
    return;
  }

  currentStudent = student;
  window.__student = student;

  // Set top breadcrumb
  const bcName = document.getElementById("breadcrumb-student-name");
  if (bcName) bcName.textContent = student.name;

  // Setup delete button
  const delBtn = document.getElementById("btn-delete-profile");
  if (delBtn) {
    delBtn.onclick = () => deleteFromProfile(student.id, student.name);
  }

  // Fetch applications for this student with scholarship schemes and payments
  const { data: apps } = await sb
    .from("scholarship_applications")
    .select("*, scholarships(name, provider, category), application_payments(amount, status, payment_date)")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false });

  currentApps = apps || [];

  renderHeaderCard(student);
  renderKPIs(currentApps, student);
  renderApplicationsList(currentApps);
  await loadAndRenderScholarshipEligibility(student);
  renderAcademicAndPersonal(student);
  renderBankDetails(student);
  renderDocumentVault(student);
  await loadStudentInquiries(student);
}

// Automatic Scholarship Eligibility Table Loader
async function loadAndRenderScholarshipEligibility(student) {
  const tableBody = document.getElementById("eligibility-table-body");
  if (!tableBody) return;

  try {
    const sb = window.supabaseClient;
    const { data: scholarships, error } = await sb
      .from("scholarships")
      .select("*")
      .order("name");

    if (error || !scholarships || scholarships.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-ink-400">No scholarship schemes currently configured in database.</td></tr>`;
      return;
    }

    // Run EligibilityEngine
    const results = typeof EligibilityEngine !== "undefined" && EligibilityEngine.evaluateAll
      ? EligibilityEngine.evaluateAll(student, scholarships)
      : scholarships.map(sch => ({
          scholarship: sch,
          status: "ELIGIBLE",
          reasons: [],
          checks: []
        }));

    let eligibleCount = 0;
    let reviewCount = 0;
    let ineligibleCount = 0;

    results.forEach(r => {
      if (r.status === "Eligible") eligibleCount++;
      else if (r.status === "Missing Information" || r.status === "Partially Matched") reviewCount++;
      else ineligibleCount++;
    });

    const elElig = document.getElementById("metric-eligible-count");
    if (elElig) elElig.textContent = eligibleCount;
    const elRev = document.getElementById("metric-review-count");
    if (elRev) elRev.textContent = reviewCount;
    const elInelig = document.getElementById("metric-ineligible-count");
    if (elInelig) elInelig.textContent = ineligibleCount;
    const elBadge = document.getElementById("tab-badge-eligibility");
    if (elBadge) elBadge.textContent = eligibleCount;
    const elTotal = document.getElementById("total-evaluated-label");
    if (elTotal) elTotal.textContent = `${scholarships.length} schemes evaluated`;

    // Map existing student applications
    const enrolledMap = new Map();
    (currentApps || []).forEach(a => {
      if (a.scholarship_id) enrolledMap.set(a.scholarship_id, a);
    });

    tableBody.innerHTML = results.map(({ scholarship: s, status, failureReasons, matchReasons, reviewReasons, reasons, checks }) => {
      const isEnrolled = enrolledMap.has(s.id);
      const app = enrolledMap.get(s.id);

      const badgeHtml = typeof EligibilityEngine !== "undefined" && EligibilityEngine.renderBadge
        ? EligibilityEngine.renderBadge(status)
        : `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-ink-100 text-ink-700">${status}</span>`;

      // Extract details safely
      const positiveNotes = Array.isArray(matchReasons) && matchReasons.length > 0
        ? matchReasons
        : (Array.isArray(checks) ? checks.filter(c => c && c.passed).map(c => c.name) : []);

      const issueNotes = Array.isArray(failureReasons) && failureReasons.length > 0
        ? failureReasons
        : (Array.isArray(reasons) ? reasons : []);

      const pendingNotes = Array.isArray(reviewReasons) && reviewReasons.length > 0
        ? reviewReasons
        : (Array.isArray(reasons) ? reasons : []);

      let breakdownHtml = "";
      if (status === "Eligible") {
        breakdownHtml = `
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
              <span>✓</span>
              <span>All mandatory scheme criteria satisfied</span>
            </div>
            <div class="text-[11px] text-ink-500 flex flex-wrap gap-x-3 gap-y-0.5">
              ${positiveNotes.slice(0, 4).map(n => `<span>• ${escapeHtml(n)}</span>`).join("")}
            </div>
          </div>`;
      } else if (status === "Missing Information" || status === "Partially Matched") {
        breakdownHtml = `
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 text-amber-800 font-semibold text-xs">
              <span>⚠</span>
              <span>Manual verification required</span>
            </div>
            <div class="text-[11px] text-amber-700">
              ${pendingNotes.map(r => `<div>• ${escapeHtml(r)}</div>`).join("")}
            </div>
          </div>`;
      } else {
        breakdownHtml = `
          <div class="space-y-1">
            <div class="text-red-700 font-semibold flex items-center gap-1.5 text-xs">
              <span>✕</span>
              <span>Does not meet scheme criteria</span>
            </div>
            <div class="text-[11px] text-red-600">
              ${issueNotes.map(r => `<div>• ${escapeHtml(r)}</div>`).join("")}
            </div>
          </div>`;
      }

      let actionHtml = "";
      if (isEnrolled) {
        actionHtml = `
          <div class="text-right">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] border border-emerald-200">
              <span>✓</span> Enrolled
            </span>
            ${app.application_no ? `
              <div class="text-[10px] text-ink-500 font-mono mt-0.5 flex items-center justify-end gap-1">
                <span>#${escapeHtml(app.application_no)}</span>
                ${typeof renderCopyButton === "function" ? renderCopyButton(app.application_no, "Application ID") : ""}
              </div>` : ""}
          </div>`;
      } else if (status === "Eligible") {
        actionHtml = `
          <div class="text-right">
            <a href="application.html?student_id=${student.id}&scholarship_id=${s.id}" class="btn-compact btn-primary">
              <span>Apply Now</span>
              <span>→</span>
            </a>
          </div>`;
      } else if (status === "Missing Information" || status === "Partially Matched") {
        actionHtml = `
          <div class="text-right">
            <a href="application.html?student_id=${student.id}&scholarship_id=${s.id}" class="btn-compact btn-secondary text-amber-900 border-amber-300 bg-amber-50 hover:bg-amber-100">
              <span>Review & Enroll</span>
            </a>
          </div>`;
      } else {
        actionHtml = `
          <div class="text-right text-[11px] text-ink-400 italic">
            Ineligible
          </div>`;
      }

      return `
        <tr class="hover:bg-ink-50/50 transition">
          <td class="py-3 px-4 align-top">
            <div class="font-bold text-ink-900 text-xs">${escapeHtml(s.name)}</div>
            <div class="text-[11px] text-ink-500 mt-0.5">
              ${escapeHtml(s.provider || "Government Ministry / Trust")}
              ${s.category ? ` • <span class="text-gold-700 font-semibold">${escapeHtml(s.category)}</span>` : ""}
            </div>
            ${s.eligible_state && s.eligible_state !== "ALL" ? `<span class="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-medium">📍 Domicile: ${escapeHtml(s.eligible_state)}</span>` : ""}
          </td>
          <td class="py-3 px-4 align-top whitespace-nowrap">
            <span class="font-display font-bold text-xs text-ink-900">${formatCurrency(s.amount)}</span>
            <div class="text-[10px] text-ink-400">${escapeHtml(s.disbursement_type || "Per Year")}</div>
          </td>
          <td class="py-3 px-4 align-top whitespace-nowrap">
            ${badgeHtml}
          </td>
          <td class="py-3 px-4 align-top">
            ${breakdownHtml}
          </td>
          <td class="py-3 px-4 align-top">
            ${actionHtml}
          </td>
        </tr>`;
    }).join("");

  } catch (err) {
    console.error("Error evaluating student eligibility:", err);
    tableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-red-500">Error loading eligibility data: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// Master Header Card (Clean, clear, compact executive profile summary)
function renderHeaderCard(s) {
  const container = document.getElementById("profile-header-card");
  if (!container) return;

  const initials = (s.name || "ST").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const cleanPhone = (s.mobile || "").replace(/\D/g, "");
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${s.name}, regarding your scholarship record on ScholarLedger:`)}` : null;
  const studentCode = s.student_code || s.code || `STU-${(s.id || "").slice(0, 6)}`;
  const stStatus = s.status || "Active";
  const statusClass = stStatus.toLowerCase() === "active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : (stStatus.toLowerCase() === "pending" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-ink-100 text-ink-600 border-ink-200");

  container.innerHTML = `
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
      <!-- Left: Compact Avatar & Core Student Identity -->
      <div class="flex items-start sm:items-center gap-3 min-w-0">
        <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-ink-800 to-ink-950 text-gold-400 font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-xs border border-ink-700/60">
          ${escapeHtml(initials)}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h1 class="font-display text-base sm:text-lg font-bold text-ink-900 leading-snug">
              ${escapeHtml(s.name)}
            </h1>
            <span class="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-semibold text-ink-600 bg-ink-50 px-1.5 py-0.2 rounded border border-ink-200">
              ${escapeHtml(studentCode)}
              ${typeof renderCopyButton === "function" ? renderCopyButton(studentCode, "Student ID") : ""}
            </span>
            <span class="px-2 py-0.2 rounded-full text-[10px] font-bold border ${statusClass}">
              ● ${escapeHtml(stStatus)}
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-gold-50 text-gold-800 border border-gold-200">
              ${escapeHtml(s.category || "General")}
            </span>
            ${s.state ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-ink-50 text-ink-600 border border-ink-100">📍 ${escapeHtml(s.state)}</span>` : ""}
          </div>
          
          <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-600 mt-1">
            <span class="font-medium text-ink-800 truncate max-w-[200px]">📚 ${escapeHtml(s.course || "General Course")} ${s.current_semester || s.semester ? `(${escapeHtml(s.current_semester || s.semester)})` : ""}</span>
            <span class="text-ink-300">•</span>
            <span class="text-ink-500 truncate max-w-[220px]" title="${escapeHtml(s.college || '')}">🏛️ ${escapeHtml(s.college || "College not registered")}</span>
            ${s.percentage ? `<span class="text-ink-300">•</span><span class="text-ink-700 font-semibold font-mono">Marks: ${s.percentage}%</span>` : ""}
            ${s.annual_income ? `<span class="text-ink-300">•</span><span class="text-ink-700 font-semibold font-mono">Income: ₹${Number(s.annual_income).toLocaleString("en-IN")}/yr</span>` : ""}
          </div>
        </div>
      </div>

      <!-- Right: Compact Direct Communication Buttons -->
      <div class="flex flex-wrap items-center gap-1.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-ink-100">
        ${cleanPhone ? `
          <div class="inline-flex items-center gap-1 bg-ink-50 border border-ink-200 rounded-lg px-2 py-1 text-xs">
            <a href="tel:${cleanPhone}" class="text-ink-800 font-semibold hover:text-gold-700 transition flex items-center gap-1">
              <span>📞</span>
              <span class="font-mono">${escapeHtml(s.mobile)}</span>
            </a>
            ${typeof renderCopyButton === "function" ? renderCopyButton(cleanPhone, "Mobile Number") : ""}
          </div>
          <a href="${waLink}" target="_blank" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition flex items-center gap-1 shadow-2xs">
            <span>💬</span>
            <span>WhatsApp</span>
          </a>` : ""}
        ${s.email ? `
          <div class="inline-flex items-center gap-1 bg-ink-50 border border-ink-200 rounded-lg px-2 py-1 text-xs">
            <a href="mailto:${escapeHtml(s.email)}" class="text-ink-800 font-semibold hover:text-gold-700 transition flex items-center gap-1" title="${escapeHtml(s.email)}">
              <span>✉️</span>
              <span class="max-w-[130px] truncate">${escapeHtml(s.email)}</span>
            </a>
            ${typeof renderCopyButton === "function" ? renderCopyButton(s.email, "Email Address") : ""}
          </div>` : ""}
      </div>
    </div>
  `;
}

// Financial & Performance KPIs - Clean, compact metric cards
function renderKPIs(apps, s) {
  const container = document.getElementById("profile-financial-cards");
  if (!container) return;

  const totalSanctioned = apps.reduce((sum, a) => sum + Number(a.expected_amount || 0), 0);
  
  // Total received payments across all applications
  let totalReceived = 0;
  apps.forEach(a => {
    (a.application_payments || []).forEach(p => {
      if (p.status === "Received") {
        totalReceived += Number(p.amount || 0);
      }
    });
  });

  const pendingDisbursal = Math.max(totalSanctioned - totalReceived, 0);

  // Total Advisory Fees
  const totalFees = apps.reduce((sum, a) => {
    const fee = Number(a.advisory_fee_amount || 0);
    return sum + fee;
  }, 0);

  const approvedApps = apps.filter(a => ["Approved", "Amount Received", "Closed"].includes(a.status)).length;
  const successPct = apps.length > 0 ? Math.round((approvedApps / apps.length) * 100) : 0;

  container.innerHTML = `
    <!-- Card 1: Total Sanctioned Value -->
    <div class="bg-white rounded-xl border border-ink-100 p-3.5 shadow-card flex items-center justify-between gap-2 hover:border-gold-300 transition">
      <div class="min-w-0">
        <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">Sanctioned Grants</span>
        <p class="font-display text-base sm:text-lg font-bold text-ink-900 mt-0.5 leading-tight font-mono truncate">${formatCurrency(totalSanctioned)}</p>
        <p class="text-[10px] text-ink-500 mt-0.5 truncate">${apps.length} scheme${apps.length === 1 ? "" : "s"} tracked</p>
      </div>
      <div class="w-8 h-8 rounded-lg bg-ink-50 text-ink-700 flex items-center justify-center text-xs shrink-0">🎓</div>
    </div>

    <!-- Card 2: Disbursed to Student -->
    <div class="bg-white rounded-xl border border-emerald-200/80 p-3.5 shadow-card flex items-center justify-between gap-2 hover:border-emerald-300 transition">
      <div class="min-w-0">
        <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Disbursed</span>
        <p class="font-display text-base sm:text-lg font-bold text-emerald-700 mt-0.5 leading-tight font-mono truncate">${formatCurrency(totalReceived)}</p>
        <p class="text-[10px] text-emerald-700/80 mt-0.5 font-mono truncate">${formatCurrency(pendingDisbursal)} pending</p>
      </div>
      <div class="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center text-xs shrink-0">💳</div>
    </div>

    <!-- Card 3: Advisory Fees -->
    <div class="bg-white rounded-xl border border-gold-200/80 p-3.5 shadow-card flex items-center justify-between gap-2 hover:border-gold-300 transition">
      <div class="min-w-0">
        <span class="text-[10px] font-bold uppercase tracking-wider text-gold-900 block">Advisory Fee</span>
        <p class="font-display text-base sm:text-lg font-bold text-gold-900 mt-0.5 leading-tight font-mono truncate">${formatCurrency(totalFees)}</p>
        <p class="text-[10px] text-gold-800/80 mt-0.5 truncate">Retainer fee earned</p>
      </div>
      <div class="w-8 h-8 rounded-lg bg-gold-100/70 text-gold-900 flex items-center justify-center text-xs shrink-0">🪙</div>
    </div>

    <!-- Card 4: Success Rate -->
    <div class="bg-white rounded-xl border border-ink-100 p-3.5 shadow-card flex items-center justify-between gap-2 hover:border-emerald-300 transition">
      <div class="min-w-0">
        <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">Approval Rate</span>
        <p class="font-display text-base sm:text-lg font-bold text-ink-900 mt-0.5 leading-tight font-mono">${successPct}%</p>
        <p class="text-[10px] text-ink-500 mt-0.5 truncate">${approvedApps} of ${apps.length} approved</p>
      </div>
      <div class="w-8 h-8 rounded-lg bg-ink-50 text-ink-700 flex items-center justify-center text-xs shrink-0">📈</div>
    </div>
  `;

  // Update applications count badge
  const appBadge = document.getElementById("tab-badge-apps");
  if (appBadge) appBadge.textContent = apps.length;
}

// Tab Switching
function switchProfileTab(tabName) {
  document.querySelectorAll(".profile-tab-btn").forEach(btn => {
    btn.classList.remove("bg-ink-900", "text-white");
    btn.classList.add("bg-transparent", "text-ink-600");
  });
  const activeBtn = document.getElementById(`tab-btn-${tabName}`);
  if (activeBtn) {
    activeBtn.classList.remove("bg-transparent", "text-ink-600");
    activeBtn.classList.add("bg-ink-900", "text-white");
  }

  document.querySelectorAll(".profile-tab-panel").forEach(panel => {
    panel.classList.add("hidden");
  });
  const activePanel = document.getElementById(`tab-content-${tabName}`);
  if (activePanel) {
    activePanel.classList.remove("hidden");
  }
}

// Render Applications List Cards
function renderApplicationsList(apps) {
  const container = document.getElementById("applications-container");
  if (!container) return;

  if (apps.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 bg-white rounded-xl border border-dashed border-ink-200 p-6 space-y-2.5">
        <div class="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center text-lg mx-auto">🎓</div>
        <h3 class="font-display font-bold text-sm text-ink-900">No Scholarship Applications Yet</h3>
        <p class="text-xs text-ink-500 max-w-sm mx-auto">This student does not have any scholarship applications recorded. Start tracking state, central, or corporate scholarships now.</p>
        <button onclick="window.location.href='application.html?student_id=${studentId}'" class="btn-compact btn-primary inline-flex items-center gap-1.5 mt-1">
          <span>+</span>
          <span>Create First Application</span>
        </button>
      </div>`;
    return;
  }

  container.innerHTML = apps.map(app => {
    const received = (app.application_payments || [])
      .filter(p => p.status === "Received")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const expected = Number(app.expected_amount || 0);
    const feeRate = currentStudent.commission_percentage !== undefined ? currentStudent.commission_percentage : (app.advisory_fee_rate || app.commission_rate || 10);
    const feeAmount = Number(app.advisory_fee_amount || (expected * feeRate / 100));

    // Determine status badge class
    const statusClass = STATUS_COLORS[app.status] || "bg-ink-100 text-ink-700";

    // Progress percentage
    const progressPct = expected > 0 ? Math.min(100, Math.round((received / expected) * 100)) : 0;

    return `
      <div class="card-interactive p-4 sm:p-5 space-y-3.5">
        <!-- Card Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-ink-100">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 class="font-display font-bold text-sm sm:text-base text-ink-900 truncate">
                ${escapeHtml(app.scholarships?.name || "Scholarship Scheme")}
              </h3>
              <span class="px-2 py-0.2 rounded-full text-[10px] font-bold ${statusClass}">
                ${escapeHtml(app.status)}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500 mt-1">
              <span>Provider: <strong class="text-ink-700">${escapeHtml(app.scholarships?.provider || "Government / Trust")}</strong></span>
              <span class="text-ink-300">•</span>
              <span>AY: <strong class="text-ink-700">${escapeHtml(app.academic_year || "2024-2025")}</strong></span>
              ${app.application_no ? `<span class="text-ink-300">•</span><span>App ID: <strong class="font-mono text-ink-800">${escapeHtml(app.application_no)}</strong> ${typeof renderCopyButton === "function" ? renderCopyButton(app.application_no, "Application ID") : ""}</span>` : ""}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <a href="application.html?id=${app.id}" class="btn-compact btn-primary">
              <span>Manage Application</span>
              <span>→</span>
            </a>
          </div>
        </div>

        <!-- Financial Breakdown Row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-ink-50/70 p-3 rounded-lg border border-ink-100 text-xs">
          <div>
            <span class="text-[10px] font-bold uppercase text-ink-400 block">Sanctioned</span>
            <span class="font-display font-bold text-xs sm:text-sm text-ink-900 block mt-0.5 font-mono">${formatCurrency(expected)}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase text-emerald-700 block">Disbursed</span>
            <span class="font-display font-bold text-xs sm:text-sm text-emerald-600 block mt-0.5 font-mono">${formatCurrency(received)}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase text-amber-700 block">Advisory Fee (${feeRate}%)</span>
            <span class="font-display font-bold text-xs sm:text-sm text-amber-900 block mt-0.5 font-mono">${formatCurrency(feeAmount)}</span>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase text-ink-400 block">Disbursal Progress</span>
            <div class="flex items-center gap-2 mt-1">
              <div class="flex-1 bg-ink-200 rounded-full h-1.5 overflow-hidden">
                <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${progressPct}%"></div>
              </div>
              <span class="font-bold text-[11px] text-ink-800 font-mono">${progressPct}%</span>
            </div>
          </div>
        </div>

        <!-- 5-Stage Stepper -->
        <div class="pt-0.5">
          <div class="flex items-center justify-between text-[11px] text-ink-500 mb-1 font-medium">
            <span>Lifecycle Stepper</span>
            <span>Current: <strong class="text-ink-900">${escapeHtml(app.status)}</strong></span>
          </div>
          <div class="grid grid-cols-5 gap-1 text-center text-[10px] font-bold">
            ${renderLifecycleSteps(app.status)}
          </div>
        </div>
      </div>`;
  }).join("");
}

function renderLifecycleSteps(status) {
  const steps = ["Draft / New", "Submitted", "Verified", "Sanctioned", "Disbursed"];
  const statusMap = {
    "Draft": 0,
    "Submitted": 1,
    "Under Verification": 2,
    "Documents Pending": 1,
    "Documents Uploaded": 2,
    "Approved": 3,
    "Amount Received": 4,
    "Closed": 4,
    "Rejected": -1
  };

  const currentIdx = statusMap[status] ?? 1;

  return steps.map((label, idx) => {
    let bg = "bg-ink-100 text-ink-400";
    if (status === "Rejected") {
      bg = "bg-red-50 text-red-600 border border-red-200";
    } else if (idx <= currentIdx) {
      bg = "bg-emerald-500 text-white shadow-xs";
    }
    return `
      <div class="py-1.5 px-1 rounded-lg ${bg} truncate">
        ${label}
      </div>`;
  }).join("");
}

// Render Academic, Personal & Address Information
function renderAcademicAndPersonal(s) {
  const studentCode = s.student_code || s.code || "";
  const aadhaarNo = s.aadhaar_number || s.aadhaar || "";

  // 1. Academic fields
  const academicItems = [
    { label: "Student ID / Code", val: studentCode || "—", copyVal: studentCode, copyLabel: "Student ID" },
    { label: "Academic Course", val: s.course || "—" },
    { label: "College / University", val: s.college || s.university || "—" },
    { label: "Admission Year", val: s.admission_year || "2026" },
    { label: "Current Year / Semester", val: s.current_semester || s.semester || "—" },
    { label: "Previous Score (%)", val: s.percentage ? `${s.percentage}%` : "—" },
    { label: "Registration Status", val: s.status || "Active" }
  ];

  document.getElementById("grid-academic").innerHTML = academicItems.map(item => `
    <div class="flex items-center justify-between gap-2 border-b border-ink-100/60 pb-2 last:border-0">
      <span class="text-ink-400 shrink-0">${item.label}:</span>
      <div class="flex items-center gap-1.5 min-w-0 justify-end">
        <span class="font-semibold text-ink-900 text-right truncate max-w-[200px]">${escapeHtml(item.val)}</span>
        ${item.copyVal && typeof renderCopyButton === "function" ? renderCopyButton(item.copyVal, item.copyLabel) : ""}
      </div>
    </div>`).join("");

  // 2. Personal fields
  const personalItems = [
    { label: "Full Legal Name", val: s.name || "—" },
    { label: "Father's Name", val: s.father_name || "—" },
    { label: "Mother's Name", val: s.mother_name || "—" },
    { label: "Date of Birth", val: s.dob ? formatDate(s.dob) : "—" },
    { label: "Gender", val: s.gender || "—" },
    { label: "Aadhaar / ID Number", val: aadhaarNo ? (aadhaarNo.length > 4 ? `XXXX-XXXX-${aadhaarNo.slice(-4)}` : aadhaarNo) : "Verified in records", copyVal: aadhaarNo, copyLabel: "Aadhaar Number" },
    { label: "Social Category", val: s.category || "General" },
    { label: "Religion", val: s.religion || "—" },
    { label: "PwD Status", val: s.pwd_status || (s.is_pwd ? "Yes" : "No") },
    { label: "Family Annual Income", val: s.annual_income ? `₹${Number(s.annual_income).toLocaleString("en-IN")}` : "—" }, { label: "Commission (%)", val: s.commission_percentage !== undefined ? s.commission_percentage + "%" : "10%" }
  ];

  document.getElementById("grid-personal").innerHTML = personalItems.map(item => `
    <div class="flex items-center justify-between gap-2 border-b border-ink-100/60 pb-2 last:border-0">
      <span class="text-ink-400 shrink-0">${item.label}:</span>
      <div class="flex items-center gap-1.5 min-w-0 justify-end">
        <span class="font-semibold text-ink-900 text-right truncate max-w-[200px]">${escapeHtml(item.val)}</span>
        ${item.copyVal && typeof renderCopyButton === "function" ? renderCopyButton(item.copyVal, item.copyLabel) : ""}
      </div>
    </div>`).join("");

  // 3. Address and Contact fields
  const addressItems = [
    { label: "Mobile Number", val: s.mobile || "—", copyVal: s.mobile, copyLabel: "Mobile Number" },
    { label: "Email Address", val: s.email || "—", copyVal: s.email, copyLabel: "Email Address" },
    { label: "Domicile State", val: s.state || "Bihar" },
    { label: "District", val: s.district || "—" },
    { label: "Full Address", val: s.address || "—", copyVal: s.address, copyLabel: "Address" }
  ];

  document.getElementById("grid-address").innerHTML = addressItems.map(item => `
    <div class="flex items-start justify-between gap-2 border-b border-ink-100/60 pb-2 last:border-0">
      <span class="text-ink-400 shrink-0 pt-0.5">${item.label}:</span>
      <div class="flex items-start gap-1.5 min-w-0 justify-end text-right">
        <span class="font-semibold text-ink-900 leading-snug break-words max-w-[220px]">${escapeHtml(item.val)}</span>
        ${item.copyVal && typeof renderCopyButton === "function" ? renderCopyButton(item.copyVal, item.copyLabel) : ""}
      </div>
    </div>`).join("");

  // Notes
  const notesEl = document.getElementById("student-notes-content");
  if (notesEl) {
    notesEl.textContent = s.notes || "No coordinator notes or physical file remarks recorded for this student.";
  }
}

// Render Bank Details
function renderBankDetails(s) {
  const container = document.getElementById("grid-bank-details");
  if (!container) return;

  const bankName = s.bank_name || "State Bank of India (Designated DBT)";
  const accNo = s.account_number || "";
  const ifsc = s.ifsc_code || "SBIN0001234";

  container.innerHTML = `
    <div class="bg-ink-50/80 p-4 rounded-2xl border border-ink-100">
      <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">Bank Name</span>
      <p class="font-display font-bold text-sm text-ink-900 mt-1">${escapeHtml(bankName)}</p>
      <span class="text-[11px] text-ink-500">Core Banking Solutions (CBS)</span>
    </div>

    <div class="bg-ink-50/80 p-4 rounded-2xl border border-ink-100">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400">Account Number</span>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick="toggleAccMask()" id="btn-mask-acc" class="text-[10px] text-gold-700 font-bold hover:underline">Show</button>
          ${typeof renderCopyButton === "function" ? renderCopyButton(accNo, "Account Number") : ""}
        </div>
      </div>
      <p id="acc-no-display" class="font-mono font-bold text-sm text-ink-900 mt-1">•••• •••• ${accNo.slice(-4)}</p>
      <span class="text-[11px] text-ink-500">Savings Bank Account</span>
    </div>

    <div class="bg-ink-50/80 p-4 rounded-2xl border border-ink-100">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">IFSC Code</span>
        ${typeof renderCopyButton === "function" ? renderCopyButton(ifsc, "IFSC Code") : ""}
      </div>
      <p class="font-mono font-bold text-sm text-ink-900 mt-1">${escapeHtml(ifsc)}</p>
      <span class="text-[11px] text-ink-500">RTGS / NEFT / IMPS Enabled</span>
    </div>

    <div class="bg-ink-50/80 p-4 rounded-2xl border border-ink-100">
      <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">DBT APBS Status</span>
      <p class="font-bold text-sm text-emerald-600 mt-1 flex items-center gap-1.5">
        <span>✓</span>
        <span>Aadhaar Seeded</span>
      </p>
      <span class="text-[11px] text-ink-500">Direct Benefit Transfer Ready</span>
    </div>`;

  window.__rawAccNo = accNo;
}

let isAccMasked = true;
function toggleAccMask() {
  const display = document.getElementById("acc-no-display");
  const btn = document.getElementById("btn-mask-acc");
  if (!display || !window.__rawAccNo) return;

  if (isAccMasked) {
    display.textContent = window.__rawAccNo;
    btn.textContent = "Mask";
    isAccMasked = false;
  } else {
    display.textContent = `•••• •••• ${window.__rawAccNo.slice(-4)}`;
    btn.textContent = "Show";
    isAccMasked = true;
  }
}

// Render Document Vault
function renderDocumentVault(s) {
  const container = document.getElementById("documents-checklist");
  if (!container) return;

  const isReserved = (s.category || "").toUpperCase() !== "GENERAL";

  container.innerHTML = STUDENT_DOCS.map(doc => {
    // If caste cert and student is General, mark not applicable
    if (doc.id === "caste_cert" && !isReserved) {
      return `
        <div class="p-3.5 bg-ink-50/50 rounded-2xl border border-ink-100 flex items-center justify-between opacity-60">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-ink-100 text-ink-500 flex items-center justify-center text-xs">📄</span>
            <span class="text-xs font-semibold text-ink-700">${doc.name}</span>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ink-100 text-ink-500">Not Applicable (General)</span>
        </div>`;
    }

    return `
      <div class="p-3.5 bg-white rounded-2xl border border-ink-100 flex items-center justify-between hover:border-gold-300 transition shadow-xs">
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
          <div>
            <span class="text-xs font-bold text-ink-900 block">${doc.name}</span>
            <span class="text-[10px] text-ink-400 font-mono">Digital verification verified</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Verified
          </span>
        </div>
      </div>`;
  }).join("");
}

// Load Student Support Inquiries
async function loadStudentInquiries(student) {
  const container = document.getElementById("student-inquiries-list");
  const badge = document.getElementById("tab-badge-inquiries");
  if (!container) return;

  try {
    const sb = window.supabaseClient;
    let messages = null;
    let query = sb.from("support_messages").select("*");

    if (typeof query.or === "function") {
      const orFilter = student.mobile
        ? `student_id.eq.${student.id},student_mobile.eq.${student.mobile}`
        : `student_id.eq.${student.id}`;
      const res = await query.or(orFilter).order("created_at", { ascending: false });
      messages = res.data;
    } else {
      // Fallback if .or is not supported
      const res = await query.order("created_at", { ascending: false });
      messages = (res.data || []).filter(
        m => m.student_id === student.id || (student.mobile && m.student_mobile === student.mobile)
      );
    }

    studentInquiries = messages || [];
    const pendingCount = studentInquiries.filter(m => (m.status || "Pending").toLowerCase() === "pending").length;

    if (badge) {
      badge.textContent = `${studentInquiries.length}`;
      badge.classList.remove("hidden");
      if (pendingCount > 0) {
        badge.className = "px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-ink-950 font-bold animate-pulse";
      } else {
        badge.className = "px-1.5 py-0.2 rounded-full text-[10px] bg-ink-100 text-ink-700 font-bold";
      }
    }

    if (studentInquiries.length === 0) {
      container.innerHTML = `
        <div class="p-6 bg-white rounded-3xl border border-ink-100 text-center space-y-2">
          <div class="w-10 h-10 rounded-xl bg-ink-50 text-ink-400 flex items-center justify-center text-lg mx-auto">💬</div>
          <p class="text-xs font-bold text-ink-800">No Support Requests from this Student</p>
          <p class="text-xs text-ink-400">When the student submits a question from the student portal, it will appear here for you to answer.</p>
        </div>`;
      return;
    }

    container.innerHTML = studentInquiries.map(item => {
      const isPending = (item.status || "Pending").toLowerCase() === "pending";
      return `
        <div class="card-interactive p-4 sm:p-5 space-y-3 ${isPending ? "ring-1 ring-amber-300 border-amber-200 bg-amber-50/10" : ""}">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span class="font-bold text-xs sm:text-sm text-ink-900">${escapeHtml(item.subject || "Student Inquiry")}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-ink-100 text-ink-600 font-semibold">${escapeHtml(item.category || "General")}</span>
              </div>
              ${item.related_scholarship ? `<p class="text-xs text-ink-500 mt-0.5 font-medium">🎓 Scheme: <strong class="text-ink-800">${escapeHtml(item.related_scholarship)}</strong></p>` : ""}
            </div>
            ${isPending
              ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Pending</span>`
              : `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">✓ Responded</span>`}
          </div>

          <div class="bg-ink-50/70 p-3 rounded-lg border border-ink-100 text-xs text-ink-800 whitespace-pre-line leading-relaxed">
            ${escapeHtml(item.message || "—")}
          </div>

          ${item.response ? `
            <div class="text-xs text-emerald-950 bg-emerald-50/80 p-3 rounded-lg border border-emerald-200 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[10px] uppercase tracking-wide text-emerald-700">Official Coordinator Reply:</span>
                <span class="text-[10px] text-emerald-600 font-mono">${formatDateTime(item.responded_at || item.updated_at)}</span>
              </div>
              <p class="whitespace-pre-line font-medium">${escapeHtml(item.response)}</p>
            </div>` : ""}

          <div class="flex items-center justify-between pt-1">
            <span class="text-[10px] text-ink-400">Submitted ${formatDateTime(item.created_at)}</span>
            <button onclick="openStudentReplyModal('${item.id}')" class="btn-compact btn-primary">
              ${item.response ? "Edit Reply" : "Reply to Student"}
            </button>
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    console.error("Student inquiries error:", err);
    container.innerHTML = `<p class="text-xs text-ink-400">Failed to load inquiries.</p>`;
  }
}

// Reply Modal Actions
function openStudentReplyModal(id) {
  const item = studentInquiries.find(m => m.id === id);
  if (!item) return;

  document.getElementById("st-reply-id").value = item.id;
  document.getElementById("st-reply-subject").textContent = item.subject || "Student Inquiry";
  document.getElementById("st-reply-category").textContent = item.category || "General";
  document.getElementById("st-reply-message").textContent = item.message || "—";
  document.getElementById("st-reply-text").value = item.response || "";
  document.getElementById("st-reply-status").value = item.status === "Resolved" ? "Resolved" : "Responded";

  const modal = document.getElementById("student-reply-modal");
  if (modal) {
    modal.classList.remove("hidden");
    setTimeout(() => document.getElementById("st-reply-text").focus(), 50);
  }
}

function closeStudentReplyModal() {
  const modal = document.getElementById("student-reply-modal");
  if (modal) modal.classList.add("hidden");
}

function insertStudentTemplate(type) {
  const area = document.getElementById("st-reply-text");
  if (!area) return;

  const templates = {
    verification: "Dear Student, your application and submitted documents are currently under verification by the nodal officer. You will be notified once physical verification is concluded.",
    dbt_batch: "Dear Student, your sanctioned scholarship installment has been scheduled in the upcoming direct bank transfer (DBT) batch. Please ensure your bank account remains active.",
    doc_fix: "Dear Student, there is a deficiency in your uploaded document. Please re-upload a clear, non-blurry scanned copy of your certificate or contact your center coordinator.",
    sanctioned: "Dear Student, congratulations! Your scholarship application has been officially approved. Sanction order details will be uploaded to your student portal shortly."
  };

  area.value = templates[type] || "";
  area.focus();
}

async function handleStSubmitReply(e) {
  e.preventDefault();
  const id = document.getElementById("st-reply-id").value;
  const replyText = document.getElementById("st-reply-text").value.trim();
  const status = document.getElementById("st-reply-status").value || "Responded";

  if (!id || !replyText) return;

  const btn = document.getElementById("st-reply-submit-btn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    const sb = window.supabaseClient;
    const now = new Date().toISOString();
    const { error } = await sb.from("support_messages").update({
      response: replyText,
      responded_at: now,
      status: status
    }).eq("id", id);

    if (error) throw error;

    toast("✓ Reply sent to student successfully!", "success");
    closeStudentReplyModal();
    if (window.__student) {
      await loadStudentInquiries(window.__student);
    }
  } catch (err) {
    console.error("Reply error:", err);
    toast("Failed to send reply: " + (err.message || ""), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Reply";
  }
}

function editFromProfile() {
  window.location.href = `students.html?edit=${studentId}`;
}

async function deleteFromProfile(id, name) {
  const ok = await confirmDelete("Delete Student?", `This will remove ${name}'s student profile and all associated scholarship records.`);
  if (!ok) return;

  const { error } = await window.supabaseClient.from("students").delete().eq("id", id);
  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  toast("Student record removed.");
  window.location.href = "students.html";
}
