const fs = require("fs");
const file = "login.html";
let html = fs.readFileSync(file, "utf8");

html = html.replace(/value="admin@scholarledger\.internal"/g, 'value=""');
html = html.replace(/placeholder="admin@scholarledger\.internal"/g, 'placeholder="admin@yourdomain.com"');
html = html.replace(/value="admin123"/g, 'value=""');
html = html.replace(/<button type="button" onclick="fillDefaultAdmin\(\)".*?<\/button>/g, "");
html = html.replace(/function fillDefaultAdmin\(\) \{[\s\S]*?\}/g, "");

fs.writeFileSync(file, html, "utf8");
console.log("Patched login.html");
