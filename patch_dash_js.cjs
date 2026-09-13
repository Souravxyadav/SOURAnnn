const fs = require('fs');
let js = fs.readFileSync('js/dashboard.js', 'utf8');

// We need to add init functions for rendering D3 charts and fetching recent payments
// Let's add them at the end of the init() block or add them to the file directly

const patchCode = `
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
    .attr("viewBox", \`0 0 \${width} \${height}\`)
    .append("g")
    .attr("transform", \`translate(\${width / 2},\${height / 2})\`);
    
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
    item.innerHTML = \`<span class="w-2.5 h-2.5 rounded-full" style="background-color: \${colorScale(d.label)}"></span><span class="text-ink-600">\${d.label} (\${d.value})</span>\`;
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
    
    return \`
      <div class="flex items-start justify-between bg-white border border-ink-100 rounded-xl p-3 hover:border-gold-300 transition">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full \${isReceived ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center shrink-0 text-xs">
            \${isReceived ? '✓' : '⌛'}
          </div>
          <div>
            <p class="text-[11px] font-bold text-ink-900 truncate max-w-[120px]">\${escapeHtml(studentName)}</p>
            <p class="text-[10px] text-ink-500">\${escapeHtml(typeLabel)} • \${dateStr}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold \${isReceived ? 'text-emerald-600' : 'text-amber-600'}">\${amountStr}</p>
          <p class="text-[9px] font-medium text-ink-400 mt-0.5">\${escapeHtml(p.status)}</p>
        </div>
      </div>
    \`;
  }).join("");
}
`;

// Insert the patch code at the end of the file
js = js + '\n' + patchCode;

// Now hook them into init() and loadStats()
// Replace init()
js = js.replace('await loadDeadlines();\n})();', 'await loadDeadlines();\n  await loadRecentPayments();\n  // Set Date\n  const dateEl = document.getElementById("dash-date");\n  if(dateEl) dateEl.textContent = new Date().toLocaleDateString("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric"});\n})();');

// Pass appList to renderChart inside loadStats
js = js.replace('document.getElementById("stat-pending-amount").textContent = formatCurrency(totalPending);\n}', 'document.getElementById("stat-pending-amount").textContent = formatCurrency(totalPending);\n  renderChart(appList);\n}');

// Update loadRecent to use the newer UI format
js = js.replace(/container\.innerHTML = data\.map[\s\S]*?\}\.join\(\"\"\);\n\}/, `
  container.innerHTML = data.map(a => \`
    <a href="application.html?id=\${a.id}" class="flex items-center justify-between bg-white border border-ink-100 rounded-xl p-3 hover:border-gold-300 transition">
      <div>
        <p class="text-[11px] font-bold text-ink-900 truncate max-w-[150px]">\${escapeHtml(a.students?.name || "Unknown")}</p>
        <p class="text-[10px] text-ink-500 truncate max-w-[150px]">\${escapeHtml(a.scholarships?.name || "—")}</p>
      </div>
      <div class="text-right shrink-0 pl-2">
        <span class="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md \${STATUS_COLORS[a.status] || "bg-ink-100 text-ink-600"}">\${escapeHtml(a.status)}</span>
        <p class="text-[10px] text-ink-700 font-bold mt-1">\${formatCurrency(a.expected_amount)}</p>
      </div>
    </a>\`).join("");
}
`);

fs.writeFileSync('js/dashboard.js', js);
console.log("Patched dashboard.js");
