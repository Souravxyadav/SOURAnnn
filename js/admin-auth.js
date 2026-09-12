// Admin authentication guard for ScholarLedger
(async function () {
  try {
    const isLoggedOut = localStorage.getItem("scholarledger_logged_out") === "true";
    if (isLoggedOut && !window.location.pathname.endsWith("login.html")) {
      window.location.href = "login.html";
      return;
    }
    // Unhide page
    document.documentElement.style.visibility = "visible";
  } catch (e) {
    document.documentElement.style.visibility = "visible";
  }
})();
