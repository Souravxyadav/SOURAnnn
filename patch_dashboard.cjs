const fs = require("fs");
let js = fs.readFileSync("js/dashboard.js", "utf8");

const oldLoadStats = `async function loadStats() {
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

  document.getElementById("stat-expected").textContent = formatCurrency(totalExpected);
  document.getElementById("stat-received").textContent = formatCurrency(totalReceived);
  document.getElementById("stat-pending-amt").textContent = formatCurrency(Math.max(0, totalExpected - totalReceived));
}`;

const newLoadStats = `async function loadStats() {
  const sb = window.supabaseClient;
  
  // Use server-side SQL views for aggregation where possible
  const [
    { count: studentCount },
    { count: appCount },
    { count: approvedCount },
    { count: pendingCount },
    { data: financials }
  ] = await Promise.all([
    sb.from("students").select("*", { count: "exact", head: true }),
    sb.from("scholarship_applications").select("*", { count: "exact", head: true }),
    sb.from("scholarship_applications").select("*", { count: "exact", head: true }).in("status", ["Approved", "Amount Received", "Closed"]),
    sb.from("scholarship_applications").select("*", { count: "exact", head: true }).in("status", ["Submitted", "Under Verification", "Documents Pending", "Documents Uploaded"]),
    sb.from("application_financials").select("expected_amount, received_amount")
  ]);

  document.getElementById("stat-students").textContent = studentCount ?? 0;
  document.getElementById("stat-applications").textContent = appCount ?? 0;
  document.getElementById("stat-approved").textContent = approvedCount ?? 0;
  document.getElementById("stat-pending").textContent = pendingCount ?? 0;

  let totalExpected = 0;
  let totalReceived = 0;
  if (financials) {
    financials.forEach(f => {
      totalExpected += Number(f.expected_amount || 0);
      totalReceived += Number(f.received_amount || 0);
    });
  }

  document.getElementById("stat-expected").textContent = formatCurrency(totalExpected);
  document.getElementById("stat-received").textContent = formatCurrency(totalReceived);
  document.getElementById("stat-pending-amt").textContent = formatCurrency(Math.max(0, totalExpected - totalReceived));
}`;

js = js.replace(oldLoadStats, newLoadStats);

fs.writeFileSync("js/dashboard.js", js, "utf8");
console.log("Patched dashboard JS to use SQL views");
