// Students Controller
let allStudents = [];
let filteredStudents = [];
let selectedPendingIds = new Set();
let currentStatusFilter = "ALL";
let currentCategoryFilter = "ALL";
let currentStateFilter = "ALL";
let currentCourseFilter = "ALL";
let currentSort = "newest";

document.addEventListener("DOMContentLoaded", async () => {
  renderLayout("students", "Students Directory");
  setupFilterDropdowns();
  await loadStudents();

  // Search filter
  qs("#search-input")?.addEventListener("input", debounce(() => {
    applyStudentFilters();
  }, 200));

  // Status filter dropdown
  qs("#status-filter")?.addEventListener("change", (e) => {
    currentStatusFilter = e.target.value;
    applyStudentFilters();
  });

  // Category filter dropdown
  qs("#category-filter")?.addEventListener("change", (e) => {
    currentCategoryFilter = e.target.value;
    applyStudentFilters();
  });

  // State filter dropdown
  qs("#state-filter")?.addEventListener("change", (e) => {
    currentStateFilter = e.target.value;
    applyStudentFilters();
  });

  // Course filter dropdown
  qs("#course-filter")?.addEventListener("change", (e) => {
    currentCourseFilter = e.target.value;
    applyStudentFilters();
  });

  // Sort filter dropdown
  qs("#sort-filter")?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyStudentFilters();
  });

  // Modal form submit
  qs("#student-form")?.addEventListener("submit", onSaveStudent);

  // URL parameters
  if (getParam("new") === "1") openStudentForm();
  const editId = getParam("edit");
  if (editId) {
    const target = allStudents.find(s => s.id === editId);
    if (target) openStudentForm(target);
  }
});

function setupFilterDropdowns() {
  const stateFilter = qs("#state-filter");
  if (stateFilter && typeof getStateOptionsHtml === "function") {
    stateFilter.innerHTML = getStateOptionsHtml("", "All States (Domicile)");
  }

  const courseFilter = qs("#course-filter");
  if (courseFilter && typeof getCourseOptionsHtml === "function") {
    courseFilter.innerHTML = getCourseOptionsHtml("", "All Courses / Disciplines");
  }
}

function resetStudentFilters() {
  if (qs("#search-input")) qs("#search-input").value = "";
  if (qs("#status-filter")) qs("#status-filter").value = "ALL";
  if (qs("#category-filter")) qs("#category-filter").value = "ALL";
  if (qs("#state-filter")) qs("#state-filter").value = "ALL";
  if (qs("#course-filter")) qs("#course-filter").value = "ALL";
  if (qs("#sort-filter")) qs("#sort-filter").value = "newest";

  currentStatusFilter = "ALL";
  currentCategoryFilter = "ALL";
  currentStateFilter = "ALL";
  currentCourseFilter = "ALL";
  currentSort = "newest";

  applyStudentFilters();
}

async function loadStudents() {
  const { data, error } = await window.supabaseClient
    .from("students")
    .select("*, scholarship_applications(id, status)")
    .order("created_at", { ascending: false });

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  allStudents = data || [];
  applyStudentFilters();
  renderPendingApprovalsSection();
}

