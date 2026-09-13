const fs = require("fs");
let js = fs.readFileSync("js/student-portal.js", "utf8");

// 1. DOMContentLoaded block
js = js.replace(
  /document\.addEventListener\("DOMContentLoaded", async \(\) => \{[\s\S]*?await loadStudentPortalData\(stdToken\);\n\}\);/,
  `document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "student-login.html";
    return;
  }
  const { data: st } = await window.supabaseClient.from("students").select("id").eq("auth_user_id", session.user.id).single();
  if (!st) {
    await window.supabaseClient.auth.signOut();
    window.location.href = "student-login.html";
    return;
  }
  await loadStudentPortalData(st.id);
});`
);

// 2. The fallback block inside loadStudentPortalData
const oldFallback = `    if (stRes.error || !stRes.data) {
      // Fallback to first student if token is mock-reset
      const { data: allSt } = await sb.from("students").select("*").limit(1);
      if (allSt && allSt.length > 0) {
        currentStudent = allSt[0];
        localStorage.setItem("student_session_token", currentStudent.id);
        const { data: refreshedApps } = await sb.from("scholarship_applications").select("*, scholarships(*)").eq("student_id", currentStudent.id).order("created_at", { ascending: false });
        currentApplications = refreshedApps || [];
      } else {
        toast("Student session expired. Please sign in again.", "error");
        localStorage.removeItem("student_session_token");
        window.location.href = "student-login.html";
        return;
      }
    } else {
      currentStudent = stRes.data;
    }`;

const newFallback = `    if (stRes.error || !stRes.data) {
      toast("Student session expired. Please sign in again.", "error");
      await window.supabaseClient.auth.signOut();
      window.location.href = "student-login.html";
      return;
    } else {
      currentStudent = stRes.data;
    }`;
js = js.replace(oldFallback, newFallback);

// 3. handleStudentLogout
const oldLogout = `function handleStudentLogout() {
  localStorage.removeItem("student_session_token");
  toast("Signed out successfully", "success");
  setTimeout(() => {
    window.location.href = "student-login.html";
  }, 300);
}`;
const newLogout = `async function handleStudentLogout() {
  await window.supabaseClient.auth.signOut();
  toast("Signed out successfully", "success");
  setTimeout(() => {
    window.location.href = "student-login.html";
  }, 300);
}`;
js = js.replace(oldLogout, newLogout);

fs.writeFileSync("js/student-portal.js", js, "utf8");
console.log("Cleaned up student portal completely.");
