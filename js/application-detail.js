const appId = getParam("id");
const presetStudentId = getParam("student_id");
let currentApplication = null;

(async function init() {
  await requireAuth();
  renderLayout("applications", appId ? "Application" : "New Application");

  populateStatusOptions();
  populatePaymentStatusOptions();
  populateDocumentOptions();

  qs("#application-form").addEventListener("submit", onSaveApplication);
  qs("#toggle-password").addEventListener("click", togglePassword);
  qs("#copy-password").addEventListener("click", copyPassword);
  qs("#add-payment-btn")?.addEventListener("click", () => {
    qs("#payment-form").reset();
    qs("#p-date").value = new Date().toISOString().slice(0, 10);
    openModal("payment-modal");
  });
  qs("#payment-form").addEventListener("submit", onSavePayment);
  qs("#add-document-btn")?.addEventListener("click", () => {
    qs("#document-form").reset();
    openModal("document-modal");
  });
  qs("#document-form").addEventListener("submit", onSaveDocument);
  qs("#delete-app-btn")?.addEventListener("click", onDeleteApplication);

  if (appId) {
    await loadExisting();
  } else {
    await loadCreateMode();
  }
})();

function populateStatusOptions() {
  qs("#a-status").innerHTML = APPLICATION_STATUSES.map(s => `<option value="${s}">${s}</option>`).join("");
}
function populatePaymentStatusOptions() {
  qs("#p-status").innerHTML = PAYMENT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join("");
}
function populateDocumentOptions() {
  qs("#d-type").innerHTML = DOCUMENT_TYPES.map(s => `<option value="${s}">${s}</option>`).join("");
  qs("#d-status").innerHTML = DOCUMENT_STATUSES.map(s => `<option value="${s}"${s === "Required" ? " selected" : ""}>${s}</option>`).join("");
}

