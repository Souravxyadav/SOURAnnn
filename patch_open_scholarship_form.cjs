const fs = require('fs');

let js = fs.readFileSync('js/scholarships.js', 'utf8');

const regex = /function openScholarshipForm\(s = null\) \{[\s\S]*?openModal\("scholarship-modal"\);\n\}/;

const replacement = `function openScholarshipForm(s = null) {
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
}`;

js = js.replace(regex, replacement);
fs.writeFileSync('js/scholarships.js', js, 'utf8');
