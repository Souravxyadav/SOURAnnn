// Important Links & Quick Portals Controller
let allLinks = [];
let activeCategory = "all";

document.addEventListener("DOMContentLoaded", async () => {
  renderLayout("links", "Important Links & Official Portals");
  await loadLinks();
});

async function loadLinks() {
  const loading = document.getElementById("loadingState");
  const empty = document.getElementById("emptyState");
  const grid = document.getElementById("linksGrid");

  try {
    loading?.classList.remove("hidden");
    empty?.classList.add("hidden");

    const { data, error } = await window.supabaseClient
      .from("important_links")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    allLinks = data || [];
    renderLinks();
  } catch (err) {
    console.error("Load links error:", err);
    toast("Failed to load important links", "error");
  } finally {
    loading?.classList.add("hidden");
  }
}

function filterLinksCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll(".category-filter-btn").forEach(b => {
    b.classList.remove("bg-ink-900", "text-white", "font-bold");
    b.classList.add("bg-white", "text-ink-600", "font-semibold", "border", "border-ink-200");
  });
  btn.classList.remove("bg-white", "text-ink-600", "font-semibold", "border", "border-ink-200");
  btn.classList.add("bg-ink-900", "text-white", "font-bold");
  renderLinks();
}

function filterLinksSearch() {
  renderLinks();
}

function renderLinks() {
  const grid = document.getElementById("linksGrid");
  const empty = document.getElementById("emptyState");
  if (!grid) return;

  const query = (document.getElementById("linkSearchInput")?.value || "").toLowerCase().trim();

  const filtered = allLinks.filter(link => {
    const matchesCat = activeCategory === "all" || link.category?.toLowerCase() === activeCategory.toLowerCase();
    const title = (link.title || "").toLowerCase();
    const desc = (link.description || "").toLowerCase();
    const badge = (link.badge || "").toLowerCase();
    const matchesQuery = !query || title.includes(query) || desc.includes(query) || badge.includes(query);
    return matchesCat && matchesQuery;
  });

  if (filtered.length === 0) {
    grid.innerHTML = "";
    empty?.classList.remove("hidden");
    return;
  }

  empty?.classList.add("hidden");
  grid.innerHTML = filtered.map(link => {
    const icon = link.icon || getCategoryIcon(link.category);
    return `
      <div class="group relative bg-white p-5 rounded-2xl border border-ink-100 shadow-sm hover:shadow-card hover:border-gold-300 transition-all duration-300 flex flex-col h-full overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl bg-ink-50 border border-ink-100 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 group-hover:bg-gold-50 group-hover:border-gold-200 transition-all duration-300 shrink-0">
            ${icon}
          </div>
          <div class="flex flex-col items-end gap-1.5 shrink-0">
            <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-ink-900 text-white shadow-xs">
              ${escapeHtml(link.category || "Other")}
            </span>
            ${link.badge ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">${escapeHtml(link.badge)}</span>` : ""}
          </div>
        </div>
        
        <div class="mb-4 flex-1">
          <h3 class="font-display font-bold text-sm text-ink-900 group-hover:text-gold-700 transition-colors mb-1.5 line-clamp-1">
            ${escapeHtml(link.title)}
          </h3>
          <p class="text-xs text-ink-500 line-clamp-2 leading-relaxed">
            ${escapeHtml(link.description || "Official portal access and resources.")}
          </p>
        </div>
        
        <div class="pt-3 border-t border-ink-100 flex items-center justify-between gap-2 mt-auto">
          <div class="flex items-center gap-1 sm:opacity-60 group-hover:opacity-100 transition-opacity">
            <button onclick="copyLinkUrl('${escapeHtml(link.url)}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition" title="Copy URL">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button onclick="editLink('${link.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-gold-600 hover:bg-gold-50 transition" title="Edit Link">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button onclick="deleteLink('${link.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition" title="Delete Link">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
          <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="h-9 px-4 bg-ink-50 hover:bg-gold-500 hover:text-ink-950 text-ink-700 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs border border-ink-200 hover:border-gold-500">
            <span>Open</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
        </div>
      </div>
    `;
  }).join("");
}

function getCategoryIcon(cat) {
  switch ((cat || "").toLowerCase()) {
    case "government": return "🏛️";
    case "verification": return "🔐";
    case "tools": return "💳";
    case "university": return "🎓";
    case "scholarship": return "📜";
    default: return "🌐";
  }
}

function openAddLinkModal() {
  const modal = document.getElementById("linkModal");
  const form = document.getElementById("linkForm");
  if (!modal) return;
  if (form) form.reset();
  document.getElementById("editLinkId").value = "";
  document.getElementById("linkModalTitle").textContent = "Add Important Link";
  modal.classList.remove("hidden");
}

function closeLinkModal() {
  document.getElementById("linkModal")?.classList.add("hidden");
}

function editLink(id) {
  const link = allLinks.find(l => l.id === id);
  if (!link) return;

  document.getElementById("editLinkId").value = link.id;
  document.getElementById("formLinkTitle").value = link.title || "";
  document.getElementById("formLinkUrl").value = link.url || "";
  document.getElementById("formLinkCategory").value = link.category || "Government";
  document.getElementById("formLinkOrder").value = link.display_order ?? 0;
  document.getElementById("formLinkBadge").value = link.badge || "";
  document.getElementById("formLinkDescription").value = link.description || "";
  document.getElementById("formLinkActive").checked = link.is_active !== false;

  document.getElementById("linkModalTitle").textContent = "Edit Important Link";
  document.getElementById("linkModal").classList.remove("hidden");
}

async function handleSaveLink(e) {
  e.preventDefault();
  const id = document.getElementById("editLinkId").value;
  const title = document.getElementById("formLinkTitle").value.trim();
  const url = document.getElementById("formLinkUrl").value.trim();
  const category = document.getElementById("formLinkCategory").value;
  const order = parseInt(document.getElementById("formLinkOrder").value, 10) || 0;
  const badge = document.getElementById("formLinkBadge").value.trim() || null;
  const desc = document.getElementById("formLinkDescription").value.trim() || null;
  const isActive = document.getElementById("formLinkActive").checked;

  const btn = document.getElementById("saveLinkBtn");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const payload = {
      title,
      url,
      category,
      display_order: order,
      badge,
      description: desc,
      is_active: isActive,
      icon: getCategoryIcon(category)
    };

    if (id) {
      const { error } = await window.supabaseClient.from("important_links").update(payload).eq("id", id);
      if (error) throw error;
      toast("✓ Link updated successfully!", "success");
    } else {
      const { error } = await window.supabaseClient.from("important_links").insert(payload);
      if (error) throw error;
      toast("✓ Link created successfully!", "success");
    }

    closeLinkModal();
    await loadLinks();
  } catch (err) {
    console.error("Save link error:", err);
    toast("Error saving link: " + (err.message || ""), "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Important Link";
  }
}

async function deleteLink(id) {
  if (!confirm("Are you sure you want to remove this important link?")) return;
  try {
    const { error } = await window.supabaseClient.from("important_links").delete().eq("id", id);
    if (error) throw error;
    toast("✓ Link deleted successfully", "success");
    await loadLinks();
  } catch (err) {
    console.error("Delete link error:", err);
    toast("Failed to delete link", "error");
  }
}

function copyLinkUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    toast("✓ Link URL copied to clipboard!", "success");
  }).catch(() => {
    toast("Failed to copy link", "error");
  });
}
