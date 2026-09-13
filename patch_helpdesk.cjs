const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "js/helpdesk.js");
let code = fs.readFileSync(filePath, "utf-8");

// State for selected conversation
code = code.replace("let searchQuery = \"\";", "let searchQuery = \"\";\nlet selectedInquiryId = null;\n");

// Replace renderInquiries
const newRenderInquiries = `
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
    container.innerHTML = \`
      <div class="p-6 text-center space-y-2 opacity-60">
        <div class="w-10 h-10 rounded-full bg-ink-100 text-ink-400 flex items-center justify-center text-lg mx-auto">💬</div>
        <p class="text-[11px] text-ink-500">No inquiries found.</p>
      </div>\`;
    return;
  }

  container.innerHTML = list.map(item => {
    const isPending = (item.status || "Pending").toLowerCase() === "pending";
    const statusDot = isPending ? \`<span class="w-2 h-2 rounded-full bg-amber-500 shadow-sm shrink-0"></span>\` : \`<span class="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shrink-0"></span>\`;
    const isSelected = item.id === selectedInquiryId;
    
    return \`
      <button onclick="selectInquiry('\${item.id}')" class="w-full text-left p-3 hover:bg-white focus:bg-white transition flex flex-col gap-1 border-l-4 \${isSelected ? 'bg-white border-gold-500 shadow-sm' : 'border-transparent'}">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5 font-bold text-xs text-ink-900 truncate">
            \${statusDot}
            <span class="truncate">\${escapeHtml(item.student_name || "Student")}</span>
          </div>
          <span class="text-[9px] text-ink-400 whitespace-nowrap shrink-0">\${formatDateTime(item.created_at).split(',')[0]}</span>
        </div>
        <div class="text-[11px] font-semibold text-ink-700 truncate">\${escapeHtml(item.subject || "Inquiry")}</div>
        <p class="text-[10px] text-ink-500 line-clamp-1">\${escapeHtml(item.message || "")}</p>
      </button>
    \`;
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
  document.getElementById("chat-student-info").textContent = \`Mobile: \${item.student_mobile || "—"} | Code: \${item.student_code || "STU"} | \${item.category || "General"}\`;
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
  let historyHtml = \`
    <div class="flex flex-col gap-1 max-w-[85%] self-start">
      <div class="text-[9px] text-ink-400 font-bold uppercase ml-1">\${escapeHtml(item.student_name)} (\${formatDateTime(item.created_at)})</div>
      <div class="bg-white border border-ink-100 rounded-2xl rounded-tl-sm p-3.5 shadow-sm space-y-2 relative">
        \${item.related_scholarship ? \`<div class="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg inline-block border border-amber-100 mb-1">🎓 \${escapeHtml(item.related_scholarship)}</div>\` : ""}
        <div class="font-bold text-sm text-ink-900">\${escapeHtml(item.subject || "Student Inquiry")}</div>
        <div class="text-xs text-ink-700 whitespace-pre-line leading-relaxed">\${escapeHtml(item.message || "")}</div>
      </div>
    </div>
  \`;
  
  if (item.response) {
    historyHtml += \`
      <div class="flex flex-col gap-1 max-w-[85%] self-end items-end mt-4">
        <div class="text-[9px] text-ink-400 font-bold uppercase mr-1">Coordinator (\${formatDateTime(item.responded_at || item.updated_at)})</div>
        <div class="bg-gold-50 border border-gold-200 rounded-2xl rounded-tr-sm p-3.5 shadow-sm">
          <div class="text-xs text-ink-900 whitespace-pre-line leading-relaxed">\${escapeHtml(item.response)}</div>
        </div>
      </div>
    \`;
  }
  
  history.innerHTML = historyHtml;
  history.scrollTop = history.scrollHeight;
}
`;

// Find everything from function renderInquiries() to the end of openReplyModal
// since we removed the modal logic
const renderInquiriesStart = code.indexOf("function renderInquiries()");
const insertQuickTemplateStart = code.indexOf("function insertQuickTemplate");

if (renderInquiriesStart > -1 && insertQuickTemplateStart > -1) {
  code = code.substring(0, renderInquiriesStart) + newRenderInquiries + "\n" + code.substring(insertQuickTemplateStart);
}

// Modify handleSendReply to remove closeReplyModal() and update active chat
code = code.replace("closeReplyModal();", "renderActiveChat();");
code = code.replace("<span>Send Reply to Student</span>", "<span>Send</span>");

fs.writeFileSync(filePath, code, "utf-8");
console.log("Patched helpdesk.js");
