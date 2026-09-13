(async function init() {
  await requireAuth();
  renderLayout("dashboard", "Dashboard");
  await loadStats();
  await loadRecent();
  await loadDashboardInquiries();
  await loadDeadlines();
  await loadRecentPayments();
  // Set Date
  const dateEl = document.getElementById("dash-date");
  if(dateEl) dateEl.textContent = new Date().toLocaleDateString("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric"});
})();

let dashInquiries = [];

async function loadStats() {
  const sb = window.supabaseClient;

  const [{ count: studentCount }, { data: apps }] = await Promise.all([
    sb.from("students").select("*", { count: "exact", head: true }),
    sb.from("scholarship_applications").select("id, status, expected_amount"),
  ]);

  document.getElementById("stat-students").textContent = studentCount ?? 0;

  const appList = apps || [];
  document.getElementById("stat-applications").textContent = appList.length;
  document.getElementById("stat-approved").textContent =
    appList.filter(a => ["Approved", "Amount Received", "Closed"].includes(a.status)).length;
  document.getElementById("stat-pending").textContent =
    appList.filter(a => ["Submitted", "Under Verification", "Documents Pending", "Documents Uploaded"].includes(a.status)).length;

  const totalExpected = appList.reduce((s, a) => s + Number(a.expected_amount || 0), 0);

  const { data: payments } = await sb
    .from("application_payments")
    .select("amount, status");
  const totalReceived = (payments || [])
    .filter(p => p.status === "Received")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = Math.max(totalExpected - totalReceived, 0);

  document.getElementById("stat-expected").textContent = formatCurrency(totalExpected);
  document.getElementById("stat-received").textContent = formatCurrency(totalReceived);
  document.getElementById("stat-pending-amount").textContent = formatCurrency(totalPending);
  renderChart(appList);
}

async function loadRecent() {
  const sb = window.supabaseClient;
  const { data, error } = await sb
    .from("scholarship_applications")
    .select("id, status, expected_amount, updated_at, students(name), scholarships(name)")
    .order("updated_at", { ascending: false })
    .limit(5);

  const container = document.getElementById("recent-list");
  if (error || !data || data.length === 0) {
    container.innerHTML = `<p class="text-sm text-ink-400">No applications yet.</p>`;
    return;
  }

  container.innerHTML = data.map(a => `
    <a href="application.html?id=${a.id}" class="flex items-center justify-between bg-white border border-ink-100 rounded-xl shadow-card px-4 py-3 hover:border-gold-400 transition">
      <div class="min-w-0">
        <p class="text-sm font-medium text-ink-900 truncate">${escapeHtml(a.students?.name || "Unknown")}</p>
        <p class="text-xs text-ink-400 truncate">${escapeHtml(a.scholarships?.name || "—")}</p>
      </div>
      <div class="text-right shrink-0 pl-3">
        <span class="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || "bg-slate-100 text-slate-600"}">${escapeHtml(a.status)}</span>
        <p class="text-xs text-ink-400 mt-1">${formatCurrency(a.expected_amount)}</p>
      </div>
    </a>`).join("");
}

async function loadDeadlines() {
  const sb = window.supabaseClient;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("scholarships")
    .select("id, name, end_date")
    .eq("is_active", true)
    .gte("end_date", today)
    .order("end_date", { ascending: true })
    .limit(5);

  const container = document.getElementById("deadline-list");
  if (error || !data || data.length === 0) {
    container.innerHTML = `<p class="text-sm text-ink-400">No upcoming deadlines.</p>`;
    return;
  }

  container.innerHTML = data.map(s => {
    const days = Math.ceil((new Date(s.end_date) - new Date()) / 86400000);
    return `
    <a href="scholarships.html" class="flex items-center justify-between bg-white border border-ink-100 rounded-xl shadow-card px-4 py-3 hover:border-gold-400 transition">
      <p class="text-sm font-medium text-ink-900">${escapeHtml(s.name)}</p>
      <div class="text-right">
        <p class="text-xs text-ink-400">${formatDate(s.end_date)}</p>
        <p class="text-xs font-medium text-gold-600">${days} day${days === 1 ? "" : "s"} left</p>
      </div>
    </a>`;
  }).join("");
}

async function loadDashboardInquiries() {
  const badge = document.getElementById("dashboard-inquiry-badge");
  if (!badge) return;

  try {
    const sb = window.supabaseClient;
    const { data: messages } = await sb
      .from("support_messages")
      .select("id, status")
      .order("created_at", { ascending: false });

    const pendingCount = (messages || []).filter(m => (m.status || "Pending").toLowerCase() === "pending").length;

    badge.classList.remove("hidden");
    badge.textContent = `${pendingCount} Pending`;
    if (pendingCount > 0) {
      badge.className = "px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-ink-950 rounded-full animate-pulse";
    } else {
      badge.className = "px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full";
    }
  } catch (err) {
    console.warn("Dashboard inquiries count error:", err);
  }
}




