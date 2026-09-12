// Commissions & Student Fees Ledger Controller
let allApplications = [];
let allPayments = [];
let filteredApplications = [];
let currentScope = "approved"; // "approved", "pending-fee", "settled", "all"

document.addEventListener("DOMContentLoaded", async () => {
  renderLayout("commissions", "Commissions & Student Fees Ledger");
  await loadCommissionsData();

  // Check URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search") || urlParams.get("q");
  const appIdParam = urlParams.get("app_id") || urlParams.get("id");
  const scopeParam = urlParams.get("scope");

  if (searchParam) {
    const searchInput = document.getElementById("comm-search");
    if (searchInput) searchInput.value = searchParam;
    filterLedger();
  }

  if (scopeParam) {
    setCommissionScope(scopeParam);
  }

  if (appIdParam) {
    openRecordPaymentModal(appIdParam);
  }
});

function isStudentPayment(p) {
  if (!p) return false;
  if (p.payment_type === "Student") return true;
  const n = (p.notes || "").toLowerCase();
  if (n.includes("[category: student]") || n.includes("[type: student]") || n.includes("student disbursal")) return true;
  return false;
}

function isCommissionPayment(p) {
  return !isStudentPayment(p);
}

function isApprovedApp(app) {
  if (!app) return false;
  const s = (app.status || "").toLowerCase();
  if (s === "approved" || s === "amount received" || s === "disbursed" || s === "sanctioned" || s === "completed") return true;
  if (s.includes("approv") || s.includes("received") || s.includes("disburs")) return true;
  if (app.approval_date) return true;
  const hasPayments = allPayments.some(p => p.application_id === app.id);
  if (hasPayments) return true;
  return false;
}

async function loadCommissionsData() {
  try {
    const sb = window.supabaseClient;
    const [appsRes, payRes] = await Promise.all([
      sb.from("scholarship_applications").select("*, students(*), scholarships(*)").order("updated_at", { ascending: false }),
      sb.from("application_payments").select("*").order("payment_date", { ascending: false })
    ]);

    allApplications = appsRes.data || [];
    allPayments = payRes.data || [];

    populateAcademicYears();
    populatePaymentModalApps();
    calculateMetrics();
    filterLedger();
  } catch (err) {
    console.error("Error loading commissions & student fees data:", err);
    toast("Failed to load commissions ledger", "error");
  }
}

function calculateMetrics() {
  let totalSanctioned = 0;
  let totalStudentReceived = 0;
  let totalCommissionDue = 0;
  let totalCommissionCollected = 0;

  const systemApps = allApplications.filter(a => isApprovedApp(a));

  systemApps.forEach(app => {
    const award = Number(app.scholarship_amount || app.expected_amount || 0);
    const rate = Number(app.commission_percentage || 10);
    const commDue = Number(app.commission_amount || (award * rate / 100));

    totalSanctioned += award;
    totalCommissionDue += commDue;
  });

  allPayments.forEach(p => {
    const amt = Number(p.amount || 0);
    if (p.status === "Received") {
      if (isStudentPayment(p)) {
        totalStudentReceived += amt;
      } else {
        totalCommissionCollected += amt;
      }
    }
  });

  const pendingDueToMe = Math.max(0, totalCommissionDue - totalCommissionCollected);

  const elVol = document.getElementById("stat-scholarship-volume");
  const elStuRec = document.getElementById("stat-student-received");
  const elTotalComm = document.getElementById("stat-total-commission");
  const elCollected = document.getElementById("stat-collected");
  const elPending = document.getElementById("stat-pending");

  if (elVol) elVol.textContent = formatCurrency(totalSanctioned);
  if (elStuRec) elStuRec.textContent = formatCurrency(totalStudentReceived);
  if (elTotalComm) elTotalComm.textContent = formatCurrency(totalCommissionDue);
  if (elCollected) elCollected.textContent = formatCurrency(totalCommissionCollected);
  if (elPending) elPending.textContent = formatCurrency(pendingDueToMe);

  const badgeApproved = document.getElementById("badge-count-approved");
  if (badgeApproved) badgeApproved.textContent = systemApps.length;
}

