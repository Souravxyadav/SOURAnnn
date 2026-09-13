const fs = require('fs');
let html = fs.readFileSync('dashboard.html', 'utf8');

// Add D3 script before our scripts
html = html.replace('</head>', '  <script src="https://d3js.org/d3.v7.min.js"></script>\n</head>');

// Replace main content to add new sections
const newMainContent = `
      <main class="px-3.5 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto space-y-6 md:space-y-8">
        <!-- Header & Date -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 class="font-display text-2xl font-bold text-ink-900">Admin Dashboard</h1>
            <p class="text-sm text-ink-500 mt-1" id="dash-date">Welcome back, Coordinator.</p>
          </div>
          <div class="flex gap-2">
            <a href="commissions.html" class="px-4 py-2 bg-ink-50 border border-ink-200 text-ink-700 hover:text-ink-900 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5">
              <span>Ledger</span>
            </a>
            <a href="helpdesk.html" class="px-4 py-2 bg-ink-900 hover:bg-gold-500 hover:text-ink-950 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5">
              <span>Reply Center</span>
              <span id="dashboard-inquiry-badge" class="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-ink-950 rounded-full hidden">0</span>
            </a>
          </div>
        </div>

        <!-- Stat cards -->
        <section class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div class="bg-white rounded-2xl border border-ink-100 shadow-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition cursor-default">
            <div class="w-10 h-10 rounded-xl bg-ink-50 text-ink-600 flex items-center justify-center text-lg mb-3">👥</div>
            <p class="text-xs text-ink-500 font-bold uppercase tracking-wider">Total Students</p>
            <p id="stat-students" class="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-1">—</p>
          </div>
          <div class="bg-white rounded-2xl border border-ink-100 shadow-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition cursor-default">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3">📑</div>
            <p class="text-xs text-ink-500 font-bold uppercase tracking-wider">Applications</p>
            <p id="stat-applications" class="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-1">—</p>
          </div>
          <div class="bg-white rounded-2xl border border-ink-100 shadow-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition cursor-default">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg mb-3">✅</div>
            <p class="text-xs text-emerald-600/80 font-bold uppercase tracking-wider">Approved</p>
            <p id="stat-approved" class="font-display text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">—</p>
          </div>
          <div class="bg-white rounded-2xl border border-ink-100 shadow-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition cursor-default">
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg mb-3">⏳</div>
            <p class="text-xs text-amber-600/80 font-bold uppercase tracking-wider">Pending Review</p>
            <p id="stat-pending" class="font-display text-2xl sm:text-3xl font-bold text-amber-700 mt-1">—</p>
          </div>
        </section>

        <!-- Money summary & Quick actions -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <section class="lg:col-span-8 bg-ink-900 rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 text-white shadow-xl relative overflow-hidden">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div class="absolute right-20 -bottom-10 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl"></div>
            
            <div class="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl seal shrink-0 flex items-center justify-center shadow-lg relative z-10 bg-white">
              <span class="font-display text-[11px] sm:text-xs font-bold text-ink-900 text-center leading-tight">NET<br>DUE</span>
            </div>
            
            <div class="w-full flex-1 grid grid-cols-3 gap-4 sm:gap-6 relative z-10 min-w-0">
              <div class="min-w-0 border-l-2 border-white/10 pl-4 sm:pl-5">
                <p class="text-[10px] sm:text-xs uppercase tracking-wider text-ink-300 font-bold truncate">Expected Total</p>
                <p id="stat-expected" class="font-display text-xl sm:text-2xl font-bold mt-1 text-white truncate">—</p>
              </div>
              <div class="min-w-0 border-l-2 border-white/10 pl-4 sm:pl-5">
                <p class="text-[10px] sm:text-xs uppercase tracking-wider text-emerald-400 font-bold truncate">Received</p>
                <p id="stat-received" class="font-display text-xl sm:text-2xl font-bold mt-1 text-emerald-300 truncate">—</p>
              </div>
              <div class="min-w-0 border-l-2 border-white/10 pl-4 sm:pl-5">
                <p class="text-[10px] sm:text-xs uppercase tracking-wider text-gold-400 font-bold truncate">Pending / Due</p>
                <p id="stat-pending-amount" class="font-display text-xl sm:text-2xl font-bold mt-1 text-gold-300 truncate">—</p>
              </div>
            </div>
          </section>

          <section class="lg:col-span-4 grid grid-cols-2 gap-3 sm:gap-4">
            <a href="students.html?new=1" class="bg-white border border-ink-100 rounded-2xl shadow-card p-4 flex flex-col items-center justify-center gap-2 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-8 h-8 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition">➕</div>
              <span class="text-xs font-bold text-ink-800">Add Student</span>
            </a>
            <a href="scholarships.html?new=1" class="bg-white border border-ink-100 rounded-2xl shadow-card p-4 flex flex-col items-center justify-center gap-2 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-8 h-8 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition">🎓</div>
              <span class="text-xs font-bold text-ink-800">Add Scheme</span>
            </a>
            <a href="application.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-4 flex flex-col items-center justify-center gap-2 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-8 h-8 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition">📝</div>
              <span class="text-xs font-bold text-ink-800">New App</span>
            </a>
            <a href="applications.html" class="bg-white border border-ink-100 rounded-2xl shadow-card p-4 flex flex-col items-center justify-center gap-2 hover:border-gold-400 hover:-translate-y-0.5 transition text-center group">
              <div class="w-8 h-8 rounded-full bg-ink-50 text-ink-600 flex items-center justify-center group-hover:bg-gold-50 group-hover:text-gold-700 transition">📂</div>
              <span class="text-xs font-bold text-ink-800">All Apps</span>
            </a>
          </section>
        </div>

        <!-- Charts and Activity Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Column 1: Application Status Chart -->
          <section class="lg:col-span-1 bg-white rounded-3xl border border-ink-100 p-6 shadow-card flex flex-col">
            <h2 class="font-display text-base font-bold text-ink-900 mb-1">Application Pipeline</h2>
            <p class="text-[11px] text-ink-400 mb-6 font-medium">Distribution by current status</p>
            <div id="chart-container" class="w-full flex-1 min-h-[250px] flex items-center justify-center relative">
              <p class="text-xs text-ink-400 absolute">Loading Chart...</p>
            </div>
            <div id="chart-legend" class="mt-4 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold"></div>
          </section>

          <!-- Column 2: Recent Activity -->
          <section class="lg:col-span-1 bg-white rounded-3xl border border-ink-100 p-6 shadow-card flex flex-col">
            <div class="flex items-center justify-between mb-1">
              <h2 class="font-display text-base font-bold text-ink-900">Recent Applications</h2>
              <a href="applications.html" class="text-[10px] font-bold text-gold-600 hover:underline uppercase tracking-wider">View All</a>
            </div>
            <p class="text-[11px] text-ink-400 mb-4 font-medium">Latest tracked forms</p>
            <div id="recent-list" class="space-y-3 flex-1 overflow-y-auto pr-1">
              <p class="text-xs text-ink-400">Loading…</p>
            </div>
          </section>

          <!-- Column 3: Recent Transactions & Deadlines -->
          <section class="lg:col-span-1 flex flex-col gap-6">
            
            <!-- Recent Transactions -->
            <div class="bg-white rounded-3xl border border-ink-100 p-6 shadow-card flex-1 flex flex-col">
              <div class="flex items-center justify-between mb-1">
                <h2 class="font-display text-base font-bold text-ink-900">Latest Payments</h2>
                <a href="commissions.html" class="text-[10px] font-bold text-gold-600 hover:underline uppercase tracking-wider">Ledger</a>
              </div>
              <p class="text-[11px] text-ink-400 mb-4 font-medium">Recent student & commission credits</p>
              <div id="recent-payments" class="space-y-3 overflow-y-auto pr-1 flex-1">
                <p class="text-xs text-ink-400">Loading…</p>
              </div>
            </div>

            <!-- Deadlines -->
            <div class="bg-ink-50 rounded-3xl border border-ink-100 p-5">
              <div class="flex items-center justify-between mb-3">
                <h2 class="font-display text-sm font-bold text-ink-900 flex items-center gap-2"><span>📅</span> Upcoming Deadlines</h2>
              </div>
              <div id="deadline-list" class="space-y-2">
                <p class="text-xs text-ink-400">Loading…</p>
              </div>
            </div>
            
          </section>
        </div>

      </main>
`;

html = html.replace(/<main[\s\S]*?<\/main>/, newMainContent);

fs.writeFileSync('dashboard.html', html);
console.log("Patched dashboard.html");
