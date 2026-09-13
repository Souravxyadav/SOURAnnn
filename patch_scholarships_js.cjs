const fs = require('fs');
let js = fs.readFileSync('js/scholarships.js', 'utf8');

// Replace s-course-level and s-category extraction
js = js.replace(/document\.getElementById\("s-course-level"\)\.value/g, "Array.from(document.querySelectorAll('#s-course-level-container input:checked')).map(cb => cb.value).join(', ')");
js = js.replace(/document\.getElementById\("s-category"\)\.value/g, "Array.from(document.querySelectorAll('#s-category-container input:checked')).map(cb => cb.value).join(', ')");

// When loading a scholarship into the modal
const populateRegex = /document\.getElementById\("s-course-level"\)\.value = s\.course_level \|\| "Any";\s*document\.getElementById\("s-category"\)\.value = s\.category \|\| "All";/;
const populateReplacement = `
  const cLevels = (s.course_level || "").split(',').map(x => x.trim());
  document.querySelectorAll('#s-course-level-container input').forEach(cb => {
    cb.checked = cLevels.includes(cb.value);
  });
  const cats = (s.category || "").split(',').map(x => x.trim());
  document.querySelectorAll('#s-category-container input').forEach(cb => {
    cb.checked = cats.includes(cb.value);
  });
  document.getElementById("s-awards-count").value = s.awards_count || "";
  document.getElementById("s-renewal").checked = s.renewal || false;
  document.getElementById("s-max-pct").value = s.max_pct || "";
  document.getElementById("s-stream").value = s.req_stream || "";
  document.getElementById("s-subjects").value = s.req_subjects || "";
  document.getElementById("s-min-income").value = s.min_income || "";
  document.getElementById("s-age-limit").value = s.age_limit || "";
  document.getElementById("s-institution").value = s.institution_type || "Any";
`;
js = js.replace(populateRegex, populateReplacement);

// Also need to clear checkboxes on Add Scholarship
const clearRegex = /document\.getElementById\("s-course-level"\)\.value = "Any";\s*document\.getElementById\("s-category"\)\.value = "All";/;
const clearReplacement = `
  document.querySelectorAll('#s-course-level-container input').forEach(cb => cb.checked = false);
  document.querySelectorAll('#s-category-container input').forEach(cb => cb.checked = false);
  document.getElementById("s-awards-count").value = "";
  document.getElementById("s-renewal").checked = false;
  document.getElementById("s-max-pct").value = "";
  document.getElementById("s-stream").value = "";
  document.getElementById("s-subjects").value = "";
  document.getElementById("s-min-income").value = "";
  document.getElementById("s-age-limit").value = "";
  document.getElementById("s-institution").value = "Any";
`;
js = js.replace(clearRegex, clearReplacement);

// We need to add the AI modal functions at the end
js += `
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
    console.error(err);
    toast("Failed to generate from AI. Using mock if no API available...", "error");
    // MOCK fallback for safety
    document.getElementById("s-name").value = "Generated Scholarship Name";
    closeAIScholarshipModal();
  } finally {
    btn.innerHTML = origBtnText;
    btn.disabled = false;
  }
};
`;

fs.writeFileSync('js/scholarships.js', js, 'utf8');