function populateAcademicYears() {
  const sel = document.getElementById("filter-academic-year");
  if (!sel) return;
  const years = new Set(allApplications.map(a => a.academic_year).filter(Boolean));
  years.add("2024-2025");
  years.add("2025-2026");

  const currentVal = sel.value;
  sel.innerHTML = `<option value="all">All Sessions</option>` +
    Array.from(years).sort().reverse().map(y => `
      <option value="${y}" ${currentVal === y ? "selected" : ""}>Session ${y}</option>
    `).join("");
}

function populatePaymentModalApps() {
  const sel = document.getElementById("pay-app-id");
  if (!sel) return;

  const validApps = allApplications.filter(a => isApprovedApp(a) || a.status !== "Rejected");
  sel.innerHTML = `<option value="">-- Choose Student & Application --</option>` +
    validApps.map(app => {
      const student = app.students || {};
      const sch = app.scholarships || {};
      const award = Number(app.scholarship_amount || app.expected_amount || 0);
      const appNum = app.application_number ? `#${app.application_number}` : `#${app.id.slice(0, 6)}`;
      return `
        <option value="${app.id}">
          ${escapeHtml(student.name || "Student")} (${escapeHtml(student.mobile || "—")}) — ${escapeHtml(sch.name || "Scholarship")} [${appNum}] (₹${award})
        </option>
      `;
    }).join("");
}

function setCommissionScope(scope) {
  currentScope = scope;
  const tabs = ["approved", "pending-fee", "settled", "all"];
  tabs.forEach(t => {
    const btn = document.getElementById(`scope-btn-${t}`);
    if (!btn) return;
    if (t === scope) {
      btn.className = "scope-tab shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl bg-ink-900 text-white transition shadow-xs";
    } else {
      btn.className = "scope-tab shrink-0 text-xs font-medium px-3 py-1.5 rounded-xl bg-ink-50 hover:bg-ink-100 text-ink-600 transition";
    }
  });

  filterLedger();
}

function filterLedger() {
  const query = (document.getElementById("comm-search")?.value || "").toLowerCase().trim();
  const year = document.getElementById("filter-academic-year")?.value || "all";
  const payStatus = document.getElementById("filter-payment-status")?.value || "all";

  filteredApplications = allApplications.filter(app => {
    const student = app.students || {};
    const sch = app.scholarships || {};

    const matchesQuery = !query ||
      (student.name || "").toLowerCase().includes(query) ||
      (student.mobile || "").includes(query) ||
      (student.code || student.student_code || "").toLowerCase().includes(query) ||
      (app.application_number || "").toLowerCase().includes(query) ||
      (sch.name || "").toLowerCase().includes(query);

    const matchesYear = year === "all" || app.academic_year === year;

    const award = Number(app.scholarship_amount || app.expected_amount || 0);
    const rate = Number(app.commission_percentage || 10);
    const due = Number(app.commission_amount || (award * rate / 100));

    const appPays = allPayments.filter(p => p.application_id === app.id && isCommissionPayment(p) && p.status === "Received");
    const collected = appPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = due - collected;

    let matchesStatus = true;
    if (payStatus === "paid") {
      matchesStatus = due > 0 && balance <= 0;
    } else if (payStatus === "partial") {
      matchesStatus = collected > 0 && balance > 0;
    } else if (payStatus === "unpaid") {
      matchesStatus = due > 0 && collected === 0;
    }

    const approved = isApprovedApp(app);
    let matchesScope = true;
    if (currentScope === "approved") {
      matchesScope = approved;
    } else if (currentScope === "pending-fee") {
      matchesScope = approved && balance > 0;
    } else if (currentScope === "settled") {
      matchesScope = approved && due > 0 && balance <= 0;
    } else if (currentScope === "all") {
      matchesScope = true;
    }

    return matchesQuery && matchesYear && matchesStatus && matchesScope;
  });

  renderLedgerCards();
}

