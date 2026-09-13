const fs = require('fs');

function patchRenderCard(file) {
  let js = fs.readFileSync(file, 'utf8');

  const oldRenderMatch = /<div class="mt-2\.5 space-y-1 text-xs">[\s\S]*?<\/div>/;
  const newRenderMatch = `<div class="mt-2.5 space-y-1 text-[11px]">
          \${result.checks.map(c => {
            if (c.passed) return \`<p class="text-emerald-700 flex items-start gap-1.5"><span class="text-emerald-500 font-bold">✓</span> <span>\${escapeHtml(c.name)}</span></p>\`;
            if (c.review) return \`<p class="text-amber-700 flex items-start gap-1.5"><span class="text-amber-500 font-bold">⚠</span> <span>\${escapeHtml(c.name)}</span></p>\`;
            return \`<p class="text-red-600 flex items-start gap-1.5"><span class="text-red-500 font-bold">✕</span> <span>\${escapeHtml(c.name)}</span></p>\`;
          }).join("")}
        </div>`;
        
  // We should also patch the badge color at the top of the card
  const oldBadgeRegex = /<span class="inline-flex items-center gap-1.5 px-2 py-0\.2 rounded-full text-\[10px\] font-bold \${isEligible \? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}"[^>]*>[\s\S]*?<\/span>/;
  const newBadge = `\${window.EligibilityEngine ? window.EligibilityEngine.renderBadge(result.status) : '<span class="px-2 font-bold">' + result.statusLabel + '</span>'}`;
  
  if (js.match(oldRenderMatch)) {
    js = js.replace(oldRenderMatch, newRenderMatch);
    if (js.match(oldBadgeRegex)) {
       js = js.replace(oldBadgeRegex, newBadge);
    }
    fs.writeFileSync(file, js, 'utf8');
  }
}

patchRenderCard('js/eligibility.js');
patchRenderCard('js/student-detail.js');
