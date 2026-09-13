const fs = require('fs');
let js = fs.readFileSync('js/students.js', 'utf8');

const csvLogic = `
let pendingCsvRows = [];

window.exportStudentsCsv = function() {
  const visibleStudents = currentFilteredStudents || allStudents;
  if (visibleStudents.length === 0) {
    toast("No students to export", "error");
    return;
  }
  
  const headers = ["ID", "Name", "Student Code", "Mobile", "Email", "Aadhaar", "Gender", "DOB", "Category", "Course Level", "State", "District"];
  const rows = visibleStudents.map(s => [
    s.id,
    s.name,
    s.student_code || s.code,
    s.mobile,
    s.email,
    s.aadhaar_number,
    s.gender,
    s.dob,
    s.category,
    s.course_level || s.course_id,
    s.state,
    s.district
  ]);
  
  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\\n" 
    + rows.map(e => e.map(cell => '"' + (cell || '') + '"').join(",")).join("\\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "students_" + new Date().toISOString().slice(0,10) + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.handleCsvImport = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    processCsvData(text);
  };
  reader.readAsText(file);
  event.target.value = ''; // reset
};

function processCsvData(csvText) {
  const lines = csvText.split('\\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    toast("CSV file is empty or missing headers", "error");
    return;
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const nameIdx = headers.findIndex(h => h.includes('name'));
  const mobileIdx = headers.findIndex(h => h.includes('mobile') || h.includes('phone'));
  const emailIdx = headers.findIndex(h => h.includes('email'));
  const courseIdx = headers.findIndex(h => h.includes('course'));
  const categoryIdx = headers.findIndex(h => h.includes('category'));
  
  if (nameIdx === -1 || mobileIdx === -1) {
    toast("CSV must contain at least 'Name' and 'Mobile' columns", "error");
    return;
  }
  
  pendingCsvRows = [];
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  
  const tbody = document.getElementById("csv-preview-body");
  tbody.innerHTML = '';
  
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV parsing handling quotes is complex, using simple split for now assuming no commas in values
    let rowText = lines[i];
    // A simple regex to split by comma outside quotes
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const cols = rowText.split(regex).map(col => col.replace(/^"|"$/g, '').trim());
    
    const name = cols[nameIdx];
    const mobile = cols[mobileIdx];
    const email = emailIdx !== -1 ? cols[emailIdx] : '';
    const course = courseIdx !== -1 ? cols[courseIdx] : '';
    const category = categoryIdx !== -1 ? cols[categoryIdx] : '';
    
    let statusText = 'Valid';
    let statusColor = 'text-emerald-600 bg-emerald-50';
    let isValid = true;
    
    // Validation
    if (!name || name.length < 2) {
      isValid = false; statusText = "Invalid Name";
    } else if (!mobile || mobile.length < 10) {
      isValid = false; statusText = "Invalid Mobile";
    } else if (allStudents.some(s => s.mobile === mobile)) {
      isValid = false; statusText = "Duplicate Mobile"; duplicateCount++;
    }
    
    if (isValid) validCount++;
    else if (statusText !== "Duplicate Mobile") invalidCount++;
    
    if (isValid) {
      pendingCsvRows.push({
        name, mobile, email, course_id: course || 'UG', category: category || 'General', status: 'Active',
        code: 'STU-CSV-' + Date.now().toString().slice(-4) + '-' + i
      });
    }
    
    if (!isValid) statusColor = 'text-red-600 bg-red-50';
    if (statusText === 'Duplicate Mobile') statusColor = 'text-amber-600 bg-amber-50';
    
    tbody.innerHTML += \`
      <tr>
        <td class="p-2">\${i}</td>
        <td class="p-2 truncate max-w-[120px]">\${name}</td>
        <td class="p-2">\${mobile}</td>
        <td class="p-2 truncate max-w-[120px]">\${email}</td>
        <td class="p-2">\${course}</td>
        <td class="p-2">\${category}</td>
        <td class="p-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold \${statusColor}">\${statusText}</span>
        </td>
      </tr>
    \`;
  }
  
  document.getElementById("csv-summary").innerHTML = \`
    Total Rows: \${lines.length - 1} &bull; 
    <span class="text-emerald-700">Valid: \${validCount}</span> &bull; 
    <span class="text-amber-700">Duplicates: \${duplicateCount}</span> &bull; 
    <span class="text-red-700">Invalid: \${invalidCount}</span>
  \`;
  
  const confirmBtn = document.getElementById("csv-confirm-btn");
  confirmBtn.disabled = validCount === 0;
  
  document.getElementById("csv-preview-modal").classList.remove("hidden");
}

window.closeCsvModal = function() {
  document.getElementById("csv-preview-modal").classList.add("hidden");
  pendingCsvRows = [];
};

window.confirmCsvImport = async function() {
  if (pendingCsvRows.length === 0) return;
  
  const confirmBtn = document.getElementById("csv-confirm-btn");
  confirmBtn.innerHTML = "Importing...";
  confirmBtn.disabled = true;
  
  try {
    for (let row of pendingCsvRows) {
      const { error } = await sb.from("students").insert(row);
      if (error) throw error;
    }
    
    toast(\`Successfully imported \${pendingCsvRows.length} students\`, "success");
    closeCsvModal();
    loadStudents();
  } catch (err) {
    console.error(err);
    toast("Error importing some records", "error");
    confirmBtn.innerHTML = "Confirm Import";
    confirmBtn.disabled = false;
  }
};
`;

if (!js.includes('exportStudentsCsv')) {
  js += '\n' + csvLogic;
  fs.writeFileSync('js/students.js', js, 'utf8');
}