function getInitials(name) {
  if (!name) return "ST";
  return name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function renderLedgerCards() {
  const container = document.getElementById("ledger-cards-container");
  const countEl = document.getElementById("ledger-count");
  const badgeEl = document.getElementById("ledger-count-badge");
  if (!container) return;

  const countStr = `${filteredApplications.length} of ${allApplications.length} applications`;
  if (countEl) countEl.textContent = countStr;
  if (badgeEl) badgeEl.textContent = `${filteredApplications.length} shown`;

  if (filteredApplications.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-ink-400 bg-white rounded-3xl border border-dashed border-ink-200 p-8 shadow-card">
        <div class="w-14 h-14 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto text-2xl mb-3 shadow-xs">💰</div>
        <p class="font-display font-bold text-base text-ink-900">No applications match your filter.</p>
        <p class="text-xs text-ink-400 mt-1 max-w-sm mx-auto">Applications automatically appear here once approved, or adjust your search filter above.</p>
        <button type="button" onclick="resetLedgerFilters()" class="mt-4 px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold rounded-xl shadow-xs transition">
          Reset Filters
        </button>
      </div>`;
    return;
  }

  container.innerHTML = filteredApplications.map(app => {
    const student = app.students || {};
    const sch = app.scholarships || {};
    const award = Number(app.scholarship_amount || app.expected_amount || 0);
    const rate = Number(app.commission_percentage || 10);
    const due = Number(app.commission_amount || (award * rate / 100));
    const netStudentShare = Math.max(0, award - due);

    // How much student actually received (disbursed)
    const studentPays = allPayments.filter(p => p.application_id === app.id && isStudentPayment(p) && p.status === "Received");
    const studentReceived = studentPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // How much I (center/admin) have received (commission/fee)
    const commPays = allPayments.filter(p => p.application_id === app.id && isCommissionPayment(p) && p.status === "Received");
    const collectedFee = commPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balanceDue = Math.max(0, due - collectedFee);

    const totalAppPaysCount = allPayments.filter(p => p.application_id === app.id).length;
    const approved = isApprovedApp(app);

    // Settlement Badge
    let statusBadge = "";
    if (due === 0) {
      statusBadge = `<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">No Fee Due</span>`;
    } else if (balanceDue <= 0) {
      statusBadge = `<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">✓ Fully Settled</span>`;
    } else if (collectedFee > 0) {
      statusBadge = `<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">Partially Paid (${Math.round((collectedFee / due) * 100)}%)</span>`;
    } else {
      statusBadge = `<span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1">Fee Due (Unpaid)</span>`;
    }

    const appNumberStr = app.application_number || app.id.slice(0, 8);
    const initials = getInitials(student.name);

    // Fee collection percentage
    const feePct = due > 0 ? Math.min(100, Math.round((collectedFee / due) * 100)) : 100;

    return `
      <div class="card-interactive bg-white rounded-2xl border border-ink-100 shadow-card p-4 sm:p-5 hover:border-gold-400 transition space-y-3.5 group flex flex-col justify-between">
        
        <div class="space-y-3">
          <!-- Card Header: Student & Status -->
          <div class="flex items-start justify-between gap-2.5">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-ink-900 to-ink-800 text-gold-400 font-display font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-ink-700/80">
                ${initials}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <a href="student.html?id=${student.id || ""}" class="font-display font-bold text-sm sm:text-base text-ink-900 hover:text-gold-700 transition hover:underline truncate">
                    ${escapeHtml(student.name || "Student Name")}
                  </a>
                  <span class="text-[10px] font-mono text-ink-600 font-bold bg-ink-50 border border-ink-200 px-1.5 py-0.2 rounded">
                    ${escapeHtml(student.code || student.student_code || "STU")}
                  </span>
                  ${student.category ? `<span class="text-[10px] font-semibold text-ink-500 bg-ink-50 px-1.5 py-0.2 rounded border border-ink-100">${escapeHtml(student.category)}</span>` : ""}
                </div>

                <div class="flex items-center gap-1.5 text-xs text-ink-500 mt-0.5 flex-wrap">
                  ${student.mobile ? `<a href="tel:${student.mobile}" class="hover:text-gold-700 font-mono text-xs text-ink-700 font-medium flex items-center gap-1">📞 ${escapeHtml(student.mobile)}</a>` : ""}
                  ${student.course ? `<span class="text-ink-300">•</span><span class="font-medium text-ink-700 truncate max-w-[140px]">${escapeHtml(student.course)}</span>` : ""}
                  ${student.college ? `<span class="text-ink-300">•</span><span class="text-ink-500 truncate max-w-[180px]">${escapeHtml(student.college)}</span>` : ""}
                </div>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1 shrink-0">
              ${statusBadge}
              <span class="text-[10px] font-mono text-ink-400">#${escapeHtml(appNumberStr)}</span>
            </div>
          </div>

          <!-- Scholarship Details Box -->
          <div class="bg-ink-50/70 rounded-xl p-3 border border-ink-100 flex items-center justify-between gap-2.5 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0"></span>
                <p class="text-xs font-bold text-ink-900 truncate">${escapeHtml(sch.name || "Scholarship Scheme")}</p>
              </div>
              <p class="text-[10px] text-ink-500 mt-0.5 truncate">${escapeHtml(sch.provider || "State / Central Agency")} · Session ${escapeHtml(app.academic_year || "2024-2025")}</p>
            </div>
            <div class="shrink-0">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${approved ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-ink-100 text-ink-700"}">
                ${approved ? "✓ Approved" : escapeHtml(app.status)}
              </span>
            </div>
          </div>

          <!-- Financial Breakdown Matrix (4 Structured Cards) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <div class="bg-white rounded-xl border border-ink-100 p-2.5 shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">Sanctioned</span>
              <span class="font-display font-bold text-sm text-ink-900 mt-0.5 block font-mono">${formatCurrency(award)}</span>
              <span class="text-[9px] text-ink-400 mt-0.5 block truncate">Total Award</span>
            </div>

            <div class="bg-emerald-50/40 rounded-xl border border-emerald-100 p-2.5 shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Disbursed</span>
              <span class="font-display font-bold text-sm text-emerald-800 mt-0.5 block font-mono">${formatCurrency(studentReceived)}</span>
              <span class="text-[9px] text-emerald-600 mt-0.5 block truncate">Net: ${formatCurrency(netStudentShare)}</span>
            </div>

            <div class="bg-white rounded-xl border border-ink-100 p-2.5 shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-ink-500 block">Center Fee Due</span>
              <span class="font-display font-bold text-sm text-ink-900 mt-0.5 block font-mono">${formatCurrency(due)}</span>
              <span class="text-[9px] text-gold-600 font-semibold mt-0.5 block">Rate: ${rate}%</span>
            </div>

            <div class="bg-gold-50/40 rounded-xl border border-gold-200/60 p-2.5 shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-gold-800 block">I Received</span>
              <span class="font-display font-bold text-sm text-gold-800 mt-0.5 block font-mono">${formatCurrency(collectedFee)}</span>
              <span class="text-[9px] text-gold-600 mt-0.5 block">${feePct}% collected</span>
            </div>
          </div>

          <!-- Balance Alert / Settle Banner -->
          <div class="p-2.5 rounded-xl flex items-center justify-between gap-2.5 ${balanceDue > 0 ? "bg-amber-50/80 border border-amber-200/80 text-amber-900" : "bg-emerald-50/70 border border-emerald-200 text-emerald-900"}">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm shrink-0">${balanceDue > 0 ? "⏳" : "✓"}</span>
              <div class="min-w-0">
                <p class="text-xs font-bold leading-tight truncate">
                  ${balanceDue > 0 ? `Center Fee Due: ${formatCurrency(balanceDue)}` : `Fee Fully Settled (₹0 Balance)`}
                </p>
                <p class="text-[10px] ${balanceDue > 0 ? "text-amber-700" : "text-emerald-700"} truncate">
                  ${balanceDue > 0 ? `Outstanding balance to collect` : `All advisory fees recorded`}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              ${balanceDue > 0 ? `
                <button type="button" onclick="openRecordPaymentModal('${app.id}', 'Commission')" class="h-8 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition active:scale-95 cursor-pointer">
                  Collect Fee
                </button>
              ` : `
                <div class="hidden sm:flex flex-col items-end gap-0.5 w-16 shrink-0">
                  <span class="text-[10px] font-bold font-mono text-emerald-700">100%</span>
                  <div class="w-full bg-emerald-200/80 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-emerald-600 h-full rounded-full" style="width: 100%"></div>
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Action Buttons Bar with Standardized Heights -->
        <div class="pt-3 border-t border-ink-100/80 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" onclick="openRecordPaymentModal('${app.id}', 'Commission')" class="btn-compact btn-primary active:scale-95 shadow-xs">
              <span>+ Record Fee</span>
            </button>
            <button type="button" onclick="openRecordPaymentModal('${app.id}', 'Student')" class="btn-compact bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95">
              <span>+ Disbursal</span>
            </button>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" onclick="openPaymentHistoryModal('${app.id}')" title="View logged payments" class="btn-compact btn-secondary">
              <span>📜 History</span>
              <span class="ml-1 px-1.5 py-0.2 rounded bg-ink-100 text-ink-700 text-[10px] font-bold font-mono">${totalAppPaysCount}</span>
            </button>
            <button type="button" onclick="openReceiptModal('${app.id}')" title="Print Fee Receipt Voucher" class="btn-compact btn-secondary">
              <span>🧾 Voucher</span>
            </button>
            <a href="application.html?id=${app.id}" title="Manage Application Details" class="btn-compact btn-secondary font-bold">
              <span>App →</span>
            </a>
          </div>
        </div>

      </div>
    `;
  }).join("");
}

function resetLedgerFilters() {
  const search = document.getElementById("comm-search");
  const payStatus = document.getElementById("filter-payment-status");
  const year = document.getElementById("filter-academic-year");
  if (search) search.value = "";
  if (payStatus) payStatus.value = "all";
  if (year) year.value = "all";
  currentScope = "approved";
  setCommissionScope("approved");
}

function openRecordPaymentModal(appId = null, defaultType = "Commission") {
  const modal = document.getElementById("payment-modal");
  const form = document.getElementById("payment-form");
  if (!modal) return;
  if (form) form.reset();

  const dateInput = document.getElementById("pay-date");
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  const radios = document.getElementsByName("pay-category");
  radios.forEach(r => {
    r.checked = (r.value === defaultType);
  });
  onPaymentCategoryChange(defaultType);

  populatePaymentModalApps();

  const sel = document.getElementById("pay-app-id");
  if (sel && appId) {
    // If appId not present in dropdown, add it
    if (!Array.from(sel.options).some(o => o.value === appId)) {
      const targetApp = allApplications.find(a => a.id === appId);
      if (targetApp) {
        const student = targetApp.students || {};
        const sch = targetApp.scholarships || {};
        const opt = document.createElement("option");
        opt.value = targetApp.id;
        opt.textContent = `${student.name || "Student"} — ${sch.name || "Scheme"} (#${targetApp.application_number || targetApp.id.slice(0, 6)})`;
        sel.prepend(opt);
      }
    }
    sel.value = appId;
    onSelectAppForPayment(appId);
  } else if (sel) {
    sel.value = "";
    document.getElementById("pay-app-summary")?.classList.add("hidden");
  }

  if (typeof window.openModal === "function") {
    window.openModal("payment-modal");
  } else {
    modal.classList.remove("hidden");
    const sheet = modal.querySelector("[data-sheet]");
    if (sheet) {
      sheet.classList.remove("translate-y-full", "md:opacity-0", "md:scale-95");
      sheet.classList.add("translate-y-0", "opacity-100", "scale-100");
    }
  }
}

