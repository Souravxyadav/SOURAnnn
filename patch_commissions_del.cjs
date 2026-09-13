const fs = require("fs");
let js = fs.readFileSync("js/commissions.js", "utf8");

const oldDel = `async function deleteLedgerPayment(paymentId) {
  const ok = await confirmDelete("Delete Payment Record?", "This will permanently remove this transaction from the ledger and recalculate balances.");
  if (!ok) return;
  try {
    const { error } = await window.supabaseClient.from("application_payments").update({ status: 'Reversed', notes: 'Reversed by admin' }).eq("id", paymentId);
    if (error) throw error;`;

const newDel = `async function deleteLedgerPayment(paymentId) {
  const ok = await confirmDelete("Delete Payment Record?", "This will permanently remove this transaction from the ledger and recalculate balances.");
  if (!ok) return;
  
  const payment = allPayments.find(p => p.id === paymentId);
  if (!payment) return;
  
  const table = payment.is_commission ? "commission_transactions" : "application_payments";
  
  try {
    const { error } = await window.supabaseClient.from(table).update({ status: 'Reversed', notes: 'Reversed by admin' }).eq("id", paymentId);
    if (error) throw error;`;

js = js.replace(oldDel, newDel);
fs.writeFileSync("js/commissions.js", js, "utf8");
console.log("Patched deleteLedgerPayment");
