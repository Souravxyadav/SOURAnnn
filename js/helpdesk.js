// Student Helpdesk & Coordinator Inquiries Manager
let allInquiries = [];
let currentFilter = "all"; // 'all' | 'pending' | 'responded'
let searchQuery = "";
let selectedInquiryId = null;


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
      <div class="p-6 text-center bg-white rounded-2xl border border-red-200 shadow-card text-xs text-red-600">
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
      <div class="p-6 text-center space-y-2 opacity-60">
        <div class="w-10 h-10 rounded-full bg-ink-100 text-ink-400 flex items-center justify-center text-lg mx-auto">💬</div>
        <p class="text-[11px] text-ink-500">No inquiries found.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const isPending = (item.status || "Pending").toLowerCase() === "pending";
    const statusDot = isPending ? `<span class="w-2 h-2 rounded-full bg-amber-500 shadow-sm shrink-0"></span>` : `<span class="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shrink-0"></span>`;
    const isSelected = item.id === selectedInquiryId;
    
    return `
      <button onclick="selectInquiry('${item.id}')" class="w-full text-left p-3 hover:bg-white focus:bg-white transition flex flex-col gap-1 border-l-4 ${isSelected ? 'bg-white border-gold-500 shadow-sm' : 'border-transparent'}">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5 font-bold text-xs text-ink-900 truncate">
            ${statusDot}
            <span class="truncate">${escapeHtml(item.student_name || "Student")}</span>
          </div>
          <span class="text-[9px] text-ink-400 whitespace-nowrap shrink-0">${formatDateTime(item.created_at).split(',')[0]}</span>
        </div>
        <div class="text-[11px] font-semibold text-ink-700 truncate">${escapeHtml(item.subject || "Inquiry")}</div>
        <p class="text-[10px] text-ink-500 line-clamp-1">${escapeHtml(item.message || "")}</p>
      </button>
    `;
  }).join("");
  
  if (selectedInquiryId && !list.find(i => i.id === selectedInquiryId)) {
    selectedInquiryId = null;
    renderActiveChat();
  } else if (!selectedInquiryId && list.length > 0) {
    selectInquiry(list[0].id);
  }
}

function selectInquiry(id) {
  selectedInquiryId = id;
  renderInquiries();
  renderActiveChat();
}

function renderActiveChat() {
  const emptyState = document.getElementById("chat-empty-state");
  const activeState = document.getElementById("chat-active-state");
  
  if (!selectedInquiryId) {
    emptyState.classList.remove("hidden");
    activeState.classList.add("hidden");
    return;
  }
  
  const item = allInquiries.find(i => i.id === selectedInquiryId);
  if (!item) return;
  
  emptyState.classList.add("hidden");
  activeState.classList.remove("hidden");
  
  const isPending = (item.status || "Pending").toLowerCase() === "pending";
  
  document.getElementById("chat-student-name").textContent = item.student_name || "Student";
  document.getElementById("chat-student-info").textContent = `Mobile: ${item.student_mobile || "—"} | Code: ${item.student_code || "STU"} | ${item.category || "General"}`;
  document.getElementById("chat-avatar").textContent = (item.student_name || "S").charAt(0).toUpperCase();
  
  const badge = document.getElementById("chat-status-badge");
  if (isPending) {
    badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200";
    badge.textContent = "Awaiting Reply";
  } else {
    badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200";
    badge.textContent = "Responded";
  }
  
  document.getElementById("reply-message-id").value = item.id;
  document.getElementById("reply-content").value = item.response || "";
  document.getElementById("reply-status-select").value = item.status === "Resolved" ? "Resolved" : "Responded";
  
  // Render Chat History
  const history = document.getElementById("chat-history");
  let historyHtml = `
    <div class="flex flex-col gap-1 max-w-[85%] self-start">
      <div class="text-[9px] text-ink-400 font-bold uppercase ml-1">${escapeHtml(item.student_name)} (${formatDateTime(item.created_at)})</div>
      <div class="bg-white border border-ink-100 rounded-2xl rounded-tl-sm p-3.5 shadow-sm space-y-2 relative">
        ${item.related_scholarship ? `<div class="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg inline-block border border-amber-100 mb-1">🎓 ${escapeHtml(item.related_scholarship)}</div>` : ""}
        <div class="font-bold text-sm text-ink-900">${escapeHtml(item.subject || "Student Inquiry")}</div>
        <div class="text-xs text-ink-700 whitespace-pre-line leading-relaxed">${escapeHtml(item.message || "")}</div>
      </div>
    </div>
  `;
  
  if (item.response) {
    historyHtml += `
      <div class="flex flex-col gap-1 max-w-[85%] self-end items-end mt-4">
        <div class="text-[9px] text-ink-400 font-bold uppercase mr-1">Coordinator (${formatDateTime(item.responded_at || item.updated_at)})</div>
        <div class="bg-gold-50 border border-gold-200 rounded-2xl rounded-tr-sm p-3.5 shadow-sm">
          <div class="text-xs text-ink-900 whitespace-pre-line leading-relaxed">${escapeHtml(item.response)}</div>
        </div>
      </div>
    `;
  }
  
  history.innerHTML = historyHtml;
  history.scrollTop = history.scrollHeight;
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
    renderActiveChat();
    updateMetrics();
    renderInquiries();
  } catch (err) {
    console.error("Reply error:", err);
    toast("Failed to send reply: " + (err.message || ""), "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Send</span> <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
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
