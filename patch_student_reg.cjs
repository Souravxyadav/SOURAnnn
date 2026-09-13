const fs = require("fs");
let html = fs.readFileSync("student-register.html", "utf8");

// Add required to email, and add password
const oldEmail = `              <label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Email Address</label>
              <input type="email" id="reg-email" class="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-xs outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500" placeholder="rahul@example.com">
            </div>`;

const newEmailAndPass = `              <label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Email Address *</label>
              <input required type="email" id="reg-email" class="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-xs outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500" placeholder="student@example.com">
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Password *</label>
              <input required type="password" id="reg-password" minlength="6" class="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-xs outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500" placeholder="••••••••">
            </div>`;

html = html.replace(oldEmail, newEmailAndPass);
// Make grid-cols-1 sm:grid-cols-4 for that row since we added a column
html = html.replace('<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">', '<div class="grid grid-cols-1 sm:grid-cols-4 gap-3">');

// Update JS
const oldJS = `      const email = document.getElementById("reg-email").value.trim() || null;`;
const newJS = `      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value;`;
html = html.replace(oldJS, newJS);

// Remove the `code` which doesn't exist anymore and change insertion logic
const payloadOld = `      const payload = {
        code: studentCode,
        student_code: studentCode,
        name,
        mobile,
        dob,
        gender,
        email,
        category,
        annual_income: income,
        percentage,
        course,
        semester,
        college,
        student_identifier: aadhaarLast4,
        notes: npciStatus === "Pending" ? "NPCI Mapping Pending" : "",
        status: "Active"
      };

      const { data, error } = await window.supabaseClient.from("students").insert([payload]).select();
      if (error) throw error;
      
      const newStudent = data[0];
      
      // Auto-login (setting token for prototype)
      localStorage.setItem("student_session_token", newStudent.id);
      
      window.location.href = "student-portal.html";`;

const payloadNew = `      
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'student'
          }
        }
      });
      
      if (authError) throw authError;
      
      const authUserId = authData.user.id;

      const payload = {
        auth_user_id: authUserId,
        student_code: studentCode,
        name,
        mobile,
        dob,
        gender,
        email,
        category,
        annual_income: income,
        percentage,
        course,
        current_semester: semester,
        college,
        student_identifier: aadhaarLast4,
        notes: npciStatus === "Pending" ? "NPCI Mapping Pending" : "",
        status: "Active"
      };

      const { data, error } = await window.supabaseClient.from("students").insert([payload]).select();
      if (error) {
         console.error(error);
         throw new Error("Profile creation failed: " + error.message);
      }
      
      window.location.href = "student-portal.html";`;
html = html.replace(payloadOld, payloadNew);

fs.writeFileSync("student-register.html", html, "utf8");
console.log("student-register patched.");
