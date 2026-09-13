const fs = require("fs");
let js = fs.readFileSync("js/utils.js", "utf8");
js = js.replace('return "Can\'t reach the server. Check your internet connection.";', 'return "Network Error (" + error.message + "). Check your internet connection or ad blocker.";');
fs.writeFileSync("js/utils.js", js, "utf8");
