// Student Payments & Service Fees Controller
let allStudentPayments = [];
let allStudents = [];
let allApplications = [];
let filteredPayments = [];

document.addEventListener("DOMContentLoaded", async () => {
  renderLayout("student-payments", "Student Payments & Service Fees");
  await loadStudentPaymentsData();
});

async function loadStudentPaymentsData() {
  try {
    const sb = window.supabaseClient;
    const [spRes, stRes, appRes] = await Promise.all([
      sb.from("student_payments").select("*").order("created_at", { ascending: false }),
      sb.from("students").select("*"),
      sb.from("scholarship_applications").select("*, scholarships(name)")
    ]);

    allStudentPayments = spRes.data || [];
    allStudents = stRes.data || [];
    allApplications = appRes.data || [];

    // Populate student selector in modal
    populateStudentModalSelect();

    calculateStudentMetrics();
    applyPaymentFilters();
  } catch (err) {
    console.error("Error loading student payments:", err);
    toast("Failed to load student payments data", "error");
  }
}

function calculateStudentMetrics() {
  let totalDue = 0;
  let totalReceived = 0;
  let countPaid = 0;
  let countPartial = 0;

  allStudentPayments.forEach(p => {
    const due = Number(p.fee_due || p.amount || 0);
    const rec = Number(p.amount || 0);
    totalDue += due;
    totalReceived += rec;

    const status = p.status || (rec >= due ? "Paid" : (rec > 0 ? "Partially Paid" : "Unpaid"));
    if (status === "Paid") countPaid++;
    else if (status === "Partially Paid") countPartial++;
  });

  const pending = Math.max(0, totalDue - totalReceived);

  const elDue = document.getElementById("metric-total-due");
  const elRec = document.getElementById("metric-total-received");
  const elPen = document.getElementById("metric-total-pending");
  const elPaid = document.getElementById("metric-count-paid");
  const elPartial = document.getElementById("metric-count-partial");

  if (elDue) elDue.textContent = formatCurrency(totalDue);
  if (elRec) elRec.textContent = formatCurrency(totalReceived);
  if (elPen) elPen.textContent = formatCurrency(pending);
  if (elPaid) elPaid.textContent = countPaid;
  if (elPartial) elPartial.textContent = countPartial;
}

function populateStudentModalSelect() {
  const sel = document.getElementById("modal-student-select");
  if (!sel) return;

  let html = `<option value="">-- Choose Student --</option>`;
  allStudents.forEach(s => {
    const code = s.code || s.student_code || "STU";
    html += `<option value="${s.id}">${s.name} (${code} · ${s.mobile || "No Mobile"})</option>`;
  });
  sel.innerHTML = html;
}

function applyPaymentFilters() {
  const query = (document.getElementById("sp-search")?.value || "").toLowerCase().trim();
  const statusFilter = document.getElementById("sp-status-filter")?.value || "ALL";
  const typeFilter = document.getElementById("sp-type-filter")?.value || "ALL";

  filteredPayments = allStudentPayments.filter(p => {
    const student = allStudents.find(s => s.id === p.student_id) || {};
    const name = (student.name || "").toLowerCase();
    const code = (student.code || student.student_code || "").toLowerCase();
    const mobile = (student.mobile || "").toLowerCase();
    const ref = (p.reference_no || "").toLowerCase();

    const matchesQuery = !query ||
      name.includes(query) ||
      code.includes(query) ||
      mobile.includes(query) ||
      ref.includes(query);

    const feeDue = Number(p.fee_due || p.amount || 0);
    const rec = Number(p.amount || 0);
    const status = p.status || (rec >= feeDue ? "Paid" : (rec > 0 ? "Partially Paid" : "Unpaid"));

    const matchesStatus = statusFilter === "ALL" || status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === "ALL" || (p.payment_type || "").toLowerCase() === typeFilter.toLowerCase();

    return matchesQuery && matchesStatus && matchesType;
  });

  renderPaymentsTable();
}

