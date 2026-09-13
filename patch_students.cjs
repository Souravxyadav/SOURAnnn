const fs = require('fs');
let html = fs.readFileSync('students.html', 'utf8');

const regexBtn = /<div class="flex items-center gap-2 justify-end">[\s\S]*?<\/div>/;
const replacementBtn = `<div class="flex items-center gap-2 justify-end flex-wrap">
  <button onclick="exportStudentsCsv()" class="px-3 py-2 bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 shrink-0">
    <span>📥 Export CSV</span>
  </button>
  <button onclick="document.getElementById('csv-file-input').click()" class="px-3 py-2 bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 shrink-0">
    <span>📤 Import CSV</span>
  </button>
  <input type="file" id="csv-file-input" accept=".csv" class="hidden" onchange="handleCsvImport(event)">
  <button onclick="openStudentModal()" class="px-4 py-2 bg-ink-900 hover:bg-ink-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0">
    <span>+ Add Student</span>
  </button>
</div>`;

html = html.replace(regexBtn, replacementBtn);

// Add CSV preview modal
const csvModal = `
  <!-- CSV Preview Modal -->
  <div id="csv-preview-modal" class="modal-root hidden fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div onclick="closeCsvModal()" class="absolute inset-0 bg-ink-950/60 backdrop-blur-xs"></div>
    <div class="relative bg-white w-full max-w-4xl rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-display text-lg font-bold text-ink-900">Import Students from CSV</h3>
        <button onclick="closeCsvModal()" class="w-8 h-8 rounded-full bg-ink-50 text-ink-500 flex items-center justify-center">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div id="csv-summary" class="mb-4 text-sm font-semibold text-ink-700 p-3 bg-ink-50 rounded-xl border border-ink-200"></div>
        <div class="overflow-x-auto border border-ink-200 rounded-xl">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="bg-ink-50 border-b border-ink-200 text-ink-500">
              <tr>
                <th class="p-2 font-semibold">Row</th>
                <th class="p-2 font-semibold">Name</th>
                <th class="p-2 font-semibold">Mobile</th>
                <th class="p-2 font-semibold">Email</th>
                <th class="p-2 font-semibold">Course Level</th>
                <th class="p-2 font-semibold">Category</th>
                <th class="p-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody id="csv-preview-body" class="divide-y divide-ink-100">
              <!-- rows injected here -->
            </tbody>
          </table>
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <button onclick="closeCsvModal()" class="flex-1 border border-ink-200 text-ink-700 text-sm font-semibold rounded-xl py-2 hover:bg-ink-50">Cancel</button>
        <button id="csv-confirm-btn" onclick="confirmCsvImport()" class="flex-[2] bg-ink-900 text-white hover:bg-ink-800 font-bold text-sm rounded-xl py-2 flex items-center justify-center gap-2" disabled>
          Confirm Import
        </button>
      </div>
    </div>
  </div>
`;

if (!html.includes('csv-preview-modal')) {
  html = html.replace('<!-- Add/Edit student modal -->', csvModal + '\n  <!-- Add/Edit student modal -->');
  fs.writeFileSync('students.html', html, 'utf8');
}

