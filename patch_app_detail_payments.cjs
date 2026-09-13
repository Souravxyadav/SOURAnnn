const fs = require("fs");
let js = fs.readFileSync("js/application-detail.js", "utf8");

const oldLoad = `async function loadPayments() {
  const { data, error } = await window.supabaseClient
    .from("application_payments")
    .select("*")
    .eq("application_id", appId)
    .order("payment_date", { ascending: false });

  if (error) {
    toast(friendlyError(error), "error");
    return;
  }
  
  appPayments = data || [];`;

const newLoad = `async function loadPayments() {
  const [payRes, commRes] = await Promise.all([
    window.supabaseClient.from("application_payments").select("*").eq("application_id", appId),
    window.supabaseClient.from("commission_transactions").select("*").eq("application_id", appId)
  ]);

  if (payRes.error) {
    toast(friendlyError(payRes.error), "error");
    return;
  }
  
  const pays = (payRes.data || []).map(p => ({ ...p, payment_type: 'Student', transaction_id: p.transaction_id, is_commission: false }));
  const comms = (commRes.data || []).map(c => ({ ...c, payment_type: 'Commission', transaction_id: c.reference_no, payment_method: c.payment_mode, is_commission: true }));
  
  appPayments = [...pays, ...comms].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));`;

js = js.replace(oldLoad, newLoad);

// Patch saving logic to correctly insert to the right table
const oldSave = `  if (editingPaymentId) {
    const { error } = await window.supabaseClient.from("application_payments").update(payload).eq("id", editingPaymentId);
    if (error) throw error;
    toast("Payment updated.", "success");
  } else {
    payload.application_id = appId;
    const { error } = await window.supabaseClient.from("application_payments").insert([payload]);
    if (error) throw error;
    toast("Payment added.", "success");
  }`;

const newSave = `  if (editingPaymentId) {
    const existing = appPayments.find(p => p.id === editingPaymentId);
    const table = existing?.is_commission ? "commission_transactions" : "application_payments";
    
    // adjust payload for commission table
    const updatePayload = { ...payload };
    if (existing?.is_commission) {
       updatePayload.payment_mode = payload.payment_method;
       updatePayload.reference_no = payload.transaction_id;
       delete updatePayload.payment_method;
       delete updatePayload.transaction_id;
    }
    
    const { error } = await window.supabaseClient.from(table).update(updatePayload).eq("id", editingPaymentId);
    if (error) throw error;
    toast("Payment updated.", "success");
  } else {
    // If inserting, assume student payment in this view unless UI specifies.
    // Actually, UI has a 'Type' field which we don't have, but let's assume standard payment.
    payload.application_id = appId;
    const { error } = await window.supabaseClient.from("application_payments").insert([payload]);
    if (error) throw error;
    toast("Payment added.", "success");
  }`;
  
js = js.replace(oldSave, newSave);

fs.writeFileSync("js/application-detail.js", js, "utf8");
console.log("Patched application-detail.js payments");