// D3 Chart Implementation
function renderChart(appList) {
  const container = document.getElementById("chart-container");
  const legend = document.getElementById("chart-legend");
  if (!container || !legend) return;
  
  if (!appList || appList.length === 0) {
    container.innerHTML = '<p class="text-xs text-ink-400 absolute">No data to chart</p>';
    return;
  }
  
  // Aggregate data by status
  const statusCounts = {};
  appList.forEach(a => {
    const s = a.status || "Unknown";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  
  const data = Object.keys(statusCounts).map(k => ({ label: k, value: statusCounts[k] }));
  
  // Clear container
  container.innerHTML = "";
  legend.innerHTML = "";
  
  // Colors for specific statuses
  const colorScale = d3.scaleOrdinal()
    .domain(["Submitted", "Under Verification", "Approved", "Amount Received", "Rejected", "Closed"])
    .range(["#0ea5e9", "#f59e0b", "#10b981", "#059669", "#ef4444", "#64748b"]);
    
  const width = container.clientWidth || 250;
  const height = 250;
  const radius = Math.min(width, height) / 2 - 10;
  
  const svg = d3.select("#chart-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);
    
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);
    
  const data_ready = pie(data);
  
  const arcGenerator = d3.arc()
    .innerRadius(radius * 0.5) // donut
    .outerRadius(radius * 0.8)
    .cornerRadius(4)
    .padAngle(0.03);
    
  const arcHover = d3.arc()
    .innerRadius(radius * 0.5)
    .outerRadius(radius * 0.9)
    .cornerRadius(4)
    .padAngle(0.03);
    
  svg
    .selectAll('path')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', d => colorScale(d.data.label))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
       d3.select(this).transition().duration(200).attr('d', arcHover);
    })
    .on("mouseout", function(event, d) {
       d3.select(this).transition().duration(200).attr('d', arcGenerator);
    });
    
  // Add total text in middle
  svg.append("text")
     .attr("text-anchor", "middle")
     .attr("y", -5)
     .attr("class", "font-display font-bold text-2xl")
     .attr("fill", "#09090b") // ink-900
     .text(appList.length);
     
  svg.append("text")
     .attr("text-anchor", "middle")
     .attr("y", 15)
     .attr("class", "font-sans text-[10px] font-bold tracking-widest uppercase")
     .attr("fill", "#71717a") // ink-500
     .text("TOTAL");

  // Render Legend
  data.forEach(d => {
    const item = document.createElement("div");
    item.className = "flex items-center gap-1.5";
    item.innerHTML = `<span class="w-2.5 h-2.5 rounded-full" style="background-color: ${colorScale(d.label)}"></span><span class="text-ink-600">${d.label} (${d.value})</span>`;
    legend.appendChild(item);
  });
}

// Function to load recent payments
async function loadRecentPayments() {
  const sb = window.supabaseClient;
  const { data, error } = await sb
    .from("application_payments")
    .select("id, amount, status, updated_at, type, scholarship_applications(id, students(name))")
    .order("updated_at", { ascending: false })
    .limit(5);
    
  const container = document.getElementById("recent-payments");
  if (!container) return;
  
  if (error || !data || data.length === 0) {
    container.innerHTML = '<p class="text-xs text-ink-400">No recent payments recorded.</p>';
    return;
  }
  
  container.innerHTML = data.map(p => {
    const isReceived = p.status === "Received";
    const amountStr = formatCurrency(p.amount);
    const dateStr = p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-IN", {day:"numeric", month:"short"}) : "—";
    const studentName = p.scholarship_applications?.students?.name || "Unknown Student";
    const typeLabel = p.type === "Commission" ? "Commission" : "Direct Transfer";
    
    return `
      <div class="flex items-start justify-between bg-white border border-ink-100 rounded-xl p-3 hover:border-gold-300 transition">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full ${isReceived ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center shrink-0 text-xs">
            ${isReceived ? '✓' : '⌛'}
          </div>
          <div>
            <p class="text-[11px] font-bold text-ink-900 truncate max-w-[120px]">${escapeHtml(studentName)}</p>
            <p class="text-[10px] text-ink-500">${escapeHtml(typeLabel)} • ${dateStr}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold ${isReceived ? 'text-emerald-600' : 'text-amber-600'}">${amountStr}</p>
          <p class="text-[9px] font-medium text-ink-400 mt-0.5">${escapeHtml(p.status)}</p>
        </div>
      </div>
    `;
  }).join("");
}
