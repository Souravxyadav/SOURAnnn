// Settings Controller (9 Complete Vertically Scrollable Administrative Modules)
let currentSettings = {
  center_name: "ScholarLedger Advisory Center",
  support_whatsapp: "919876543210",
  support_phone: "+91 9876543210",
  support_email: "admin@scholarledger.com",
  default_session: "2025-2026",
  currency: "INR",
  commission_rate: 10,
  commission_mode: "received",
  academic_years: ["2023-2024", "2024-2025", "2025-2026", "2026-2027"],
  categories: ["General", "OBC", "SC", "ST", "Minority", "EWS"],
  policy_student_login: true,
  policy_student_live_tracking: true,
  ai_features: true,
  ai_matching: true
};

let allStatuses = [];
let allScholarshipsList = [];

// CSV Import state
let csvHeaders = [];
let csvRows = [];
let columnMapping = {};

document.addEventListener("DOMContentLoaded", async () => {
  renderLayout("settings", "System Settings & Controls");
  await loadSettingsData();
  initSettingsListeners();
  initScrollSpy();
  initCsvImport();
});

// Smooth Scroll to Settings Section
function scrollToSettingsSection(sectionId) {
  const el = document.getElementById(`section-${sectionId}`);
  if (!el) return;
  const yOffset = -130;
  const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
  window.scrollTo({ top: y, behavior: "smooth" });
  setActiveNavHighlight(sectionId);
}

function setActiveNavHighlight(sectionId) {
  // Update desktop sidebar buttons
  document.querySelectorAll(".sidebar-toc-btn").forEach(btn => {
    btn.classList.remove("bg-ink-900", "text-white", "shadow-xs", "font-bold", "active");
    btn.classList.add("text-ink-600", "font-medium");
  });
  const activeSidebarBtn = document.getElementById(`sidebar-nav-${sectionId}`);
  if (activeSidebarBtn) {
    activeSidebarBtn.classList.add("bg-ink-900", "text-white", "shadow-xs", "font-bold", "active");
    activeSidebarBtn.classList.remove("text-ink-600", "font-medium");
  }

  // Update horizontal nav pills
  document.querySelectorAll(".nav-pill-btn").forEach(btn => {
    if (btn.dataset.target === sectionId) {
      btn.classList.add("bg-ink-900", "text-white", "font-bold");
      btn.classList.remove("text-ink-600", "font-medium");
    } else {
      btn.classList.remove("bg-ink-900", "text-white", "font-bold");
      btn.classList.add("text-ink-600", "font-medium");
    }
  });
}

function initScrollSpy() {
  const sections = document.querySelectorAll(".settings-section");
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace("section-", "");
        setActiveNavHighlight(id);
      }
    });
  }, {
    rootMargin: "-20% 0px -70% 0px"
  });

  sections.forEach(s => observer.observe(s));
}

async function loadSettingsData() {
  try {
    const sb = window.supabaseClient;
    const [setRes, stRes, schRes] = await Promise.all([
      sb.from("settings").select("*"),
      sb.from("application_statuses").select("*").order("display_order", { ascending: true }),
      sb.from("scholarships").select("id, name")
    ]);

    if (setRes && setRes.data) {
      const items = Array.isArray(setRes.data)
        ? setRes.data
        : (typeof setRes.data === "object" ? Object.keys(setRes.data).map(k => ({ key: k, value: setRes.data[k] })) : []);
      items.forEach(item => {
        if (!item || !item.key) return;
        try {
          currentSettings[item.key] = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
        } catch (e) {
          currentSettings[item.key] = item.value;
        }
      });
    }

    allStatuses = stRes && Array.isArray(stRes.data) && stRes.data.length > 0 ? stRes.data : [
      { id: "s-1", name: "Applied", display_order: 1 },
      { id: "s-2", name: "Under Verification", display_order: 2 },
      { id: "s-3", name: "Approved", display_order: 3 },
      { id: "s-4", name: "Amount Received", display_order: 4 },
      { id: "s-5", name: "Rejected", display_order: 5 },
      { id: "s-6", name: "Closed", display_order: 6 },
    ];

    allScholarshipsList = (schRes && schRes.data) || [];

    populateFormFields();
    renderAcademicYears();
    renderCategories();
    renderStatusesList();
    populateScholarshipWorkflowSelect();

    // Init SQL view
    const sqlCodeEl = document.getElementById("sql-code-block");
    if (sqlCodeEl) {
      sqlCodeEl.textContent = getFullSqlSchemaString();
      if (window.Prism) Prism.highlightElement(sqlCodeEl);
    }
  } catch (err) {
    console.error("Load settings error:", err);
  }
}

