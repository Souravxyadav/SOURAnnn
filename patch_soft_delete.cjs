const fs = require("fs");

let js = fs.readFileSync("js/commissions.js", "utf8");
js = js.replace(
  /await window\.supabaseClient\.from\("application_payments"\)\.delete\(\)\.eq\("id", paymentId\)/g,
  `await window.supabaseClient.from("application_payments").update({ status: 'Reversed', notes: 'Reversed by admin' }).eq("id", paymentId)`
);
fs.writeFileSync("js/commissions.js", js, "utf8");

js = fs.readFileSync("js/application-detail.js", "utf8");
js = js.replace(
  /await window\.supabaseClient\.from\("application_payments"\)\.delete\(\)\.eq\("id", id\)/g,
  `await window.supabaseClient.from("application_payments").update({ status: 'Reversed', notes: 'Reversed by admin' }).eq("id", id)`
);
fs.writeFileSync("js/application-detail.js", js, "utf8");

console.log("Patched to soft-delete payments");
