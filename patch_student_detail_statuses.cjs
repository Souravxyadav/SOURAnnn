const fs = require('fs');

let js = fs.readFileSync('js/student-detail.js', 'utf8');
js = js.replace(/r\.status === "ELIGIBLE"/g, 'r.status === "Eligible"');
js = js.replace(/status === "ELIGIBLE"/g, 'status === "Eligible"');
js = js.replace(/r\.status === "NEEDS_REVIEW"/g, 'r.status === "Missing Information" || r.status === "Partially Matched"');
js = js.replace(/status === "NEEDS_REVIEW"/g, 'status === "Missing Information" || status === "Partially Matched"');

fs.writeFileSync('js/student-detail.js', js, 'utf8');