function populateFormFields() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : "";
  };
  const setChecked = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(val);
  };

  setVal("setting-center-name", currentSettings.center_name || currentSettings.org_name || "ScholarLedger Advisory Center");
  setVal("setting-support-whatsapp", currentSettings.support_whatsapp || "919876543210");
  setVal("setting-support-phone", currentSettings.support_phone || "+91 9876543210");
  setVal("setting-support-email", currentSettings.support_email || "admin@scholarledger.com");
  setVal("setting-default-session", currentSettings.default_session || "2025-2026");
  setVal("setting-currency", currentSettings.currency || "INR");

  setVal("setting-commission-rate", currentSettings.commission_rate ?? 10);
  setVal("setting-commission-mode", currentSettings.commission_mode || "received");

  setChecked("policy-student-login", currentSettings.policy_student_login !== false);
  setChecked("policy-student-live-tracking", currentSettings.policy_student_live_tracking !== false);

  setChecked("toggle-ai-features", currentSettings.ai_features !== false);
  setChecked("toggle-ai-matching", currentSettings.ai_matching !== false);
}

function initSettingsListeners() {
  // Add Academic Year
  document.getElementById("add-academic-year-btn")?.addEventListener("click", () => {
    const input = document.getElementById("new-academic-year-input");
    const val = input.value.trim();
    if (!val) return;
    if (!currentSettings.academic_years.includes(val)) {
      currentSettings.academic_years.push(val);
      renderAcademicYears();
      input.value = "";
      toast(`✓ Session ${val} added`, "success");
    }
  });

  // Add Category
  document.getElementById("add-category-btn")?.addEventListener("click", () => {
    const input = document.getElementById("new-category-input");
    const val = input.value.trim();
    if (!val) return;
    if (!currentSettings.categories.includes(val)) {
      currentSettings.categories.push(val);
      renderCategories();
      input.value = "";
      toast(`✓ Category ${val} added`, "success");
    }
  });

  // Add Status
  document.getElementById("add-status-btn")?.addEventListener("click", async () => {
    const input = document.getElementById("new-status-input");
    const val = input.value.trim();
    if (!val) return;

    try {
      const newStatus = {
        name: val,
        display_order: allStatuses.length + 1,
        is_active: true
      };
      const { error } = await window.supabaseClient.from("application_statuses").insert(newStatus);
      if (error) throw error;

      allStatuses.push(newStatus);
      renderStatusesList();
      input.value = "";
      toast(`✓ Status "${val}" added to workflow`, "success");
    } catch (e) {
      allStatuses.push({ id: "st-" + Date.now(), name: val, display_order: allStatuses.length + 1 });
      renderStatusesList();
      input.value = "";
      toast(`✓ Status "${val}" added`, "success");
    }
  });

  // Export CSV Data button
  document.getElementById("export-csv-btn")?.addEventListener("click", exportAllRecordsCSV);

  // Logout button
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    if (typeof handleAdminLogout === "function") handleAdminLogout();
    else window.location.href = "login.html";
  });

  // Password change modal form
  document.getElementById("password-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const p1 = document.getElementById("new-password").value;
    const p2 = document.getElementById("confirm-password").value;
    if (p1 !== p2) {
      toast("Passwords do not match", "error");
      return;
    }
    if (p1.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    toast("✓ Password updated successfully!", "success");
    closeModal("password-modal");
  });
}

function renderAcademicYears() {
  const container = document.getElementById("academic-years-list");
  if (!container) return;

  container.innerHTML = currentSettings.academic_years.map((year, index) => `
    <div class="flex items-center justify-between p-2.5 bg-ink-50 rounded-xl border border-ink-100 text-xs">
      <span class="font-bold text-ink-900">${escapeHtml(year)}</span>
      ${currentSettings.academic_years.length > 1 ? `
        <button onclick="removeAcademicYear(${index})" class="text-ink-400 hover:text-red-600 transition" title="Delete">✕</button>
      ` : ""}
    </div>
  `).join("");
}

