const fs = require("fs");
let html = fs.readFileSync("student-login.html", "utf8");

const oldInputs = `        <label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Registered Mobile Number *</label>
        <div class="relative">
          <span class="absolute left-3.5 top-2.5 text-xs text-ink-400 font-mono font-medium">+91</span>
          <input type="tel" id="login-mobile" required pattern="[0-9]{10}" maxlength="10"
            class="w-full rounded-xl border border-ink-200 pl-11 pr-3.5 py-2.5 text-xs font-mono font-medium text-ink-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
            placeholder="9876543210">
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Date of Birth (DOB) *</label>
        <input type="date" id="login-dob" required
          class="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-xs text-ink-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition">
        <p class="text-[10px] text-ink-400 mt-1">Used to verify student identity securely.</p>`;

const newInputs = `        <label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Email Address *</label>
        <div class="relative">
          <input type="email" id="login-email" required
            class="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-xs font-medium text-ink-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
            placeholder="student@example.com">
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Password *</label>
        <input type="password" id="login-password" required
          class="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-xs text-ink-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition">`;

html = html.replace(oldInputs, newInputs);

const oldScript = `<script>
  const form = document.getElementById("student-login-form");
  const errorBox = document.getElementById("student-login-error");
  const btn = document.getElementById("student-login-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Authenticating...";

    const mobile = document.getElementById("login-mobile").value.trim();
    const dob = document.getElementById("login-dob").value;

    try {
      // In production, this would call Supabase Auth or an Edge Function.
      // For this demo, we use an RPC-like mock.
      const { data, error } = await window.supabaseClient.rpc("student_login", { p_mobile: mobile, p_dob: dob });
      
      if (error) throw error;
      if (!data || !data.success) throw new Error("Invalid credentials");

      localStorage.setItem("student_session_token", data.student_id);
      window.location.href = "student-portal.html";

    } catch (err) {
      errorBox.textContent = err.message || "Invalid mobile number or Date of Birth.";
      errorBox.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Access My Student Portal";
    }
  });
</script>`;

const newScript = `<script>
  const form = document.getElementById("student-login-form");
  const errorBox = document.getElementById("student-login-error");
  const btn = document.getElementById("student-login-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Authenticating...";

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;

      window.location.href = "student-portal.html";

    } catch (err) {
      errorBox.textContent = err.message || "Invalid email or password.";
      errorBox.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Access My Student Portal";
    }
  });
</script>`;

html = html.replace(/<script>[\s\S]*?<\/script>/, newScript);

fs.writeFileSync("student-login.html", html, "utf8");
console.log("student-login patched.");
