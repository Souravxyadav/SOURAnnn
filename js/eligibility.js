// Eligibility Matching Engine Controller
let allStudents = [];
let allScholarships = [];
let allApplications = [];

document.addEventListener("DOMContentLoaded", async () => {
  renderLayout("eligibility", "Eligibility Matching Engine");
  await loadEligibilityData();
  
  // Populate course dropdown in simulator
  const simCourse = document.getElementById("sim-course");
  if (simCourse && typeof getCourseOptionsHtml === "function") {
    simCourse.innerHTML = getCourseOptionsHtml("", "Any Course (Class 1 to PG, Diploma)");
  }
});

async function loadEligibilityData() {
  try {
    const sb = window.supabaseClient;
    const [stRes, schRes, appRes] = await Promise.all([
      sb.from("students").select("*"),
      sb.from("scholarships").select("*").eq("is_active", true),
      sb.from("scholarship_applications").select("*")
    ]);

    allStudents = stRes.data || [];
    allScholarships = schRes.data || [];
    allApplications = appRes.data || [];

    // KPI Counters
    document.getElementById("stat-total-scholarships").textContent = allScholarships.length;
    document.getElementById("stat-total-students").textContent = allStudents.length;
    document.getElementById("stat-total-apps").textContent = allApplications.length;

    // Populate pickers
    populateStudentPicker();
    populateScholarshipPicker();

    // Auto-evaluate if student query param passed
    const paramStudentId = getParam("student_id");
    if (paramStudentId) {
      const picker = document.getElementById("student-picker");
      if (picker) {
        picker.value = paramStudentId;
        onSelectStudent(paramStudentId);
      }
    }
  } catch (err) {
    console.error("Error loading eligibility data:", err);
    toast("Failed to load criteria engine data", "error");
  }
}

function populateStudentPicker() {
  const sel = document.getElementById("student-picker");
  if (!sel) return;
  let html = `<option value="">-- Choose a student to evaluate --</option>`;
  allStudents.forEach(s => {
    const code = s.code || s.student_code || "STU";
    html += `<option value="${s.id}">${s.name} (${code} · ${s.category || "General"} · ${s.course || "No Course"})</option>`;
  });
  sel.innerHTML = html;
}

function populateScholarshipPicker() {
  const sel = document.getElementById("scholarship-picker");
  if (!sel) return;
  let html = `<option value="">-- Choose a scholarship --</option>`;
  allScholarships.forEach(s => {
    html += `<option value="${s.id}">${s.name} (${formatCurrency(s.scholarship_amount || s.maximum_amount || 0)})</option>`;
  });
  sel.innerHTML = html;
}

function switchEngineTab(tabKey) {
  const tabs = ["student", "scholarship", "simulator"];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const panel = document.getElementById(`tab-panel-${t}`);
    if (t === tabKey) {
      btn?.classList.add("border-gold-500", "text-ink-900", "font-semibold");
      btn?.classList.remove("border-transparent", "text-ink-500");
      panel?.classList.remove("hidden");
    } else {
      btn?.classList.remove("border-gold-500", "text-ink-900", "font-semibold");
      btn?.classList.add("border-transparent", "text-ink-500");
      panel?.classList.add("hidden");
    }
  });

  if (tabKey === "simulator") {
    runSimulation();
  }
}

