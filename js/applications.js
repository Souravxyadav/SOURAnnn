// Applications Controller
let allApplications = [];
let allPayments = [];
let activeStatusFilter = "all";

const PENDING_STATUSES = [
  "Not Started", "Registration Done", "Application Started", "Form Filled",
  "Documents Pending", "Documents Uploaded", "Submitted", "Under Verification",
  "Deficiency / Correction Required", "Payment Processing"
];

document.addEventListener("DOMContentLoaded", async () => {
  renderLayout("applications", "Applications");
  await loadApplications();
  await loadScholarshipOptions();

  qs("#search-input")?.addEventListener("input", debounce(applyFilters, 200));
  qs("#scholarship-filter")?.addEventListener("change", applyFilters);
  qs("#year-filter")?.addEventListener("change", applyFilters);
  qs("#sort-select")?.addEventListener("change", applyFilters);

  qsa(".filter-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      activeStatusFilter = btn.dataset.filter;
      qsa(".filter-tab").forEach(b => {
        b.classList.remove("bg-ink-900", "text-white", "font-semibold", "shadow-xs");
        b.classList.add("bg-ink-50", "text-ink-600", "font-medium");
      });
      btn.classList.add("bg-ink-900", "text-white", "font-semibold", "shadow-xs");
      btn.classList.remove("bg-ink-50", "text-ink-600", "font-medium");
      applyFilters();
    });
  });
});

function isStudentPayment(p) {
  if (!p) return false;
  if (p.payment_type === "Student") return true;
  const n = (p.notes || "").toLowerCase();
  if (n.includes("[category: student]") || n.includes("[type: student]") || n.includes("student disbursal")) return true;
  return false;
}

function getInitials(name) {
  if (!name) return "ST";
  return name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

async function loadApplications() {
  const sb = window.supabaseClient;
  const [appRes, payRes] = await Promise.all([
    sb.from("scholarship_applications").select("*, students(*), scholarships(*)").order("updated_at", { ascending: false }),
    sb.from("application_payments").select("*")
  ]);

  if (appRes.error) {
    toast(friendlyError(appRes.error), "error");
    return;
  }

  allApplications = appRes.data || [];
  allPayments = payRes.data || [];

  calculateMetrics();
  updateTabCounts();
  applyFilters();
}

function updateTabCounts() {
  let allCount = allApplications.length;
  let approvedCount = 0;
  let pendingCount = 0;
  let disbursedCount = 0;
  let rejectedCount = 0;

  allApplications.forEach(a => {
    const s = a.status || "";
    if (s === "Approved" || s === "Sanctioned") approvedCount++;
    else if (PENDING_STATUSES.includes(s)) pendingCount++;
    else if (["Amount Received", "Closed", "Partially Received", "Disbursed"].includes(s)) disbursedCount++;
    else if (s === "Rejected") rejectedCount++;
  });

  const setT = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  };

  setT("tab-count-all", allCount);
  setT("tab-count-approved", approvedCount);
  setT("tab-count-pending", pendingCount);
  setT("tab-count-disbursed", disbursedCount);
  setT("tab-count-rejected", rejectedCount);
}

function calculateMetrics() {
  let totalSanctioned = 0;
  let totalDisbursed = 0;
  let totalCommission = 0;
  let approvedCount = 0;

  allApplications.forEach(a => {
    const award = Number(a.scholarship_amount || a.expected_amount || 0);
    const rate = Number(a.commission_percentage || 10);
    const comm = Number(a.commission_amount || (award * rate / 100));

    totalSanctioned += award;
    totalCommission += comm;

    const s = (a.status || "").toLowerCase();
    if (s === "approved" || s.includes("approv") || s === "amount received" || s === "disbursed" || a.approval_date) {
      approvedCount++;
    }
  });

  allPayments.forEach(p => {
    if (isStudentPayment(p) && p.status === "Received") {
      totalDisbursed += Number(p.amount || 0);
    }
  });

  const approvalRate = allApplications.length > 0 ? Math.round((approvedCount / allApplications.length) * 100) : 0;

  const kpiApps = document.getElementById("kpi-total-apps");
  const kpiVal = document.getElementById("kpi-total-val");
  const kpiDis = document.getElementById("kpi-total-disbursed");
  const kpiComm = document.getElementById("kpi-total-comm");
  const kpiApprRate = document.getElementById("kpi-approval-rate");

  if (kpiApps) kpiApps.textContent = allApplications.length;
  if (kpiVal) kpiVal.textContent = formatCurrency(totalSanctioned);
  if (kpiDis) kpiDis.textContent = formatCurrency(totalDisbursed);
  if (kpiComm) kpiComm.textContent = formatCurrency(totalCommission);
  if (kpiApprRate) kpiApprRate.textContent = `${approvalRate}%`;
}

