// Student Helpdesk & Coordinator Inquiries Manager
let allInquiries = [];
let currentFilter = "all"; // 'all' | 'pending' | 'responded'
let searchQuery = "";

const TEMPLATES = {
  under_verification: "Dear Student, your application and submitted documents are currently under verification by the institutional nodal officer. You will receive an update once physical verification is concluded.",
  dbt_queued: "Dear Student, your scholarship amount sanction has been confirmed by the department. The payment has been scheduled in the upcoming direct bank transfer (DBT) batch and will reflect in your Aadhaar-linked account within 5-7 working days.",
  doc_correction: "Dear Student, your document has a minor deficiency. Please re-upload a clear, non-blurry scanned PDF of your latest income / marksheet certificate through the portal or submit it to the center coordinator.",
  portal_approved: "Dear Student, good news! Your scholarship application has been officially approved. Please keep your registered bank account active to receive the sanctioned installment without interruption."
};

document.addEventListener("DOMContentLoaded", async () => {
  await requireAuth();
  renderLayout("helpdesk", "Student Helpdesk");
  await loadHelpdeskData();
});

async function loadHelpdeskData() {
  const container = document.getElementById("inquiries-container");
  if (!container) return;

  try {
    const sb = window.supabaseClient;
    // Load support messages and student records for rich context
    const [msgRes, stuRes] = await Promise.all([
      sb.from("support_messages").select("*").order("created_at", { ascending: false }),
      sb.from("students").select("id, name, student_code, code, mobile, course, college")
    ]);

    const messages = msgRes.data || [];
    const students = stuRes.data || [];
    const studentMap = new Map();
    students.forEach(s => {
      studentMap.set(s.id, s);
      if (s.mobile) studentMap.set(s.mobile.replace(/\D/g, ""), s);
    });

    // Merge student information if missing
    allInquiries = messages.map(msg => {
      let st = studentMap.get(msg.student_id);
      if (!st && msg.student_mobile) {
        st = studentMap.get(msg.student_mobile.replace(/\D/g, ""));
      }
      return {
        ...msg,
        student_code: st?.code || st?.student_code || "STU",
        student_course: st?.course || "",
        student_college: st?.college || ""
      };
    });

    updateMetrics();
    renderInquiries();
  } catch (err) {
    console.error("Load helpdesk data error:", err);
    toast("Failed to load inquiries: " + (err.message || ""), "error");
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-2xl border border-red-200 shadow-card text-xs text-red-600">
        Failed to load inquiries. Please check your connection and refresh.
      </div>`;
  }
}

function updateMetrics() {
  const total = allInquiries.length;
  const pending = allInquiries.filter(m => (m.status || "Pending").toLowerCase() === "pending").length;
  const responded = total - pending;
  const rate = total > 0 ? Math.round((responded / total) * 100) : 100;

  const mTotal = document.getElementById("metric-total");
  const mPending = document.getElementById("metric-pending");
  const mResponded = document.getElementById("metric-responded");
  const mRate = document.getElementById("metric-rate");
  const bPending = document.getElementById("badge-pending-count");

  const cAll = document.getElementById("count-all");
  const cPending = document.getElementById("count-pending");
  const cResponded = document.getElementById("count-responded");

  if (mTotal) mTotal.textContent = total;
  if (mPending) mPending.textContent = pending;
  if (mResponded) mResponded.textContent = responded;
  if (mRate) mRate.textContent = `${rate}%`;
  if (bPending) {
    bPending.textContent = `${pending} Pending`;
    if (pending === 0) {
      bPending.className = "px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200";
    } else {
      bPending.className = "px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 animate-pulse";
    }
  }

  if (cAll) cAll.textContent = total;
  if (cPending) cPending.textContent = pending;
  if (cResponded) cResponded.textContent = responded;
}

function setHelpdeskFilter(filterKey) {
  currentFilter = filterKey;
  document.querySelectorAll(".hd-filter-btn").forEach(btn => {
    btn.classList.remove("bg-ink-900", "text-white");
    btn.classList.add("bg-ink-100", "text-ink-700");
  });
  const activeBtn = document.getElementById(`btn-filter-${filterKey}`);
  if (activeBtn) {
    activeBtn.classList.remove("bg-ink-100", "text-ink-700");
    activeBtn.classList.add("bg-ink-900", "text-white");
  }
  renderInquiries();
}

function handleHelpdeskSearch() {
  const input = document.getElementById("helpdesk-search");
  searchQuery = (input?.value || "").toLowerCase().trim();
  renderInquiries();
}

function renderInquiries() {
  const container = document.getElementById("inquiries-container");
  if (!container) return;

  let list = [...allInquiries];

  // Apply Status Filter
  if (currentFilter === "pending") {
    list = list.filter(m => (m.status || "Pending").toLowerCase() === "pending");
  } else if (currentFilter === "responded") {
    list = list.filter(m => (m.status || "Pending").toLowerCase() !== "pending");
  }

  // Apply Search
  if (searchQuery) {
    list = list.filter(m => {
      const name = (m.student_name || "").toLowerCase();
      const mobile = (m.student_mobile || "").toLowerCase();
      const code = (m.student_code || "").toLowerCase();
      const subject = (m.subject || "").toLowerCase();
      const msg = (m.message || "").toLowerCase();
      const category = (m.category || "").toLowerCase();
      const sch = (m.related_scholarship || "").toLowerCase();
      return name.includes(searchQuery) ||
             mobile.includes(searchQuery) ||
             code.includes(searchQuery) ||
             subject.includes(searchQuery) ||
             msg.includes(searchQuery) ||
             category.includes(searchQuery) ||
             sch.includes(searchQuery);
    });
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center bg-white rounded-3xl border border-ink-100 shadow-card space-y-2">
        <div class="w-12 h-12 rounded-2xl bg-ink-50 text-ink-400 flex items-center justify-center text-xl mx-auto">💬</div>
        <h4 class="font-display font-bold text-sm text-ink-800">No Student Inquiries Found</h4>
        <p class="text-xs text-ink-400 max-w-sm mx-auto">
          ${searchQuery ? "No inquiries matched your search terms." : currentFilter === "pending" ? "Great job! There are no pending inquiries requiring replies right now." : "No support inquiries have been submitted yet."}
        </p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const isPending = (item.status || "Pending").toLowerCase() === "pending";
    const statusBadge = isPending
      ? `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Awaiting Reply</span>`
      : `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0"><span>✓</span> Responded</span>`;

    const cleanPhone = (item.student_mobile || "").replace(/\D/g, "");
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${item.student_name || "Student"}, this is regarding your inquiry on ScholarLedger.`)}` : null;

    return `
      <div class="card-interactive ${isPending ? "border-amber-200/90 ring-1 ring-amber-100" : "border-ink-100"} p-4 sm:p-5 space-y-3.5">
        <!-- Top Row: Student info & status -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-ink-100/80">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl ${isPending ? "bg-amber-100 text-amber-800" : "bg-ink-100 text-ink-800"} font-bold text-xs flex items-center justify-center shrink-0">
              ${escapeHtml(item.student_name ? item.student_name.slice(0, 2).toUpperCase() : "ST")}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <a href="student.html?id=${encodeURIComponent(item.student_id || "")}" class="font-display font-bold text-sm text-ink-900 hover:text-gold-600 transition">
                  ${escapeHtml(item.student_name || "Student")}
                </a>
                <span class="font-mono text-[10px] px-2 py-0.5 rounded-md bg-ink-100 text-ink-600 font-semibold">
                  ${escapeHtml(item.student_code || "STU")}
                </span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-ink-50 text-ink-600 border border-ink-100">
                  ${escapeHtml(item.category || "General")}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-3 text-[11px] text-ink-400 mt-1">
                <span>📱 ${escapeHtml(item.student_mobile || "—")}</span>
                ${item.student_course ? `<span>• ${escapeHtml(item.student_course)}</span>` : ""}
                ${item.student_college ? `<span class="truncate max-w-[200px]">• ${escapeHtml(item.student_college)}</span>` : ""}
                <span>• Asked ${formatDateTime(item.created_at)}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            ${statusBadge}
            ${waLink ? `
              <a href="${waLink}" target="_blank" class="p-1.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition" title="Message on WhatsApp">
                <span class="text-xs">💬</span>
              </a>` : ""}
            ${cleanPhone ? `
              <a href="tel:${cleanPhone}" class="p-1.5 rounded-xl border border-ink-200 text-ink-600 hover:bg-ink-50 transition" title="Direct Phone Call">
                <span class="text-xs">📞</span>
              </a>` : ""}
          </div>
        </div>

        <!-- Subject & Related Scholarship -->
        <div class="space-y-1">
          ${item.related_scholarship ? `
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/80 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 font-medium">
              <span>🎓 Scheme:</span>
              <span class="font-bold">${escapeHtml(item.related_scholarship)}</span>
            </div>` : ""}
          <h3 class="font-display font-bold text-sm text-ink-900 pt-0.5">
            ${escapeHtml(item.subject || "Student Inquiry")}
          </h3>
          <p class="text-xs text-ink-700 bg-ink-50/60 p-3 rounded-xl border border-ink-100 whitespace-pre-line leading-relaxed">
            ${escapeHtml(item.message || "—")}
          </p>
        </div>

        <!-- Response Area -->
        ${item.response ? `
          <div class="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">🎓</span>
                <span class="font-bold text-xs text-emerald-950">Coordinator Official Reply</span>
                <span class="text-[10px] text-emerald-700">(${formatDateTime(item.responded_at || item.updated_at)})</span>
              </div>
              <button onclick="openReplyModal('${item.id}')" class="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline">
                Edit Reply
              </button>
            </div>
            <p class="text-xs text-emerald-900 whitespace-pre-line leading-relaxed pl-8">
              ${escapeHtml(item.response)}
            </p>
          </div>
        ` : `
          <div class="flex items-center justify-between pt-1">
            <span class="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Student is waiting for coordinator guidance</span>
            </span>
            <button onclick="openReplyModal('${item.id}')" class="btn-compact btn-primary">
              <span>Reply to Student</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
            </button>
          </div>
        `}
      </div>`;
  }).join("");
}

