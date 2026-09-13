const fs = require("fs");
let js = fs.readFileSync("js/application-detail.js", "utf8");

js = js.replace(
  `  const { error } = 
  const p = appPayments.find(x => x.id === id);`,
  `  const p = appPayments.find(x => x.id === id);`
);
js = js.replace(
  `await window.supabaseClient.from(table).update({ status: 'Reversed', notes: 'Reversed by admin' }).eq("id", id);
  if (error) {`,
  `const { error } = await window.supabaseClient.from(table).update({ status: 'Reversed', notes: 'Reversed by admin' }).eq("id", id);
  if (error) {`
);

fs.writeFileSync("js/application-detail.js", js, "utf8");
console.log("Fixed syntax");
