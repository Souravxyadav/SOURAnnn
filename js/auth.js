// Auth helpers shared by every page.

async function requireAuth() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

async function redirectIfLoggedIn() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session) window.location.href = "dashboard.html";
}

async function login(email, password) {
  const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function logout() {
  await window.supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

// Wire up any element with [data-logout] to sign the admin out.
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-logout]")) logout();
});
