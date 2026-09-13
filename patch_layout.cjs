const fs = require("fs");
let js = fs.readFileSync("js/layout.js", "utf8");

js = js.replace(
`function handleAdminLogout() {
  if (window.supabaseClient && window.supabaseClient.auth) {
    window.supabaseClient.auth.signOut().then(() => {
      localStorage.removeItem("scholarledger_mock_session_v1");
      localStorage.setItem("scholarledger_logged_out", "true");
      window.location.href = "login.html";
    });
  } else {
    localStorage.removeItem("scholarledger_mock_session_v1");
    localStorage.setItem("scholarledger_logged_out", "true");
    window.location.href = "login.html";
  }
}`,
`function handleAdminLogout() {
  if (window.supabaseClient && window.supabaseClient.auth) {
    window.supabaseClient.auth.signOut().then(() => {
      window.location.href = "login.html";
    });
  } else {
    window.location.href = "login.html";
  }
}`
);

fs.writeFileSync("js/layout.js", js, "utf8");
console.log("Patched layout.js");