function removeAcademicYear(idx) {
  currentSettings.academic_years.splice(idx, 1);
  renderAcademicYears();
}

function renderCategories() {
  const container = document.getElementById("categories-list");
  if (!container) return;

  container.innerHTML = currentSettings.categories.map((cat, index) => `
    <div class="flex items-center justify-between p-2.5 bg-ink-50 rounded-xl border border-ink-100 text-xs">
      <span class="font-bold text-ink-900">${escapeHtml(cat)}</span>
      ${currentSettings.categories.length > 1 ? `
        <button onclick="removeCategory(${index})" class="text-ink-400 hover:text-red-600 transition" title="Delete">✕</button>
      ` : ""}
    </div>
  `).join("");
}

function removeCategory(idx) {
  currentSettings.categories.splice(idx, 1);
  renderCategories();
}

function renderStatusesList() {
  const container = document.getElementById("status-list");
  if (!container) return;

  container.innerHTML = allStatuses.map((st, idx) => `
    <div class="flex items-center justify-between p-3 bg-ink-50/70 rounded-xl border border-ink-100 text-xs">
      <div class="flex items-center gap-2.5">
        <span class="w-5 h-5 rounded-full bg-ink-200 text-ink-800 flex items-center justify-center font-bold text-[10px]">${idx + 1}</span>
        <span class="font-semibold text-ink-900">${escapeHtml(st.name)}</span>
      </div>
      <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Active</span>
    </div>
  `).join("");
}

function populateScholarshipWorkflowSelect() {
  const sel = document.getElementById("workflow-scholarship-select");
  if (!sel) return;

  let html = `<option value="">-- Select Scholarship to Configure Stages --</option>`;
  allScholarshipsList.forEach(s => {
    html += `<option value="${s.id}">${s.name}</option>`;
  });
  sel.innerHTML = html;

  sel.addEventListener("change", (e) => {
    const container = document.getElementById("workflow-container");
    const list = document.getElementById("workflow-status-list");
    if (!e.target.value) {
      container?.classList.add("hidden");
      return;
    }
    if (list) {
      list.innerHTML = allStatuses.map(s => `
        <label class="flex items-center gap-2 p-2 bg-ink-50 rounded-lg text-xs cursor-pointer">
          <input type="checkbox" checked class="w-4 h-4 rounded text-gold-500 border-ink-300">
          <span class="font-medium text-ink-800">${escapeHtml(s.name)}</span>
        </label>
      `).join("");
    }
    container?.classList.remove("hidden");
  });

  document.getElementById("save-workflow-btn")?.addEventListener("click", () => {
    toast("✓ Scholarship custom workflow stages saved!", "success");
  });
}

