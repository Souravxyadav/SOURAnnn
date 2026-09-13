const fs = require('fs');

function patchFilters(fileHtml) {
  let html = fs.readFileSync(fileHtml, 'utf8');

  // Wrap the filters grid with a container and a toggle button for mobile
  const filterGridRegex = /<div class="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center gap-2 pt-2\.5 border-t border-ink-100">/;
  
  const replacement = `
  <div class="lg:hidden w-full flex justify-end mt-2">
    <button onclick="document.getElementById('mobile-filter-drawer').classList.toggle('hidden')" class="px-3 py-1.5 bg-ink-50 border border-ink-200 text-ink-700 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
      Filters
    </button>
  </div>
  <div id="mobile-filter-drawer" class="hidden lg:flex flex-col lg:flex-row grid-cols-2 sm:grid-cols-3 lg:flex-wrap lg:items-center gap-2 pt-2.5 border-t border-ink-100 bg-white lg:bg-transparent p-3 lg:p-0 rounded-xl lg:rounded-none border lg:border-none border-ink-200 mt-2 lg:mt-0 shadow-sm lg:shadow-none absolute lg:relative z-20 w-full lg:w-auto left-0">
  `;

  if (html.match(filterGridRegex)) {
    html = html.replace(filterGridRegex, replacement);
    fs.writeFileSync(fileHtml, html, 'utf8');
  }
}

patchFilters('students.html');
patchFilters('scholarships.html');