function renderPaymentsTable() {
  const tbody = document.getElementById("student-payments-tbody");
  const countEl = document.getElementById("payment-row-count");
  if (!tbody) return;

  if (countEl) countEl.textContent = `${filteredPayments.length} records`;

  if (filteredPayments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-12 text-ink-400">
          <p class="font-medium text-sm text-ink-600">No payment records found.</p>
          <button onclick="resetPaymentFilters()" class="mt-2 text-xs text-gold-600 font-semibold hover:underline">Reset Filters</button>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filteredPayments.map(p => {
    const student = allStudents.find(s => s.id === p.student_id) || {};
    const app = allApplications.find(a => a.id === p.application_id);
    const schName = app ? (app.scholarships?.name || "Linked Application") : "General Center Fee";

    const feeDue = Number(p.fee_due || p.amount || 0);
    const received = Number(p.amount || 0);
    const balance = Math.max(0, feeDue - received);

    let statusBadge = "";
    if (balance <= 0 && feeDue > 0) {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Fully Paid</span>`;
    } else if (received > 0) {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Partially Paid</span>`;
    } else {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Unpaid</span>`;
    }

    return `
      <tr class="hover:bg-ink-50/50 transition">
        <td class="px-4 py-3.5">
          <a href="student.html?id=${student.id || ""}" class="font-bold text-ink-900 hover:text-gold-600 hover:underline block">
            ${escapeHtml(student.name || "Student")}
          </a>
          <span class="text-[10px] text-ink-400 font-mono">${escapeHtml(student.code || student.student_code || "STU")} · ${escapeHtml(student.mobile || "—")}</span>
        </td>
        <td class="px-4 py-3.5">
          <p class="font-semibold text-ink-800 truncate max-w-[180px]">${escapeHtml(schName)}</p>
          <span class="text-[10px] bg-ink-100 text-ink-600 px-1.5 py-0.5 rounded">${escapeHtml(p.payment_type || "Fee")}</span>
        </td>
        <td class="px-4 py-3.5 text-right font-bold text-ink-900">${formatCurrency(feeDue)}</td>
        <td class="px-4 py-3.5 text-right font-bold text-emerald-700">${formatCurrency(received)}</td>
        <td class="px-4 py-3.5 text-right font-bold ${balance > 0 ? "text-amber-700" : "text-emerald-700"}">${formatCurrency(balance)}</td>
        <td class="px-4 py-3.5 text-center">${statusBadge}</td>
        <td class="px-4 py-3.5 text-xs text-ink-500">
          ${p.payment_date ? formatDate(p.payment_date) : "—"}
          <span class="block text-[10px] text-ink-400">${escapeHtml(p.payment_mode || "")}</span>
        </td>
        <td class="px-4 py-3.5 text-right">
          <button onclick="openPaymentHistoryModal('${p.student_id}')" class="px-2.5 py-1 bg-white hover:bg-ink-100 text-ink-800 border border-ink-200 text-[11px] font-semibold rounded-lg shadow-xs transition">
            History
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function resetPaymentFilters() {
  const search = document.getElementById("sp-search");
  const status = document.getElementById("sp-status-filter");
  const type = document.getElementById("sp-type-filter");
  if (search) search.value = "";
  if (status) status.value = "ALL";
  if (type) type.value = "ALL";
  applyPaymentFilters();
}

function openRecordPaymentModal(studentId = null) {
  const modal = document.getElementById("record-student-payment-modal");
  const form = document.getElementById("record-payment-form");
  if (!modal) return;
  if (form) form.reset();

  const dateInput = document.getElementById("modal-payment-date");
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  const sel = document.getElementById("modal-student-select");
  if (sel && studentId) {
    sel.value = studentId;
    onPaymentStudentSelected(studentId);
  }

  calculatePaymentBalance();
  modal.classList.remove("hidden");
}

function closeRecordPaymentModal() {
  document.getElementById("record-student-payment-modal")?.classList.add("hidden");
}

function onPaymentStudentSelected(studentId) {
  const appSel = document.getElementById("modal-application-select");
  if (!appSel) return;

  if (!studentId) {
    appSel.innerHTML = `<option value="">General Center Fee (Not tied to single application)</option>`;
    return;
  }

  const studentApps = allApplications.filter(a => a.student_id === studentId);
  let html = `<option value="">General Center Fee (Not tied to single application)</option>`;
  studentApps.forEach(a => {
    const sch = a.scholarships?.name || "Scholarship";
    html += `<option value="${a.id}">#${a.application_number || a.id.slice(0, 8)} - ${sch}</option>`;
  });
  appSel.innerHTML = html;

  // Calculate prior payments made by this student
  const studentPayments = allStudentPayments.filter(p => p.student_id === studentId);
  const prevPaid = studentPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const prevDisplay = document.getElementById("modal-prev-paid-display");
  if (prevDisplay) prevDisplay.textContent = formatCurrency(prevPaid);

  calculatePaymentBalance();
}

function onPaymentApplicationSelected(appId) {
  calculatePaymentBalance();
}

function calculatePaymentBalance() {
  const feeDue = parseFloat(document.getElementById("modal-fee-due-input")?.value || 0);
  const currentPay = parseFloat(document.getElementById("modal-payment-amount")?.value || 0);
  
  const currentDisplay = document.getElementById("modal-current-pay-display");
  if (currentDisplay) currentDisplay.textContent = formatCurrency(currentPay);

  const balance = Math.max(0, feeDue - currentPay);
  const balDisplay = document.getElementById("modal-balance-display");
  if (balDisplay) balDisplay.textContent = formatCurrency(balance);

  const statusBadge = document.getElementById("modal-status-badge");
  if (statusBadge) {
    if (balance <= 0 && feeDue > 0) {
      statusBadge.textContent = "Fully Paid";
      statusBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800";
    } else if (currentPay > 0) {
      statusBadge.textContent = "Partially Paid";
      statusBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800";
    } else {
      statusBadge.textContent = "Unpaid";
      statusBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800";
    }
  }
}

async function handleSaveStudentPayment(e) {
  e.preventDefault();
  const studentId = document.getElementById("modal-student-select").value;
  const appId = document.getElementById("modal-application-select").value || null;
  const feeDue = parseFloat(document.getElementById("modal-fee-due-input").value) || 0;
  const amount = parseFloat(document.getElementById("modal-payment-amount").value);
  const date = document.getElementById("modal-payment-date").value;
  const type = document.getElementById("modal-payment-type").value;
  const mode = document.getElementById("modal-payment-mode").value;
  const utr = document.getElementById("modal-utr").value.trim() || null;
  const ref = document.getElementById("modal-ref-no").value.trim() || null;
  const receivedBy = document.getElementById("modal-received-by").value.trim() || "Admin";
  const remarks = document.getElementById("modal-remarks").value.trim() || null;

  if (!studentId || isNaN(amount) || amount <= 0) {
    toast("Please select a student and enter a valid amount", "error");
    return;
  }

  const btn = document.getElementById("save-payment-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";

  const status = (amount >= feeDue && feeDue > 0) ? "Paid" : (amount > 0 ? "Partially Paid" : "Unpaid");

  try {
    const payload = {
      student_id: studentId,
      application_id: appId,
      fee_due: feeDue,
      amount: amount,
      payment_date: date,
      payment_type: type,
      payment_mode: mode,
      reference_no: utr || ref,
      status: status,
      received_by: receivedBy,
      remarks: remarks
    };

    const { error } = await window.supabaseClient.from("student_payments").insert(payload);
    if (error) throw error;

    toast("✓ Student payment recorded successfully!", "success");
    closeRecordPaymentModal();
    await loadStudentPaymentsData();
  } catch (err) {
    console.error("Save payment error:", err);
    toast("Failed to record payment: " + (err.message || ""), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Payment";
  }
}

function openPaymentHistoryModal(studentId) {
  const modal = document.getElementById("payment-history-modal");
  if (!modal) return;

  const student = allStudents.find(s => s.id === studentId) || {};
  const history = allStudentPayments.filter(p => p.student_id === studentId);

  document.getElementById("history-modal-title").textContent = `${student.name || "Student"} - Payment History`;
  document.getElementById("history-modal-subtitle").textContent = `${student.code || "STU"} · Mobile: ${student.mobile || "—"}`;

  const totalPaid = history.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalAssessed = history.reduce((s, p) => s + Number(p.fee_due || p.amount || 0), 0);
  const balance = Math.max(0, totalAssessed - totalPaid);

  const summaryBox = document.getElementById("history-summary-box");
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div><span class="text-ink-400">Total Assessed:</span> <strong class="text-ink-900">${formatCurrency(totalAssessed)}</strong></div>
      <div><span class="text-emerald-700">Total Paid:</span> <strong class="text-emerald-700">${formatCurrency(totalPaid)}</strong></div>
      <div><span class="text-amber-800">Remaining Balance:</span> <strong class="${balance > 0 ? "text-amber-700" : "text-emerald-700"}">${formatCurrency(balance)}</strong></div>
    `;
  }

  const tbody = document.getElementById("history-tbody");
  if (tbody) {
    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-ink-400 text-xs">No prior payments found for this student.</td></tr>`;
    } else {
      tbody.innerHTML = history.map(p => `
        <tr class="hover:bg-ink-50/50">
          <td class="px-3 py-2.5 font-medium">${formatDate(p.payment_date)}</td>
          <td class="px-3 py-2.5 font-bold text-emerald-700">${formatCurrency(p.amount)}</td>
          <td class="px-3 py-2.5">${escapeHtml(p.payment_type || "Fee")}</td>
          <td class="px-3 py-2.5">${escapeHtml(p.payment_mode || "—")}</td>
          <td class="px-3 py-2.5 font-mono text-[11px]">${escapeHtml(p.reference_no || "—")}</td>
          <td class="px-3 py-2.5">${escapeHtml(p.received_by || "Admin")}</td>
          <td class="px-3 py-2.5 text-ink-500">${escapeHtml(p.remarks || "—")}</td>
        </tr>
      `).join("");
    }
  }

  modal.classList.remove("hidden");
}

function exportStudentPaymentsCSV() {
  if (!allStudentPayments.length) {
    toast("No student payments to export", "error");
    return;
  }

  const rows = [
    ["Student Name", "Student Code", "Mobile", "Payment Type", "Fee Due", "Amount Paid", "Payment Date", "Payment Mode", "Reference No", "Status", "Received By", "Remarks"]
  ];

  allStudentPayments.forEach(p => {
    const student = allStudents.find(s => s.id === p.student_id) || {};
    rows.push([
      `"${student.name || ""}"`,
      `"${student.code || student.student_code || ""}"`,
      `"${student.mobile || ""}"`,
      `"${p.payment_type || ""}"`,
      p.fee_due || p.amount || 0,
      p.amount || 0,
      `"${p.payment_date || ""}"`,
      `"${p.payment_mode || ""}"`,
      `"${p.reference_no || ""}"`,
      `"${p.status || ""}"`,
      `"${p.received_by || ""}"`,
      `"${p.remarks || ""}"`
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `scholarledger_student_fees_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("✓ Student Payments CSV exported!", "success");
}
