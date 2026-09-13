const fs = require("fs");
const path = require("path");

// 1. Patch links.html for layout
const htmlPath = path.join(process.cwd(), "links.html");
let html = fs.readFileSync(htmlPath, "utf-8");

const oldToolbar = `        <!-- Toolbar & Filter Bar -->
        <div class="bg-white p-2.5 sm:p-3 rounded-2xl border border-ink-100 shadow-sm space-y-2 relative z-20">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div class="relative flex-1 max-w-md">
              <input id="linkSearchInput" oninput="filterLinksSearch()" type="search" placeholder="Search official portals, schemes, verification tools…"
                class="w-full h-8 rounded-lg border border-ink-200 bg-ink-50/50 pl-8 pr-3 text-[11px] md:text-xs outline-none focus:border-gold-500 focus:bg-white focus:ring-1 focus:ring-gold-500 transition">
              <svg class="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            </div>

            <!-- Categories Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto table-scroll max-w-full pb-1 md:pb-0">
              <button onclick="filterLinksCategory('all', this)" class="category-filter-btn px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-ink-900 text-white transition shrink-0">All</button>
              <button onclick="filterLinksCategory('Government', this)" class="category-filter-btn px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-ink-600 hover:bg-ink-50 transition shrink-0">Govt Portals</button>
              <button onclick="filterLinksCategory('Verification', this)" class="category-filter-btn px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-ink-600 hover:bg-ink-50 transition shrink-0">Verification</button>
              <button onclick="filterLinksCategory('Scholarship', this)" class="category-filter-btn px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-ink-600 hover:bg-ink-50 transition shrink-0">Scholarships</button>
              <button onclick="filterLinksCategory('Tools', this)" class="category-filter-btn px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium text-ink-600 hover:bg-ink-50 transition shrink-0">Tools & Utilities</button>
            </div>
            
            <div class="flex items-center gap-2 justify-end shrink-0">
              <button onclick="openAddLinkModal()" class="h-8 px-3 bg-ink-900 hover:bg-ink-800 text-white text-[11px] font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 shrink-0">
                <span>+ Add Link</span>
              </button>
            </div>
          </div>
        </div>`;

const newToolbar = `        <!-- Premium Header & Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 class="font-display font-bold text-2xl text-ink-900">Official Portals</h1>
            <p class="text-sm text-ink-500 mt-1">Quick access to government, verification, and university websites.</p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="relative flex-1 sm:w-72">
              <input id="linkSearchInput" oninput="filterLinksSearch()" type="search" placeholder="Search portals..."
                class="w-full h-10 rounded-xl border border-ink-200 bg-white pl-10 pr-4 text-xs outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 shadow-sm transition">
              <svg class="w-4 h-4 text-ink-400 absolute left-3.5 top-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            </div>
            <button onclick="openAddLinkModal()" class="h-10 px-4 bg-ink-900 hover:bg-ink-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 shrink-0">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span class="hidden sm:inline">Add Portal</span>
            </button>
          </div>
        </div>

        <!-- Categories Pill Bar -->
        <div class="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 pt-1 border-b border-ink-100">
          <button onclick="filterLinksCategory('all', this)" class="category-filter-btn px-4 py-2 rounded-full text-xs font-bold bg-ink-900 text-white shadow-sm transition shrink-0">All Portals</button>
          <button onclick="filterLinksCategory('Government', this)" class="category-filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-white text-ink-600 border border-ink-200 hover:bg-ink-50 shadow-sm transition shrink-0">Govt Portals</button>
          <button onclick="filterLinksCategory('Verification', this)" class="category-filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-white text-ink-600 border border-ink-200 hover:bg-ink-50 shadow-sm transition shrink-0">Verification</button>
          <button onclick="filterLinksCategory('Scholarship', this)" class="category-filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-white text-ink-600 border border-ink-200 hover:bg-ink-50 shadow-sm transition shrink-0">Scholarships</button>
          <button onclick="filterLinksCategory('Tools', this)" class="category-filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-white text-ink-600 border border-ink-200 hover:bg-ink-50 shadow-sm transition shrink-0">Tools & Utilities</button>
        </div>`;