// Modal handling
function openReplyModal(messageId) {
  const item = allInquiries.find(m => m.id === messageId);
  if (!item) return;

  document.getElementById("reply-message-id").value = item.id;
  document.getElementById("reply-student-name").textContent = item.student_name || "Student";
  document.getElementById("reply-student-info").textContent = `Mobile: ${item.student_mobile || "—"} · Code: ${item.student_code || "STU"}`;
  document.getElementById("reply-category-badge").textContent = item.category || "General";
  document.getElementById("reply-student-message").textContent = item.message || "—";

  const schContainer = document.getElementById("reply-scheme-container");
  const schName = document.getElementById("reply-scheme-name");
  if (item.related_scholarship) {
    schContainer.classList.remove("hidden");
    schName.textContent = item.related_scholarship;
  } else {
    schContainer.classList.add("hidden");
  }

  const contentInput = document.getElementById("reply-content");
  contentInput.value = item.response || "";
  document.getElementById("reply-status-select").value = item.status === "Resolved" ? "Resolved" : "Responded";

  const modal = document.getElementById("reply-modal");
  if (modal) {
    modal.classList.remove("hidden");
    setTimeout(() => contentInput.focus(), 50);
  }
}

function closeReplyModal() {
  const modal = document.getElementById("reply-modal");
  if (modal) modal.classList.add("hidden");
}

