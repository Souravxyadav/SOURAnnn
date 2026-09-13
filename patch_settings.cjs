const fs = require("fs");
let js = fs.readFileSync("js/settings.js", "utf8");

js = js.replace(/919876543210/g, "");
js = js.replace(/\+91 9876543210/g, "");
js = js.replace(/admin@scholarledger.com/g, "");

fs.writeFileSync("js/settings.js", js, "utf8");