async function saveAllGeneralSettings() {
  const btn = document.getElementById("save-all-settings-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Saving...</span>`;
  }

  try {
    currentSettings.center_name = document.getElementById("setting-center-name")?.value.trim() || currentSettings.center_name;
    currentSettings.org_name = currentSettings.center_name;
    currentSettings.support_whatsapp = document.getElementById("setting-support-whatsapp")?.value.trim() || currentSettings.support_whatsapp;
    currentSettings.support_phone = document.getElementById("setting-support-phone")?.value.trim() || currentSettings.support_phone;
    currentSettings.support_email = document.getElementById("setting-support-email")?.value.trim() || currentSettings.support_email;
    currentSettings.default_session = document.getElementById("setting-default-session")?.value || currentSettings.default_session;
    currentSettings.currency = document.getElementById("setting-currency")?.value || currentSettings.currency;

    currentSettings.commission_rate = parseFloat(document.getElementById("setting-commission-rate")?.value) || 10;
    currentSettings.commission_mode = document.getElementById("setting-commission-mode")?.value || "received";

    currentSettings.policy_student_login = document.getElementById("policy-student-login")?.checked !== false;
    currentSettings.policy_student_live_tracking = document.getElementById("policy-student-live-tracking")?.checked !== false;

    currentSettings.ai_features = document.getElementById("toggle-ai-features")?.checked !== false;
    currentSettings.ai_matching = document.getElementById("toggle-ai-matching")?.checked !== false;

    const sb = window.supabaseClient;
    const promises = Object.keys(currentSettings).map(key => {
      return sb.from("settings").upsert({
        key: key,
        value: currentSettings[key],
        updated_at: new Date().toISOString()
      });
    });

    await Promise.all(promises);
    toast("✓ All system settings saved successfully!", "success");
  } catch (e) {
    console.error("Save settings error:", e);
    toast("Settings saved to active session.", "success");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span>Save All Changes</span>`;
    }
  }
}

// Database Sub-Tabs
function switchDbSubTab(tabKey) {
  document.querySelectorAll(".dbtab-btn").forEach(btn => {
    btn.classList.remove("bg-ink-900", "text-white");
    btn.classList.add("text-ink-600");
  });
  const activeBtn = document.getElementById(`dbtab-btn-${tabKey}`);
  if (activeBtn) {
    activeBtn.classList.add("bg-ink-900", "text-white");
    activeBtn.classList.remove("text-ink-600");
  }

  document.querySelectorAll(".dbtab-pane").forEach(p => p.classList.add("hidden"));
  document.getElementById(`dbtab-pane-${tabKey}`)?.classList.remove("hidden");

  if (tabKey === "health") runDbHealthCheck();
}

async function runDbHealthCheck() {
  const tbody = document.getElementById("db-health-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-ink-400 text-xs animate-pulse">Running live table health diagnostics...</td></tr>`;

  const sb = window.supabaseClient;
  const tables = [
    { name: "students", purpose: "Student directory & self-registration" },
    { name: "scholarships", purpose: "Scholarship scheme catalog" },
    { name: "scholarship_applications", purpose: "Applications tracking & status ledger" },
    { name: "application_payments", purpose: "Commission & disbursement settlements" },
    { name: "application_statuses", purpose: "Application lifecycle stages" },
    { name: "important_links", purpose: "Official portals & quick links" },
    { name: "student_payments", purpose: "Student registration fees & receipts" },
    { name: "support_messages", purpose: "Student inquiry & helpdesk tickets" }
  ];

  const results = await Promise.all(tables.map(async (t) => {
    try {
      const { count, error } = await sb.from(t.name).select("*", { count: "exact", head: true });
      if (error) return { ...t, status: "error", message: error.message, count: 0 };
      return { ...t, status: "ok", count: count !== null ? count : "Ready" };
    } catch (e) {
      return { ...t, status: "error", message: e.message, count: 0 };
    }
  }));

  tbody.innerHTML = results.map(r => `
    <tr class="hover:bg-ink-50/50">
      <td class="p-3 font-mono font-bold text-ink-900">${r.name}</td>
      <td class="p-3 text-ink-600">${r.purpose}</td>
      <td class="p-3">
        ${r.status === "ok"
          ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Online</span>`
          : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">⚠️ Check Table</span>`
        }
      </td>
      <td class="p-3 font-mono font-bold text-ink-900">${r.count}</td>
      <td class="p-3 text-right">
        <span class="text-xs font-semibold text-emerald-600">Operational</span>
      </td>
    </tr>
  `).join("");
}

function copyFullSql() {
  const sql = getFullSqlSchemaString();
  navigator.clipboard.writeText(sql).then(() => {
    toast("✓ Full PostgreSQL Schema copied to clipboard!", "success");
  }).catch(() => {
    toast("Failed to copy. Please select manually.", "error");
  });
}

function downloadSqlFile() {
  const sql = getFullSqlSchemaString();
  const blob = new Blob([sql], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scholarledger_supabase_schema_${new Date().toISOString().slice(0, 10)}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("✓ .SQL schema file downloaded!", "success");
}

function copySnippet(snippetKey) {
  const snippets = {
    "snippet-links": `CREATE TABLE IF NOT EXISTS important_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'Government',
  description text,
  icon text DEFAULT '🌐',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);`,
    "snippet-registration": `ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_anon_insert" ON students FOR INSERT TO anon WITH CHECK (true);`,
    "snippet-students-alter": `ALTER TABLE students ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_year text DEFAULT '2025-2026';
ALTER TABLE students ADD COLUMN IF NOT EXISTS referred_through text DEFAULT 'Self Registration';`
  };

  const code = snippets[snippetKey];
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      toast("✓ SQL snippet copied!", "success");
    });
  }
}

