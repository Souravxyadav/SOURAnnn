const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "js/links.js");
let code = fs.readFileSync(filePath, "utf-8");

const oldCard = `      <div class="card-interactive p-4 sm:p-5 flex flex-col justify-between space-y-3.5 group">
        <div>
          <div class="flex items-start justify-between gap-2 mb-2.5">
            <div class="w-9 h-9 rounded-xl bg-gold-50 border border-gold-200/60 flex items-center justify-center text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              \${icon}
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ink-50 text-ink-600 border border-ink-100">
                \${escapeHtml(link.category || "Other")}
              </span>
              \${link.badge ? \`<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">\${escapeHtml(link.badge)}</span>\` : ""}
            </div>
          </div>
          <h3 class="font-display font-bold text-xs sm:text-sm text-ink-900 group-hover:text-gold-700 transition leading-snug">
            \${escapeHtml(link.title)}
          </h3>
          <p class="text-xs text-ink-500 mt-1 line-clamp-2 leading-relaxed">
            \${escapeHtml(link.description || "Official portal access and resources.")}
          </p>
        </div>
        <div class="pt-2.5 border-t border-ink-100 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1">
            <button onclick="copyLinkUrl('\${escapeHtml(link.url)}')" class="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded-lg transition" title="Copy URL">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button onclick="editLink('\${link.id}')" class="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded-lg transition" title="Edit Link">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button onclick="deleteLink('\${link.id}')" class="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Link">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
          <a href="\${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="btn-compact btn-primary">
            <span>Open Portal</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      </div>`;

const newCard = `      <div class="card-interactive p-4 flex flex-col justify-between space-y-3 group bg-white border border-ink-100 rounded-xl shadow-sm hover:shadow-md transition">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200/60 flex items-center justify-center text-lg shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            \${icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap mb-1">
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-ink-100 text-ink-600">
                \${escapeHtml(link.category || "Other")}
              </span>
              \${link.badge ? \`<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">\${escapeHtml(link.badge)}</span>\` : ""}
            </div>
            <h3 class="font-display font-bold text-xs text-ink-900 group-hover:text-gold-700 transition leading-snug truncate">
              \${escapeHtml(link.title)}
            </h3>
            <p class="text-[11px] text-ink-500 mt-0.5 line-clamp-2 leading-relaxed">
              \${escapeHtml(link.description || "Official portal access and resources.")}
            </p>
          </div>
        </div>
        <div class="pt-2 border-t border-ink-100 flex items-center justify-between gap-2 mt-auto">
          <div class="flex items-center gap-0.5">
            <button onclick="copyLinkUrl('\${escapeHtml(link.url)}')" class="p-1 text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded transition" title="Copy URL">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button onclick="editLink('\${link.id}')" class="p-1 text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded transition" title="Edit Link">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button onclick="deleteLink('\${link.id}')" class="p-1 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete Link">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
          <a href="\${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="h-7 px-2.5 bg-ink-900 hover:bg-ink-800 text-white text-[10px] font-bold rounded shadow-xs transition flex items-center gap-1">
            <span>Open</span>
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      </div>`;

if (code.includes('card-interactive p-4 sm:p-5')) {
    code = code.replace(oldCard, newCard);
    fs.writeFileSync(filePath, code, "utf-8");
    console.log("Patched link cards successfully.");
} else {
    console.log("Could not find old card to patch.");
}
