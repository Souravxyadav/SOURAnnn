const fs = require("fs");
let js = fs.readFileSync("js/application-detail.js", "utf8");

js = js.replace(
  `await window.supabaseClient.from("application_payments").update({ status: 'Reversed', notes: 'Reversed by admin' }).eq("id", id);`,
  `
  const p = appPayments.find(x => x.id === id);
  const table = p?.is_commission ? "commission_transactions" : "application_payments";
  await window.supabaseClient.from(table).update({ status: 'Reversed', notes: 'Reversed by admin' }).eq("id", id);`
);

fs.writeFileSync("js/application-detail.js", js, "utf8");
console.log("Patched application-detail delete");
