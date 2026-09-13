const fs = require('fs');
let js = fs.readFileSync('js/scholarships.js', 'utf8');

const regexPayload = /const payload = \{[\s\S]*?\};/;
const replacementPayload = `const payload = {
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
    };`;

js = js.replace(regexPayload, replacementPayload);
fs.writeFileSync('js/scholarships.js', js, 'utf8');
