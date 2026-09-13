// Scholarships Controller
let allScholarships = [];
let filteredScholarships = [];
let currentFilter = "ALL";
let currentCategoryFilter = "ALL";
let currentStateFilter = "ALL";
let currentSort = "newest";

document.addEventListener("DOMContentLoaded", async () => {
  renderLayout("scholarships", "Scholarships Schemes");
  setupScholarshipFilterDropdowns();
  await loadScholarships();

  qs("#search-input")?.addEventListener("input", debounce(() => {
    applyScholarshipFilters();
  }, 200));

  qs("#status-filter")?.addEventListener("change", (e) => {
    currentFilter = e.target.value;
    applyScholarshipFilters();
  });

  qs("#scheme-category-filter")?.addEventListener("change", (e) => {
    currentCategoryFilter = e.target.value;
    applyScholarshipFilters();
  });

  qs("#state-filter")?.addEventListener("change", (e) => {
    currentStateFilter = e.target.value;
    applyScholarshipFilters();
  });

  qs("#sort-filter")?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyScholarshipFilters();
  });

  qs("#scholarship-form")?.addEventListener("submit", onSaveScholarship);

  if (getParam("new") === "1") openScholarshipForm();
});

function setupScholarshipFilterDropdowns() {
  const stateSel = qs("#state-filter");
  if (stateSel && typeof getStateOptionsHtml === "function") {
    stateSel.innerHTML = getStateOptionsHtml("", "All States / Pan-India");
  }
}

function resetScholarshipFilters() {
  if (qs("#search-input")) qs("#search-input").value = "";
  if (qs("#status-filter")) qs("#status-filter").value = "ALL";
  if (qs("#scheme-category-filter")) qs("#scheme-category-filter").value = "ALL";
  if (qs("#state-filter")) qs("#state-filter").value = "ALL";
  if (qs("#sort-filter")) qs("#sort-filter").value = "newest";

  currentFilter = "ALL";
  currentCategoryFilter = "ALL";
  currentStateFilter = "ALL";
  currentSort = "newest";

  applyScholarshipFilters();
}

async function loadScholarships() {
  const { data, error } = await window.supabaseClient
    .from("scholarships")
    .select("*, scholarship_applications(id, status)")
    .order("created_at", { ascending: false });

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  allScholarships = data || [];
  applyScholarshipFilters();
}


function renderFilterChips() {
  const container = document.getElementById("active-filters-chips");
  if (!container) return;
  container.innerHTML = "";
  
  const addChip = (label, value, selectId) => {
    if (value && value !== "ALL") {
      const el = document.createElement("div");
      el.className = "px-2 py-1 bg-gold-100 text-gold-900 border border-gold-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition";
      el.innerHTML = `${label} &times;`;
      el.onclick = () => {
        document.getElementById(selectId).value = "ALL";
        applyScholarshipFilters();
      };
      container.appendChild(el);
    }
  };
  
  if (document.getElementById("status-filter")) addChip(document.getElementById("status-filter").options[document.getElementById("status-filter").selectedIndex].text, document.getElementById("status-filter").value, "status-filter");
  if (document.getElementById("state-filter")) addChip(document.getElementById("state-filter").options[document.getElementById("state-filter").selectedIndex].text, document.getElementById("state-filter").value, "state-filter");
  if (document.getElementById("scheme-category-filter")) addChip(document.getElementById("scheme-category-filter").options[document.getElementById("scheme-category-filter").selectedIndex].text, document.getElementById("scheme-category-filter").value, "scheme-category-filter");
}

