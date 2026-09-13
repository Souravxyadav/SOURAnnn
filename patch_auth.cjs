const fs = require("fs");

let loginHtml = fs.readFileSync("student-login.html", "utf8");

// Remove Email Address block
loginHtml = loginHtml.replace(
  /<label class="block text-xs font-bold uppercase text-ink-700 mb-1\.5">Email Address \*<\/label>[\s\S]*?<\/div>\s*<\/div>/,
  `<label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Mobile Number *</label>
        <div class="relative">
          <span class="absolute left-3.5 top-2.5 text-xs text-ink-400 font-mono font-medium">+91</span>
          <input type="tel" id="login-mobile" pattern="[0-9]{10}" maxlength="10" required
            class="w-full rounded-xl border border-ink-200 pl-11 pr-3.5 py-2.5 text-xs font-mono font-medium text-ink-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
            placeholder="10-digit mobile number">
        </div>
      </div>`
);

loginHtml = loginHtml.replace(
  /<input type="password" id="login-password" required/g,
  '<input type="date" id="login-dob" required'
);
loginHtml = loginHtml.replace(
  /const email = document\.getElementById\("login-email"\)\.value\.trim\(\);/g,
  'const mobile = document.getElementById("login-mobile").value.trim();'
);
loginHtml = loginHtml.replace(
  /const password = document\.getElementById\("login-password"\)\.value;/g,
  'const dob = document.getElementById("login-dob").value;'
);
loginHtml = loginHtml.replace(
  /email,\n\s*password/g,
  'email: mobile + "@student.scholarledger.com",\n        password: dob'
);
loginHtml = loginHtml.replace(
  /err\.message \|\| "Invalid email or password\."/g,
  'err.message || "Invalid mobile number or date of birth."'
);
loginHtml = loginHtml.replace(
  /<label class="block text-xs font-bold uppercase text-ink-700 mb-1\.5">Password \*<\/label>/g,
  '<label class="block text-xs font-bold uppercase text-ink-700 mb-1.5">Date of Birth (Password) *</label>'
);
fs.writeFileSync("student-login.html", loginHtml, "utf8");
console.log("Patched login");

// 2. Patch student-register.html
let regHtml = fs.readFileSync("student-register.html", "utf8");
regHtml = regHtml.replace(
  /<div>\s*<label class="block text-xs font-bold uppercase text-ink-700 mb-1\.5">Email Address \*<\/label>[\s\S]*?<\/div>\s*<div>\s*<label class="block text-xs font-bold uppercase text-ink-700 mb-1\.5">Password \*<\/label>[\s\S]*?<\/div>/g,
  ''
);

const oldRegLogic = `      const mobile = document.getElementById("reg-mobile").value.trim();
      const dob = document.getElementById("reg-dob").value;
      const gender = document.getElementById("reg-gender").value;
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value;`;

const newRegLogic = `      const mobile = document.getElementById("reg-mobile").value.trim();
      const dob = document.getElementById("reg-dob").value;
      const gender = document.getElementById("reg-gender").value;
      const email = mobile + "@student.scholarledger.com";
      const password = dob;`;

regHtml = regHtml.replace(oldRegLogic, newRegLogic);

const oldRegPayload = `        code: studentCode,
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
        aadhaar_last_four: aadhaarLast4,
        npci_status: npciStatus,
        status: "Pending",
        created_at: new Date().toISOString()
      };
      const sb = window.supabaseClient;
      const { data, error } = await sb.from("students").insert(payload).select().single();
      if (error) throw error;
      toast("✓ Registration successful! Accessing portal...", "success");
      const createdId = data?.id || payload.id;
      localStorage.setItem("student_session_token", createdId);
      setTimeout(() => {
        window.location.href = "student-portal.html";
      }, 1000);`;

const newRegPayload = `        student_code: studentCode,
        name,
        mobile,
        dob,
        gender,
        email,
        category,
        annual_income: income,
        percentage,
        course,
        branch: course,
        academic_year: new Date().getFullYear().toString(),
        current_semester: semester,
        college,
        status: "Active"
      };
      const sb = window.supabaseClient;
      
      const authRes = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role: 'student' } }
      });
      if (authRes.error) throw authRes.error;
      
      const authUserId = authRes.data.user?.id;
      if (!authUserId) throw new Error("Failed to create student authentication");
      
      payload.auth_user_id = authUserId;
      
      const { data, error } = await sb.from("students").insert(payload).select().single();
      if (error) throw error;
      
      toast("✓ Registration successful! Accessing portal...", "success");
      setTimeout(() => {
        window.location.href = "student-portal.html";
      }, 1000);`;

regHtml = regHtml.replace(oldRegPayload, newRegPayload);
fs.writeFileSync("student-register.html", regHtml, "utf8");
console.log("Patched register");

