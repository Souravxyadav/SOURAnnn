const fs = require("fs");
let html = fs.readFileSync("js/auth-guard.js", "utf8");

html = `// Student authentication guard
(async function () {
  try {
    const isLoginScreen = window.location.pathname.includes("login") || window.location.pathname.includes("register");
    if (!window.supabaseClient) {
      document.documentElement.style.visibility = "visible";
      return;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (!session) {
      if (!isLoginScreen && window.location.pathname.includes("student-")) {
        window.location.replace("student-login.html");
        return;
      }
    } else {
      if (isLoginScreen) {
        window.location.replace("student-portal.html");
        return;
      }
    }
    document.documentElement.style.visibility = "visible";
  } catch (e) {
    console.error(e);
    document.documentElement.style.visibility = "visible";
  }
})();
`;
fs.writeFileSync("js/auth-guard.js", html, "utf8");

let portalJs = fs.readFileSync("js/student-portal.js", "utf8");

portalJs = portalJs.replace(
  `document.addEventListener("DOMContentLoaded", async () => {
  const stdToken = localStorage.getItem("student_session_token");
  if (!stdToken) {
    window.location.href = "student-login.html";
    return;
  }
  await loadStudentPortalData(stdToken);
});`,
  `document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "student-login.html";
    return;
  }
  
  // Find student ID linked to this auth user
  const { data: studentRecord, error } = await window.supabaseClient.from("students").select("id").eq("auth_user_id", session.user.id).single();
  
  if (error || !studentRecord) {
    console.error("Student profile not found", error);
    // Student might just have signed up or something is wrong
    return;
  }
  
  await loadStudentPortalData(studentRecord.id);
});`
);

// We need to also patch the logout function in student portal
portalJs = portalJs.replace(
  `function handleStudentLogout() {
  localStorage.removeItem("student_session_token");
  window.location.href = "student-login.html";
}`,
  `async function handleStudentLogout() {
  await window.supabaseClient.auth.signOut();
  window.location.href = "student-login.html";
}`
);

fs.writeFileSync("js/student-portal.js", portalJs, "utf8");
console.log("Patched student-portal.js and auth-guard.js");