// ---------- CREATE MODE ----------
async function loadCreateMode() {
  qs("#selection-card").classList.remove("hidden");
  const sb = window.supabaseClient;

  const [{ data: students }, { data: scholarships }] = await Promise.all([
    sb.from("students").select("id, name, student_code").order("name"),
    sb.from("scholarships").select("id, name").eq("is_active", true).order("name"),
  ]);

  const studentSelect = qs("#select-student");
  (students || []).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name}${s.student_code ? " (" + s.student_code + ")" : ""}`;
    studentSelect.appendChild(opt);
  });
  if (presetStudentId) studentSelect.value = presetStudentId;

  const scholarshipSelect = qs("#select-scholarship");
  (scholarships || []).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name;
    scholarshipSelect.appendChild(opt);
  });

  const presetSchId = getParam("scholarship_id");
  if (presetSchId) {
    scholarshipSelect.value = presetSchId;
    const matched = (scholarships || []).find(sc => sc.id === presetSchId);
    if (matched && matched.scholarship_amount) {
      const expInput = qs("#a-expected");
      if (expInput) expInput.value = matched.scholarship_amount;
    }
  }

  const yrInput = qs("#a-year");
  if (yrInput && !yrInput.value) yrInput.value = "2025-2026";

  const numInput = qs("#a-number");
  if (numInput && !numInput.value) numInput.value = `APP-${Math.floor(100000 + Math.random() * 900000)}`;

  qs("#a-status").value = "Not Started";
}

// ---------- EDIT MODE ----------
async function loadExisting() {
  const sb = window.supabaseClient;
  const { data, error } = await sb
    .from("scholarship_applications")
    .select("*, students(id, name, student_code), scholarships(id, name)")
    .eq("id", appId)
    .single();

  if (error || !data) {
    toast("Application not found.", "error");
    window.location.href = "applications.html";
    return;
  }
  currentApplication = data;

  qs("#app-header").classList.remove("hidden");
  qs("#progress-card").classList.remove("hidden");
  qs("#payments-section").classList.remove("hidden");
  qs("#documents-section").classList.remove("hidden");

  qs("#app-title-student").textContent = data.students?.name || "Unknown student";
  qs("#app-title-scholarship").textContent = `${data.scholarships?.name || "—"} ${data.academic_year ? "• " + data.academic_year : ""}`;

  qs("#a-number").value = data.application_number || "";
  qs("#a-registration").value = data.registration_number || "";
  qs("#a-year").value = data.academic_year || "";
  qs("#a-login").value = data.login_id || "";
  qs("#a-password").value = deobfuscate(data.encrypted_password) || "";
  qs("#a-application-date").value = data.application_date || "";
  qs("#a-submission-date").value = data.submission_date || "";
  qs("#a-verification-date").value = data.verification_date || "";
  qs("#a-approval-date").value = data.approval_date || "";
  qs("#a-status").value = data.status || "Not Started";
  qs("#a-expected").value = data.expected_amount || data.scholarship_amount || "";
  qs("#a-notes").value = data.notes || "";

  // Set commission rate and amounts
  const rateInput = qs("#a-comm-rate");
  if (rateInput) {
    rateInput.value = data.commission_percentage || 10;
  }
  calculateCommissionSplit();

  updateProgressBar(data.status);
  renderApprovalWorkflowBanner(data.status);

  qs("#a-status").addEventListener("change", (e) => {
    const newStatus = e.target.value;
    updateProgressBar(newStatus);
    if (newStatus === "Approved" && !qs("#a-approval-date").value) {
      qs("#a-approval-date").value = new Date().toISOString().slice(0, 10);
    }
    renderApprovalWorkflowBanner(newStatus);
  });

  const linkToComm = qs("#link-to-commissions");
  if (linkToComm && appId) {
    linkToComm.href = `commissions.html?app_id=${appId}`;
  }

  await loadPayments();
  await loadDocuments();
}

function calculateCommissionSplit() {
  const exp = Number(qs("#a-expected")?.value || 0);
  const rate = Number(qs("#a-comm-rate")?.value || 10);
  const commAmount = Math.round((exp * rate) / 100);
  const studentAmount = Math.max(0, exp - commAmount);

  const commInput = qs("#a-comm-amount");
  const studentInput = qs("#a-student-amount");
  if (commInput) commInput.value = commAmount;
  if (studentInput) studentInput.value = studentAmount;
}

function renderApprovalWorkflowBanner(status) {
  const banner = qs("#approval-workflow-banner");
  if (!banner) return;

  const isApproved = status === "Approved" || status === "Amount Received" || status === "Disbursed" || Boolean(qs("#a-approval-date")?.value);

  if (isApproved) {
    banner.className = "rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 transition-all";
    banner.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div class="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>✓ Active in Commission & Student Fees Ledger</span>
          </div>
          <p class="text-[11px] text-emerald-700 mt-0.5">
            Student scholarship award and center advisory fee collections are tracked in the merged financial system.
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="commissions.html?app_id=${appId || ''}" class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1">
            <span>View Commission Ledger</span> →
          </a>
        </div>
      </div>
    `;
  } else {
    banner.className = "rounded-xl border border-ink-200 bg-ink-50/70 p-3.5 transition-all";
    banner.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <p class="text-xs font-bold text-ink-900">Application Pending Approval</p>
          <p class="text-[11px] text-ink-500 mt-0.5">
            When you approve this application, it automatically populates the Commission & Student Fees ledger.
          </p>
        </div>
        <button type="button" onclick="quickApproveApplication()" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95">
          <span>✓ Approve & Send to Commission</span>
        </button>
      </div>
    `;
  }
}

function quickApproveApplication() {
  const statusSelect = qs("#a-status");
  if (statusSelect) {
    statusSelect.value = "Approved";
  }
  const approvalDateInput = qs("#a-approval-date");
  if (approvalDateInput && !approvalDateInput.value) {
    approvalDateInput.value = new Date().toISOString().slice(0, 10);
  }
  calculateCommissionSplit();
  updateProgressBar("Approved");
  renderApprovalWorkflowBanner("Approved");
  toast("Status set to Approved! Click 'Save Application' to finalize and sync with the Commission ledger.", "info");
}

function updateProgressBar(status) {
  const pct = STATUS_PROGRESS[status] ?? 0;
  qs("#progress-bar").style.width = pct + "%";
  qs("#progress-pct").textContent = pct + "%";
}

function togglePassword() {
  const input = qs("#a-password");
  const btn = qs("#toggle-password");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  btn.textContent = show ? "Hide" : "Show";
}

async function copyPassword() {
  const value = qs("#a-password").value;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    toast("Password copied to clipboard.");
  } catch {
    toast("Couldn't copy — please copy manually.", "error");
  }
}

// ---------- SAVE APPLICATION ----------
async function onSaveApplication(e) {
  e.preventDefault();
  const sb = window.supabaseClient;
  const btn = qs("#app-save-btn");

  let studentId = currentApplication?.student_id;
  let scholarshipId = currentApplication?.scholarship_id;

  if (!appId) {
    studentId = qs("#select-student").value;
    scholarshipId = qs("#select-scholarship").value;
    if (!studentId || !scholarshipId) {
      toast("Please select a student and a scholarship.", "error");
      return;
    }
  }

  setLoading(btn, true);

  const statusVal = qs("#a-status").value;
  let approvalDateVal = qs("#a-approval-date").value || null;
  if (statusVal === "Approved" && !approvalDateVal) {
    approvalDateVal = new Date().toISOString().slice(0, 10);
  }

  const expectedVal = qs("#a-expected").value ? Number(qs("#a-expected").value) : 0;
  const commRateVal = Number(qs("#a-comm-rate")?.value || 10);
  const commAmountVal = Math.round((expectedVal * commRateVal) / 100);
  const studentAmountVal = Math.max(0, expectedVal - commAmountVal);

  const payload = {
    student_id: studentId,
    scholarship_id: scholarshipId,
    application_number: qs("#a-number").value.trim() || null,
    registration_number: qs("#a-registration").value.trim() || null,
    academic_year: qs("#a-year").value.trim() || null,
    login_id: qs("#a-login").value.trim() || null,
    encrypted_password: qs("#a-password").value ? obfuscate(qs("#a-password").value) : null,
    application_date: qs("#a-application-date").value || null,
    submission_date: qs("#a-submission-date").value || null,
    verification_date: qs("#a-verification-date").value || null,
    approval_date: approvalDateVal,
    status: statusVal,
    expected_amount: expectedVal,
    scholarship_amount: expectedVal,
    commission_percentage: commRateVal,
    commission_amount: commAmountVal,
    student_amount: studentAmountVal,
    commission_status: statusVal === "Approved" ? (currentApplication?.commission_status || "Pending") : (currentApplication?.commission_status || null),
    notes: qs("#a-notes").value.trim() || null,
  };

  const { data, error } = appId
    ? await sb.from("scholarship_applications").update(payload).eq("id", appId).select().single()
    : await sb.from("scholarship_applications").insert(payload).select().single();

  setLoading(btn, false);

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }

  if (statusVal === "Approved") {
    toast("✓ Application approved and sent to Commission & Student Fees Ledger!", "success");
  } else {
    toast(appId ? "Application saved successfully." : "Application created successfully.");
  }
  window.location.href = `application.html?id=${data.id}`;
}

async function onDeleteApplication() {
  const ok = await confirmDelete("Delete Application?", "This removes the application along with its payments and documents.");
  if (!ok) return;
  const { error } = await window.supabaseClient.from("scholarship_applications").delete().eq("id", appId);
  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  toast("Application deleted.");
  window.location.href = "applications.html";
}

// ---------- PAYMENTS ----------
async function loadPayments() {
  const { data, error } = await window.supabaseClient
    .from("application_payments")
    .select("*")
    .eq("application_id", appId)
    .order("payment_date", { ascending: false });

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }

  const payments = data || [];
  const received = payments.filter(p => p.status === "Received").reduce((s, p) => s + Number(p.amount || 0), 0);
  const expected = Number(currentApplication?.expected_amount || 0);
  const pending = Math.max(expected - received, 0);

  qs("#pay-expected").textContent = formatCurrency(expected);
  qs("#pay-received").textContent = formatCurrency(received);
  qs("#pay-pending").textContent = formatCurrency(pending);

  const list = qs("#payments-list");
  if (payments.length === 0) {
    list.innerHTML = `<p class="text-sm text-ink-400 text-center py-6">No payments recorded yet.</p>`;
    return;
  }
  list.innerHTML = payments.map(p => `
    <div class="flex items-center justify-between border border-ink-100 rounded-lg px-3.5 py-2.5">
      <div>
        <p class="text-sm font-medium text-ink-900">${formatCurrency(p.amount)}</p>
        <p class="text-xs text-ink-400">${formatDate(p.payment_date)} ${p.transaction_id ? "• " + escapeHtml(p.transaction_id) : ""}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-medium px-2 py-0.5 rounded-full ${p.status === "Received" ? "bg-emerald-100 text-emerald-700" : p.status === "Failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}">${p.status}</span>
        <button onclick="deletePayment('${p.id}')" class="text-ink-300 hover:text-red-600 text-xs">✕</button>
      </div>
    </div>`).join("");
}

async function onSavePayment(e) {
  e.preventDefault();
  const btn = qs("#payment-save-btn");
  setLoading(btn, true);

  const payload = {
    application_id: appId,
    amount: Number(qs("#p-amount").value),
    payment_date: qs("#p-date").value || null,
    transaction_id: qs("#p-transaction").value.trim() || null,
    payment_method: qs("#p-method").value.trim() || null,
    status: qs("#p-status").value,
    notes: qs("#p-notes").value.trim() || null,
  };

  const { error } = await window.supabaseClient.from("application_payments").insert(payload);
  setLoading(btn, false);

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  toast("Payment added successfully.");
  closeModal("payment-modal");
  await loadPayments();
}

async function deletePayment(id) {
  const ok = await confirmDelete("Delete Payment?", "This will remove the payment record.");
  if (!ok) return;
  const { error } = await window.supabaseClient.from("application_payments").delete().eq("id", id);
  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  toast("Payment deleted.");
  await loadPayments();
}

// ---------- DOCUMENTS ----------
async function loadDocuments() {
  const { data, error } = await window.supabaseClient
    .from("application_documents")
    .select("*")
    .eq("application_id", appId)
    .order("created_at", { ascending: false });

  const list = qs("#documents-list");
  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  const docs = data || [];
  if (docs.length === 0) {
    list.innerHTML = `<p class="text-sm text-ink-400 text-center py-6">No documents added yet.</p>`;
    return;
  }
  const statusIcon = { "Verified": "✓", "Uploaded": "✓", "Pending": "⏳", "Required": "○", "Not Required": "—", "Rejected": "✕", "Expired": "⚠" };
  list.innerHTML = docs.map(d => `
    <div class="flex items-center justify-between border border-ink-100 rounded-lg px-3.5 py-2.5">
      <div>
        <p class="text-sm font-medium text-ink-900">${statusIcon[d.status] || "•"} ${escapeHtml(d.document_type)}</p>
        ${d.document_number ? `<p class="text-xs text-ink-400">${escapeHtml(d.document_number)}</p>` : ""}
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-medium px-2 py-0.5 rounded-full ${d.status === "Verified" || d.status === "Uploaded" ? "bg-emerald-100 text-emerald-700" : d.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}">${d.status}</span>
        <button onclick="deleteDocument('${d.id}')" class="text-ink-300 hover:text-red-600 text-xs">✕</button>
      </div>
    </div>`).join("");
}

async function onSaveDocument(e) {
  e.preventDefault();
  const btn = qs("#document-save-btn");
  setLoading(btn, true);

  const file = qs("#d-file").files[0];
  let storagePath = null;
  let fileName = null;

  if (file) {
    fileName = file.name;
    storagePath = `${currentApplication.student_id}/${appId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await window.supabaseClient.storage
      .from("scholarship-documents")
      .upload(storagePath, file);
    if (uploadError) {
      setLoading(btn, false);
      toast(friendlyError(uploadError), "error");
      return;
    }
  }

  const payload = {
    application_id: appId,
    document_type: qs("#d-type").value,
    status: qs("#d-status").value,
    document_number: qs("#d-number").value.trim() || null,
    file_name: fileName,
    storage_path: storagePath,
  };

  const { error } = await window.supabaseClient.from("application_documents").insert(payload);
  setLoading(btn, false);

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  toast("Document uploaded successfully.");
  closeModal("document-modal");
  await loadDocuments();
}

async function deleteDocument(id) {
  const ok = await confirmDelete("Delete Document?", "This will remove the document record.");
  if (!ok) return;
  const { error } = await window.supabaseClient.from("application_documents").delete().eq("id", id);
  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  toast("Document deleted.");
  await loadDocuments();
}