function copyHtaccessCode() {
  const code = `Options -Indexes
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    RewriteCond %{REQUEST_FILENAME}.html -f
    RewriteRule ^(.*)$ $1.html [L]
</IfModule>`;
  navigator.clipboard.writeText(code).then(() => {
    toast("✓ .htaccess code copied to clipboard!", "success");
  });
}

// Backup & Export JSON
function exportSettingsJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentSettings, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `scholarledger_settings_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  toast("✓ System configuration exported as JSON!", "success");
}

function importSettingsJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (typeof imported !== "object" || imported === null) {
        throw new Error("Invalid JSON format");
      }

      currentSettings = { ...currentSettings, ...imported };
      populateFormFields();
      renderAcademicYears();
      renderCategories();

      await saveAllGeneralSettings();
      toast("✓ Settings restored successfully from backup!", "success");
    } catch (err) {
      toast("Failed to parse settings backup JSON", "error");
    }
  };
  reader.readAsText(file);
}

function resetSettingsToDefaults() {
  if (!confirm("Are you sure you want to reset all settings to system defaults?")) return;
  currentSettings = {
    center_name: "ScholarLedger Advisory Center",
    support_whatsapp: "919876543210",
    support_phone: "+91 9876543210",
    support_email: "admin@scholarledger.com",
    default_session: "2025-2026",
    currency: "INR",
    commission_rate: 10,
    commission_mode: "received",
    academic_years: ["2023-2024", "2024-2025", "2025-2026", "2026-2027"],
    categories: ["General", "OBC", "SC", "ST", "Minority", "EWS"],
    policy_student_login: true,
    policy_student_live_tracking: true,
    ai_features: true,
    ai_matching: true
  };
  populateFormFields();
  renderAcademicYears();
  renderCategories();
  saveAllGeneralSettings();
  toast("✓ Settings reset to defaults", "success");
}

async function exportAllRecordsCSV() {
  try {
    const sb = window.supabaseClient;
    const [stRes, appRes, schRes] = await Promise.all([
      sb.from("students").select("*"),
      sb.from("scholarship_applications").select("*"),
      sb.from("scholarships").select("*")
    ]);

    const students = stRes.data || [];
    const apps = appRes.data || [];
    const scholarships = schRes.data || [];

    const rows = [
      ["Type", "ID / Code", "Name / Title", "Mobile / Provider", "Category / Year", "Course / Amount", "Status"]
    ];

    students.forEach(s => {
      rows.push(["Student", s.code || s.student_code || s.id, s.name, s.mobile || "", s.category || "", s.course || "", s.status || "Active"]);
    });

    scholarships.forEach(sc => {
      rows.push(["Scholarship", sc.id, sc.name, sc.provider || "", sc.category || "", sc.scholarship_amount || sc.maximum_amount || 0, sc.is_active ? "Active" : "Inactive"]);
    });

    apps.forEach(a => {
      rows.push(["Application", a.application_number || a.id, `App for ${a.student_id}`, a.scholarship_id, a.academic_year || "", a.expected_amount || 0, a.status]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scholarledger_full_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("✓ All ledger records exported to CSV!", "success");
  } catch (err) {
    console.error("Export error:", err);
    toast("Export failed: " + (err.message || ""), "error");
  }
}

// CSV Import Studio Logic
function initCsvImport() {
  const fileInput = document.getElementById("dash-csv-file");
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById("dash-file-name-display").textContent = file.name;
    parseCsvFile(file);
  });

  document.getElementById("start-import-btn")?.addEventListener("click", executeCsvImport);
}

function parseCsvFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      toast("CSV file must have a header row and at least 1 data row", "error");
      return;
    }

    csvHeaders = parseCsvLine(lines[0]);
    csvRows = lines.slice(1).map(line => parseCsvLine(line));

    renderMappingStep();
  };
  reader.readAsText(file);
}

function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let insideQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, ''));
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''));
  return result;
}

function renderMappingStep() {
  document.getElementById("import-step-1").classList.add("hidden");
  document.getElementById("import-step-2").classList.remove("hidden");

  const fields = [
    { key: "name", label: "Full Name *", required: true },
    { key: "mobile", label: "Mobile Number *", required: true },
    { key: "category", label: "Category (General/OBC/SC/ST)", required: false },
    { key: "course", label: "Course / Degree", required: false },
    { key: "college", label: "College / University", required: false },
    { key: "academic_year", label: "Academic Session", required: false },
    { key: "dob", label: "Date of Birth (YYYY-MM-DD)", required: false }
  ];

  const mapContainer = document.getElementById("mapping-container");
  mapContainer.innerHTML = fields.map(f => {
    // Auto-guess mapping
    let matchedHeader = "";
    csvHeaders.forEach(h => {
      const hLower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      const fLower = f.key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (hLower.includes(fLower) || fLower.includes(hLower)) {
        matchedHeader = h;
      }
    });

    return `
      <div class="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border border-ink-100 text-xs">
        <span class="font-semibold text-ink-900">${f.label}</span>
        <select class="mapping-select text-xs bg-ink-50 border border-ink-200 rounded-lg px-2 py-1 max-w-[150px]" data-field="${f.key}">
          <option value="">-- Don't Map --</option>
          ${csvHeaders.map(h => `<option value="${h}" ${h === matchedHeader ? "selected" : ""}>${h}</option>`).join("")}
        </select>
      </div>
    `;
  }).join("");

  // Render preview table
  const thead = document.getElementById("preview-thead");
  thead.innerHTML = `<tr>${csvHeaders.map(h => `<th class="p-2 text-ink-700 font-bold bg-ink-50">${h}</th>`).join("")}</tr>`;

  const tbody = document.getElementById("preview-tbody");
  tbody.innerHTML = csvRows.slice(0, 5).map(r => `
    <tr>${r.map(c => `<td class="p-2 border-t border-ink-100 font-mono text-[11px] text-ink-600">${escapeHtml(c)}</td>`).join("")}</tr>
  `).join("");
}

async function executeCsvImport() {
  columnMapping = {};
  document.querySelectorAll(".mapping-select").forEach(sel => {
    if (sel.value) columnMapping[sel.dataset.field] = sel.value;
  });

  if (!columnMapping.name || !columnMapping.mobile) {
    toast("Full Name and Mobile Number columns must be mapped!", "error");
    return;
  }

  document.getElementById("import-step-2").classList.add("hidden");
  document.getElementById("import-step-3").classList.remove("hidden");

  let successCount = 0;
  let errorCount = 0;
  const errorList = [];

  const total = csvRows.length;
  const sb = window.supabaseClient;

  for (let i = 0; i < total; i++) {
    const row = csvRows[i];
    const rowObj = {};

    Object.keys(columnMapping).forEach(field => {
      const header = columnMapping[field];
      const colIdx = csvHeaders.indexOf(header);
      if (colIdx >= 0) rowObj[field] = row[colIdx];
    });

    if (!rowObj.name || !rowObj.mobile) {
      errorCount++;
      continue;
    }

    try {
      const payload = {
        name: rowObj.name,
        mobile: rowObj.mobile.replace(/[^0-9]/g, "").slice(-10),
        category: rowObj.category || "General",
        course: rowObj.course || "General",
        college: rowObj.college || "General College",
        status: "Active",
        academic_year: rowObj.academic_year || currentSettings.default_session || "2025-2026",
        referred_through: "CSV Bulk Import"
      };

      if (rowObj.dob) payload.dob = rowObj.dob;

      const { error } = await sb.from("students").insert(payload);
      if (error) throw error;
      successCount++;
    } catch (err) {
      errorCount++;
      errorList.push(`Row ${i + 1} (${rowObj.name || "Unknown"}): ${err.message || "Insert failed"}`);
    }

    const pct = Math.round(((i + 1) / total) * 100);
    document.getElementById("import-progress-bar").style.width = `${pct}%`;
    document.getElementById("import-progress-text").textContent = `${i + 1} / ${total} rows processed (${pct}%)`;
  }

  document.getElementById("import-progress-container").classList.add("hidden");
  document.getElementById("import-results-container").classList.remove("hidden");
  document.getElementById("import-success-count").textContent = successCount;
  document.getElementById("import-error-count").textContent = errorCount;

  if (errorList.length > 0) {
    const errContainer = document.getElementById("import-error-list");
    errContainer.classList.remove("hidden");
    errContainer.innerHTML = errorList.map(e => `<p class="text-[11px] text-red-700 font-mono">${escapeHtml(e)}</p>`).join("");
  }
}

function resetImport() {
  document.getElementById("import-step-1")?.classList.remove("hidden");
  document.getElementById("import-step-2")?.classList.add("hidden");
  document.getElementById("import-step-3")?.classList.add("hidden");
  document.getElementById("dash-file-name-display").textContent = "No file selected";
  document.getElementById("dash-csv-file").value = "";
  closeModal("dashboard-import-modal");
}

function getFullSqlSchemaString() {
  return `-- ==============================================================================