function closePaymentModal() {
  if (typeof window.closeModal === "function") {
    window.closeModal("payment-modal");
  } else {
    document.getElementById("payment-modal")?.classList.add("hidden");
  }
}

function onPaymentCategoryChange(category) {
  const title = document.getElementById("payment-modal-title");
  const autofillBtn = document.getElementById("btn-autofill-fee");
  if (category === "Student") {
    if (title) title.textContent = "Record Student Scholarship Disbursal";
    if (autofillBtn) autofillBtn.textContent = "Autofill Net Award";
  } else {
    if (title) title.textContent = "Record Commission & Center Fee Settlement";
    if (autofillBtn) autofillBtn.textContent = "Autofill Due";
  }
  const appId = document.getElementById("pay-app-id")?.value;
  if (appId) onSelectAppForPayment(appId);
}

function onSelectAppForPayment(appId) {
  const summaryBox = document.getElementById("pay-app-summary");
  if (!appId) {
    if (summaryBox) summaryBox.classList.add("hidden");
    return;
  }

  const app = allApplications.find(a => a.id === appId);
  if (!app) return;

  const award = Number(app.scholarship_amount || app.expected_amount || 0);
  const pct = Number(app.commission_percentage || 10);
  const due = Number(app.commission_amount || (award * pct / 100));
  const netShare = Math.max(0, award - due);

  const commPays = allPayments.filter(p => p.application_id === app.id && isCommissionPayment(p) && p.status === "Received");
  const collected = commPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const balance = Math.max(0, due - collected);

  const grantEl = document.getElementById("pay-sum-grant");
  const studentNetEl = document.getElementById("pay-sum-student-net");
  const dueEl = document.getElementById("pay-sum-due");
  const paidEl = document.getElementById("pay-sum-paid");
  const balEl = document.getElementById("pay-sum-bal");

  if (grantEl) grantEl.textContent = formatCurrency(award);
  if (studentNetEl) studentNetEl.textContent = formatCurrency(netShare);
  if (dueEl) dueEl.textContent = formatCurrency(due);
  if (paidEl) paidEl.textContent = formatCurrency(collected);
  if (balEl) balEl.textContent = formatCurrency(balance);

  const amtInput = document.getElementById("pay-amount");
  const isStudentCat = document.querySelector('input[name="pay-category"]:checked')?.value === "Student";
  if (amtInput) {
    if (isStudentCat) {
      amtInput.value = netShare > 0 ? netShare : award;
    } else {
      amtInput.value = balance > 0 ? balance : "";
    }
  }

  if (summaryBox) summaryBox.classList.remove("hidden");
}