async function loadScholarshipOptions() {
  const { data } = await window.supabaseClient.from("scholarships").select("id, name").order("name");
  const select = qs("#scholarship-filter");
  if (!select) return;
  (data || []).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
}

function applyFilters() {
  const term = (qs("#search-input")?.value || "").trim().toLowerCase();
  const scholarshipId = qs("#scholarship-filter")?.value;
  const year = qs("#year-filter")?.value || "all";
  const sort = qs("#sort-select")?.value;

  let list = allApplications.filter(a => {
    if (term) {
      const studentName = (a.students?.name || "").toLowerCase();
      const studentCode = (a.students?.code || a.students?.student_code || "").toLowerCase();
      const schName = (a.scholarships?.name || "").toLowerCase();
      const appNum = (a.application_number || a.id || "").toLowerCase();
      const mobile = (a.students?.mobile || "").toLowerCase();
      const course = (a.students?.course || "").toLowerCase();
      const college = (a.students?.college || "").toLowerCase();

      if (!studentName.includes(term) && !studentCode.includes(term) && !schName.includes(term) && !appNum.includes(term) && !mobile.includes(term) && !course.includes(term) && !college.includes(term)) {
        return false;
      }
    }

    if (scholarshipId && a.scholarship_id !== scholarshipId) return false;
    if (year !== "all" && a.academic_year !== year) return false;

    if (activeStatusFilter === "pending" && !PENDING_STATUSES.includes(a.status)) return false;
    if (activeStatusFilter === "approved" && a.status !== "Approved") return false;
    if (activeStatusFilter === "disbursed" && !["Amount Received", "Closed", "Partially Received", "Disbursed"].includes(a.status)) return false;
    if (activeStatusFilter === "rejected" && a.status !== "Rejected") return false;

    return true;
  });

  list = [...list].sort((a, b) => {
    if (sort === "newest") return new Date(b.created_at) - new Date(a.created_at);
    if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (sort === "amount_desc") return Number(b.expected_amount || b.scholarship_amount || 0) - Number(a.expected_amount || a.scholarship_amount || 0);
    return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
  });

  render(list);
}

function resetAppFilters() {
  const s = qs("#search-input");
  const sf = qs("#scholarship-filter");
  const yf = qs("#year-filter");
  const sort = qs("#sort-select");
  if (s) s.value = "";
  if (sf) sf.value = "";
  if (yf) yf.value = "all";
  if (sort) sort.value = "updated_desc";

  activeStatusFilter = "all";
  qsa(".filter-tab").forEach(b => {
    if (b.dataset.filter === "all") {
      b.classList.add("bg-ink-900", "text-white", "font-semibold", "shadow-xs");
      b.classList.remove("bg-ink-50", "text-ink-600", "font-medium");
    } else {
      b.classList.remove("bg-ink-900", "text-white", "font-semibold", "shadow-xs");
      b.classList.add("bg-ink-50", "text-ink-600", "font-medium");
    }
  });

  applyFilters();
}

function getWorkflowStepIndex(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("reject")) return -1;
  if (s.includes("disburs") || s.includes("amount received") || s === "closed") return 4;
  if (s.includes("approv") || s.includes("sanction")) return 3;
  if (s.includes("verif") || s.includes("submit") || s.includes("correct") || s.includes("processing")) return 2;
  if (s.includes("doc") || s.includes("form")) return 1;
  return 0; // Registered
}

