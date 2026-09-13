// Production Supabase Client initialization
// DO NOT ADD MOCK DATA OR LOCALSTORAGE FALLBACKS HERE.

(function () {
  const SUPABASE_URL = (window.APP_CONFIG?.SUPABASE_URL || '').trim();
  const SUPABASE_ANON_KEY = (window.APP_CONFIG?.SUPABASE_ANON_KEY || '').trim();

  const isConfigured =
    SUPABASE_URL &&
    SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";

  if (!isConfigured) {
    console.error("[ScholarLedger] Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in js/config.js");
    // We create a dummy client that throws errors to prevent silent failures
    const errorThrower = () => {
      return {
        then: (_, reject) => {
          if (typeof window.toast === "function") {
             window.toast("Database not configured. Check js/config.js", "error");
          }
          if (reject) reject(new Error("Supabase is not configured in js/config.js"));
          return Promise.reject(new Error("Supabase is not configured in js/config.js"));
        }
      };
    };

    window.supabaseClient = {
      auth: {
        getSession: errorThrower,
        signInWithPassword: errorThrower,
        signOut: errorThrower,
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        updateUser: errorThrower
      },
      from: () => ({
        select: errorThrower,
        insert: errorThrower,
        update: errorThrower,
        delete: errorThrower
      }),
      rpc: errorThrower,
      storage: {
        from: () => ({
          upload: errorThrower,
          createSignedUrl: errorThrower,
          download: errorThrower
        })
      }
    };
    return;
  }

  try {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.info("[ScholarLedger] Connected to Supabase");
  } catch (e) {
    console.error("[ScholarLedger] Failed to initialize Supabase client:", e);
    if (typeof window.toast === "function") {
       window.toast("Failed to connect to database.", "error");
    }
  }
})();
