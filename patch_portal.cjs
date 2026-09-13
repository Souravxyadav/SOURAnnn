const fs = require("fs");
let js = fs.readFileSync("js/student-portal.js", "utf8");

const oldDom = `document.addEventListener("DOMContentLoaded", async () => {
  const stdToken = localStorage.getItem("student_session_token");
  if (!stdToken) {
    window.location.href = "student-login.html";
    return;
  }
  await loadStudentPortalData(stdToken);
});`;

const newDom = `document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "student-login.html";
    return;
  }
  const { data: st } = await window.supabaseClient.from("students").select("id").eq("auth_user_id", session.user.id).single();
  if (!st) {
    // maybe they are an admin testing? or invalid?
    await window.supabaseClient.auth.signOut();
    window.location.href = "student-login.html";
    return;
  }
  await loadStudentPortalData(st.id);
});`;

js = js.replace(oldDom, newDom);

const oldLogout = `function logoutStudent() {
  localStorage.removeItem("student_session_token");
  window.location.href = "student-login.html";
}`;
const newLogout = `async function logoutStudent() {
  await window.supabaseClient.auth.signOut();
  window.location.href = "student-login.html";
}`;
js = js.replace(oldLogout, newLogout);

fs.writeFileSync("js/student-portal.js", js, "utf8");
console.log("Patched student portal");