function autoFillRemainingFee() {
  const appId = document.getElementById("pay-app-id")?.value;
  if (!appId) {
    toast("Please choose an application first", "warning");
    return;
  }
  const app = allApplications.find(a => a.id === appId);
  if (!app) return;

  const isStudent = document.querySelector('input[name="pay-category"]:checked')?.value === "Student";
  const award = Number(app.scholarship_amount || app.expected_amount || 0);
  const pct = Number(app.commission_percentage || 10);
  const due = Number(app.commission_amount || (award * pct / 100));
  const net = Math.max(0, award - due);

  const amtInput = document.getElementById("pay-amount");
  if (!amtInput) return;

  if (isStudent) {
    amtInput.value = net > 0 ? net : award;
  } else {
    const commPays = allPayments.filter(p => p.application_id === app.id && isCommissionPayment(p) && p.status === "Received");
    const collected = commPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = Math.max(0, due - collected);
    amtInput.value = balance;
  }
}

async function onSavePayment(e) {
  e.preventDefault();
  const appId = document.getElementById("pay-app-id")?.value;
  const amount = parseFloat(document.getElementById("pay-amount")?.value);
  const date = document.getElementById("pay-date")?.value || new Date().toISOString().slice(0, 10);
  const mode = document.getElementById("pay-mode")?.value || "Cash";
  const ref = document.getElementById("pay-reference")?.value.trim() || null;
  const remarks = document.getElementById("pay-remarks")?.value.trim() || null;
  const collectedBy = document.getElementById("pay-collected-by")?.value.trim() || null;
  const category = document.querySelector('input[name="pay-category"]:checked')?.value || "Commission";

  if (!appId) {
    toast("Please select an application scheme", "error");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    toast("Please enter a valid payment amount (greater than ₹0)", "error");
    return;
  }

  const btn = document.getElementById("pay-submit-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Saving payment...</span>`;
  }

  try {
    // Format descriptive notes containing metadata
    const noteParts = [
      `[Category: ${category}]`,
      mode ? `[Mode: ${mode}]` : null,
      collectedBy ? `[Received by: ${collectedBy}]` : null,
      remarks
    ].filter(Boolean);
    const formattedNotes = noteParts.join(" · ");

    // Standard payload with dual compatibility
    const standardPayload = {
      application_id: appId,
      amount: amount,
      payment_date: date,
      transaction_id: ref,
      reference_no: ref,
      payment_type: category,
      payment_method: mode,
      payment_mode: mode,
      received_by: collectedBy || "Admin",
      status: "Received",
      notes: formattedNotes,
      remarks: formattedNotes
    };

    let insertRes = await window.supabaseClient.from("application_payments").insert(standardPayload).select();
    
    if (insertRes.error) {
      console.warn("Primary payment insert warning, trying minimal fallback:", insertRes.error);
      const fallbackPayload = {
        application_id: appId,
        amount: amount,
        payment_date: date,
        payment_method: mode,
        status: "Received",
        notes: formattedNotes
      };
      const retryRes = await window.supabaseClient.from("application_payments").insert(fallbackPayload).select();
      if (retryRes.error) throw retryRes.error;
    }

    // Safely update application commission status if columns exist
    try {
      const app = allApplications.find(a => a.id === appId);
      if (app && category === "Commission") {
        const award = Number(app.scholarship_amount || app.expected_amount || 0);
        const rate = Number(app.commission_percentage || 10);
        const due = Number(app.commission_amount || (award * rate / 100));

        const existingPays = allPayments.filter(p => p.application_id === appId && isCommissionPayment(p) && p.status === "Received");
        const totalPaidNow = existingPays.reduce((s, p) => s + Number(p.amount || 0), 0) + amount;

        if (totalPaidNow >= due) {
          await window.supabaseClient.from("scholarship_applications").update({
            commission_status: "Received",
            commission_received_date: date
          }).eq("id", appId);
        }
      } else if (app && category === "Student") {
        if (app.status === "Approved" || app.status === "Under Verification" || app.status === "Sanctioned") {
          await window.supabaseClient.from("scholarship_applications").update({
            status: "Disbursed"
          }).eq("id", appId);
        }
      }
    } catch (e) {
      console.warn("Non-fatal application update error:", e);
    }

    toast(`✓ ${category === "Commission" ? "Center fee payment" : "Student disbursal"} saved successfully!`, "success");
    closePaymentModal();
    await loadCommissionsData();

    // Open receipt modal for printing
    openReceiptModal(appId, {
      amount,
      date,
      mode,
      ref,
      category,
      collectedBy
    });
  } catch (err) {
    console.error("Save settlement error:", err);
    toast("Failed to record payment: " + (err.message || "Database error"), "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>✓ Save Payment</span>`;
    }
  }
}