function applyScholarshipFilters() {
  const query = (qs("#search-input")?.value || "").trim().toLowerCase();

  filteredScholarships = allScholarships.filter(s => {
    const matchesSearch = !query ||
      (s.name || "").toLowerCase().includes(query) ||
      (s.provider || "").toLowerCase().includes(query) ||
      (s.category || "").toLowerCase().includes(query) ||
      (s.description || "").toLowerCase().includes(query) ||
      (s.eligibility_criteria || "").toLowerCase().includes(query);

    const matchesStatus = currentFilter === "ALL" ||
      (currentFilter === "ACTIVE" && s.is_active) ||
      (currentFilter === "INACTIVE" && !s.is_active);

    const schCat = (s.category || "").toLowerCase();
    const matchesCategory = currentCategoryFilter === "ALL" ||
      schCat.includes(currentCategoryFilter.toLowerCase());

    const schState = (s.state || "").toLowerCase();
    const matchesState = currentStateFilter === "ALL" ||
      !s.state || s.state === "All India" ||
      schState.includes(currentStateFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesCategory && matchesState;
  });

  filteredScholarships.sort((a, b) => {
    if (currentSort === "amount-desc") {
      const amtA = Number(a.scholarship_amount || a.maximum_amount || 0);
      const amtB = Number(b.scholarship_amount || b.maximum_amount || 0);
      return amtB - amtA;
    }
    if (currentSort === "name-asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  renderScholarships(filteredScholarships);
}

function renderScholarships(list) {
  const grid = qs("#scholarships-grid");
  const countEl = qs("#result-count");
  if (!grid) return;

  if (countEl) countEl.textContent = `${list.length} scheme${list.length === 1 ? "" : "s"}`;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-ink-100">
        <div class="w-12 h-12 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center mx-auto text-xl mb-3">📜</div>
        <p class="text-sm font-semibold text-ink-700">No scholarships match your search.</p>
        <p class="text-xs text-ink-400 mt-1 mb-4">Add a scholarship scheme to start tracking student enrollments.</p>
        <button onclick="openScholarshipForm()" class="bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold rounded-xl px-4 py-2.5 shadow-xs transition">+ Add Scholarship</button>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(s => {
    const apps = s.scholarship_applications || [];
    const approved = apps.filter(a => ["Approved", "Amount Received", "Closed"].includes(a.status)).length;
    const amount = s.scholarship_amount || s.maximum_amount || 0;
    const commPct = s.commission_percentage || 10;

    return `
      <div class="card-interactive bg-white border border-ink-100 rounded-2xl shadow-card hover:border-gold-400 hover:shadow-md transition flex flex-col justify-between h-full group p-4 sm:p-5">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-ink-100 text-ink-500"}">
              ${s.is_active ? "Active" : "Archived"}
            </span>
            <span class="font-display font-bold text-sm text-ink-900">${formatCurrency(amount)}</span>
          </div>

          <div>
            <h3 class="font-display font-bold text-sm text-ink-900 group-hover:text-gold-700 transition leading-snug line-clamp-2 min-h-[2.5rem]" title="${escapeHtml(s.name)}">
              ${escapeHtml(s.name)}
            </h3>
            <p class="text-xs text-ink-500 mt-0.5 font-medium truncate">${escapeHtml(s.provider || "Official Scheme")} · ${escapeHtml(s.academic_year || "2026-2027")}</p>
          </div>

          <div class="flex flex-wrap gap-1.5 text-[10px] pt-1">
            <span class="bg-ink-50 text-ink-700 border border-ink-100 px-2 py-0.5 rounded-md font-semibold">Category: ${escapeHtml(s.category || "All")}</span>
            <span class="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">State: ${escapeHtml(s.eligible_state || s.state || "All India")}</span>
            ${s.income_limit ? `<span class="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">Income ≤ ₹${Number(s.income_limit).toLocaleString('en-IN')}</span>` : ""}
            ${s.min_percentage ? `<span class="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md font-semibold">Min ${s.min_percentage}%</span>` : ""}
            ${s.show_to_students !== false 
              ? `<span class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">🎓 Portal Visible</span>`
              : `<span class="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md font-semibold">🔒 Hidden</span>`}
            ${s.end_date ? `<span class="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-semibold">Ends: ${formatDate(s.end_date)}</span>` : ""}
          </div>
        </div>

        <!-- Aligned Action Footer with Strict Button Heights & Grid -->
        <div class="mt-4 pt-3 border-t border-ink-100/80 space-y-2">
          <div class="flex items-center justify-between text-[11px]">
            <div class="flex items-center gap-1.5 font-medium">
              <span class="px-2 py-0.5 rounded-md font-semibold text-ink-700 bg-ink-50 border border-ink-200/80">
                👥 ${apps.length} ${apps.length === 1 ? "Applied" : "Applied"}
              </span>
              ${approved > 0 ? `<span class="px-1.5 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px]">✓ ${approved} Approved</span>` : ""}
            </div>
            <span class="text-[10px] font-semibold text-gold-800 bg-gold-50 border border-gold-200 px-1.5 py-0.5 rounded">Comm: ${commPct}%</span>
          </div>

          <!-- Action Buttons: Balanced flex layout with consistent heights -->
          <div class="flex items-center gap-2 pt-0.5">
            <button type="button" onclick="deleteScholarship('${s.id}', '${escapeHtml(s.name).replace(/'/g, "\\'")}')" class="h-9 w-9 rounded-xl border border-ink-200 hover:border-red-300 hover:bg-red-50 active:bg-red-100 text-ink-400 hover:text-red-600 flex items-center justify-center transition shrink-0 cursor-pointer" title="Delete Scheme">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            <button type="button" onclick='openScholarshipForm(${JSON.stringify(s).replace(/'/g, "&apos;")})' class="flex-1 h-9 px-2 rounded-xl border border-ink-200 hover:border-ink-300 hover:bg-ink-50 active:bg-ink-100 text-ink-700 hover:text-ink-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition whitespace-nowrap min-w-0 cursor-pointer" title="Edit Scheme">
              <span>✏️</span>
              <span class="truncate">Edit</span>
            </button>
            <a href="application.html?scholarship_id=${s.id}" class="flex-1 h-9 px-2.5 rounded-xl bg-ink-900 hover:bg-ink-800 active:bg-ink-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs whitespace-nowrap min-w-0" title="Enroll Student">
              <span>+</span>
              <span class="truncate">Enroll</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function openScholarshipForm(s = null) {
  qs("#scholarship-form").reset();
  if (qs("#s-id")) qs("#s-id").value = "";
  if (qs("#s-active")) qs("#s-active").checked = true;
  if (qs("#s-show-to-students")) qs("#s-show-to-students").checked = true;
  if (qs("#s-manual-review")) qs("#s-manual-review").checked = false;
  if (qs("#s-renewal")) qs("#s-renewal").checked = false;
  
  if (qs("#s-state")) qs("#s-state").value = "Any";
  if (qs("#s-gender")) qs("#s-gender").value = "Any";
  if (qs("#s-institution")) qs("#s-institution").value = "Any";
  
  document.querySelectorAll('#s-course-level-container input').forEach(cb => cb.checked = false);
  document.querySelectorAll('#s-category-container input').forEach(cb => cb.checked = false);

  qs("#scholarship-modal-title").textContent = s ? "Edit Scholarship Scheme" : "Add Scholarship Scheme";

  if (s) {
    if (qs("#s-id")) qs("#s-id").value = s.id || "";
    if (qs("#s-name")) qs("#s-name").value = s.name || "";
    if (qs("#s-provider")) qs("#s-provider").value = s.provider || "";
    if (qs("#s-description")) qs("#s-description").value = s.description || "";
    
    if (qs("#s-max-amount")) qs("#s-max-amount").value = s.scholarship_amount || s.maximum_amount || "";
    if (qs("#s-awards-count")) qs("#s-awards-count").value = s.awards_count || "";
    if (qs("#s-income-limit")) qs("#s-income-limit").value = s.income_limit || "";
    if (qs("#s-min-income")) qs("#s-min-income").value = s.min_income || "";
    if (qs("#s-min-pct")) qs("#s-min-pct").value = s.min_percentage || "";
    if (qs("#s-max-pct")) qs("#s-max-pct").value = s.max_pct || "";
    
    if (qs("#s-gender")) qs("#s-gender").value = s.gender || s.gender_eligibility || "Any";
    if (qs("#s-state")) qs("#s-state").value = s.state || s.eligible_state || "Any";
    if (qs("#s-institution")) qs("#s-institution").value = s.institution_type || "Any";
    
    if (qs("#s-stream")) qs("#s-stream").value = s.req_stream || "";
    if (qs("#s-subjects")) qs("#s-subjects").value = s.req_subjects || "";
    if (qs("#s-age-limit")) qs("#s-age-limit").value = s.age_limit || "";
    
    if (qs("#s-start")) qs("#s-start").value = s.start_date || "";
    if (qs("#s-end")) qs("#s-end").value = s.end_date || "";
    if (qs("#s-official-url")) qs("#s-official-url").value = s.official_url || "";
    if (qs("#s-application-url")) qs("#s-application-url").value = s.application_url || "";
    if (qs("#s-eligibility")) qs("#s-eligibility").value = s.eligibility || "";
    
    if (qs("#s-active")) qs("#s-active").checked = s.active !== undefined ? s.active : s.is_active !== false;
    if (qs("#s-show-to-students")) qs("#s-show-to-students").checked = s.show_to_students !== false;
    if (qs("#s-manual-review")) qs("#s-manual-review").checked = Boolean(s.manual_review_required || s.manual_review);
    if (qs("#s-renewal")) qs("#s-renewal").checked = Boolean(s.renewal);
    
    const cLevels = (s.course_level || "").split(',').map(x => x.trim());
    document.querySelectorAll('#s-course-level-container input').forEach(cb => {
      cb.checked = cLevels.includes(cb.value);
    });
    
    const cats = (s.category || "").split(',').map(x => x.trim());
    document.querySelectorAll('#s-category-container input').forEach(cb => {
      cb.checked = cats.includes(cb.value);
    });
  }
  openModal("scholarship-modal");
}

async function onSaveScholarship(e) {
  e.preventDefault();
  const btn = qs("#scholarship-save-btn");
  setLoading(btn, true);

  const id = qs("#s-id").value;
  const maxAmt = qs("#s-max-amount").value ? Number(qs("#s-max-amount").value) : 0;
  const payload = {
      name: document.getElementById("s-name").value.trim(),
      provider: document.getElementById("s-provider").value.trim(),
      description: document.getElementById("s-description").value.trim(),
      official_url: document.getElementById("s-official-url").value.trim(),
      application_url: document.getElementById("s-application-url").value.trim(),
      start_date: document.getElementById("s-start").value || null,
      end_date: document.getElementById("s-end").value || null,
      scholarship_amount: document.getElementById("s-max-amount").value ? parseFloat(document.getElementById("s-max-amount").value) : null,
      maximum_amount: document.getElementById("s-max-amount").value ? parseFloat(document.getElementById("s-max-amount").value) : null,
      awards_count: document.getElementById("s-awards-count").value ? parseInt(document.getElementById("s-awards-count").value, 10) : null,
      renewal: document.getElementById("s-renewal").checked,
      active: document.getElementById("s-active").checked,
      
      course_level: Array.from(document.querySelectorAll('#s-course-level-container input:checked')).map(cb => cb.value).join(', '),
      category: Array.from(document.querySelectorAll('#s-category-container input:checked')).map(cb => cb.value).join(', '),
      
      min_percentage: document.getElementById("s-min-pct").value ? parseFloat(document.getElementById("s-min-pct").value) : null,
      max_pct: document.getElementById("s-max-pct").value ? parseFloat(document.getElementById("s-max-pct").value) : null,
      req_stream: document.getElementById("s-stream").value.trim(),
      req_subjects: document.getElementById("s-subjects").value.trim(),
      
      income_limit: document.getElementById("s-income-limit").value ? parseFloat(document.getElementById("s-income-limit").value) : null,
      min_income: document.getElementById("s-min-income").value ? parseFloat(document.getElementById("s-min-income").value) : null,
      
      gender: document.getElementById("s-gender").value,
      state: document.getElementById("s-state").value,
      age_limit: document.getElementById("s-age-limit").value ? parseInt(document.getElementById("s-age-limit").value, 10) : null,
      institution_type: document.getElementById("s-institution").value,
      
      eligibility: document.getElementById("s-eligibility").value.trim(),
      
      academic_year: document.getElementById("s-year")?.value || "2024-2025",
      show_to_students: document.getElementById("s-show-to-students")?.checked || true,
      manual_review: document.getElementById("s-manual-review")?.checked || false
    };

  const sb = window.supabaseClient;
  const { error } = id
    ? await sb.from("scholarships").update(payload).eq("id", id)
    : await sb.from("scholarships").insert(payload);

  setLoading(btn, false);

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }

  toast(id ? "✓ Scholarship updated successfully." : "✓ Scholarship scheme created.", "success");
  closeModal("scholarship-modal");
  await loadScholarships();
}

async function deleteScholarship(id, name) {
  const ok = await confirmDelete("Delete Scheme?", `Remove "${name}" from schemes catalog?`);
  if (!ok) return;
  const { error } = await window.supabaseClient.from("scholarships").delete().eq("id", id);
  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  toast("Scholarship removed.");
  await loadScholarships();
}

window.openAIScholarshipModal = function() {
  document.getElementById("ai-scholarship-modal").classList.remove("hidden");
  document.getElementById("ai-source-text").value = "";
};

window.closeAIScholarshipModal = function() {
  document.getElementById("ai-scholarship-modal").classList.add("hidden");
};

window.generateScholarshipFromAI = async function() {
  const text = document.getElementById("ai-source-text").value.trim();
  if (!text) {
    toast("Please enter scholarship text or URL.", "error");
    return;
  }
  const btn = document.getElementById("ai-generate-btn");
  const origBtnText = btn.innerHTML;
  btn.innerHTML = "<span>✨</span> Extracting...";
  btn.disabled = true;
  
  try {
    const res = await fetch("/api/ai/scholarship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);
    
    // Fill the form fields with extracted data
    document.getElementById("s-name").value = data.name || "";
    document.getElementById("s-provider").value = data.provider || "";
    document.getElementById("s-description").value = data.description || "";
    document.getElementById("s-official-url").value = data.official_url || "";
    document.getElementById("s-application-url").value = data.application_url || "";
    
    if (data.start_date) document.getElementById("s-start").value = data.start_date;
    if (data.end_date) document.getElementById("s-end").value = data.end_date;
    
    document.getElementById("s-max-amount").value = data.scholarship_amount || "";
    
    // Checkboxes course level
    if (data.course_levels && Array.isArray(data.course_levels)) {
      document.querySelectorAll('#s-course-level-container input').forEach(cb => {
        cb.checked = data.course_levels.includes(cb.value);
      });
    }
    // Checkboxes category
    if (data.categories && Array.isArray(data.categories)) {
      document.querySelectorAll('#s-category-container input').forEach(cb => {
        cb.checked = data.categories.includes(cb.value);
      });
    }
    
    document.getElementById("s-min-pct").value = data.min_percentage || "";
    document.getElementById("s-income-limit").value = data.income_limit || "";
    document.getElementById("s-state").value = data.state || "Any";
    document.getElementById("s-gender").value = data.gender || "Any";
    document.getElementById("s-age-limit").value = data.age_limit || "";
    document.getElementById("s-eligibility").value = data.eligibility_conditions || "";
    
    closeAIScholarshipModal();
    toast("Scholarship data extracted! Please review and Verify.", "success");
  } catch(err) {
    console.error("AI Generation Error:", err);
    toast("AI extraction failed or unavailable. Please fill manually.", "error");
  } finally {
    btn.innerHTML = origBtnText;
    btn.disabled = false;
  }
};
