const fs = require("fs");
let js = fs.readFileSync("js/config.js", "utf8");

js = js.replace(
  `SUPABASE_URL: "YOUR_SUPABASE_URL"`,
  `SUPABASE_URL: "https://oqecfwapemsideodfmzl.supabase.co"`
);

js = js.replace(
  `SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY"`,
  `SUPABASE_ANON_KEY: "sb_publishable_mOmAsBtzyoCll0mQKpDiQQ_Tu7Z_pjN"`
);

fs.writeFileSync("js/config.js", js, "utf8");
console.log("Patched config.js with actual Supabase credentials");