// Payment History Modal
function openPaymentHistoryModal(appId) {
  const app = allApplications.find(a => a.id === appId);
  if (!app) return;

  const student = app.students || {};
  const pays = allPayments.filter(p => p.application_id === appId);

  const titleEl = document.getElementById("hist-modal-title");
  const subEl = document.getElementById("hist-modal-subtitle");
  if (titleEl) titleEl.textContent = `Payments: ${student.name || "Student"}`;
  if (subEl) subEl.textContent = `${pays.length} transactions recorded for this scholarship application`;

  const listEl = document.getElementById("hist-modal-list");
  if (!listEl) return;

  if (pays.length === 0) {
    listEl.innerHTML = `
      <div class="py-8 text-center text-ink-400">
        <p class="text-xs">No payments or disbursals recorded yet.</p>
      </div>`;
  } else {
    listEl.innerHTML = pays.map(p => {
      const isStu = isStudentPayment(p);
      const mode = p.payment_method || p.payment_mode || "Cash";
      return `
        <div class="p-3.5 bg-ink-50/80 rounded-2xl border border-ink-100 flex items-center justify-between gap-3 text-xs">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-ink-900 font-mono">${formatCurrency(p.amount)}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isStu ? "bg-emerald-100 text-emerald-800" : "bg-gold-100 text-gold-800"}">
                ${isStu ? "Student Disbursal" : "Center Fee"}
              </span>
            </div>
            <p class="text-[11px] text-ink-500 mt-1 font-mono">
              ${formatDate(p.payment_date)} • ${escapeHtml(mode)} ${p.transaction_id ? `(Ref: ${escapeHtml(p.transaction_id)})` : ""}
            </p>
            ${p.notes ? `<p class="text-[11px] text-ink-600 mt-0.5">${escapeHtml(p.notes)}</p>` : ""}
          </div>
          <button type="button" onclick="deleteLedgerPayment('${p.id}')" title="Delete Payment" class="text-ink-400 hover:text-red-600 p-2 rounded-xl hover:bg-white transition text-sm">
            🗑️
          </button>
        </div>
      `;
    }).join("");
  }

  if (typeof window.openModal === "function") {
    window.openModal("payment-history-modal");
  } else {
    document.getElementById("payment-history-modal")?.classList.remove("hidden");
  }
}

