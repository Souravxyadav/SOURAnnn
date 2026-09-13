const fs = require("fs");
let js = fs.readFileSync("js/applications.js", "utf8");

js = js.replace(
  `sb.from("scholarship_applications").select("*, students(*), scholarships(*)").order("updated_at", { ascending: false }),`,
  `sb.from("scholarship_applications").select("*, students(*), scholarships(*)").order("updated_at", { ascending: false }).limit(500),`
);

fs.writeFileSync("js/applications.js", js, "utf8");
console.log("Patched applications.js limit");
