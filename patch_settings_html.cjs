const fs = require("fs");
let html = fs.readFileSync("settings.html", "utf8");

html = html.replace(/admin@scholarledger.com/g, "");

fs.writeFileSync("settings.html", html, "utf8");
