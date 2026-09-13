const fs = require("fs");
let js = fs.readFileSync("js/supabase-client.js", "utf8");
js = js.replace("const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};", "const SUPABASE_URL = (window.APP_CONFIG?.SUPABASE_URL || '').trim();\n  const SUPABASE_ANON_KEY = (window.APP_CONFIG?.SUPABASE_ANON_KEY || '').trim();");
fs.writeFileSync("js/supabase-client.js", js, "utf8");
console.log("Patched client to trim URLs");