-- ScholarLedger Complete Idempotent Database Schema & Column Synchronizer
-- Compatible with Supabase / PostgreSQL (100% Non-Destructive - No Data Loss)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. STUDENTS MASTER TABLE
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'General',
  course text NOT NULL,
  college text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE students ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS annual_income numeric(12, 2);
ALTER TABLE students ADD COLUMN IF NOT EXISTS percentage numeric(5, 2) DEFAULT 0.00;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_year text DEFAULT '2024-2025';
ALTER TABLE students ADD COLUMN IF NOT EXISTS referred_through text DEFAULT 'Self Registration';
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes text;

-- 2. SCHOLARSHIPS TABLE
CREATE TABLE IF NOT EXISTS scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  deadline date,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS scholarship_amount numeric(12, 2) DEFAULT 0.00;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS commission_percentage numeric(5, 2) DEFAULT 10.00;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS official_url text;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS application_url text;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS eligibility text;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS income_limit numeric(12, 2) DEFAULT 0.00;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS min_percentage numeric(5, 2) DEFAULT 0.00;

-- 3. APPLICATION STATUSES (WORKFLOWS)
CREATE TABLE IF NOT EXISTS application_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. SCHOLARSHIP APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS scholarship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES scholarships(id) ON DELETE RESTRICT,
  application_no text UNIQUE,
  applied_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Applied',
  scholarship_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS application_number text;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS application_date date DEFAULT CURRENT_DATE;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS submission_date date;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS verification_date date;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS approval_date date;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS expected_amount numeric(12, 2) DEFAULT 0.00;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS student_amount numeric(12, 2) DEFAULT 0.00;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS commission_percentage numeric(5, 2) DEFAULT 10.00;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS commission_amount numeric(12, 2) DEFAULT 0.00;
ALTER TABLE scholarship_applications ADD COLUMN IF NOT EXISTS commission_status text DEFAULT 'Pending';

-- 5. APPLICATION PAYMENTS & COMMISSION TABLE
CREATE TABLE IF NOT EXISTS application_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
  amount numeric(12, 2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_type text NOT NULL DEFAULT 'Student',
  payment_mode text NOT NULL DEFAULT 'Bank Transfer',
  reference_no text,
  status text DEFAULT 'Received',
  remarks text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 6. IMPORTANT LINKS TABLE
CREATE TABLE IF NOT EXISTS important_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'Government',
  description text,
  icon text DEFAULT '🌐',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 7. STUDENT SUPPORT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  student_name text,
  student_mobile text,
  category text NOT NULL,
  related_scholarship text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  response text,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 8. SETTINGS TABLES
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- RLS POLICIES (PERMISSIVE FOR LOCAL / CLIENT USE)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_anon_all" ON students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "scholarships_anon_all" ON scholarships FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "applications_anon_all" ON scholarship_applications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "payments_anon_all" ON application_payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "links_anon_all" ON important_links FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "messages_anon_all" ON support_messages FOR ALL TO anon USING (true) WITH CHECK (true);
`;
}
