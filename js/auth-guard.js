// Student authentication guard for ScholarLedger Student Portal
(function () {
  try {
    const isLoginScreen = window.location.pathname.includes("login");
    const stdToken = localStorage.getItem("student_session_token");

    if (!stdToken && !isLoginScreen) {
      window.location.href = "student-login.html";
      return;
    }
    document.documentElement.style.visibility = "visible";
  } catch (e) {
    document.documentElement.style.visibility = "visible";
  }
})();
