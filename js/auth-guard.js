// Student authentication guard
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
