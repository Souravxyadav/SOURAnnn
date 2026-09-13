const fs = require("fs");
let regHtml = fs.readFileSync("student-register.html", "utf8");

const oldRegPayload = `      const payload = {
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
      setTimeout(() => {`;

const newRegPayload = `      const payload = {
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
      setTimeout(() => {`;

regHtml = regHtml.replace(oldRegPayload, newRegPayload);
fs.writeFileSync("student-register.html", regHtml, "utf8");
console.log("Patched register 2");
