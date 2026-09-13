const fs = require('fs');

function addChips(fileHtml, fileJs) {
  let html = fs.readFileSync(fileHtml, 'utf8');
  if (!html.includes('id="active-filters-chips"')) {
    html = html.replace('<div id="scholarships-grid"', '<div id="active-filters-chips" class="flex flex-wrap gap-2 pt-2 empty:hidden"></div>\n        <div id="scholarships-grid"');
    html = html.replace('<div id="students-grid"', '<div id="active-filters-chips" class="flex flex-wrap gap-2 pt-2 empty:hidden"></div>\n        <div id="students-grid"');
    fs.writeFileSync(fileHtml, html, 'utf8');
  }

  let js = fs.readFileSync(fileJs, 'utf8');
  if (!js.includes('renderFilterChips')) {
    const isStudent = fileJs.includes('students');
    const func = `
function renderFilterChips() {
  const container = document.getElementById("active-filters-chips");
  if (!container) return;
  container.innerHTML = "";
  
  const addChip = (label, value, selectId) => {
    if (value && value !== "ALL") {
      const el = document.createElement("div");
      el.className = "px-2 py-1 bg-gold-100 text-gold-900 border border-gold-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition";
      el.innerHTML = \`\${label} &times;\`;
      el.onclick = () => {
        document.getElementById(selectId).value = "ALL";
        ${isStudent ? 'applyStudentFilters();' : 'applyScholarshipFilters();'}
      };
      container.appendChild(el);
    }
  };
  
  if (document.getElementById("status-filter")) addChip(document.getElementById("status-filter").options[document.getElementById("status-filter").selectedIndex].text, document.getElementById("status-filter").value, "status-filter");
  if (document.getElementById("state-filter")) addChip(document.getElementById("state-filter").options[document.getElementById("state-filter").selectedIndex].text, document.getElementById("state-filter").value, "state-filter");
  ${isStudent 
    ? 'if (document.getElementById("category-filter")) addChip(document.getElementById("category-filter").options[document.getElementById("category-filter").selectedIndex].text, document.getElementById("category-filter").value, "category-filter");\n  if (document.getElementById("course-filter")) addChip(document.getElementById("course-filter").options[document.getElementById("course-filter").selectedIndex].text, document.getElementById("course-filter").value, "course-filter");' 
    : 'if (document.getElementById("scheme-category-filter")) addChip(document.getElementById("scheme-category-filter").options[document.getElementById("scheme-category-filter").selectedIndex].text, document.getElementById("scheme-category-filter").value, "scheme-category-filter");'
  }
}
`;
    // Inject renderFilterChips into applyFilters
    js = js.replace(/function applyStudentFilters\(\) {/, func + '\nfunction applyStudentFilters() {');
    js = js.replace(/function applyScholarshipFilters\(\) {/, func + '\nfunction applyScholarshipFilters() {');
    
    // Call renderFilterChips in render code
    js = js.replace(/renderStudentsGrid\(\);/, 'renderStudentsGrid(); renderFilterChips();');
    js = js.replace(/renderScholarshipsGrid\(\);/, 'renderScholarshipsGrid(); renderFilterChips();');
    
    fs.writeFileSync(fileJs, js, 'utf8');
  }
}

addChips('scholarships.html', 'js/scholarships.js');
addChips('students.html', 'js/students.js');

