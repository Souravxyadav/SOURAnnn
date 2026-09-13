const fs = require("fs");
const path = require("path");

const htmlPath = path.join(process.cwd(), "links.html");
let html = fs.readFileSync(htmlPath, "utf-8");

// Increase grid spacing for better visual breathing room in the new bento layout
html = html.replace(
  '<div id="linksGrid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>', 
  '<div id="linksGrid" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 pt-2"></div>'
);

fs.writeFileSync(htmlPath, html, "utf-8");
