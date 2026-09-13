const fs = require("fs");
let js = fs.readFileSync("js/students.js", "utf8");

// Add pagination variables
const vars = `let allStudents = [];
let currentPage = 1;
const pageSize = 100;
let totalStudentsCount = 0;
let isSearchMode = false;`;
js = js.replace("let allStudents = [];", vars);

const oldLoad = `async function loadStudents() {
  const { data, error } = await window.supabaseClient
    .from("students")
    .select("*, scholarship_applications(id, status)")
    .order("created_at", { ascending: false });

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  allStudents = data || [];
  filterStudents();
}`;

const newLoad = `async function loadStudents(page = 1, searchQuery = null) {
  currentPage = page;
  let query = window.supabaseClient
    .from("students")
    .select("*, scholarship_applications(id, status)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, (page * pageSize) - 1);
    
  if (searchQuery) {
    query = query.or(\`name.ilike.%\${searchQuery}%,mobile.ilike.%\${searchQuery}%,student_code.ilike.%\${searchQuery}%\`);
    isSearchMode = true;
  } else {
    isSearchMode = false;
  }

  const { data, count, error } = await query;

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  
  totalStudentsCount = count || 0;
  allStudents = data || [];
  filterStudents();
  renderPagination();
}

function renderPagination() {
  const grid = document.getElementById("studentsGrid");
  if (!grid) return;
  const totalPages = Math.ceil(totalStudentsCount / pageSize);
  if (totalPages <= 1) {
    let pg = document.getElementById("pagination-controls");
    if (pg) pg.remove();
    return;
  }
  
  let pg = document.getElementById("pagination-controls");
  if (!pg) {
    pg = document.createElement("div");
    pg.id = "pagination-controls";
    pg.className = "flex items-center justify-between w-full mt-6 px-2";
    grid.parentNode.insertBefore(pg, grid.nextSibling);
  }
  
  pg.innerHTML = \`
    <div class="text-xs text-ink-500">Showing \${allStudents.length} of \${totalStudentsCount}</div>
    <div class="flex items-center gap-2">
      <button onclick="loadStudents(\${currentPage - 1}, isSearchMode ? document.getElementById('searchStudents').value.trim() : null)" \${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 text-xs bg-white border border-ink-200 rounded-lg shadow-sm disabled:opacity-50">Previous</button>
      <span class="text-xs font-semibold">\${currentPage} / \${totalPages}</span>
      <button onclick="loadStudents(\${currentPage + 1}, isSearchMode ? document.getElementById('searchStudents').value.trim() : null)" \${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 text-xs bg-white border border-ink-200 rounded-lg shadow-sm disabled:opacity-50">Next</button>
    </div>
  \`;
}`;

js = js.replace(oldLoad, newLoad);

// Change search behavior to trigger backend search
js = js.replace(
  `document.getElementById("searchStudents")?.addEventListener("input", (e) => {
  filterStudents();
});`,
  `document.getElementById("searchStudents")?.addEventListener("input", debounce((e) => {
  const val = e.target.value.trim();
  if (val.length === 0 || val.length >= 3) {
    loadStudents(1, val);
  } else {
    filterStudents(); // fallback to local filter for < 3 chars if needed, though backend is better.
  }
}, 500));`
);

fs.writeFileSync("js/students.js", js, "utf8");
console.log("Patched students pagination");