function render(list) {
  const countEl = qs("#result-count");
  const badgeEl = qs("#active-showing-badge");
  if (countEl) countEl.textContent = `${list.length} of ${allApplications.length} applications`;
  if (badgeEl) badgeEl.textContent = `${list.length} showing`;

  const grid = qs("#applications-grid");
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-ink-200 p-8 shadow-card">
        <div class="w-14 h-14 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto text-2xl mb-3 shadow-xs">📋</div>
        <p class="font-display font-bold text-base text-ink-900">No applications match your filter.</p>
        <p class="text-xs text-ink-400 mt-1 mb-4 max-w-sm mx-auto">Try adjusting your search criteria or register a new student scholarship application.</p>
        <div class="flex items-center justify-center gap-2">
          <button type="button" onclick="resetAppFilters()" class="bg-ink-100 hover:bg-ink-200 text-ink-800 text-xs font-semibold rounded-xl px-4 py-2.5 transition">
            Reset Filters
          </button>
          <a href="application.html" class="bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold rounded-xl px-4 py-2.5 shadow-xs transition active:scale-95">
            + New Application
          </a>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(a => {
    const student = a.students || {};
    const sch = a.scholarships || {};
    const expected = Number(a.expected_amount || a.scholarship_amount || 0);
    const commPct = Number(a.commission_percentage || 10);
    const commAmt = Number(a.commission_amount || (expected * commPct / 100));
    const netStudentShare = Math.max(0, expected - commAmt);

    const appPays = allPayments.filter(p => p.application_id === a.id && isStudentPayment(p) && p.status === "Received");
    const received = appPays.reduce((s, p) => s + Number(p.amount || 0), 0);

    const initials = getInitials(student.name);
    const isApproved = a.status === "Approved" || a.status === "Amount Received" || a.status === "Disbursed" || Boolean(a.approval_date);
    const isDisbursed = a.status === "Disbursed" || a.status === "Amount Received";
    const isRejected = a.status === "Rejected";

    // Status Badge styling
    let statusBadgeCls = "bg-slate-100 text-slate-700 border-slate-200";
    let statusIcon = "📄";
    if (isApproved && !isDisbursed) {
      statusBadgeCls = "bg-emerald-50 text-emerald-800 border-emerald-300";
      statusIcon = "✓";
    } else if (isDisbursed) {
      statusBadgeCls = "bg-sky-50 text-sky-800 border-sky-300";
      statusIcon = "🎉";
    } else if (isRejected) {
      statusBadgeCls = "bg-rose-50 text-rose-800 border-rose-300";
      statusIcon = "✕";
    } else {
      statusBadgeCls = "bg-amber-50 text-amber-800 border-amber-300";
      statusIcon = "⏳";
    }

    // Step index for 5-stage workflow
    const stepIdx = getWorkflowStepIndex(a.status);
    const stages = [
      { key: "reg", label: "Registered" },
      { key: "docs", label: "Form & Docs" },
      { key: "verif", label: "Verification" },
      { key: "appr", label: "Approved" },
      { key: "disb", label: "Disbursed" }
    ];

    const appNumberStr = a.application_number || a.id.slice(0, 8);

    return `
      <div class="card-interactive bg-white border border-ink-100 rounded-2xl shadow-card p-4 sm:p-5 hover:border-gold-400 transition flex flex-col justify-between space-y-3.5 group">
        
        <div class="space-y-3">
          <!-- Card Header: Student Profile & Status -->
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
                  ${student.category ? `<span class="text-[10px] font-semibold text-ink-600 bg-ink-100/70 border border-ink-200 px-1.5 py-0.2 rounded">${escapeHtml(student.category)}</span>` : ""}
                </div>

                <div class="flex items-center gap-1.5 text-xs text-ink-500 mt-0.5 flex-wrap">
                  ${student.mobile ? `<a href="tel:${student.mobile}" class="hover:text-gold-700 font-mono text-xs text-ink-700 font-medium flex items-center gap-1">📞 ${escapeHtml(student.mobile)}</a>` : ""}
                  ${student.course ? `<span class="text-ink-300">•</span><span class="font-medium text-ink-700 truncate max-w-[140px]">${escapeHtml(student.course)}</span>` : ""}
                  ${student.college ? `<span class="text-ink-300">•</span><span class="text-ink-500 truncate max-w-[180px]">${escapeHtml(student.college)}</span>` : ""}
                </div>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1 shrink-0">
              <span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeCls}">
                <span>${statusIcon}</span>
                <span>${escapeHtml(a.status)}</span>
              </span>
              <span class="text-[10px] font-mono text-ink-400 font-semibold">#${escapeHtml(appNumberStr)}</span>
            </div>
          </div>

          <!-- Scholarship Scheme & Academic Details Box -->
          <div class="bg-ink-50/70 rounded-xl p-3 border border-ink-100 flex items-center justify-between gap-2.5 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0"></span>
                <p class="text-xs font-bold text-ink-900 truncate">${escapeHtml(sch.name || "Scholarship Program")}</p>
              </div>
              <p class="text-[10px] text-ink-500 mt-0.5 truncate">${escapeHtml(sch.provider || "State / Central Scheme")} · Session ${escapeHtml(a.academic_year || "2024-2025")}</p>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[10px] font-mono text-ink-500 font-medium block">
                ${a.submission_date ? `Submitted ${formatDate(a.submission_date)}` : (a.created_at ? `Created ${formatDate(a.created_at)}` : "Active")}
              </span>
            </div>
          </div>

          <!-- Interactive 5-Stage Workflow Stepper -->
          <div class="bg-white rounded-xl p-2.5 border border-ink-100 shadow-2xs space-y-1.5">
            <div class="flex items-center justify-between text-[10px] font-bold text-ink-400 uppercase tracking-wider">
              <span>Lifecycle Workflow</span>
              <span class="font-mono text-ink-700">${isRejected ? "Rejected" : `Stage ${Math.min(5, stepIdx + 1)} of 5`}</span>
            </div>

            <div class="grid grid-cols-5 gap-1 pt-0.5">
              ${stages.map((stage, idx) => {
                let dotCls = "bg-ink-100 text-ink-400 border-ink-200";
                let textCls = "text-ink-400";
                let check = `${idx + 1}`;

                if (isRejected) {
                  dotCls = "bg-rose-50 text-rose-600 border-rose-200";
                  textCls = "text-rose-500";
                } else if (idx < stepIdx) {
                  dotCls = "bg-emerald-600 text-white border-emerald-600";
                  textCls = "text-emerald-800 font-bold";
                  check = "✓";
                } else if (idx === stepIdx) {
                  dotCls = "bg-gold-500 text-ink-950 border-gold-500 ring-2 ring-gold-200 font-bold";
                  textCls = "text-gold-900 font-bold";
                }

                return `
                  <div class="flex flex-col items-center text-center">
                    <div class="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] border ${dotCls} transition">
                      ${check}
                    </div>
                    <span class="text-[9px] mt-0.5 leading-tight line-clamp-1 ${textCls}">
                      ${stage.label}
                    </span>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Financial Breakdown Strip (3 Clear Metric Cards) -->
          <div class="grid grid-cols-3 gap-2 text-left">
            <div class="bg-white rounded-xl border border-ink-100 p-2.5 shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">Sanctioned</span>
              <span class="font-display font-bold text-sm text-ink-900 mt-0.5 block font-mono">${formatCurrency(expected)}</span>
              <span class="text-[9px] text-ink-400 mt-0.5 block truncate">Total Award</span>
            </div>

            <div class="bg-emerald-50/40 rounded-xl border border-emerald-100 p-2.5 shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Disbursed</span>
              <span class="font-display font-bold text-sm text-emerald-800 mt-0.5 block font-mono">${formatCurrency(received)}</span>
              <span class="text-[9px] text-emerald-600 mt-0.5 block font-mono truncate">Net: ${formatCurrency(netStudentShare)}</span>
            </div>

            <div class="bg-gold-50/40 rounded-xl border border-gold-200/60 p-2.5 shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-gold-800 block">Advisory Fee</span>
              <span class="font-display font-bold text-sm text-gold-800 mt-0.5 block font-mono">${formatCurrency(commAmt)}</span>
              <span class="text-[9px] text-gold-600 mt-0.5 block font-semibold">Rate: ${commPct}%</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons Footer -->
        <div class="pt-3 border-t border-ink-100/80 flex items-center justify-between gap-2 flex-wrap">
          <div>
            ${!isApproved 
              ? `<button type="button" onclick="quickApproveFromList('${a.id}')" title="Approve and sync to Fees Ledger" class="btn-compact bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs active:scale-95 cursor-pointer">
                   <span>✓ Quick Approve</span>
                 </button>`
              : `<a href="commissions.html?search=${encodeURIComponent(student.name || a.application_number || a.id)}" title="Open in Commissions & Fees Ledger" class="btn-compact bg-gold-50 hover:bg-gold-100 text-gold-900 border border-gold-300 font-bold">
                   <span>💰 Fees Ledger →</span>
                 </a>`
            }
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <a href="student.html?id=${student.id || ""}" class="btn-compact btn-secondary">
              <span>Student Profile</span>
            </a>
            <a href="application.html?id=${a.id}" class="btn-compact btn-primary active:scale-95 shadow-xs">
              <span>Manage Application →</span>
            </a>
          </div>
        </div>

      </div>
    `;
  }).join("");
}

async function quickApproveFromList(appId) {
  const app = allApplications.find(a => a.id === appId);
  if (!app) return;
  const award = Number(app.expected_amount || app.scholarship_amount || 0);
  const rate = Number(app.commission_percentage || 10);
  const comm = Math.round(award * rate / 100);
  const studentAmt = Math.max(0, award - comm);

  try {
    const { error } = await window.supabaseClient.from("scholarship_applications").update({
      status: "Approved",
      approval_date: new Date().toISOString().slice(0, 10),
      scholarship_amount: award,
      commission_percentage: rate,
      commission_amount: comm,
      student_amount: studentAmt,
      commission_status: "Pending"
    }).eq("id", appId);

    if (error) throw error;

    toast("✓ Application approved! Synced to Commission & Fees Ledger.", "success");
    await loadApplications();
  } catch (err) {
    console.error("Quick approve error:", err);
    toast("Failed to approve application: " + (err.message || ""), "error");
  }
}

function exportApplicationsCsv() {
  if (!allApplications.length) {
    toast("No applications found to export", "warning");
    return;
  }

  const rows = [
    ["App Number", "Student Name", "Student Code", "Mobile", "Course", "College", "Scholarship Scheme", "Session", "Sanctioned Award", "Student Disbursed", "Advisory Fee", "Commission Rate", "Status", "Updated Date"]
  ];

  allApplications.forEach(a => {
    const s = a.students || {};
    const sch = a.scholarships || {};
    const award = Number(a.expected_amount || a.scholarship_amount || 0);
    const rate = Number(a.commission_percentage || 10);
    const fee = Number(a.commission_amount || (award * rate / 100));

    const appPays = allPayments.filter(p => p.application_id === a.id && isStudentPayment(p) && p.status === "Received");
    const disbursed = appPays.reduce((acc, p) => acc + Number(p.amount || 0), 0);

    rows.push([
      `"${a.application_number || a.id}"`,
      `"${s.name || ""}"`,
      `"${s.code || s.student_code || ""}"`,
      `"${s.mobile || ""}"`,
      `"${s.course || ""}"`,
      `"${s.college || ""}"`,
      `"${sch.name || ""}"`,
      `"${a.academic_year || ""}"`,
      award,
      disbursed,
      fee,
      `${rate}%`,
      `"${a.status || ""}"`,
      `"${a.updated_at ? formatDate(a.updated_at) : ""}"`
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `scholarledger_applications_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("✓ Applications CSV exported successfully!", "success");
}
