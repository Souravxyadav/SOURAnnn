const fs = require('fs');
let js = fs.readFileSync('js/eligibility-engine.js', 'utf8');

const replacement = `
(function (global, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    global.EligibilityEngine = factory();
  }
}(typeof window !== "undefined" ? window : this, function () {

  function evaluate(student, scholarship) {
    if (!student || !scholarship) return null;

    let failureReasons = [];
    let matchReasons = [];
    let reviewReasons = [];

    // 1. Category (Multiple)
    const schCategories = scholarship.category ? scholarship.category.split(',').map(c => c.trim().toLowerCase()) : [];
    const studentCat = (student.category || "").trim().toLowerCase();
    
    if (schCategories.length > 0 && !schCategories.includes('any') && !schCategories.includes('all')) {
      if (!studentCat) {
        reviewReasons.push(\`Category missing on profile (Required: \${scholarship.category})\`);
      } else {
        const matchesCat = schCategories.some(c => studentCat.includes(c) || c.includes(studentCat) || c === 'general');
        if (matchesCat || schCategories.includes(studentCat)) {
          matchReasons.push(\`Category matched: \${student.category}\`);
        } else {
          failureReasons.push(\`Category \${student.category} does not match required (\${scholarship.category})\`);
        }
      }
    } else {
      matchReasons.push("Open to all categories");
    }

    // 2. Course Level (Multiple)
    const schCourseLevels = scholarship.course_level ? scholarship.course_level.split(',').map(c => c.trim().toLowerCase()) : [];
    const studentCourse = (student.course_level || student.course || "").trim().toLowerCase();
    
    if (schCourseLevels.length > 0 && !schCourseLevels.includes('any') && !schCourseLevels.includes('all')) {
      if (!studentCourse) {
        reviewReasons.push(\`Course level missing (Required: \${scholarship.course_level})\`);
      } else {
        const matchesLevel = schCourseLevels.some(cl => studentCourse.includes(cl) || cl.includes(studentCourse));
        if (matchesLevel) {
          matchReasons.push(\`Course level matched: \${student.course_level || student.course}\`);
        } else {
          failureReasons.push(\`Course \${studentCourse} does not match required level (\${scholarship.course_level})\`);
        }
      }
    } else {
      matchReasons.push("Open to all course levels");
    }

    // 3. Percentage
    const minPct = Number(scholarship.min_percentage || 0);
    const maxPct = Number(scholarship.max_pct || 100);
    const studentPct = Number(student.percentage || student.marks_percentage);
    
    if (minPct > 0 || scholarship.max_pct) {
      if (!studentPct) {
        reviewReasons.push(\`Percentage missing (Required: >= \${minPct}%)\`);
      } else if (studentPct < minPct) {
        failureReasons.push(\`Percentage \${studentPct}% is below required \${minPct}%\`);
      } else if (scholarship.max_pct && studentPct > maxPct) {
        failureReasons.push(\`Percentage \${studentPct}% is above allowed \${maxPct}%\`);
      } else {
        matchReasons.push(\`Percentage requirement matched: \${studentPct}%\`);
      }
    } else {
      matchReasons.push("No percentage requirement");
    }

    // 4. Family Income
    const maxInc = Number(scholarship.income_limit || 0);
    const minInc = Number(scholarship.min_income || 0);
    const studentInc = Number(student.annual_income || student.income);
    
    if (maxInc > 0 || minInc > 0) {
      if (!studentInc) {
        reviewReasons.push(\`Family income missing (Limit: ₹\${maxInc || 'N/A'})\`);
      } else if (maxInc > 0 && studentInc > maxInc) {
        failureReasons.push(\`Income ₹\${studentInc} exceeds maximum limit ₹\${maxInc}\`);
      } else if (minInc > 0 && studentInc < minInc) {
        failureReasons.push(\`Income ₹\${studentInc} is below minimum requirement ₹\${minInc}\`);
      } else {
        matchReasons.push(\`Income requirement matched: ₹\${studentInc}\`);
      }
    } else {
      matchReasons.push("No income limit");
    }

    // 5. Gender
    const schGender = (scholarship.gender || scholarship.gender_eligibility || "Any").toLowerCase();
    const studentGender = (student.gender || "").toLowerCase();
    if (schGender !== "any" && schGender !== "all") {
      if (!studentGender) {
        reviewReasons.push(\`Gender missing (Required: \${scholarship.gender})\`);
      } else if (studentGender !== schGender) {
        failureReasons.push(\`Gender \${student.gender} does not match required \${scholarship.gender}\`);
      } else {
        matchReasons.push(\`Gender matched: \${student.gender}\`);
      }
    }

    // 6. State
    const schState = (scholarship.state || "Any").toLowerCase();
    const studentState = (student.state || "").toLowerCase();
    if (schState !== "any" && schState !== "all india") {
      if (!studentState) {
        reviewReasons.push(\`State missing (Required: \${scholarship.state})\`);
      } else if (!studentState.includes(schState) && !schState.includes(studentState)) {
        failureReasons.push(\`State \${student.state} does not match required \${scholarship.state}\`);
      } else {
        matchReasons.push(\`State matched: \${student.state}\`);
      }
    }
    
    // 7. Age
    const schAge = Number(scholarship.age_limit || 0);
    let studentAge = 0;
    if (student.dob) {
      const birthDate = new Date(student.dob);
      const today = new Date();
      studentAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        studentAge--;
      }
    }
    if (schAge > 0) {
      if (!studentAge) {
        reviewReasons.push(\`DOB/Age missing (Age Limit: \${schAge})\`);
      } else if (studentAge > schAge) {
        failureReasons.push(\`Age \${studentAge} exceeds limit \${schAge}\`);
      } else {
        matchReasons.push(\`Age requirement matched: \${studentAge} (Limit: \${schAge})\`);
      }
    }

    // 8. Other conditions
    if (scholarship.pwd === "Yes") {
      if (student.pwd_status !== "Yes") failureReasons.push("Requires PwD status");
      else matchReasons.push("PwD requirement matched");
    }
    
    if (scholarship.req_stream && student.stream && !student.stream.toLowerCase().includes(scholarship.req_stream.toLowerCase())) {
      failureReasons.push(\`Stream \${student.stream} does not match required \${scholarship.req_stream}\`);
    }

    let status = "Eligible";
    let statusLabel = "Eligible";
    let statusColor = "emerald";

    if (failureReasons.length > 0) {
      status = "Not Eligible";
      statusLabel = "Not Eligible";
      statusColor = "red";
    } else if (reviewReasons.length > 0) {
      status = "Missing Information";
      statusLabel = "Missing Information";
      statusColor = "amber";
    }

    // Check if partially matched (some match, some missing, no failures)
    if (status === "Missing Information" && matchReasons.length > 0 && failureReasons.length === 0) {
      status = "Partially Matched";
      statusLabel = "Partially Matched";
    }

    return {
      status,
      statusLabel,
      statusColor,
      failureReasons,
      matchReasons,
      reviewReasons,
      checks: [
        ...matchReasons.map(m => ({ name: m, passed: true, review: false })),
        ...reviewReasons.map(r => ({ name: r, passed: false, review: true })),
        ...failureReasons.map(f => ({ name: f, passed: false, review: false }))
      ],
      isEligible: status === "Eligible",
      scholarship
    };
  }

  function evaluateAll(student, scholarshipsList) {
    if (!student || !Array.isArray(scholarshipsList)) return [];
    return scholarshipsList.map(sch => evaluate(student, sch));
  }

  function renderBadge(status, customLabel = "") {
    switch (status) {
      case "Eligible":
        return \`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span>\${customLabel || "✓ Eligible"}</span>
        </span>\`;
      case "Not Eligible":
        return \`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          <span>\${customLabel || "✗ Not Eligible"}</span>
        </span>\`;
      case "Partially Matched":
        return \`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <span>\${customLabel || "⚠ Partially Matched"}</span>
        </span>\`;
      case "Missing Information":
      default:
        return \`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <span>\${customLabel || "⚠ Missing Info"}</span>
        </span>\`;
    }
  }

  return { evaluate, evaluateAll, renderBadge };
}));
`;

fs.writeFileSync('js/eligibility-engine.js', replacement, 'utf8');
