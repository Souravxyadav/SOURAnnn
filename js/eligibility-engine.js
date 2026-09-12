// Central Decoupled Eligibility Engine for ScholarLedger
// Architecture: Student Data -> Scholarship Rules -> Eligibility Engine -> Result (Eligible / Not Eligible / Needs Review)

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EligibilityEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Evaluates a single student against a scholarship's defined eligibility rules
   * @param {Object} student 
   * @param {Object} scholarship 
   * @returns {Object} Evaluation result with 3 statuses: ELIGIBLE, NOT_ELIGIBLE, NEEDS_REVIEW
   */
  function evaluate(student, scholarship) {
    if (!student || !scholarship) {
      return {
        status: "NOT_ELIGIBLE",
        statusLabel: "Not Eligible",
        statusColor: "red",
        reasons: ["Invalid student or scholarship record"],
        matches: [],
        needsReviewReasons: [],
        isEligible: false
      };
    }

    const failureReasons = [];
    const matchReasons = [];
    const reviewReasons = [];

    // 1. Check Family Annual Income Rule
    const studentIncome = student.annual_income !== null && student.annual_income !== undefined && student.annual_income !== ""
      ? Number(student.annual_income)
      : null;
    const incomeLimit = Number(scholarship.income_limit || 0);

    if (incomeLimit > 0) {
      if (studentIncome === null || isNaN(studentIncome)) {
        reviewReasons.push(`Family income is not recorded on student profile (Limit: ₹${incomeLimit.toLocaleString('en-IN')})`);
      } else if (studentIncome > incomeLimit) {
        failureReasons.push(`Family income (₹${studentIncome.toLocaleString('en-IN')}) exceeds the maximum allowed income of ₹${incomeLimit.toLocaleString('en-IN')}`);
      } else {
        matchReasons.push(`Family income (₹${studentIncome.toLocaleString('en-IN')}) within allowed limit of ₹${incomeLimit.toLocaleString('en-IN')}`);
      }
    } else {
      matchReasons.push("No family income ceiling restriction");
    }

    // 2. Check Social Category Rule
    // Scholarship categories can be comma-separated, array, or single string
    const schRawCat = scholarship.eligible_categories || scholarship.category || "All";
    const studentCat = (student.category || "General").trim();

    if (schRawCat && schRawCat !== "All" && schRawCat !== "ALL") {
      let allowedCats = [];
      if (Array.isArray(schRawCat)) {
        allowedCats = schRawCat.map(c => c.trim().toLowerCase());
      } else {
        allowedCats = schRawCat.split(/[,/|]/).map(c => c.trim().toLowerCase());
      }

      const stCatLower = studentCat.toLowerCase();
      const isCatMatched = allowedCats.some(c => c === "all" || c === stCatLower || stCatLower.includes(c) || c.includes(stCatLower));

      if (!isCatMatched) {
        failureReasons.push(`Category (${studentCat}) not eligible. Open only for: ${Array.isArray(schRawCat) ? schRawCat.join(" / ") : schRawCat}`);
      } else {
        matchReasons.push(`Category matched: ${studentCat}`);
      }
    } else {
      matchReasons.push("Open to all social categories");
    }

    // 3. Check State / Domicile Rule
    const schState = (scholarship.eligible_state || scholarship.state || "All India").trim();
    const studentState = (student.state || "").trim();

    if (schState && schState !== "All India" && schState !== "Any" && schState !== "All") {
      if (!studentState) {
        reviewReasons.push(`Domicile state not recorded on profile (Required: ${schState})`);
      } else if (studentState.toLowerCase() !== schState.toLowerCase()) {
        failureReasons.push(`Domicile state (${studentState}) does not match required state (${schState})`);
      } else {
        matchReasons.push(`Domicile state matched: ${schState}`);
      }
    } else {
      matchReasons.push("Open to all Indian States & UTs");
    }

    // 4. Check Minimum Academic Percentage / Score Rule
    const minPct = Number(scholarship.min_percentage || 0);
    const studentPct = student.percentage !== null && student.percentage !== undefined && student.percentage !== ""
      ? Number(student.percentage)
      : null;

    if (minPct > 0) {
      if (studentPct === null || isNaN(studentPct)) {
        reviewReasons.push(`Previous academic percentage not updated on student profile (Required: ≥ ${minPct}%)`);
      } else if (studentPct < minPct) {
        failureReasons.push(`Academic score (${studentPct}%) is below minimum required (${minPct}%)`);
      } else {
        matchReasons.push(`Academic score (${studentPct}%) satisfies requirement (≥ ${minPct}%)`);
      }
    } else {
      matchReasons.push("No minimum percentage threshold");
    }

    // 5. Check Course Level / Program Rule
    const schCourseLevel = (scholarship.eligible_course_level || scholarship.course_level || "Any").trim();
    const studentCourse = (student.course || "").trim();

    if (schCourseLevel && schCourseLevel !== "Any" && schCourseLevel !== "Any Level" && schCourseLevel !== "All") {
      const isSchool = /class|10th|12th|school/i.test(studentCourse);
      const isDiploma = /diploma|iti|polytechnic/i.test(studentCourse);
      const isPG = /m\.tech|mca|mba|m\.sc|m\.com|m\.a|md|ms|m\.pharm|llm|m\.ed/i.test(studentCourse);
      const isPhD = /ph\.d|doctor|fellowship/i.test(studentCourse);
      const isUG = !isSchool && !isDiploma && !isPG && !isPhD;

      let studentLevel = "UG";
      if (isSchool) studentLevel = "School";
      else if (isDiploma) studentLevel = "Diploma";
      else if (isPhD) studentLevel = "Doctorate";
      else if (isPG) studentLevel = "PG";

      const schReq = schCourseLevel.toUpperCase();
      let matched = false;

      if (schReq.includes("UG") && studentLevel === "UG") matched = true;
      if (schReq.includes("PG") && studentLevel === "PG") matched = true;
      if (schReq.includes("DIPLOMA") && studentLevel === "Diploma") matched = true;
      if (schReq.includes("SCHOOL") && studentLevel === "School") matched = true;
      if (schReq.includes("PH.D") || schReq.includes("DOCTORATE") && studentLevel === "Doctorate") matched = true;

      if (!studentCourse) {
        reviewReasons.push(`Course enrollment not recorded (Required Level: ${schCourseLevel})`);
      } else if (!matched) {
        failureReasons.push(`Course (${studentCourse}) does not match required level (${schCourseLevel})`);
      } else {
        matchReasons.push(`Course level satisfied: ${studentCourse}`);
      }
    } else {
      matchReasons.push("Open to all degree levels");
    }

    // 6. Check Gender Rule
    const schGender = (scholarship.gender_eligibility || "All").trim();
    const studentGender = (student.gender || "All").trim();

    if (schGender && schGender !== "All" && schGender !== "Any" && schGender !== "All Genders") {
      if (!studentGender || studentGender === "All") {
        reviewReasons.push(`Gender not specified on profile (Restricted to: ${schGender})`);
      } else if (studentGender.toLowerCase() !== schGender.toLowerCase()) {
        failureReasons.push(`Restricted to ${schGender} applicants only (Student is ${studentGender})`);
      } else {
        matchReasons.push(`Gender matched: ${studentGender}`);
      }
    }

    // 7. Check PwD (Persons with Disabilities) Rule
    const schPwd = (scholarship.pwd_eligibility || scholarship.pwd_required || "Any").trim();
    const studentPwd = (student.pwd_status || student.is_pwd ? "Yes" : "No").trim();

    if (schPwd && schPwd !== "Any" && schPwd !== "All") {
      if (schPwd.toLowerCase().includes("yes") && studentPwd.toLowerCase() !== "yes") {
        failureReasons.push("Exclusively reserved for PwD (Persons with Disabilities) candidates");
      } else if (schPwd.toLowerCase().includes("no") && studentPwd.toLowerCase() === "yes") {
        failureReasons.push("Not open to PwD category under this specific quota");
      } else {
        matchReasons.push(`PwD status satisfied: ${studentPwd}`);
      }
    }

    // 8. Check Manual Verification or Special Document Requirement
    if (scholarship.manual_review_required) {
      reviewReasons.push("Scheme requires manual nodal officer verification of income/caste certificate");
    }

    // Determine Final Status:
    // 1. If any hard failures exist -> NOT_ELIGIBLE
    // 2. If no hard failures, but review reasons exist -> NEEDS_REVIEW
    // 3. Otherwise -> ELIGIBLE
    let status = "ELIGIBLE";
    let statusLabel = "Eligible";
    let statusColor = "emerald";
    let mainReason = "All eligibility rules matched";

    if (failureReasons.length > 0) {
      status = "NOT_ELIGIBLE";
      statusLabel = "Not Eligible";
      statusColor = "red";
      mainReason = failureReasons[0]; // Most primary failure reason
    } else if (reviewReasons.length > 0) {
      status = "NEEDS_REVIEW";
      statusLabel = "Needs Review";
      statusColor = "amber";
      mainReason = reviewReasons[0];
    }

    const checksList = [
      ...matchReasons.map(m => ({ name: m, passed: true })),
      ...reviewReasons.map(r => ({ name: r, passed: false, review: true })),
      ...failureReasons.map(f => ({ name: f, passed: false }))
    ];

    return {
      status,
      statusLabel,
      statusColor,
      mainReason,
      failureReasons,
      matchReasons,
      reviewReasons,
      reasons: failureReasons.length > 0 ? failureReasons : reviewReasons,
      matches: matchReasons,
      checks: checksList,
      isEligible: status === "ELIGIBLE",
      needsReview: status === "NEEDS_REVIEW",
      scholarship
    };
  }

  /**
   * Evaluates all scholarships for a given student
   * @param {Object} student 
   * @param {Array} scholarshipsList 
   * @param {Boolean} forStudentPortal - if true, filters out scholarships where show_to_students is false
   */
  function evaluateAll(student, scholarshipsList, forStudentPortal = false) {
    if (!student || !Array.isArray(scholarshipsList)) return [];

    let list = scholarshipsList;
    if (forStudentPortal) {
      list = list.filter(s => s.show_to_students !== false && s.is_active !== false);
    }

    return list.map(sch => evaluate(student, sch));
  }

  /**
   * Helper to generate a styled HTML badge for the eligibility status
   */
  function renderBadge(status, customLabel = "") {
    switch (status) {
      case "ELIGIBLE":
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>${customLabel || "🟢 Eligible"}</span>
        </span>`;
      case "NOT_ELIGIBLE":
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          <span class="w-2 h-2 rounded-full bg-red-500"></span>
          <span>${customLabel || "🔴 Not Eligible"}</span>
        </span>`;
      case "NEEDS_REVIEW":
      default:
        return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>${customLabel || "🟡 Needs Review"}</span>
        </span>`;
    }
  }

  return {
    evaluate,
    evaluateAll,
    renderBadge
  };
}));
