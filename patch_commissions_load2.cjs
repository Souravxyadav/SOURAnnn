const fs = require("fs");
let js = fs.readFileSync("js/commissions.js", "utf8");

const oldLoad = `    const [appsRes, payRes] = await Promise.all([
      sb.from("scholarship_applications").select("*, students(*), scholarships(*)").order("updated_at", { ascending: false }).limit(500),
      sb.from("application_payments").select("*").order("payment_date", { ascending: false })
    ]);
    allApplications = appsRes.data || [];
    allPayments = payRes.data || [];`;

const newLoad = `    const [appsRes, payRes, commRes] = await Promise.all([
      sb.from("scholarship_applications").select("*, students(*), scholarships(*)").order("updated_at", { ascending: false }).limit(500),
      sb.from("application_payments").select("*").order("payment_date", { ascending: false }),
      sb.from("commission_transactions").select("*").order("payment_date", { ascending: false })
    ]);
    allApplications = appsRes.data || [];
    const pays = (payRes.data || []).map(p => ({ ...p, payment_type: 'Student', transaction_id: p.transaction_id, is_commission: false }));
    const comms = (commRes.data || []).map(c => ({ ...c, payment_type: 'Commission', transaction_id: c.reference_no, payment_method: c.payment_mode, is_commission: true }));
    allPayments = [...pays, ...comms].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));`;

js = js.replace(oldLoad, newLoad);

// Also need to patch isStudentPayment / isCommissionPayment to use the new flag
const p1 = `function isStudentPayment(p) {
  if (!p) return false;
  if (p.payment_type === "Student") return true;
  const n = (p.notes || "").toLowerCase();
  if (n.includes("[category: student]") || n.includes("[type: student]") || n.includes("student disbursal")) return true;
  return false;
}`;
const n1 = `function isStudentPayment(p) {
  return p && !p.is_commission;
}`;
js = js.replace(p1, n1);

const p2 = `function isCommissionPayment(p) {
  return !isStudentPayment(p);
}`;
const n2 = `function isCommissionPayment(p) {
  return p && p.is_commission;
}`;
js = js.replace(p2, n2);

fs.writeFileSync("js/commissions.js", js, "utf8");
console.log("Patched loadCommissionsData again");