function closePaymentHistoryModal() {
  if (typeof window.closeModal === "function") {
    window.closeModal("payment-history-modal");
  } else {
    document.getElementById("payment-history-modal")?.classList.add("hidden");
  }
}

async function deleteLedgerPayment(paymentId) {
  const ok = await confirmDelete("Delete Payment Record?", "This will permanently remove this transaction from the ledger and recalculate balances.");
  if (!ok) return;

  try {
    const { error } = await window.supabaseClient.from("application_payments").delete().eq("id", paymentId);
    if (error) throw error;

    toast("✓ Payment record deleted", "success");
    closePaymentHistoryModal();
    await loadCommissionsData();
  } catch (err) {
    console.error("Delete payment error:", err);
    toast("Failed to delete payment: " + (err.message || ""), "error");
  }
}

function openReceiptModal(appId, customDetails = null) {
  const app = allApplications.find(a => a.id === appId);
  if (!app) return;

  const student = app.students || {};
  const sch = app.scholarships || {};
  const award = Number(app.scholarship_amount || app.expected_amount || 0);
  const rate = Number(app.commission_percentage || 10);
  const due = Number(app.commission_amount || (award * rate / 100));

  const appPays = allPayments.filter(p => p.application_id === appId && p.status === "Received");
  const lastPay = appPays[0] || {};

  const voucherNo = "SL-REC-" + Math.floor(100000 + Math.random() * 900000);
  const dateStr = customDetails?.date || lastPay.payment_date || new Date().toISOString().slice(0, 10);
  const amountVal = customDetails?.amount || lastPay.amount || due;
  const natureStr = customDetails?.category === "Student" ? "Student Scholarship Disbursal" : "Center Commission & Advisory Fee";
  const modeStr = (customDetails?.mode || lastPay.payment_method || lastPay.payment_mode || "Cash") + (customDetails?.ref || lastPay.transaction_id || lastPay.reference_no ? ` (Ref: ${customDetails?.ref || lastPay.transaction_id || lastPay.reference_no})` : "");

  const voucherEl = document.getElementById("rec-voucher-no");
  const studentEl = document.getElementById("rec-student-name");
  const schEl = document.getElementById("rec-scholarship-name");
  const dateEl = document.getElementById("rec-date");
  const natureEl = document.getElementById("rec-nature");
  const modeEl = document.getElementById("rec-mode-ref");
  const amtEl = document.getElementById("rec-amount");

  if (voucherEl) voucherEl.textContent = `Voucher #${voucherNo}`;
  if (studentEl) studentEl.textContent = `${student.name || "Student"} (${student.mobile || "—"})`;
  if (schEl) schEl.textContent = sch.name || "Scholarship Program";
  if (dateEl) dateEl.textContent = dateStr;
  if (natureEl) natureEl.textContent = natureStr;
  if (modeEl) modeEl.textContent = modeStr;
  if (amtEl) amtEl.textContent = formatCurrency(amountVal);

  if (typeof window.openModal === "function") {
    window.openModal("receipt-modal");
  } else {
    document.getElementById("receipt-modal")?.classList.remove("hidden");
  }
}