if (html.includes('id="linkSearchInput"')) {
    html = html.replace(oldToolbar, newToolbar);
    fs.writeFileSync(htmlPath, html, "utf-8");
} else {
    console.log("Could not patch html toolbar");
}

// 2. Patch links.js for premium card and active class logic
const jsPath = path.join(process.cwd(), "js/links.js");
let js = fs.readFileSync(jsPath, "utf-8");

const oldActiveClass = `  document.querySelectorAll(".category-filter-btn").forEach(b => {
    b.classList.remove("bg-ink-900", "text-white");
    b.classList.add("text-ink-600");
  });
  btn.classList.add("bg-ink-900", "text-white");
  btn.classList.remove("text-ink-600");`;

const newActiveClass = `  document.querySelectorAll(".category-filter-btn").forEach(b => {
    b.classList.remove("bg-ink-900", "text-white", "font-bold");
    b.classList.add("bg-white", "text-ink-600", "font-semibold", "border", "border-ink-200");
  });
  btn.classList.remove("bg-white", "text-ink-600", "font-semibold", "border", "border-ink-200");
  btn.classList.add("bg-ink-900", "text-white", "font-bold");`;

js = js.replace(oldActiveClass, newActiveClass);


const startIdx = js.indexOf("grid.innerHTML = filtered.map(link => {");
const endIdx = js.indexOf("}).join(\"\");", startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const oldMapBlock = js.substring(startIdx, endIdx);
    
    const newCardLogic = `grid.innerHTML = filtered.map(link => {
    const icon = link.icon || getCategoryIcon(link.category);
    return \`
      <div class="group relative bg-white p-5 rounded-2xl border border-ink-100 shadow-sm hover:shadow-card hover:border-gold-300 transition-all duration-300 flex flex-col h-full overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl bg-ink-50 border border-ink-100 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 group-hover:bg-gold-50 group-hover:border-gold-200 transition-all duration-300 shrink-0">
            \${icon}
          </div>
          <div class="flex flex-col items-end gap-1.5 shrink-0">
            <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-ink-900 text-white shadow-xs">
              \${escapeHtml(link.category || "Other")}
            </span>
            \${link.badge ? \`<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">\${escapeHtml(link.badge)}</span>\` : ""}
          </div>
        </div>
        
        <div class="mb-4 flex-1">
          <h3 class="font-display font-bold text-sm text-ink-900 group-hover:text-gold-700 transition-colors mb-1.5 line-clamp-1">
            \${escapeHtml(link.title)}
          </h3>
          <p class="text-xs text-ink-500 line-clamp-2 leading-relaxed">
            \${escapeHtml(link.description || "Official portal access and resources.")}
          </p>
        </div>
        
        <div class="pt-3 border-t border-ink-100 flex items-center justify-between gap-2 mt-auto">
          <div class="flex items-center gap-1 sm:opacity-60 group-hover:opacity-100 transition-opacity">
            <button onclick="copyLinkUrl('\${escapeHtml(link.url)}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition" title="Copy URL">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button onclick="editLink('\${link.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-gold-600 hover:bg-gold-50 transition" title="Edit Link">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button onclick="deleteLink('\${link.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition" title="Delete Link">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
          <a href="\${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="h-9 px-4 bg-ink-50 hover:bg-gold-500 hover:text-ink-950 text-ink-700 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs border border-ink-200 hover:border-gold-500">
            <span>Open</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      </div>
    \`;
  `;
    js = js.replace(oldMapBlock, newCardLogic);
    fs.writeFileSync(jsPath, js, "utf-8");
    console.log("Patched links.js ui logic");
} else {
    console.log("Could not patch links.js map logic");
}

