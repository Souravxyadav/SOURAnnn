const fs = require('fs');
let html = fs.readFileSync('dashboard.html', 'utf8');

const updatedGrid = `
          <section class="lg:col-span-4 grid grid-cols-3 gap-2 sm:gap-3">
            <a href="students.html?new=1" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">➕</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">New<br>Student</span>
            </a>
            <a href="scholarships.html?new=1" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">🎓</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">New<br>Scheme</span>
            </a>
            <a href="application.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">📝</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">New<br>App</span>
            </a>
            <a href="students.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">👥</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">All<br>Students</span>
            </a>
            <a href="scholarships.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">📚</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">All<br>Schemes</span>
            </a>
            <a href="applications.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">📂</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">All<br>Apps</span>
            </a>
            <a href="commissions.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">💰</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">Finances<br>Ledger</span>
            </a>
            <a href="helpdesk.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">💬</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">Reply<br>Center</span>
            </a>
            <a href="links.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-7 h-7 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition text-xs">🔗</div>
              <span class="text-[10px] font-bold text-ink-800 leading-tight">Useful<br>Links</span>
            </a>
          </section>
`;

html = html.replace(/<section class="lg:col-span-4 grid grid-cols-2 gap-3 sm:gap-4">[\s\S]*?<\/section>/, updatedGrid);
fs.writeFileSync('dashboard.html', html);
console.log("Patched grid");
