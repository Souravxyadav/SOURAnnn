const fs = require('fs');

function fix(fileHtml) {
  let html = fs.readFileSync(fileHtml, 'utf8');
  html = html.replace(/<div id="mobile-filter-drawer" class="hidden lg:flex flex-col lg:flex-row grid-cols-2 sm:grid-cols-3 lg:flex-wrap lg:items-center gap-2 pt-2.5 border-t border-ink-100 bg-white lg:bg-transparent p-3 lg:p-0 rounded-xl lg:rounded-none border lg:border-none border-ink-200 mt-2 lg:mt-0 shadow-sm lg:shadow-none absolute lg:relative z-20 w-full lg:w-auto left-0">/, 
  `<div id="mobile-filter-drawer" class="hidden lg:flex flex-col sm:grid sm:grid-cols-3 lg:flex-row lg:flex-wrap lg:items-center gap-2 pt-2.5 lg:border-t lg:border-ink-100 bg-white lg:bg-transparent p-3 lg:p-0 rounded-xl lg:rounded-none border border-ink-200 lg:border-none mt-2 lg:mt-0 shadow-lg lg:shadow-none absolute lg:relative z-20 w-full lg:w-auto left-0">`);
  fs.writeFileSync(fileHtml, html, 'utf8');
}
fix('students.html');
fix('scholarships.html');