// ==========================================
// TAB 1: EVALUATE SINGLE STUDENT
// ==========================================
function onSelectStudent(studentId) {
  const container = document.getElementById("student-results-container");
  const strip = document.getElementById("student-profile-strip");
  const badge = document.getElementById("student-summary-badge");
  if (!container) return;

  if (!studentId) {
    strip?.classList.add("hidden");
    badge?.classList.add("hidden");
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-ink-200">
        <div class="w-12 h-12 rounded-2xl bg-ink-50 text-ink-400 mx-auto flex items-center justify-center text-xl mb-3">🔍</div>
        <p class="font-semibold text-sm text-ink-800">Select a student above to evaluate eligibility</p>
        <p class="text-xs text-ink-400 mt-1">The engine will check all criteria and display qualified scholarships.</p>
      </div>`;
    return;
  }

  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;

  // Populate profile strip
  document.getElementById("st-strip-name").textContent = student.name || "—";
  document.getElementById("st-strip-category").textContent = student.category || "General";
  document.getElementById("st-strip-course").textContent = student.course || "—";
  document.getElementById("st-strip-income").textContent = student.annual_income ? formatCurrency(student.annual_income) : "Not Specified";
  document.getElementById("st-strip-pct").textContent = student.percentage ? `${student.percentage}%` : "—";
  document.getElementById("st-strip-gender").textContent = student.gender || "All / Any";
  strip?.classList.remove("hidden");

  // Evaluate against every scholarship
  const results = allScholarships.map(sch => {
    return evaluateMatch(student, sch);
  });

  const eligibleCount = results.filter(r => r.isEligible).length;
  if (badge) {
    badge.innerHTML = `
      <span class="px-2.5 py-1 rounded-full text-xs font-bold ${eligibleCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}">
        ${eligibleCount} of ${allScholarships.length} Eligible
      </span>
    `;
    badge.classList.remove("hidden");
  }

  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-display font-bold text-base text-ink-900">Scholarship Evaluation Breakdown (${results.length})</h3>
        <span class="text-xs text-ink-500">${eligibleCount} matching opportunities</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${results.map(r => renderEvaluationCard(r, student.id)).join("")}
      </div>
    </div>
  `;
}

function evaluateMatch(student, sch) {
  const reasons = [];
  const matches = [];

  const studentIncome = Number(student.annual_income || 0);
  const incomeLimit = Number(sch.income_limit || 0);
  if (incomeLimit > 0) {
    if (studentIncome > incomeLimit) {
      reasons.push(`Annual income ${formatCurrency(studentIncome)} exceeds ceiling of ${formatCurrency(incomeLimit)}`);
    } else {
      matches.push(`Income under ${formatCurrency(incomeLimit)}`);
    }
  }

  const studentPct = Number(student.percentage || 0);
  const minPct = Number(sch.min_percentage || 0);
  if (minPct > 0) {
    if (studentPct > 0 && studentPct < minPct) {
      reasons.push(`Academic score ${studentPct}% is below required ${minPct}%`);
    } else if (studentPct >= minPct) {
      matches.push(`Academic score ≥ ${minPct}%`);
    }
  }

  const schCat = (sch.category || "All").toLowerCase();
  const stCat = (student.category || "General").toLowerCase();
  if (schCat !== "all") {
    if (!stCat.includes(schCat) && !schCat.includes(stCat)) {
      reasons.push(`Targeted category (${sch.category}) does not match student category (${student.category || "General"})`);
    } else {
      matches.push(`Category match: ${sch.category}`);
    }
  }

  const schGender = (sch.gender_eligibility || "All").toLowerCase();
  const stGender = (student.gender || "All").toLowerCase();
  if (schGender !== "all" && stGender !== "all") {
    if (schGender !== stGender) {
      reasons.push(`Restricted to ${sch.gender_eligibility} applicants`);
    } else {
      matches.push(`Gender match`);
    }
  }

  const isEligible = reasons.length === 0;

  // Check if student has already applied
  const existingApp = allApplications.find(a => a.student_id === student.id && a.scholarship_id === sch.id);

  return {
    scholarship: sch,
    isEligible,
    reasons,
    matches,
    existingApp
  };
}

function renderEvaluationCard(result, studentId) {
  const s = result.scholarship;
  const isEligible = result.isEligible;
  const hasApplied = Boolean(result.existingApp);

  return `
    <div class="card-interactive p-4 sm:p-5 flex flex-col justify-between space-y-3.5 ${isEligible ? "border-emerald-200" : "border-ink-100 opacity-80"}">
      <div>
        <div class="flex items-start justify-between gap-2 mb-2">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full text-[10px] font-bold ${isEligible ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}">
            <span>${isEligible ? "✓ Eligible" : "✕ Ineligible"}</span>
          </span>
          <span class="font-display font-bold text-xs sm:text-sm text-ink-900 font-mono">${formatCurrency(s.scholarship_amount || s.maximum_amount || 0)}</span>
        </div>

        <h4 class="font-display font-bold text-xs sm:text-sm text-ink-900 leading-snug">${escapeHtml(s.name)}</h4>
        <p class="text-[11px] text-ink-500 mt-0.5 truncate">${escapeHtml(s.provider || "")}</p>

        <!-- Reasons or Matches -->
        <div class="mt-2.5 space-y-1 text-xs">
          ${isEligible
            ? result.matches.map(m => `<p class="text-emerald-700 flex items-center gap-1.5"><span class="text-emerald-500 font-bold">✓</span> ${escapeHtml(m)}</p>`).join("")
            : result.reasons.map(r => `<p class="text-red-600 flex items-start gap-1.5"><span class="text-red-500 font-bold">✕</span> <span>${escapeHtml(r)}</span></p>`).join("")
          }
        </div>
      </div>

      <div class="pt-2.5 border-t border-ink-100 flex items-center justify-between">
        <span class="text-[10px] text-ink-400">Deadline: ${formatDate(s.end_date)}</span>
        ${hasApplied
          ? `<span class="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">Enrolled (#${result.existingApp.application_number || ""})</span>`
          : (isEligible
              ? `<a href="application.html?student_id=${studentId}&scholarship_id=${s.id}" class="btn-compact btn-primary">Apply Now →</a>`
              : `<span class="text-[10px] text-ink-400 font-medium">Ineligible</span>`
            )
        }
      </div>
    </div>
  `;
}

// ==========================================
// TAB 2: FIND STUDENTS FOR SCHOLARSHIP
// ==========================================
function onSelectScholarship(schId) {
  const container = document.getElementById("scholarship-candidates-container");
  const strip = document.getElementById("sc-criteria-strip");
  if (!container) return;

  if (!schId) {
    strip?.classList.add("hidden");
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-ink-200">
        <div class="w-12 h-12 rounded-2xl bg-ink-50 text-ink-400 mx-auto flex items-center justify-center text-xl mb-3">🎓</div>
        <p class="font-semibold text-sm text-ink-800">Select a scholarship above to discover eligible candidates</p>
        <p class="text-xs text-ink-400 mt-1">We'll scan all registered students who satisfy this scholarship's rules.</p>
      </div>`;
    return;
  }

  const sch = allScholarships.find(s => s.id === schId);
  if (!sch) return;

  // Criteria strip
  document.getElementById("sc-strip-cat").textContent = sch.category || "Any / All";
  document.getElementById("sc-strip-income").textContent = sch.income_limit ? formatCurrency(sch.income_limit) : "No Limit";
  document.getElementById("sc-strip-pct").textContent = sch.min_percentage ? `≥ ${sch.min_percentage}%` : "No Min";
  document.getElementById("sc-strip-gender").textContent = sch.gender_eligibility || "Any";
  strip?.classList.remove("hidden");

  // Check all students
  const matches = allStudents.map(student => {
    return {
      student,
      eval: evaluateMatch(student, sch)
    };
  });

  const eligibleStudents = matches.filter(m => m.eval.isEligible);

  container.innerHTML = `
    <div class="bg-white rounded-2xl border border-ink-100 shadow-card p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-ink-100 pb-3">
        <div>
          <h3 class="font-display font-bold text-base text-ink-900">Matching Student Candidates (${eligibleStudents.length})</h3>
          <p class="text-xs text-ink-500">Students in database qualified to apply for ${escapeHtml(sch.name)}</p>
        </div>
        <span class="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
          ${eligibleStudents.length} / ${allStudents.length} Students Qualified
        </span>
      </div>

      <div class="overflow-x-auto table-scroll max-w-full">
        <table class="w-full text-left text-xs min-w-[640px]">
          <thead class="bg-ink-50 text-ink-500 uppercase font-semibold border-b border-ink-100">
            <tr>
              <th class="p-3">Student Name</th>
              <th class="p-3">Category</th>
              <th class="p-3">Course</th>
              <th class="p-3 text-right">Income</th>
              <th class="p-3 text-right">Score %</th>
              <th class="p-3 text-center">Status</th>
              <th class="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            ${eligibleStudents.length === 0
              ? `<tr><td colspan="7" class="p-6 text-center text-ink-400">No registered students currently satisfy all criteria for this scholarship.</td></tr>`
              : eligibleStudents.map(m => {
                  const s = m.student;
                  const hasApplied = Boolean(m.eval.existingApp);
                  return `
                    <tr class="hover:bg-ink-50/50">
                      <td class="p-3 font-bold text-ink-900">${escapeHtml(s.name)} <span class="block text-[10px] text-ink-400 font-normal font-mono">${escapeHtml(s.mobile || "")}</span></td>
                      <td class="p-3">${escapeHtml(s.category || "General")}</td>
                      <td class="p-3">${escapeHtml(s.course || "—")}</td>
                      <td class="p-3 text-right font-medium">${s.annual_income ? formatCurrency(s.annual_income) : "—"}</td>
                      <td class="p-3 text-right font-bold text-ink-900">${s.percentage ? `${s.percentage}%` : "—"}</td>
                      <td class="p-3 text-center">
                        ${hasApplied
                          ? `<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">Applied</span>`
                          : `<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">Qualified</span>`
                        }
                      </td>
                      <td class="p-3 text-right">
                        ${hasApplied
                          ? `<a href="application.html?id=${m.eval.existingApp.id}" class="text-gold-600 font-bold hover:underline">View App</a>`
                          : `<a href="application.html?student_id=${s.id}&scholarship_id=${sch.id}" class="btn-compact btn-primary">Create App</a>`
                        }
                      </td>
                    </tr>
                  `;
                }).join("")
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ==========================================
// TAB 3: WHAT-IF CRITERIA CALCULATOR
// ==========================================
function runSimulation() {
  const container = document.getElementById("simulation-results-container");
  if (!container) return;

  const category = document.getElementById("sim-category")?.value || "All";
  const gender = document.getElementById("sim-gender")?.value || "All";
  const income = parseFloat(document.getElementById("sim-income")?.value) || 0;
  const pct = parseFloat(document.getElementById("sim-pct")?.value) || 0;
  const course = document.getElementById("sim-course")?.value || "";

  const mockStudent = {
    category,
    gender,
    annual_income: income,
    percentage: pct,
    course
  };

  const matches = allScholarships.map(sch => evaluateMatch(mockStudent, sch));
  const eligible = matches.filter(m => m.isEligible);

  container.innerHTML = `
    <div class="bg-white rounded-2xl border border-ink-100 p-5 shadow-card space-y-4">
      <div class="flex items-center justify-between border-b border-ink-100 pb-3">
        <div>
          <h4 class="font-display font-bold text-base text-ink-900">Simulation Match Results (${eligible.length} Matched)</h4>
          <p class="text-xs text-ink-500">Based on Category: <strong>${category}</strong>, Income: <strong>${formatCurrency(income)}</strong>, Score: <strong>${pct}%</strong></p>
        </div>
        <span class="px-3 py-1 bg-gold-100 text-gold-800 text-xs font-bold rounded-xl">
          ${eligible.length} Available Scheme(s)
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${matches.map(m => {
          const s = m.scholarship;
          return `
            <div class="p-4 rounded-xl border ${m.isEligible ? "border-emerald-200 bg-emerald-50/20" : "border-ink-100 bg-ink-50/30"} space-y-2">
              <div class="flex items-start justify-between gap-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${m.isEligible ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}">
                  ${m.isEligible ? "✓ Criteria Met" : "✕ Exceeds / Mismatch"}
                </span>
                <span class="font-bold text-xs text-ink-900">${formatCurrency(s.scholarship_amount || s.maximum_amount || 0)}</span>
              </div>
              <h5 class="font-bold text-xs text-ink-900">${escapeHtml(s.name)}</h5>
              <p class="text-[11px] text-ink-500">${escapeHtml(s.provider || "")}</p>
              <div class="text-[11px] pt-1">
                ${m.isEligible
                  ? `<p class="text-emerald-700 font-medium">Qualified: Annual funding opportunity</p>`
                  : m.reasons.map(r => `<p class="text-red-600">• ${escapeHtml(r)}</p>`).join("")
                }
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