function applyStudentFilters() {
  const query = (qs("#search-input")?.value || "").trim().toLowerCase();

  filteredStudents = allStudents.filter(s => {
    const matchesSearch = !query ||
      (s.name || "").toLowerCase().includes(query) ||
      (s.code || s.student_code || "").toLowerCase().includes(query) ||
      (s.mobile || "").toLowerCase().includes(query) ||
      (s.email || "").toLowerCase().includes(query) ||
      (s.aadhaar_number || s.aadhaar || "").toLowerCase().includes(query) ||
      (s.college || "").toLowerCase().includes(query) ||
      (s.course || "").toLowerCase().includes(query) ||
      (s.state || "").toLowerCase().includes(query) ||
      (s.district || "").toLowerCase().includes(query);

    const stStatus = s.status || "Active";
    const matchesStatus = currentStatusFilter === "ALL" || stStatus.toLowerCase() === currentStatusFilter.toLowerCase();

    const stCat = s.category || "General";
    const matchesCategory = currentCategoryFilter === "ALL" || stCat.toLowerCase() === currentCategoryFilter.toLowerCase();

    const stState = s.state || "";
    const matchesState = currentStateFilter === "ALL" || stState.toLowerCase() === currentStateFilter.toLowerCase();

    const stCourse = s.course || "";
    const matchesCourse = currentCourseFilter === "ALL" || stCourse.toLowerCase() === currentCourseFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory && matchesState && matchesCourse;
  });

  // Sorting
  filteredStudents.sort((a, b) => {
    if (currentSort === "name-asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (currentSort === "score-desc") {
      return (Number(b.previous_percentage || b.percentage || 0)) - (Number(a.previous_percentage || a.percentage || 0));
    }
    if (currentSort === "income-asc") {
      return (Number(a.annual_family_income || a.family_income || 0)) - (Number(b.annual_family_income || b.family_income || 0));
    }
    // newest default
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  renderStudents(filteredStudents);
}

function renderPendingApprovalsSection() {
  const container = document.getElementById("pending-approvals-section");
  if (!container) return;

  const pendingStudents = allStudents.filter(s => (s.status || "").toLowerCase() === "pending");
  const countBadge = document.getElementById("pending-count-badge");
  if (countBadge) countBadge.textContent = `${pendingStudents.length} Pending Registration${pendingStudents.length === 1 ? "" : "s"}`;

  if (pendingStudents.length === 0) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  const listEl = document.getElementById("pending-students-list");
  if (!listEl) return;

  listEl.innerHTML = pendingStudents.map(s => `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <input type="checkbox" value="${s.id}" onchange="togglePendingSelect('${s.id}')" ${selectedPendingIds.has(s.id) ? "checked" : ""} class="w-4 h-4 rounded text-amber-600 border-amber-300 shrink-0">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold text-sm text-ink-900 truncate">${escapeHtml(s.name)}</span>
            <span class="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">${escapeHtml(s.mobile || "")}</span>
          </div>
          <p class="text-xs text-ink-600 mt-0.5 truncate">
            ${escapeHtml(s.course || "No Course")} · ${escapeHtml(s.college || "No College")} · ${escapeHtml(s.category || "General")}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
        <button onclick="approveSingleStudent('${s.id}')" class="h-8 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-xs transition">
          ✓ Approve
        </button>
        <button onclick="rejectSingleStudent('${s.id}')" class="h-8 px-3 bg-white hover:bg-red-50 active:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition">
          Reject
        </button>
      </div>
    </div>
  `).join("");
}

function togglePendingSelect(id) {
  if (selectedPendingIds.has(id)) {
    selectedPendingIds.delete(id);
  } else {
    selectedPendingIds.add(id);
  }
}

function toggleSelectAllPending(cb) {
  const pending = allStudents.filter(s => (s.status || "").toLowerCase() === "pending");
  if (cb.checked) {
    pending.forEach(s => selectedPendingIds.add(s.id));
  } else {
    selectedPendingIds.clear();
  }
  renderPendingApprovalsSection();
}

async function approveSingleStudent(id) {
  try {
    const { error } = await window.supabaseClient.from("students").update({ status: "Active" }).eq("id", id);
    if (error) throw error;
    toast("✓ Student approved and activated!", "success");
    await loadStudents();
  } catch (e) {
    toast("Failed to approve student: " + e.message, "error");
  }
}

async function rejectSingleStudent(id) {
  if (!confirm("Are you sure you want to reject this registration?")) return;
  try {
    const { error } = await window.supabaseClient.from("students").update({ status: "Inactive" }).eq("id", id);
    if (error) throw error;
    toast("Student marked as inactive", "info");
    await loadStudents();
  } catch (e) {
    toast("Failed: " + e.message, "error");
  }
}

async function approveAllPendingStudents() {
  const pending = allStudents.filter(s => (s.status || "").toLowerCase() === "pending");
  if (pending.length === 0) return;
  if (!confirm(`Approve all ${pending.length} pending students?`)) return;

  try {
    const ids = pending.map(s => s.id);
    const { error } = await window.supabaseClient.from("students").update({ status: "Active" }).in("id", ids);
    if (error) throw error;
    toast(`✓ Approved all ${pending.length} students!`, "success");
    selectedPendingIds.clear();
    await loadStudents();
  } catch (e) {
    toast("Error: " + e.message, "error");
  }
}

async function bulkApproveSelectedStudents() {
  if (selectedPendingIds.size === 0) {
    toast("Please select students using the checkboxes first", "info");
    return;
  }
  try {
    const ids = Array.from(selectedPendingIds);
    const { error } = await window.supabaseClient.from("students").update({ status: "Active" }).in("id", ids);
    if (error) throw error;
    toast(`✓ Approved ${ids.length} selected students!`, "success");
    selectedPendingIds.clear();
    await loadStudents();
  } catch (e) {
    toast("Error: " + e.message, "error");
  }
}

function renderStudents(list) {
  const grid = qs("#students-grid");
  const countEl = qs("#result-count");
  if (!grid) return;

  if (countEl) countEl.textContent = `${list.length} student${list.length === 1 ? "" : "s"}`;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-ink-100">
        <div class="w-12 h-12 rounded-2xl bg-ink-50 text-ink-400 mx-auto flex items-center justify-center text-xl mb-3">👥</div>
        <p class="text-sm font-semibold text-ink-700">No students match the selected criteria.</p>
        <p class="text-xs text-ink-400 mt-1 mb-4">Add a new student or clear your filters.</p>
        <button onclick="resetStudentFilters()" class="bg-ink-100 hover:bg-ink-200 text-ink-800 text-xs font-semibold rounded-xl px-4 py-2 transition mr-2">Reset Filters</button>
        <button onclick="openStudentForm()" class="bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold rounded-xl px-4 py-2 shadow-xs transition">+ Add Student</button>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(s => {
    const apps = s.scholarship_applications || [];
    const approved = apps.filter(a => ["Approved", "Amount Received", "Closed"].includes(a.status)).length;
    const studentCode = s.code || s.student_code || `STU-${(s.id || "").slice(0, 6)}`;
    const initials = s.name ? s.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "ST";

    const statusBadge = (s.status || "Active").toLowerCase() === "pending"
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">Pending</span>`
      : ((s.status || "Active").toLowerCase() === "inactive"
          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ink-100 text-ink-500 shrink-0">Inactive</span>`
          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">Active</span>`);

    const incomeVal = s.annual_family_income || s.family_income;
    const scoreVal = s.previous_percentage || s.percentage;

    return `
      <div class="card-interactive bg-white border border-ink-100 rounded-2xl shadow-card hover:border-gold-400 hover:shadow-md transition flex flex-col justify-between h-full group p-4 sm:p-5">
        <!-- Top row: Avatar, Name, Code, and Status -->
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2.5">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-ink-800 to-ink-950 text-gold-400 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-ink-700/50">
                ${initials}
              </div>
              <div class="min-w-0">
                <a href="student.html?id=${s.id}" class="font-display font-bold text-sm text-ink-900 group-hover:text-gold-700 transition hover:underline truncate block" title="${escapeHtml(s.name)}">
                  ${escapeHtml(s.name)}
                </a>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[11px] font-mono text-ink-500 font-semibold">${escapeHtml(studentCode)}</span>
                  ${renderCopyButton(studentCode, 'Student ID')}
                </div>
              </div>
            </div>
            ${statusBadge}
          </div>

          <!-- Academic & College Info -->
          <div class="space-y-1.5 pt-2.5 border-t border-ink-100 text-xs">
            <div class="flex items-center justify-between gap-1 text-ink-800">
              <span class="font-medium truncate flex items-center gap-1" title="${escapeHtml(s.course || 'No course')}">
                <span>📚</span>
                <span class="truncate">${escapeHtml(s.course || "No Course")}</span>
              </span>
              ${s.current_semester || s.semester ? `<span class="text-[10px] font-semibold text-ink-600 bg-ink-100 px-1.5 py-0.5 rounded shrink-0">${escapeHtml(s.current_semester || s.semester)}</span>` : ""}
            </div>

            <p class="text-[11px] text-ink-500 truncate flex items-center gap-1" title="${escapeHtml(s.college || 'College not registered')}">
              <span>🏛️</span>
              <span class="truncate">${escapeHtml(s.college || "College not registered")}</span>
            </p>

            <!-- Contact Row with Copy -->
            <div class="flex items-center justify-between text-[11px] pt-1 gap-1">
              <div class="flex items-center gap-1.5 text-ink-600 font-mono min-w-0">
                <span class="truncate">📞 ${escapeHtml(s.mobile || "—")}</span>
                ${s.mobile ? renderCopyButton(s.mobile, 'Mobile') : ""}
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="px-1.5 py-0.5 bg-ink-100 text-ink-700 rounded text-[10px] font-semibold">${escapeHtml(s.category || "General")}</span>
                ${s.state ? `<span class="px-1.5 py-0.5 bg-ink-50 border border-ink-200/70 text-ink-600 rounded text-[10px] truncate max-w-[80px]">📍 ${escapeHtml(s.state)}</span>` : ""}
              </div>
            </div>

            <!-- Score & Income details if available -->
            ${(scoreVal || incomeVal) ? `
              <div class="flex items-center justify-between text-[10px] text-ink-600 bg-ink-50/80 px-2.5 py-1.5 rounded-xl mt-1 border border-ink-100/60">
                <span>${scoreVal ? `Score: <b class="text-ink-900 font-semibold">${scoreVal}%</b>` : "Score: —"}</span>
                <span>${incomeVal ? `Income: <b class="text-ink-900 font-semibold">₹${Number(incomeVal).toLocaleString("en-IN")}</b>` : ""}</span>
              </div>
            ` : ""}
          </div>
        </div>

        <!-- Aligned Action Footer with Guaranteed 3-column Layout -->
        <div class="mt-4 pt-3 border-t border-ink-100/80 space-y-2">
          <!-- Schemes Status Count -->
          <div class="flex items-center justify-between text-[11px]">
            <div class="flex items-center gap-1.5 font-medium">
              <span class="px-2 py-0.5 rounded-md font-semibold text-ink-700 bg-ink-50 border border-ink-200/80">
                ${apps.length} ${apps.length === 1 ? "Scheme" : "Schemes"}
              </span>
              ${approved > 0 ? `<span class="px-1.5 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px]">✓ ${approved} Approved</span>` : ""}
            </div>
            <span class="text-[10px] text-ink-400 font-mono">ID: ${(s.id || "").slice(0, 6)}</span>
          </div>

          <!-- Action Buttons: 3 equal columns for mobile & desktop to prevent misalignment -->
          <div class="grid grid-cols-3 gap-1.5 pt-0.5">
            <button type="button" onclick="openStudentFormById('${s.id}')" class="h-9 px-1.5 sm:px-2.5 rounded-xl border border-ink-200 hover:border-ink-300 hover:bg-ink-50 active:bg-ink-100 text-ink-700 text-xs font-semibold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer" title="Edit Student">
              <svg class="w-3.5 h-3.5 text-ink-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              <span>Edit</span>
            </button>
            <a href="student.html?id=${s.id}&tab=eligibility" class="h-9 px-1.5 sm:px-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1 transition shadow-2xs whitespace-nowrap min-w-0" title="Check Scholarship Eligibility">
              <span>⚡</span>
              <span class="truncate">Eligibility</span>
            </a>
            <a href="student.html?id=${s.id}" class="h-9 px-1.5 sm:px-2.5 rounded-xl bg-ink-900 hover:bg-ink-800 active:bg-ink-950 text-white text-xs font-semibold flex items-center justify-center gap-1 transition shadow-2xs whitespace-nowrap min-w-0" title="View Student Profile">
              <span>Profile</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function openStudentFormById(id) {
  const student = allStudents.find(s => s.id === id);
  if (student) openStudentForm(student);
}

function updateDistrictDropdown(stateVal, selectedDistrict = "") {
  const districtSel = qs("#f-district");
  if (!districtSel) return;
  if (typeof getDistrictOptionsHtml === "function") {
    districtSel.innerHTML = getDistrictOptionsHtml(stateVal, selectedDistrict);
  }
}

function openStudentForm(student = null) {
  const form = qs("#student-form");
  if (!form) return;
  form.reset();

  qs("#student-id").value = "";
  qs("#student-modal-title").textContent = student ? "Edit Student Record" : "Add New Student";

  // Populate course dropdown with structured hierarchy
  const courseSel = qs("#f-course");
  if (courseSel && typeof getCourseOptionsHtml === "function") {
    courseSel.innerHTML = getCourseOptionsHtml(student ? student.course : "");
  }

  // Populate category dropdown
  const catSel = qs("#f-category");
  if (catSel && typeof getCategoryOptionsHtml === "function") {
    catSel.innerHTML = getCategoryOptionsHtml(student ? student.category : "General");
  }

  // Populate Gender dropdown
  const genderSel = qs("#f-gender");
  if (genderSel && typeof getGenderOptionsHtml === "function") {
    genderSel.innerHTML = getGenderOptionsHtml(student ? student.gender : "Male");
  }

  // Populate Religion dropdown
  const relSel = qs("#f-religion");
  if (relSel && typeof getReligionOptionsHtml === "function") {
    relSel.innerHTML = getReligionOptionsHtml(student ? student.religion : "Hindu");
  }

  // Populate PwD dropdown
  const pwdSel = qs("#f-pwd");
  if (pwdSel && typeof getPwdOptionsHtml === "function") {
    pwdSel.innerHTML = getPwdOptionsHtml(student ? (student.pwd_status || (student.is_pwd ? "Yes" : "No")) : "No");
  }

  // Populate Admission Year dropdown
  const admYearSel = qs("#f-admission-year");
  if (admYearSel && typeof getAdmissionYearOptionsHtml === "function") {
    admYearSel.innerHTML = getAdmissionYearOptionsHtml(student ? student.admission_year : "2026");
  }

  // Populate Current Semester dropdown
  const semSel = qs("#f-semester");
  if (semSel && typeof getSemesterOptionsHtml === "function") {
    semSel.innerHTML = getSemesterOptionsHtml(student ? (student.current_semester || student.semester) : "1st Year (Semester 1)");
  }

  // Populate State & Cascading District
  const stateSel = qs("#f-state");
  const studentState = student ? (student.state || "Bihar") : "Bihar";
  const studentDistrict = student ? (student.district || "") : "";

  if (stateSel && typeof getStateOptionsHtml === "function") {
    stateSel.innerHTML = getStateOptionsHtml(studentState);
    stateSel.onchange = (e) => {
      updateDistrictDropdown(e.target.value, "");
    };
  }
  updateDistrictDropdown(studentState, studentDistrict);

  if (student) {
    qs("#student-id").value = student.id;
    qs("#f-name").value = student.name || "";
    qs("#f-code").value = student.code || student.student_code || "";
    qs("#f-mobile").value = student.mobile || "";
    qs("#f-email").value = student.email || "";
    if (qs("#f-father")) qs("#f-father").value = student.father_name || "";
    if (qs("#f-mother")) qs("#f-mother").value = student.mother_name || "";
    if (qs("#f-aadhaar")) qs("#f-aadhaar").value = student.aadhaar_number || student.aadhaar || "";
    if (qs("#f-college")) qs("#f-college").value = student.college || student.university || "";
    qs("#f-dob").value = student.dob ? student.dob.slice(0, 10) : "";
    qs("#f-address").value = student.address || "";
    qs("#f-notes").value = student.notes || "";
    if (qs("#f-income")) qs("#f-income").value = student.annual_income || "";
    if (qs("#f-percentage")) qs("#f-percentage").value = student.percentage || "";
    if (qs("#f-status")) qs("#f-status").value = student.status || "Active";
  } else {
    // Generate next student code
    const nextNum = allStudents.length + 1;
    qs("#f-code").value = `STU-${String(nextNum).padStart(4, "0")}`;
  }

  openModal("student-modal");
}

async function onSaveStudent(e) {
  e.preventDefault();
  const btn = qs("#student-save-btn");
  setLoading(btn, true);

  const id = qs("#student-id").value;
  const payload = {
    name: qs("#f-name").value.trim(),
    code: qs("#f-code").value.trim() || null,
    student_code: qs("#f-code").value.trim() || null,
    mobile: qs("#f-mobile").value.trim() || null,
    email: qs("#f-email").value.trim() || null,
    father_name: qs("#f-father")?.value.trim() || null,
    mother_name: qs("#f-mother")?.value.trim() || null,
    aadhaar_number: qs("#f-aadhaar")?.value.trim() || null,
    aadhaar: qs("#f-aadhaar")?.value.trim() || null,
    gender: qs("#f-gender")?.value || "Male",
    category: qs("#f-category")?.value || "General",
    religion: qs("#f-religion")?.value || "Hindu",
    pwd_status: qs("#f-pwd")?.value || "No",
    is_pwd: qs("#f-pwd")?.value === "Yes",
    state: qs("#f-state")?.value || "Bihar",
    district: qs("#f-district")?.value || null,
    course: qs("#f-course")?.value || null,
    admission_year: qs("#f-admission-year")?.value || "2026",
    semester: qs("#f-semester")?.value || null,
    current_semester: qs("#f-semester")?.value || null,
    college: qs("#f-college")?.value.trim() || null,
    university: qs("#f-college")?.value.trim() || null,
    dob: qs("#f-dob").value || null,
    address: qs("#f-address").value.trim() || null,
    notes: qs("#f-notes").value.trim() || null,
    annual_income: parseFloat(qs("#f-income")?.value) || null,
    percentage: parseFloat(qs("#f-percentage")?.value) || null,
    status: qs("#f-status")?.value || "Active"
  };

  const sb = window.supabaseClient;
  const { error } = id
    ? await sb.from("students").update(payload).eq("id", id)
    : await sb.from("students").insert(payload);

  setLoading(btn, false);

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }

  toast(id ? "✓ Student updated successfully." : "✓ Student added successfully.", "success");
  closeModal("student-modal");
  await loadStudents();
}

async function deleteStudent(id, name) {
  const ok = await confirmDelete("Delete Student?", `This will remove ${name}'s profile and records.`);
  if (!ok) return;
  const { error } = await window.supabaseClient.from("students").delete().eq("id", id);
  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  toast("Student deleted.");
  await loadStudents();
}
