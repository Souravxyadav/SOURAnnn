const fs = require('fs');
let js = fs.readFileSync('server.js', 'utf8');
js = js.replace(/model: 'gemini-2\.5-flash'/, "model: 'gemini-3.6-flash'");
fs.writeFileSync('server.js', js, 'utf8');
