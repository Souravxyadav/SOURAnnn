const fs = require('fs');

let portalJs = fs.readFileSync('js/student-portal.js', 'utf8');

const newRenderMap = `
  container.innerHTML = studentInquiriesList.map(item => {
    const isPending = (item.status || "Pending").toLowerCase() === "pending";

    return \`
      <div class="bg-white rounded-2xl border border-ink-100 p-5 space-y-4 hover:shadow-md transition">
        
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm text-ink-900">\${escapeHtml(item.subject || "Student Inquiry")}</span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-ink-50 text-ink-600">\${escapeHtml(item.category || "General")}</span>
          </div>
          \${isPending
            ? \`<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 flex items-center gap-1 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Waiting on Coordinator</span>\`
            : \`<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 flex items-center gap-1 shrink-0">✓ Replied</span>\`
          }
        </div>
        
        <!-- Thread -->
        <div class="ml-2 pl-4 border-l-2 border-ink-100 space-y-4">
          
          <!-- Student Message -->
          <div class="space-y-1">
            \${item.related_scholarship ? \`<div class="text-[11px] text-ink-500 mb-1">Scheme: \${escapeHtml(item.related_scholarship)}</div>\` : ""}
            <p class="text-sm text-ink-800 whitespace-pre-line leading-relaxed">
              \${escapeHtml(item.message || "—")}
            </p>
            <div class="text-[10px] text-ink-400 pt-1">Asked on \${formatDateTime(item.created_at)}</div>
          </div>

          <!-- Coordinator Reply (if present) -->
          \${item.response ? \`
            <div class="bg-ink-50 rounded-xl p-4 mt-2">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center text-[10px]">✨</div>
                <span class="font-bold text-xs text-ink-900">Coordinator Reply</span>
                <span class="text-[10px] text-ink-500">\${formatDateTime(item.responded_at || item.updated_at)}</span>
              </div>
              <p class="text-sm text-ink-800 whitespace-pre-line leading-relaxed">
                \${escapeHtml(item.response)}
              </p>
            </div>
          \` : ""}

        </div>
      </div>\`;
  }).join("");
}
`;

portalJs = portalJs.replace(/container\.innerHTML \= studentInquiriesList\.map\([\s\S]*?\}\.join\(\"\"\);\n\}/, newRenderMap);

fs.writeFileSync('js/student-portal.js', portalJs);
console.log("Patched student-portal.js");
