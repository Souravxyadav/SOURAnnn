const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "index.html", icon: "M3 12l2-2 7-7 7 7 2 2M5 10v10a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V10" },
  { key: "students", label: "Students Directory", href: "students.html", icon: "M12 4a4 4 0 100 8 4 4 0 000-8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" },
  { key: "scholarships", label: "Scholarships", href: "scholarships.html", icon: "M12 3l9 4.5-9 4.5-9-4.5L12 3zM3 7.5v6c0 1.7 4 4.5 9 4.5s9-2.8 9-4.5v-6" },
  { key: "applications", label: "Applications", href: "applications.html", icon: "M9 3h6a2 2 0 012 2v14l-5-3-5 3V5a2 2 0 012-2z" },
  { key: "commissions", label: "Commissions & Fees", href: "commissions.html", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "helpdesk", label: "Inquiries & Replies", href: "helpdesk.html", badgeId: "nav-inquiries-badge", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
  { key: "eligibility", label: "Eligibility Engine", href: "eligibility.html", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { key: "links", label: "Important Links", href: "links.html", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  { key: "settings", label: "Settings", href: "settings.html", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a7.97 7.97 0 000-6l2-1.6-2-3.4-2.3.9a8 8 0 00-2.1-1.2L14.6 1H9.4l-.4 2.7a8 8 0 00-2.1 1.2l-2.3-.9-2 3.4L4.6 9a7.97 7.97 0 000 6l-2 1.6 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2l.4 2.7h5.2l.4-2.7c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.6z" },
];

function iconSvg(path, cls = "w-4 h-4") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path.split(" M").map((p,i)=> i===0? `<path d="${p}"/>`:`<path d="M${p}"/>`).join("")}</svg>`;
}

function renderLayout(activeKey, pageTitle) {
  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("topbar");
  const bottomNav = document.getElementById("bottom-nav");

  if (sidebar) {
    sidebar.className = "hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-ink-900 text-ink-50 min-h-screen sticky top-0 border-r border-ink-800 z-30";
    sidebar.innerHTML = `
      <div class="px-5 py-5 border-b border-ink-800 flex items-center justify-between">
        <a href="index.html" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-ink-950 font-bold text-sm shadow-sm">
            🎓
          </div>
          <div>
            <p class="font-display text-base font-bold tracking-tight text-white leading-none">Scholar<span class="text-gold-400">Ledger</span></p>
            <p class="text-[10px] text-ink-400 mt-0.5">Admin Operations Console</p>
          </div>
        </a>
      </div>

      <div class="px-3 py-2 border-b border-ink-800 bg-ink-950/40">
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-ink-400">Portal Switching:</span>
          <a href="student-portal.html" class="text-gold-400 hover:text-gold-300 font-semibold flex items-center gap-1">
            <span>Student Portal</span>
            <span>→</span>
          </a>
        </div>
      </div>

      <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
        ${NAV_ITEMS.map(item => `
          <a href="${item.href}" class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${item.key === activeKey ? "bg-gold-500 text-ink-950 font-bold shadow-sm" : "text-ink-300 hover:bg-ink-800 hover:text-white"}">
            <div class="flex items-center gap-3 min-w-0">
              ${iconSvg(item.icon, "w-4 h-4 shrink-0")}
              <span class="truncate">${item.label}</span>
            </div>
            ${item.badgeId ? `<span id="${item.badgeId}" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-ink-950 hidden">0</span>` : ""}
          </a>`).join("")}
      </nav>

      <div class="px-3 py-3 border-t border-ink-800 bg-ink-950/60">
        <button id="sidebar-logout-btn" onclick="handleAdminLogout()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/10 hover:text-red-200 transition">
          ${iconSvg("M17 16l4-4m0 0l-4-4m4 4H7 M7 4H5a2 2 0 00-2 2v12a2 2 0 002 2h2", "w-4 h-4 text-red-400")}
          <span>Log out Admin</span>
        </button>
      </div>`;
  }

  if (topbar) {
    topbar.className = "sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-ink-100 px-3 sm:px-6 md:px-8 h-14 flex items-center justify-between w-full max-w-full overflow-hidden shrink-0";
    topbar.innerHTML = `
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <!-- Hamburger Menu Button for Mobile -->
        <button type="button" id="mobile-hamburger-btn" onclick="toggleMobileNav(true)" class="md:hidden p-1.5 -ml-1 rounded-xl text-ink-700 hover:text-ink-950 hover:bg-ink-100 active:bg-ink-200 transition shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer" aria-label="Open Navigation Menu">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <a href="index.html" class="flex items-center gap-2 shrink-0 min-w-0">
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-ink-950 font-bold text-xs shadow-xs shrink-0">
            🎓
          </div>
          <span class="font-display text-sm sm:text-base font-bold text-ink-900 tracking-tight whitespace-nowrap truncate max-w-[120px] xs:max-w-none">Scholar<span class="text-gold-600">Ledger</span></span>
        </a>

        <div class="hidden md:flex items-center gap-2 pl-3 border-l border-ink-200 min-w-0">
          <h1 class="font-display text-sm sm:text-base font-bold text-ink-900 truncate">${pageTitle || "ScholarLedger"}</h1>
        </div>
      </div>

      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <a href="student-register.html" class="hidden lg:inline-flex items-center gap-1.5 h-8.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl transition whitespace-nowrap">
          <span>📝</span>
          <span>Self-Register</span>
        </a>
        <a href="student-portal.html" class="inline-flex items-center gap-1.5 h-8.5 px-2.5 sm:px-3 bg-white hover:bg-ink-50 text-ink-800 border border-ink-200 text-xs font-semibold rounded-xl transition shadow-xs whitespace-nowrap">
          <span>🎓</span>
          <span class="hidden sm:inline">Student Portal</span>
          <span class="sm:hidden">Portal</span>
        </a>
        <button onclick="handleAdminLogout()" class="h-8.5 px-2.5 sm:px-3 bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold rounded-xl transition shadow-xs whitespace-nowrap cursor-pointer">
          <span class="hidden sm:inline">Log out</span>
          <span class="sm:hidden">Exit</span>
        </button>
      </div>`;
  }

  // Inject / update mobile navigation drawer
  let drawer = document.getElementById("mobile-nav-drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "mobile-nav-drawer";
    document.body.appendChild(drawer);
  }
  drawer.className = "fixed inset-0 z-50 invisible opacity-0 md:hidden";
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = `
    <!-- Backdrop -->
    <div onclick="toggleMobileNav(false)" class="absolute inset-0 bg-ink-950/75 backdrop-blur-xs"></div>

    <!-- Slide-in Drawer Panel -->
    <div id="mobile-nav-panel" class="relative w-4/5 max-w-[290px] h-full bg-ink-900 text-ink-50 shadow-2xl flex flex-col z-10 border-r border-ink-800">
      
      <!-- Drawer Header -->
      <div class="px-4 py-4 border-b border-ink-800 flex items-center justify-between">
        <a href="index.html" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-ink-950 font-bold text-sm shadow-xs">
            🎓
          </div>
          <div>
            <p class="font-display text-sm font-bold tracking-tight text-white leading-none">Scholar<span class="text-gold-400">Ledger</span></p>
            <p class="text-[10px] text-ink-400 mt-0.5">Admin Operations</p>
          </div>
        </a>
        <button type="button" onclick="toggleMobileNav(false)" class="p-1.5 rounded-xl text-ink-400 hover:text-white hover:bg-ink-800 transition" aria-label="Close Navigation">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Portal Switcher -->
      <div class="px-4 py-2.5 border-b border-ink-800 bg-ink-950/60">
        <div class="flex items-center justify-between text-xs">
          <span class="text-ink-400 text-[11px]">Portal:</span>
          <a href="student-portal.html" class="text-gold-400 hover:text-gold-300 font-bold text-xs flex items-center gap-1">
            <span>Student Portal</span>
            <span>→</span>
          </a>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        ${NAV_ITEMS.map(item => `
          <a href="${item.href}" onclick="toggleMobileNav(false)" class="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${item.key === activeKey ? "bg-gold-500 text-ink-950 font-bold shadow-xs" : "text-ink-300 hover:bg-ink-800 hover:text-white"}">
            <div class="flex items-center gap-3 min-w-0">
              ${iconSvg(item.icon, "w-4 h-4 shrink-0")}
              <span class="truncate">${item.label}</span>
            </div>
            ${item.badgeId ? `<span class="mobile-inquiries-badge text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-ink-950 hidden">0</span>` : ""}
          </a>`).join("")}
      </nav>

      <!-- Footer Quick Actions -->
      <div class="p-3.5 border-t border-ink-800 bg-ink-950/80 space-y-2">
        <a href="student-register.html" class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-ink-800 transition">
          <span>📝</span>
          <span>Student Self-Register</span>
        </a>
        <button type="button" onclick="handleAdminLogout()" class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 transition">
          ${iconSvg("M17 16l4-4m0 0l-4-4m4 4H7 M7 4H5a2 2 0 00-2 2v12a2 2 0 002 2h2", "w-4 h-4 text-red-400")}
          <span>Log out Admin</span>
        </button>
      </div>
    </div>`;

  if (bottomNav) {
    bottomNav.className = "md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink-950/95 backdrop-blur-md text-ink-300 border-t border-ink-800 flex items-stretch px-1 py-1 shadow-2xl safe-bottom";
    bottomNav.innerHTML = `
      <a href="index.html" class="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 text-[10px] font-medium ${activeKey === 'dashboard' ? 'text-gold-400 font-bold' : 'text-ink-400'}">
        ${iconSvg(NAV_ITEMS[0].icon, "w-4 h-4")}
        <span class="truncate">Home</span>
      </a>
      <a href="students.html" class="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 text-[10px] font-medium ${activeKey === 'students' ? 'text-gold-400 font-bold' : 'text-ink-400'}">
        ${iconSvg(NAV_ITEMS[1].icon, "w-4 h-4")}
        <span class="truncate">Students</span>
      </a>
      <a href="applications.html" class="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 text-[10px] font-medium ${activeKey === 'applications' ? 'text-gold-400 font-bold' : 'text-ink-400'}">
        ${iconSvg(NAV_ITEMS[3].icon, "w-4 h-4")}
        <span class="truncate">Apps</span>
      </a>
      <a href="commissions.html" class="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 text-[10px] font-medium ${activeKey === 'commissions' ? 'text-gold-400 font-bold' : 'text-ink-400'}">
        ${iconSvg(NAV_ITEMS[4].icon, "w-4 h-4")}
        <span class="truncate">Fees</span>
      </a>
      <button type="button" onclick="toggleMobileNav(true)" class="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 text-[10px] font-medium text-ink-300 hover:text-white" aria-label="Open Navigation Menu">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span>Menu</span>
      </button>`;
  }

  // Asynchronously check for pending student inquiries to reflect badge
  setTimeout(updateLayoutNavBadges, 80);
}

async function updateLayoutNavBadges() {
  try {
    if (!window.supabaseClient) return;
    const { data } = await window.supabaseClient.from("support_messages").select("id, status");
    const pendingCount = (data || []).filter(m => (m.status || "Pending").toLowerCase() === "pending").length;

    const desktopBadge = document.getElementById("nav-inquiries-badge");
    const mobileBadges = document.querySelectorAll(".mobile-inquiries-badge");

    if (desktopBadge) {
      if (pendingCount > 0) {
        desktopBadge.textContent = `${pendingCount}`;
        desktopBadge.classList.remove("hidden");
      } else {
        desktopBadge.classList.add("hidden");
      }
    }

    mobileBadges.forEach(b => {
      if (pendingCount > 0) {
        b.textContent = `${pendingCount}`;
        b.classList.remove("hidden");
      } else {
        b.classList.add("hidden");
      }
    });
  } catch (e) {
    // Ignore silent badge fetch errors
  }
}

function toggleMobileNav(open) {
  const drawer = document.getElementById("mobile-nav-drawer");
  if (!drawer) return;
  if (open) {
    drawer.classList.remove("invisible", "opacity-0");
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
  } else {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (!drawer.classList.contains("open")) {
        drawer.classList.add("invisible", "opacity-0");
      }
    }, 280);
    document.body.classList.remove("overflow-hidden");
  }
}

// Global escape key listener for mobile drawer
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    toggleMobileNav(false);
  }
});

function handleAdminLogout() {
  if (window.supabaseClient && window.supabaseClient.auth) {
    window.supabaseClient.auth.signOut().then(() => {
      localStorage.removeItem("scholarledger_mock_session_v1");
      localStorage.setItem("scholarledger_logged_out", "true");
      window.location.href = "login.html";
    });
  } else {
    localStorage.removeItem("scholarledger_mock_session_v1");
    localStorage.setItem("scholarledger_logged_out", "true");
    window.location.href = "login.html";
  }
}