function exportCommissionsCsv() {
  if (!allApplications.length) {
    toast("No data available to export", "error");
    return;
  }

  const rows = [
    ["Application Number", "Student Name", "Mobile", "Scholarship Scheme", "Sanctioned Award", "Student Received (Disbursed)", "Student Net Share", "Commission Rate %", "Commission / Fee Due", "I Have Received", "Balance Due to Me", "Status"]
  ];

  allApplications.forEach(app => {
    const student = app.students || {};
    const sch = app.scholarships || {};
    const award = Number(app.scholarship_amount || app.expected_amount || 0);
    const rate = Number(app.commission_percentage || 10);
    const due = Number(app.commission_amount || (award * rate / 100));
    const netShare = Math.max(0, award - due);

    const studentPays = allPayments.filter(p => p.application_id === app.id && isStudentPayment(p) && p.status === "Received");
    const studentReceived = studentPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const commPays = allPayments.filter(p => p.application_id === app.id && isCommissionPayment(p) && p.status === "Received");
    const collected = commPays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = Math.max(0, due - collected);
    const status = due === 0 ? "No Due" : (balance <= 0 ? "Fully Settled" : (collected > 0 ? "Partially Paid" : "Unpaid Due"));

    rows.push([
      `"${app.application_number || app.id}"`,
      `"${student.name || ""}"`,
      `"${student.mobile || ""}"`,
      `"${sch.name || ""}"`,
      award,
      studentReceived,
      netShare,
      rate,
      due,
      collected,
      balance,
      `"${status}"`
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `scholarledger_commissions_fees_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("✓ Commissions & Fees CSV exported successfully!", "success");
}
