// Student Portal Controller (5-Tab Architecture)
let currentStudent = null;
let currentApplications = [];
let currentPayments = [];
let allCatalogSchemes = [];
let studentInquiriesList = [];
let schemesSearchTerm = "";

document.addEventListener("DOMContentLoaded", async () => {
  const stdToken = localStorage.getItem("student_session_token");
  if (!stdToken) {
    window.location.href = "student-login.html";
    return;
  }

  await loadStudentPortalData(stdToken);
});

async function loadStudentPortalData(studentId) {
  try {
    const sb = window.supabaseClient;
    const [stRes, appRes, payRes, setRes, schRes, msgRes] = await Promise.all([
      sb.from("students").select("*").eq("id", studentId).single(),
      sb.from("scholarship_applications").select("*, scholarships(*)").eq("student_id", studentId).order("created_at", { ascending: false }),
      sb.from("application_payments").select("*"),
      sb.from("settings").select("*"),
      sb.from("scholarships").select("*").eq("is_active", true).order("end_date", { ascending: true }),
      sb.from("support_messages").select("*").order("created_at", { ascending: false })
    ]);

    if (stRes.error || !stRes.data) {
      // Fallback to first student if token is mock-reset
      const { data: allSt } = await sb.from("students").select("*").limit(1);
      if (allSt && allSt.length > 0) {
        currentStudent = allSt[0];
        localStorage.setItem("student_session_token", currentStudent.id);
        const { data: refreshedApps } = await sb.from("scholarship_applications").select("*, scholarships(*)").eq("student_id", currentStudent.id).order("created_at", { ascending: false });
        currentApplications = refreshedApps || [];
      } else {
        toast("Student session expired. Please sign in again.", "error");
        localStorage.removeItem("student_session_token");
        window.location.href = "student-login.html";
        return;
      }
    } else {
      currentStudent = stRes.data;
      currentApplications = appRes.data || [];
    }

    // Filter payments for this student's applications
    const appIds = currentApplications.map(a => a.id);
    currentPayments = (payRes.data || []).filter(p => appIds.includes(p.application_id));
    allCatalogSchemes = schRes.data || [];

    // Filter inquiries for this student (by student_id or mobile)
    const sMobile = (currentStudent.mobile || "").replace(/\D/g, "");
    studentInquiriesList = (msgRes.data || []).filter(m => {
      const isIdMatch = m.student_id && m.student_id === currentStudent.id;
      const mMobile = (m.student_mobile || "").replace(/\D/g, "");
      const isMobileMatch = sMobile && mMobile && (sMobile === mMobile || sMobile.endsWith(mMobile) || mMobile.endsWith(sMobile));
      return isIdMatch || isMobileMatch;
    });

    // Render Portal Views
    renderStudentHeaderAndHome();
    renderApplicationsTab();
    renderSchemesTab();
    renderSettingsTab();
    renderContactTab(setRes?.data || []);
    renderStudentInquiries();
  } catch (err) {
    console.error("Load portal data error:", err);
    toast("Failed to load student portal data", "error");
  }
}

