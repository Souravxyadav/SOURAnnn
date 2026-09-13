const fs = require("fs");

let file = "student-login.html";
let html = fs.readFileSync(file, "utf8");
html = html.replace(/<button type="button" onclick="fillDemoStudent\(\)".*?<\/button>/g, "");
html = html.replace(/function fillDemoStudent\(\) \{[\s\S]*?\}/g, "");
fs.writeFileSync(file, html, "utf8");

file = "student-register.html";
html = fs.readFileSync(file, "utf8");
html = html.replace(/placeholder="e\.g\. Rahul Sharma"/g, 'placeholder="Full Legal Name"');
html = html.replace(/placeholder="9876543210"/g, 'placeholder="10-digit mobile number"');
fs.writeFileSync(file, html, "utf8");

console.log("Patched student htmls");