function insertQuickTemplate(templateKey) {
  const template = TEMPLATES[templateKey];
  if (!template) return;
  const contentInput = document.getElementById("reply-content");
  if (!contentInput) return;

  if (contentInput.value.trim().length > 0) {
    contentInput.value += "\n\n" + template;
  } else {
    contentInput.value = template;
  }
  contentInput.focus();
}

async function handleSendReply(e) {
  e.preventDefault();
  const id = document.getElementById("reply-message-id").value;
  const responseText = document.getElementById("reply-content").value.trim();
  const status = document.getElementById("reply-status-select").value || "Responded";

  if (!id || !responseText) {
    toast("Please enter a reply message for the student.", "error");
    return;
  }

  const btn = document.getElementById("btn-submit-reply");
  btn.disabled = true;
  btn.innerHTML = `<span>Sending Reply...</span>`;

  try {
    const sb = window.supabaseClient;
    const now = new Date().toISOString();
    const updatePayload = {
      response: responseText,
      responded_at: now,
      status: status
    };

    const { error } = await sb.from("support_messages").update(updatePayload).eq("id", id);
    if (error) throw error;

    // Update in memory
    const targetIdx = allInquiries.findIndex(m => m.id === id);
    if (targetIdx >= 0) {
      allInquiries[targetIdx].response = responseText;
      allInquiries[targetIdx].responded_at = now;
      allInquiries[targetIdx].status = status;
    }

    toast("✓ Official reply sent to student successfully!", "success");
    closeReplyModal();
    updateMetrics();
    renderInquiries();
  } catch (err) {
    console.error("Reply error:", err);
    toast("Failed to send reply: " + (err.message || ""), "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Send Reply to Student</span> <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
  }
}

async function refreshHelpdeskData() {
  toast("Refreshing student inquiries…", "info");
  await loadHelpdeskData();
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