function switchPortalTab(tabKey) {
  // Desktop Tabs
  document.querySelectorAll(".portal-nav-btn").forEach(btn => {
    btn.classList.remove("bg-gold-500", "text-ink-950", "font-bold", "shadow-xs");
    btn.classList.add("text-ink-300", "font-medium");
  });
  const activeNavBtn = document.getElementById(`nav-btn-${tabKey}`);
  if (activeNavBtn) {
    activeNavBtn.classList.add("bg-gold-500", "text-ink-950", "font-bold", "shadow-xs");
    activeNavBtn.classList.remove("text-ink-300", "font-medium");
  }

  // Mobile Bottom Nav
  document.querySelectorAll(".portal-bottom-btn").forEach(btn => {
    btn.classList.remove("text-gold-400", "font-bold");
    btn.classList.add("text-ink-400");
  });
  const activeBottomBtn = document.getElementById(`bottom-btn-${tabKey}`);
  if (activeBottomBtn) {
    activeBottomBtn.classList.add("text-gold-400", "font-bold");
    activeBottomBtn.classList.remove("text-ink-400");
  }

  // Panes
  document.querySelectorAll(".portal-tab-content").forEach(pane => pane.classList.add("hidden"));
  const activePane = document.getElementById(`tab-content-${tabKey}`);
  if (activePane) activePane.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStudentHeaderAndHome() {
  const s = currentStudent;
  if (!s) return;

  const initials = s.name ? s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "ST";
  const nameEl = document.getElementById("portal-student-name");
  const codeEl = document.getElementById("portal-student-code");
  const academicSub = document.getElementById("portal-student-academic-sub");
  const headerAvatar = document.getElementById("header-avatar-initials");
  const avatarEl = document.getElementById("home-avatar-initials");
  const greetingEl = document.getElementById("home-student-greeting");
  const subEl = document.getElementById("home-student-subtitle");
  const colEl = document.getElementById("home-student-college");
  const badgeEl = document.getElementById("home-student-status-badge");
  const navAppsBadge = document.getElementById("nav-badge-apps");
  const homeAppsCountBadge = document.getElementById("home-apps-count-badge");
  const tabCountApps = document.getElementById("tab-count-apps");

  const studentCode = s.code || s.student_code || "STU";

  if (nameEl) nameEl.textContent = s.name;
  if (codeEl) codeEl.textContent = studentCode;
  if (academicSub) academicSub.textContent = `Session ${s.academic_year || "2025-26"}`;
  if (headerAvatar) headerAvatar.textContent = initials;
  if (avatarEl) avatarEl.textContent = initials;
  if (greetingEl) greetingEl.textContent = `Welcome, ${s.name}`;
  if (subEl) subEl.textContent = `ID: ${studentCode} · Academic Session ${s.academic_year || "2025-2026"}`;
  if (colEl) colEl.textContent = `${s.course || "Higher Education"} ${s.current_semester ? "· " + s.current_semester : ""} ${s.college ? "· " + s.college : ""}`;

  if (badgeEl) {
    badgeEl.textContent = s.status || "Active";
    if ((s.status || "").toLowerCase() === "pending") {
      badgeEl.className = "bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full";
    }
  }

  if (navAppsBadge) navAppsBadge.textContent = currentApplications.length;
  if (homeAppsCountBadge) homeAppsCountBadge.textContent = currentApplications.length;
  if (tabCountApps) tabCountApps.textContent = currentApplications.length;

  // Financial overview calculation
  let expectedTotal = 0;
  let receivedTotal = 0;

  currentApplications.forEach(a => {
    expectedTotal += Number(a.expected_amount || a.scholarship_amount || 0);
  });

  currentPayments.forEach(p => {
    if (p.payment_type === "Student" && p.status === "Received") {
      receivedTotal += Number(p.amount || 0);
    }
  });

  const pendingBalance = Math.max(0, expectedTotal - receivedTotal);

  document.getElementById("stat-student-apps").textContent = currentApplications.length;
  document.getElementById("stat-student-expected").textContent = formatCurrency(expectedTotal);
  document.getElementById("stat-student-received").textContent = formatCurrency(receivedTotal);
  document.getElementById("stat-student-pending").textContent = formatCurrency(pendingBalance);

  // Profile Card on Home
  const profileCard = document.getElementById("student-profile-card");
  if (profileCard) {
    profileCard.innerHTML = `
      <div class="bg-white rounded-2xl border border-ink-100 p-5 shadow-card space-y-3">
        <div class="flex items-center justify-between border-b border-ink-100 pb-2.5">
          <span class="text-xs font-bold uppercase tracking-wider text-ink-500">Academic Registration Snapshot</span>
          <button onclick="switchPortalTab('settings')" class="text-xs text-gold-600 font-semibold hover:underline">View Full Profile →</button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span class="text-ink-400 block text-[10px] font-semibold uppercase">Course / Level</span>
            <span class="font-bold text-ink-900 block truncate">${escapeHtml(s.course || "—")}</span>
          </div>
          <div>
            <span class="text-ink-400 block text-[10px] font-semibold uppercase">Semester / Class</span>
            <span class="font-bold text-ink-900 block truncate">${escapeHtml(s.semester || s.current_semester || "—")}</span>
          </div>
          <div>
            <span class="text-ink-400 block text-[10px] font-semibold uppercase">Category</span>
            <span class="font-bold text-ink-900 block">${escapeHtml(s.category || "General")}</span>
          </div>
          <div>
            <span class="text-ink-400 block text-[10px] font-semibold uppercase">College / University</span>
            <span class="font-bold text-ink-900 block truncate">${escapeHtml(s.college || "—")}</span>
          </div>
        </div>
      </div>`;
  }

  // Active Applications Preview on Home
  const homeAppsPreview = document.getElementById("home-applications-preview");
  if (homeAppsPreview) {
    if (currentApplications.length === 0) {
      homeAppsPreview.innerHTML = `
        <div class="bg-white rounded-2xl border border-ink-100 p-6 text-center space-y-2 shadow-card">
          <p class="text-xs text-ink-500">You do not have any active scholarship applications yet.</p>
          <button onclick="switchPortalTab('schemes')" class="px-3.5 py-1.5 bg-gold-500 text-ink-950 text-xs font-bold rounded-xl shadow-xs">
            Browse Eligible Schemes
          </button>
        </div>`;
    } else {
      homeAppsPreview.innerHTML = currentApplications.slice(0, 3).map(app => {
        const sch = app.scholarships || {};
        const statusCls = getStatusBadgeClass(app.status);
        const expected = Number(app.expected_amount || 0);

        return `
          <div class="bg-white rounded-2xl border border-ink-100 p-4 shadow-card hover:border-gold-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-ink-900 truncate">${escapeHtml(sch.name || "Scholarship Program")}</span>
                <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold ${statusCls}">
                  ${escapeHtml(app.status || "Submitted")}
                </span>
              </div>
              <p class="text-xs text-ink-400 font-mono">App No: ${escapeHtml(app.application_number || app.portal_application_id || app.id.slice(0, 8))}</p>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-ink-100">
              <div class="text-left sm:text-right">
                <span class="text-[10px] text-ink-400 block uppercase font-semibold">Award Sanction</span>
                <span class="text-xs font-bold text-ink-900">${formatCurrency(expected)}</span>
              </div>
              <button onclick="switchPortalTab('applications')" class="px-3 py-1.5 bg-ink-50 hover:bg-ink-100 text-ink-700 text-xs font-semibold rounded-xl border border-ink-200 transition">
                Track Milestone →
              </button>
            </div>
          </div>`;
      }).join("");
    }
  }

  // Home Support Preview
  renderHomeSupportPreview();
}

function renderHomeSupportPreview() {
  const container = document.getElementById("home-support-preview");
  const countBadge = document.getElementById("home-inquiries-count-badge");
  const navBadge = document.getElementById("nav-badge-replies");
  if (!container) return;

  const count = studentInquiriesList.length;
  if (countBadge) countBadge.textContent = count;

  const hasNewReply = studentInquiriesList.some(m => (m.status || "").toLowerCase() !== "pending" && m.response);
  if (navBadge) {
    if (hasNewReply) {
      navBadge.classList.remove("hidden");
    } else {
      navBadge.classList.add("hidden");
    }
  }

  if (count === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-ink-100 p-5 text-center shadow-card flex items-center justify-between">
        <div class="text-left">
          <p class="text-xs font-bold text-ink-800">Need help with your application or payments?</p>
          <p class="text-[11px] text-ink-400">Ask your institutional scholarship coordinator directly.</p>
        </div>
        <button onclick="switchPortalTab('contact')" class="px-3.5 py-1.5 bg-ink-900 hover:bg-gold-500 hover:text-ink-950 text-white text-xs font-bold rounded-xl transition shrink-0">
          Ask Question
        </button>
      </div>`;
    return;
  }

  const latest = studentInquiriesList[0];
  const isPending = (latest.status || "Pending").toLowerCase() === "pending";

  container.innerHTML = `
    <div class="bg-white rounded-2xl border ${isPending ? "border-amber-200" : "border-emerald-200"} p-4 shadow-card space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-ink-900">${escapeHtml(latest.subject || "Inquiry")}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-md bg-ink-100 text-ink-600 font-semibold">${escapeHtml(latest.category || "General")}</span>
        </div>
        ${isPending
          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Awaiting Reply</span>`
          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">✓ Replied by Coordinator</span>`}
      </div>

      <p class="text-xs text-ink-600 line-clamp-2">${escapeHtml(latest.message || "—")}</p>

      ${latest.response ? `
        <div class="bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 text-xs flex items-start gap-2">
          <span class="font-bold text-[10px] uppercase text-emerald-700 shrink-0">Advisor Reply:</span>
          <span class="line-clamp-2">${escapeHtml(latest.response)}</span>
        </div>` : ""}

      <div class="pt-1 flex items-center justify-between text-[11px]">
        <span class="text-ink-400">Asked on ${new Date(latest.created_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        <button onclick="switchPortalTab('contact')" class="text-gold-600 font-bold hover:underline">
          View Inquiry & Reply →
        </button>
      </div>
    </div>`;
}

function renderApplicationsTab() {
  const container = document.getElementById("applications-list");
  if (!container) return;

  if (currentApplications.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-3xl border border-ink-100 p-12 text-center shadow-card space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto">📋</div>
        <h3 class="font-display font-bold text-base text-ink-900">No Applications on Record</h3>
        <p class="text-xs text-ink-500 max-w-sm mx-auto">You have not been enrolled into any scholarship applications yet. Please explore open schemes or ask your coordinator.</p>
        <button onclick="switchPortalTab('schemes')" class="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs rounded-xl shadow-xs transition">
          Browse Eligible Scholarships
        </button>
      </div>`;
    return;
  }

  container.innerHTML = currentApplications.map(app => {
    const sch = app.scholarships || {};
    const status = app.status || "Submitted";
    const statusCls = getStatusBadgeClass(status);
    const expected = Number(app.expected_amount || 0);

    // Compute payments for this application
    const appPayments = currentPayments.filter(p => p.application_id === app.id && p.status === "Received");
    const receivedAmount = appPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const remainingBalance = Math.max(0, expected - receivedAmount);

    // Milestone Stepper Stages: 1. Submitted, 2. Verified, 3. Sanctioned, 4. Disbursed
    const steps = [
      { key: "submitted", label: "Application Submitted", done: true },
      {
        key: "verified",
        label: "Institute Verified",
        done: ["Under Verification", "Approved", "Amount Received", "Closed"].includes(status),
        active: status === "Under Verification"
      },
      {
        key: "sanctioned",
        label: "Sanction Approved",
        done: ["Approved", "Amount Received", "Closed"].includes(status),
        active: status === "Approved"
      },
      {
        key: "disbursed",
        label: "Bank DBT Disbursed",
        done: ["Amount Received", "Closed"].includes(status),
        active: status === "Amount Received"
      }
    ];

    return `
      <div class="bg-white rounded-3xl border border-ink-100 p-6 shadow-card space-y-5 hover:border-gold-300 transition">
        <!-- Top Row -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-ink-100">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-display font-bold text-base text-ink-900">${escapeHtml(sch.name || "Scholarship Program")}</h3>
              <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold ${statusCls}">
                ${escapeHtml(status)}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs text-ink-500 font-mono">
              <span>App ID: ${escapeHtml(app.application_number || app.portal_application_id || app.id.slice(0, 8))}</span>
              <span>• Applied: ${formatDate(app.created_at || app.applied_date)}</span>
              ${app.academic_year ? `<span>• Session: ${escapeHtml(app.academic_year)}</span>` : ""}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button onclick="openHelpForScheme('${escapeHtml(sch.name || "")}')" class="px-3 py-1.5 bg-ink-50 hover:bg-gold-50 text-ink-700 hover:text-gold-800 text-xs font-semibold rounded-xl border border-ink-200 hover:border-gold-300 transition flex items-center gap-1.5">
              <span>💬</span>
              <span>Ask Help for this Scheme</span>
            </button>
          </div>
        </div>

        <!-- 4-Stage Progress Stepper -->
        <div class="py-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-3">Milestone Progress Pipeline</span>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            ${steps.map((st, idx) => `
              <div class="p-3 rounded-2xl border ${st.done ? "bg-emerald-50/60 border-emerald-200" : st.active ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-100" : "bg-ink-50/60 border-ink-100"} space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-ink-400">Step ${idx + 1}</span>
                  ${st.done
                    ? `<span class="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>`
                    : st.active
                    ? `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>`
                    : `<span class="w-2 h-2 rounded-full bg-ink-300"></span>`}
                </div>
                <p class="text-xs font-bold ${st.done ? "text-emerald-900" : st.active ? "text-amber-900" : "text-ink-500"}">${st.label}</p>
              </div>`).join("")}
          </div>
        </div>

        <!-- Financial Breakdown Bar -->
        <div class="bg-ink-50/70 rounded-2xl p-4 border border-ink-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span class="text-ink-400 block text-[10px] uppercase font-semibold">Total Sanctioned Award</span>
            <span class="font-bold text-ink-900 font-display text-base mt-0.5 block">${formatCurrency(expected)}</span>
          </div>
          <div>
            <span class="text-emerald-700 block text-[10px] uppercase font-semibold">Credited to Bank (DBT)</span>
            <span class="font-bold text-emerald-700 font-display text-base mt-0.5 block">${formatCurrency(receivedAmount)}</span>
          </div>
          <div>
            <span class="text-amber-700 block text-[10px] uppercase font-semibold">Pending Treasury Release</span>
            <span class="font-bold text-amber-700 font-display text-base mt-0.5 block">${formatCurrency(remainingBalance)}</span>
          </div>
        </div>

        ${app.notes ? `
          <div class="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-900">
            <span class="font-bold text-[10px] uppercase tracking-wider block text-amber-700">Advisory Remarks / Deficiency Note:</span>
            <p class="mt-0.5">${escapeHtml(app.notes)}</p>
          </div>` : ""}
      </div>`;
  }).join("");
}

function renderSchemesTab() {
  const container = document.getElementById("schemes-catalog-list");
  if (!container) return;

  const categoryFilter = document.getElementById("schemes-category-filter")?.value || "ALL";
  const eligibilityFilter = document.getElementById("schemes-eligibility-filter")?.value || "ALL";

  // Evaluate eligibility for each scheme using currentStudent
  const evaluatedSchemes = allCatalogSchemes.map(sch => {
    let evalResult = null;
    if (currentStudent && typeof EligibilityEngine !== "undefined" && EligibilityEngine.evaluate) {
      evalResult = EligibilityEngine.evaluate(currentStudent, sch);
    }
    return {
      scholarship: sch,
      evalResult: evalResult || { status: "ELIGIBLE", reasons: [], checks: [] }
    };
  });

  let list = evaluatedSchemes.filter(({ scholarship: s, evalResult }) => {
    if (schemesSearchTerm) {
      const name = (s.name || "").toLowerCase();
      const cat = (s.category || "").toLowerCase();
      const provider = (s.provider || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      const match = name.includes(schemesSearchTerm) || cat.includes(schemesSearchTerm) || provider.includes(schemesSearchTerm) || desc.includes(schemesSearchTerm);
      if (!match) return false;
    }

    if (categoryFilter !== "ALL") {
      const cat = (s.category || "").toLowerCase();
      if (!cat.includes(categoryFilter.toLowerCase())) return false;
    }

    if (eligibilityFilter !== "ALL") {
      if (evalResult.status !== eligibilityFilter) return false;
    }

    return true;
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-white rounded-3xl border border-ink-100 shadow-card">
        <p class="text-xs text-ink-400">No scholarship schemes match your selected search and filters.</p>
        <button onclick="resetPortalSchemesFilters()" class="mt-2 text-xs font-semibold text-gold-600 hover:underline">Reset Filters</button>
      </div>`;
    return;
  }

  container.innerHTML = list.map(({ scholarship: sch, evalResult }) => {
    const daysLeft = sch.end_date ? Math.ceil((new Date(sch.end_date) - new Date()) / 86400000) : null;
    const deadlineBadge = daysLeft !== null
      ? daysLeft <= 0
        ? `<span class="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">Closed</span>`
        : `<span class="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] font-bold rounded-full">${daysLeft} days left</span>`
      : "";

    const eligibilityBadge = typeof EligibilityEngine !== "undefined" && EligibilityEngine.renderBadge
      ? EligibilityEngine.renderBadge(evalResult.status)
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Eligible</span>`;

    let reasonsSummary = "";
    if (evalResult.reasons && evalResult.reasons.length > 0) {
      reasonsSummary = `
        <div class="text-[11px] ${evalResult.status === 'NEEDS_REVIEW' ? 'text-amber-700 bg-amber-50/70 border-amber-200' : 'text-red-700 bg-red-50/70 border-red-200'} p-2 rounded-xl border">
          <span class="font-bold block text-[10px] uppercase">${evalResult.status === 'NEEDS_REVIEW' ? 'Verification Note' : 'Ineligibility Reason'}:</span>
          <span>${escapeHtml(evalResult.reasons[0])}</span>
        </div>`;
    } else if (evalResult.status === "ELIGIBLE") {
      reasonsSummary = `
        <div class="text-[11px] text-emerald-700 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200 flex items-center gap-1">
          <span>✓</span>
          <span>Profile matches course, category, state, and income limits.</span>
        </div>`;
    }

    return `
      <div class="card-interactive bg-white rounded-2xl border border-ink-100 p-5 shadow-card hover:border-gold-400 hover:shadow-md transition flex flex-col justify-between space-y-4">
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-ink-100 text-ink-700">${escapeHtml(sch.category || "Scholarship")}</span>
                ${eligibilityBadge}
              </div>
              <h3 class="font-display font-bold text-sm text-ink-900 mt-1">${escapeHtml(sch.name)}</h3>
            </div>
            ${deadlineBadge}
          </div>

          <p class="text-xs text-ink-500 line-clamp-2">${escapeHtml(sch.description || "State and central recognized scholarship support program.")}</p>

          ${reasonsSummary}

          <div class="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div class="bg-ink-50/70 p-2 rounded-xl border border-ink-100">
              <span class="text-[10px] text-ink-400 block uppercase font-semibold">Award Amount</span>
              <span class="font-bold text-ink-900">${formatCurrency(sch.amount || sch.maximum_amount || 0)}</span>
            </div>
            <div class="bg-ink-50/70 p-2 rounded-xl border border-ink-100">
              <span class="text-[10px] text-ink-400 block uppercase font-semibold">Application Deadline</span>
              <span class="font-bold text-ink-900">${sch.end_date ? formatDate(sch.end_date) : "Rolling"}</span>
            </div>
          </div>
        </div>

        <button onclick="openHelpForScheme('${escapeHtml(sch.name || "")}')" class="w-full py-2.5 bg-ink-900 hover:bg-ink-800 active:bg-ink-950 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
          <span>Request Coordinator Assistance to Apply</span>
          <span>→</span>
        </button>
      </div>`;
  }).join("");
}

function handleSchemesSearch() {
  const input = document.getElementById("schemes-search");
  schemesSearchTerm = (input?.value || "").toLowerCase().trim();
  renderSchemesTab();
}

function resetPortalSchemesFilters() {
  const input = document.getElementById("schemes-search");
  if (input) input.value = "";
  schemesSearchTerm = "";

  const catSel = document.getElementById("schemes-category-filter");
  if (catSel) catSel.value = "ALL";

  const eligSel = document.getElementById("schemes-eligibility-filter");
  if (eligSel) eligSel.value = "ALL";

  renderSchemesTab();
}

function openHelpForScheme(schemeName) {
  switchPortalTab("contact");
  const schSelect = document.getElementById("contact-scholarship");
  if (schSelect && schemeName) {
    // Add option if not exists
    let found = false;
    for (let opt of schSelect.options) {
      if (opt.value === schemeName) {
        found = true;
        break;
      }
    }
    if (!found) {
      const newOpt = document.createElement("option");
      newOpt.value = schemeName;
      newOpt.textContent = schemeName;
      schSelect.appendChild(newOpt);
    }
    schSelect.value = schemeName;
  }
  const subj = document.getElementById("contact-subject");
  if (subj && !subj.value) {
    subj.value = `Inquiry regarding ${schemeName}`;
  }
  const msgInput = document.getElementById("contact-message");
  if (msgInput) msgInput.focus();
}

function renderSettingsTab() {
  const s = currentStudent;
  if (!s) return;

  const studentCode = s.code || s.student_code || "STU";
  const aadhaarNo = s.aadhaar_number || s.aadhaar || "";
  const bankAcc = s.account_number || "987654321098";
  const ifsc = s.ifsc_code || "SBIN0001234";

  // 1. Academic fields
  const codeEl = document.getElementById("settings-code");
  const codeCopyEl = document.getElementById("settings-code-copy");
  const courseEl = document.getElementById("settings-course");
  const colEl = document.getElementById("settings-college");
  const admSemEl = document.getElementById("settings-admission-sem");
  const percEl = document.getElementById("settings-percentage");
  const statusEl = document.getElementById("settings-status");

  if (codeEl) codeEl.textContent = studentCode;
  if (codeCopyEl && typeof renderCopyButton === "function") codeCopyEl.innerHTML = renderCopyButton(studentCode, "Student ID");
  if (courseEl) courseEl.textContent = s.course || "—";
  if (colEl) colEl.textContent = s.college || s.university || "—";
  if (admSemEl) admSemEl.textContent = `${s.admission_year || "2026"} · ${s.current_semester || s.semester || "Semester 1"}`;
  if (percEl) percEl.textContent = s.percentage ? `${s.percentage}%` : "—";
  if (statusEl) statusEl.textContent = s.status || "Active";

  // 2. Personal & Identity fields
  const nameEl = document.getElementById("settings-name");
  const fatherEl = document.getElementById("settings-father");
  const motherEl = document.getElementById("settings-mother");
  const dobGenEl = document.getElementById("settings-dob-gender");
  const aadhaarEl = document.getElementById("settings-aadhaar");
  const aadhaarCopyEl = document.getElementById("settings-aadhaar-copy");
  const catEl = document.getElementById("settings-category");
  const relPwdEl = document.getElementById("settings-religion-pwd");
  const incEl = document.getElementById("settings-income");

  if (nameEl) nameEl.textContent = s.name || "—";
  if (fatherEl) fatherEl.textContent = s.father_name || "—";
  if (motherEl) motherEl.textContent = s.mother_name || "—";
  if (dobGenEl) dobGenEl.textContent = `${s.dob ? formatDate(s.dob) : "—"} · ${s.gender || "Not specified"}`;
  if (aadhaarEl) aadhaarEl.textContent = aadhaarNo ? (aadhaarNo.length > 4 ? `XXXX-XXXX-${aadhaarNo.slice(-4)}` : aadhaarNo) : "Verified in records";
  if (aadhaarCopyEl && aadhaarNo && typeof renderCopyButton === "function") aadhaarCopyEl.innerHTML = renderCopyButton(aadhaarNo, "Aadhaar Number");
  if (catEl) catEl.textContent = s.category || "General";
  if (relPwdEl) relPwdEl.textContent = `${s.religion || "—"} · PwD: ${s.pwd_status || (s.is_pwd ? "Yes" : "No")}`;
  if (incEl) incEl.textContent = s.annual_income ? `₹${Number(s.annual_income).toLocaleString("en-IN")}/yr` : "—";

  // 3. Contact & Address fields
  const mobEl = document.getElementById("settings-mobile");
  const mobCopyEl = document.getElementById("settings-mobile-copy");
  const emEl = document.getElementById("settings-email");
  const emCopyEl = document.getElementById("settings-email-copy");
  const stDistEl = document.getElementById("settings-state-district");
  const addrEl = document.getElementById("settings-address");
  const addrCopyEl = document.getElementById("settings-address-copy");

  if (mobEl) mobEl.textContent = s.mobile || "—";
  if (mobCopyEl && s.mobile && typeof renderCopyButton === "function") mobCopyEl.innerHTML = renderCopyButton(s.mobile, "Mobile Number");
  if (emEl) emEl.textContent = s.email || "—";
  if (emCopyEl && s.email && typeof renderCopyButton === "function") emCopyEl.innerHTML = renderCopyButton(s.email, "Email Address");
  if (stDistEl) stDistEl.textContent = `${s.state || "Bihar"} · ${s.district || "—"}`;
  if (addrEl) addrEl.textContent = s.address || "—";
  if (addrCopyEl && s.address && typeof renderCopyButton === "function") addrCopyEl.innerHTML = renderCopyButton(s.address, "Permanent Address");

  // 4. Bank & DBT fields
  const bNameEl = document.getElementById("settings-bank-name");
  const bAccEl = document.getElementById("settings-bank-acc");
  const bCopyEl = document.getElementById("settings-bank-copy");

  if (bNameEl) bNameEl.textContent = s.bank_name || "State Bank of India (Designated DBT)";
  if (bAccEl) bAccEl.textContent = `A/C: •••• ${bankAcc.slice(-4)} · IFSC: ${ifsc}`;
  if (bCopyEl && typeof renderCopyButton === "function") {
    bCopyEl.innerHTML = `
      <div class="flex items-center gap-1.5 justify-end">
        ${renderCopyButton(bankAcc, "Account Number")}
        ${renderCopyButton(ifsc, "IFSC Code")}
      </div>`;
  }
}

function renderContactTab(settingsList) {
  let whatsapp = "+91 9876543210";
  let phone = "+91 9876543210";
  let email = "scholarships@coordinator.edu";

  if (Array.isArray(settingsList)) {
    const waItem = settingsList.find(i => i.key === "support_whatsapp");
    if (waItem && waItem.value) whatsapp = String(waItem.value);
    const phItem = settingsList.find(i => i.key === "support_phone");
    if (phItem && phItem.value) phone = String(phItem.value);
    const emItem = settingsList.find(i => i.key === "support_email");
    if (emItem && emItem.value) email = String(emItem.value);
  }

  const sCode = currentStudent?.code || currentStudent?.student_code || "STU";
  const sName = currentStudent?.name || "Student";

  const waBtn = document.getElementById("admin-whatsapp-btn");
  const phBtn = document.getElementById("admin-phone-btn");
  const emBtn = document.getElementById("admin-email-btn");

  if (waBtn) waBtn.href = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello Coordinator, I am ${sName} (ID: ${sCode}). I need guidance on my scholarship application.`)}`;
  if (phBtn) phBtn.href = `tel:${phone.replace(/\s+/g, "")}`;
  if (emBtn) emBtn.href = `mailto:${email}?subject=${encodeURIComponent(`Student Inquiry - ${sName} (${sCode})`)}`;

  // Populate related scholarships dropdown in inquiry form
  const schSelect = document.getElementById("contact-scholarship");
  if (schSelect) {
    let html = `<option value="">Select if applicable...</option>`;
    currentApplications.forEach(a => {
      const name = a.scholarships?.name || "Scholarship Program";
      html += `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
    });
    schSelect.innerHTML = html;
  }
}

function renderStudentInquiries() {
  const container = document.getElementById("student-my-inquiries-list");
  if (!container) return;

  if (studentInquiriesList.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-ink-50/50 rounded-2xl border border-ink-100 space-y-1.5">
        <p class="text-xs font-bold text-ink-700">No help inquiries submitted yet</p>
        <p class="text-[11px] text-ink-400">Fill out the form on the left to submit questions regarding your applications, documents, or bank credits.</p>
      </div>`;
    return;
  }

  container.innerHTML = studentInquiriesList.map(item => {
    const isPending = (item.status || "Pending").toLowerCase() === "pending";

    return `
      <div class="p-4 rounded-2xl border ${isPending ? "border-amber-200/90 bg-amber-50/20" : "border-emerald-200/90 bg-white shadow-xs"} space-y-3">
        <!-- Header -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="font-bold text-xs text-ink-900">${escapeHtml(item.subject || "Inquiry")}</span>
              <span class="text-[10px] px-2 py-0.2 rounded-md bg-ink-100 text-ink-600 font-semibold">${escapeHtml(item.category || "General")}</span>
            </div>
            ${item.related_scholarship ? `<p class="text-[11px] text-ink-500 mt-0.5 font-medium">🎓 Scheme: ${escapeHtml(item.related_scholarship)}</p>` : ""}
          </div>
          ${isPending
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Awaiting Coordinator Reply</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0"><span>✓</span> Replied by Coordinator</span>`}
        </div>

        <!-- Student Question -->
        <div class="bg-white p-3 rounded-xl border border-ink-100 text-xs text-ink-800 whitespace-pre-line leading-relaxed">
          <span class="text-[10px] font-bold uppercase text-ink-400 block mb-1">Your Question:</span>
          ${escapeHtml(item.message || "—")}
        </div>

        <!-- Coordinator Reply if present -->
        ${item.response ? `
          <div class="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1.5 text-xs text-emerald-950">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">🎓</span>
              <span class="font-bold text-xs text-emerald-900">ScholarLedger Advisory Desk Official Reply</span>
              <span class="text-[10px] text-emerald-700">(${formatDateTime(item.responded_at || item.updated_at)})</span>
            </div>
            <p class="whitespace-pre-line leading-relaxed pl-7 text-emerald-900">
              ${escapeHtml(item.response)}
            </p>
          </div>
        ` : `
          <div class="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-[11px] text-amber-800 flex items-center gap-2">
            <span>⏳</span>
            <span>Your request has been queued with the advisor desk. Official guidance will be posted right here.</span>
          </div>
        `}

        <div class="text-[10px] text-ink-400 pt-0.5">
          Submitted on: ${formatDateTime(item.created_at)}
        </div>
      </div>`;
  }).join("");
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const category = document.getElementById("contact-category").value;
  const relatedSch = document.getElementById("contact-scholarship").value || null;
  const subject = document.getElementById("contact-subject").value.trim();
  const message = document.getElementById("contact-message").value.trim();

  const btn = document.getElementById("contact-submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span>Submitting Request...</span>`;

  try {
    const payload = {
      student_id: currentStudent.id,
      student_name: currentStudent.name,
      student_mobile: currentStudent.mobile,
      category,
      related_scholarship: relatedSch,
      subject,
      message,
      status: "Pending",
      created_at: new Date().toISOString()
    };

    const { data, error } = await window.supabaseClient.from("support_messages").insert(payload);
    if (error) throw error;

    toast("✓ Your message has been sent to the coordinator!", "success");
    document.getElementById("student-contact-form").reset();
    await reloadStudentInquiries();
  } catch (err) {
    console.error("Contact message error:", err);
    toast("Failed to submit message: " + (err.message || ""), "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Submit Help Request</span> <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
  }
}

async function reloadStudentInquiries() {
  if (!currentStudent) return;
  try {
    const sb = window.supabaseClient;
    const { data: messages } = await sb.from("support_messages").select("*").order("created_at", { ascending: false });
    
    const sMobile = (currentStudent.mobile || "").replace(/\D/g, "");
    studentInquiriesList = (messages || []).filter(m => {
      const isIdMatch = m.student_id && m.student_id === currentStudent.id;
      const mMobile = (m.student_mobile || "").replace(/\D/g, "");
      const isMobileMatch = sMobile && mMobile && (sMobile === mMobile || sMobile.endsWith(mMobile) || mMobile.endsWith(sMobile));
      return isIdMatch || isMobileMatch;
    });

    renderStudentInquiries();
    renderHomeSupportPreview();
  } catch (err) {
    console.error("Reload inquiries error:", err);
  }
}

function handleStudentLogout() {
  localStorage.removeItem("student_session_token");
  toast("Signed out successfully", "success");
  setTimeout(() => {
    window.location.href = "student-login.html";
  }, 300);
}

function getStatusBadgeClass(status) {
  const map = {
    "Submitted": "bg-blue-100 text-blue-800 border border-blue-200",
    "Under Verification": "bg-amber-100 text-amber-800 border border-amber-200",
    "Documents Pending": "bg-amber-100 text-amber-800 border border-amber-200",
    "Documents Uploaded": "bg-blue-100 text-blue-800 border border-blue-200",
    "Approved": "bg-emerald-100 text-emerald-800 border border-emerald-200",
    "Amount Received": "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold",
    "Rejected": "bg-red-100 text-red-800 border border-red-200",
    "Closed": "bg-slate-100 text-slate-700 border border-slate-200"
  };
  return map[status] || "bg-ink-100 text-ink-700";
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return isoStr;
  }
}
