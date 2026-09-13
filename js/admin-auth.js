// Admin authentication guard for ScholarLedger
(async function () {
  try {
    if (!window.supabaseClient) {
      console.warn("Supabase client not initialized.");
      document.documentElement.style.visibility = "visible";
      return;
    }

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    const isLoginPage = window.location.pathname.endsWith("login.html");
    const isStudentPage = window.location.pathname.includes("student-"); // Ignore student pages here

    if (error || !session) {
      if (!isLoginPage && !isStudentPage) {
        window.location.replace("login.html");
        return;
      }
    } else {
      if (isLoginPage) {
        window.location.replace("dashboard.html");
        return;
      }
    }

    // Check if user role is admin or staff? We could decode JWT if needed,
    // but the session existing is a good start.

    document.documentElement.style.visibility = "visible";
  } catch (e) {
    console.error("Auth guard error:", e);
    document.documentElement.style.visibility = "visible";
  }
})();
