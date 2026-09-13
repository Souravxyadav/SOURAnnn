const fs = require('fs');

const index = fs.readFileSync('index.html', 'utf8');
const login = fs.readFileSync('login.html', 'utf8');
const studentLogin = fs.readFileSync('student-login.html', 'utf8');

const headerFooterStr = (showBack) => `
<body class="bg-paper min-h-screen flex flex-col font-body text-ink-900">
  <header class="w-full bg-white border-b border-ink-100 py-4 px-4 sm:px-6 flex items-center justify-between shadow-xs">
    <div class="font-display text-lg sm:text-xl font-bold text-ink-900 flex items-center gap-2">
      <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg seal shadow-xs"></div>
      Scholar<span class="text-gold-600">Ledger</span>
    </div>
    ${showBack ? '<a href="index.html" class="flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-ink-50 hover:bg-ink-100 px-3 py-1.5 rounded-lg transition"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>Back</a>' : ''}
  </header>
  <main class="flex-1 flex items-center justify-center p-4 py-8 sm:py-12">
`;

const footerStr = `
  </main>
  <footer class="w-full bg-white border-t border-ink-100 py-6 text-center text-xs text-ink-500">
    &copy; 2026 ScholarLedger. All rights reserved.
  </footer>
</body>
`;

fs.writeFileSync('index.html', index.replace(/<body[^>]*>/, headerFooterStr(false)).replace(/<\/body>/, footerStr));
fs.writeFileSync('login.html', login.replace(/<body[^>]*>/, headerFooterStr(true)).replace(/<\/body>/, footerStr));
fs.writeFileSync('student-login.html', studentLogin.replace(/<body[^>]*>/, headerFooterStr(true)).replace(/<\/body>/, footerStr));

console.log("Patched successfully");
