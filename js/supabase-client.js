// Supabase Client with Automatic Mock Fallback for AI Studio Preview
// If real SUPABASE_URL and SUPABASE_ANON_KEY are configured, it connects to Supabase.
// Otherwise, it provides a full, persistent mock data store in localStorage.

(function () {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};

  const isRealSupabase =
    window.supabase &&
    SUPABASE_URL &&
    !SUPABASE_URL.includes("YOUR-PROJECT-REF") &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== "YOUR-ANON-PUBLIC-KEY";

  if (isRealSupabase) {
    try {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      console.info("[ScholarLedger] Connected to Supabase:", SUPABASE_URL);
      return;
    } catch (e) {
      console.warn("[ScholarLedger] Failed to initialize real Supabase client. Falling back to mock store:", e);
    }
  }

  console.info("[ScholarLedger] Running in local mock mode with persistent browser storage.");

  function getRelativeDateStr(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  }

  // Default Seed Data
  const DEFAULT_DATA = {
    students: [
      {
        id: "stu-1",
        code: "STU-0001",
        student_code: "STU-0001",
        name: "Rahul Sharma",
        father_name: "Ramesh Sharma",
        mother_name: "Sunita Sharma",
        dob: "2003-05-14",
        gender: "Male",
        mobile: "9876543210",
        email: "rahul.sharma@example.com",
        college: "Delhi Technological University",
        university: "Delhi Technological University",
        course: "B.Tech / B.E. (Computer Science & Engg)",
        branch: "Computer Science",
        academic_year: "2024-2025",
        semester: "5th Semester",
        current_semester: "5th Semester",
        category: "OBC",
        address: "Sector 14, Rohini, New Delhi, 110085",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110085",
        status: "Active",
        annual_income: 180000,
        percentage: 84.5,
        referred_through: "College Desk",
        notes: "Maintains 8.9 CGPA. Submitted all renewal records.",
        created_at: "2024-08-01T10:00:00Z",
        updated_at: "2024-08-15T14:30:00Z",
      },
      {
        id: "stu-2",
        code: "STU-0002",
        student_code: "STU-0002",
        name: "Priya Patel",
        father_name: "Kishore Patel",
        mother_name: "Meena Patel",
        dob: "2004-02-18",
        gender: "Female",
        mobile: "9812345678",
        email: "priya.patel@example.com",
        college: "All India Institute of Medical Sciences (AIIMS)",
        university: "AIIMS New Delhi",
        course: "MBBS (Bachelor of Medicine, Bachelor of Surgery)",
        branch: "Medicine",
        academic_year: "2024-2025",
        semester: "3rd Year",
        current_semester: "3rd Year",
        category: "EWS",
        address: "Ansari Nagar East, New Delhi, 110029",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110029",
        status: "Active",
        annual_income: 150000,
        percentage: 91.2,
        referred_through: "Direct Portal",
        notes: "Eligible for central medical research stipend.",
        created_at: "2024-08-05T11:00:00Z",
        updated_at: "2024-08-20T09:15:00Z",
      },
      {
        id: "stu-3",
        code: "STU-0003",
        student_code: "STU-0003",
        name: "Amit Kumar",
        father_name: "Suresh Kumar",
        mother_name: "Rekha Devi",
        dob: "2003-11-23",
        gender: "Male",
        mobile: "9723456789",
        email: "amit.kumar@example.com",
        college: "Punjab Agricultural University",
        university: "PAU Ludhiana",
        course: "B.Sc (General / Honours / IT)",
        branch: "Agronomy",
        academic_year: "2024-2025",
        semester: "4th Semester",
        current_semester: "4th Semester",
        category: "SC",
        address: "Village Kotkapura, Faridkot, Punjab, 151204",
        city: "Faridkot",
        state: "Punjab",
        pincode: "151204",
        status: "Active",
        annual_income: 120000,
        percentage: 76.0,
        referred_through: "Social Worker",
        notes: "First graduate from family.",
        created_at: "2024-08-10T12:00:00Z",
        updated_at: "2024-08-22T16:00:00Z",
      },
      {
        id: "stu-4",
        code: "STU-0004",
        student_code: "STU-0004",
        name: "Sneha Reddy",
        father_name: "Venkatesh Reddy",
        mother_name: "Padma Reddy",
        dob: "2004-09-02",
        gender: "Female",
        mobile: "9634567890",
        email: "sneha.reddy@example.com",
        college: "Sri Venkateswara College",
        university: "University of Delhi",
        course: "B.Com (General / Honours / Finance)",
        branch: "Commerce & Finance",
        academic_year: "2024-2025",
        semester: "2nd Semester",
        current_semester: "2nd Semester",
        category: "General",
        address: "Dhaula Kuan, New Delhi, 110021",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110021",
        status: "Active",
        annual_income: 220000,
        percentage: 88.0,
        referred_through: "Walk-in",
        notes: "Merit list awardee in 12th board exams.",
        created_at: "2024-08-12T14:00:00Z",
        updated_at: "2024-08-25T11:45:00Z",
      },
      {
        id: "stu-5",
        code: "STU-0005",
        student_code: "STU-0005",
        name: "Vikas Verma",
        father_name: "Sunil Verma",
        mother_name: "Kiran Verma",
        dob: "2005-07-19",
        gender: "Male",
        mobile: "9834512345",
        email: "vikas.verma@example.com",
        college: "Government Polytechnic College",
        university: "State Board of Tech Education",
        course: "Diploma in Mechanical Engineering",
        branch: "Mechanical",
        academic_year: "2025-2026",
        semester: "1st Semester",
        current_semester: "1st Semester",
        category: "OBC",
        address: "Civil Lines, Kanpur, Uttar Pradesh, 208001",
        city: "Kanpur",
        state: "Uttar Pradesh",
        pincode: "208001",
        status: "Pending",
        annual_income: 140000,
        percentage: 79.5,
        referred_through: "Self Registration",
        notes: "[Pending Review] Self-Registered via Public Admission Portal",
        created_at: "2025-01-10T09:00:00Z",
        updated_at: "2025-01-10T09:00:00Z",
      },
      {
        id: "stu-6",
        code: "STU-0006",
        student_code: "STU-0006",
        name: "Ananya Sen",
        father_name: "Debashis Sen",
        mother_name: "Mousumi Sen",
        dob: "2004-12-05",
        gender: "Female",
        mobile: "9748123456",
        email: "ananya.sen@example.com",
        college: "Jadavpur University",
        university: "Jadavpur University",
        course: "B.A. (Bachelor of Arts)",
        branch: "English Literature",
        academic_year: "2025-2026",
        semester: "2nd Year",
        current_semester: "2nd Year",
        category: "General",
        address: "Gariahat Road, Kolkata, West Bengal, 700019",
        city: "Kolkata",
        state: "West Bengal",
        pincode: "700019",
        status: "Pending",
        annual_income: 190000,
        percentage: 86.0,
        referred_through: "Self Registration",
        notes: "[Pending Review] Self-Registered via Public Admission Portal",
        created_at: "2025-01-12T14:30:00Z",
        updated_at: "2025-01-12T14:30:00Z",
      },
    ],
    scholarships: [
      {
        id: "sch-1",
        name: "National Scholarship Portal (NSP) Post-Matric",
        provider: "Ministry of Social Justice & Empowerment, Govt. of India",
        description: "Post-matric scholarship scheme providing financial support for technical, professional, and higher education.",
        academic_year: "2024-2025",
        official_url: "https://scholarships.gov.in",
        application_url: "https://scholarships.gov.in/fresh",
        maximum_amount: 50000,
        scholarship_amount: 50000,
        commission_percentage: 10,
        start_date: getRelativeDateStr(-30),
        end_date: getRelativeDateStr(45),
        eligibility: "Students scoring >50% with family income under ₹2,50,000/annum.",
        income_limit: 250000,
        min_percentage: 50,
        category: "All",
        gender_eligibility: "All",
        required_documents: ["Income Certificate", "Caste Certificate", "Bank Passbook", "Bonafide Certificate"],
        notes: "Annual verification deadline is late November.",
        is_active: true,
        created_at: "2024-07-01T08:00:00Z",
        updated_at: "2024-07-01T08:00:00Z",
      },
      {
        id: "sch-2",
        name: "E-Kalyan State Post-Matric Scholarship",
        provider: "Welfare Department, State Government",
        description: "State-level financial assistance for SC/ST/OBC students pursuing degree and diploma programmes.",
        academic_year: "2024-2025",
        official_url: "https://ekalyan.cgg.gov.in",
        application_url: "https://ekalyan.cgg.gov.in/login",
        maximum_amount: 35000,
        scholarship_amount: 35000,
        commission_percentage: 10,
        start_date: getRelativeDateStr(-15),
        end_date: getRelativeDateStr(75),
        eligibility: "Domicile of state, family income < ₹2,50,000.",
        income_limit: 250000,
        min_percentage: 50,
        category: "OBC",
        gender_eligibility: "All",
        required_documents: ["Residential Certificate", "Income Certificate", "Caste Certificate", "Mark Sheet"],
        notes: "College nodal officer stamp required on printed acknowledgement.",
        is_active: true,
        created_at: "2024-07-15T09:00:00Z",
        updated_at: "2024-07-15T09:00:00Z",
      },
      {
        id: "sch-3",
        name: "AICTE Pragati Scholarship for Girl Students",
        provider: "All India Council for Technical Education (AICTE)",
        description: "Government scheme aiming to provide advancement opportunities to young women pursuing technical education.",
        academic_year: "2024-2025",
        official_url: "https://www.aicte-india.org",
        application_url: "https://scholarships.gov.in",
        maximum_amount: 50000,
        scholarship_amount: 50000,
        commission_percentage: 8,
        start_date: getRelativeDateStr(-10),
        end_date: getRelativeDateStr(110),
        eligibility: "Female students admitted to 1st year degree programme in AICTE approved institution; family income < ₹8 Lakh.",
        income_limit: 800000,
        min_percentage: 60,
        category: "All",
        gender_eligibility: "Female",
        required_documents: ["Admission Proof", "Tuition Fee Receipt", "Income Certificate", "Director Endorsement"],
        notes: "Grant given as ₹50,000 lump sum per annum for college fees/supplies.",
        is_active: true,
        created_at: "2024-07-20T10:00:00Z",
        updated_at: "2024-07-20T10:00:00Z",
      },
    ],
    scholarship_applications: [
      {
        id: "app-1",
        student_id: "stu-1",
        scholarship_id: "sch-1",
        application_number: "NSP-2024-998812",
        registration_number: "REG-DEL-4412",
        login_id: "rahul.dtu@nsp",
        encrypted_password: btoa("ScholarPass@2024"),
        academic_year: "2024-2025",
        status: "Approved",
        application_date: "2024-08-02",
        submission_date: "2024-08-10",
        verification_date: "2024-08-20",
        approval_date: "2024-09-01",
        scholarship_amount: 50000,
        expected_amount: 50000,
        student_amount: 45000,
        commission_percentage: 10,
        commission_amount: 5000,
        commission_status: "Received",
        commission_received_date: "2024-09-06",
        notes: "Institute verification passed successfully.",
        created_at: "2024-08-02T10:00:00Z",
        updated_at: "2024-09-01T15:00:00Z",
      },
      {
        id: "app-2",
        student_id: "stu-2",
        scholarship_id: "sch-3",
        application_number: "PRAG-2024-7712",
        registration_number: "AIIMS-REG-2024",
        login_id: "priya.aiims@scholar",
        encrypted_password: btoa("PriyaDoc#2024"),
        academic_year: "2024-2025",
        status: "Under Verification",
        application_date: "2024-08-15",
        submission_date: "2024-08-22",
        verification_date: null,
        approval_date: null,
        scholarship_amount: 50000,
        expected_amount: 50000,
        student_amount: 46000,
        commission_percentage: 8,
        commission_amount: 4000,
        commission_status: "Pending",
        commission_received_date: null,
        notes: "State nodal officer reviewing hostel fee breakdown.",
        created_at: "2024-08-15T11:30:00Z",
        updated_at: "2024-08-26T12:00:00Z",
      },
      {
        id: "app-3",
        student_id: "stu-3",
        scholarship_id: "sch-2",
        application_number: "EK-2024-554109",
        registration_number: "PAU-EK-90",
        login_id: "amit.pau@ekalyan",
        encrypted_password: btoa("AmitK@776"),
        academic_year: "2024-2025",
        status: "Documents Uploaded",
        application_date: "2024-08-20",
        submission_date: null,
        verification_date: null,
        approval_date: null,
        scholarship_amount: 35000,
        expected_amount: 35000,
        student_amount: 31500,
        commission_percentage: 10,
        commission_amount: 3500,
        commission_status: "Pending",
        commission_received_date: null,
        notes: "Awaiting college principal physical signature on form.",
        created_at: "2024-08-20T14:00:00Z",
        updated_at: "2024-08-28T16:20:00Z",
      },
      {
        id: "app-4",
        student_id: "stu-4",
        scholarship_id: "sch-1",
        application_number: "NSP-2024-332190",
        registration_number: "SVC-NSP-112",
        login_id: "sneha.svc@nsp",
        encrypted_password: btoa("SnehaCom#2024"),
        academic_year: "2024-2025",
        status: "Amount Received",
        application_date: "2024-08-05",
        submission_date: "2024-08-12",
        verification_date: "2024-08-18",
        approval_date: "2024-08-25",
        scholarship_amount: 30000,
        expected_amount: 30000,
        student_amount: 27000,
        commission_percentage: 10,
        commission_amount: 3000,
        commission_status: "Received",
        commission_received_date: "2024-09-03",
        notes: "Direct benefit transfer credited into ICICI account.",
        created_at: "2024-08-05T09:15:00Z",
        updated_at: "2024-09-05T14:00:00Z",
      },
    ],
    application_payments: [
      {
        id: "pay-1",
        application_id: "app-1",
        amount: 25000,
        payment_date: "2024-09-05",
        payment_type: "Student",
        payment_mode: "Bank Transfer",
        transaction_id: "DBT-2024-984128",
        reference_no: "DBT-2024-984128",
        payment_method: "Direct Bank Transfer (DBT)",
        status: "Received",
        notes: "First installment disbursed by ministry to student.",
        created_at: "2024-09-05T10:00:00Z",
        updated_at: "2024-09-05T10:00:00Z",
      },
      {
        id: "pay-1-comm",
        application_id: "app-1",
        amount: 2500,
        payment_date: "2024-09-06",
        payment_type: "Commission",
        payment_mode: "UPI",
        transaction_id: "UPI-COMM-88129",
        reference_no: "UPI-COMM-88129",
        payment_method: "UPI",
        status: "Received",
        notes: "10% facilitation commission received from student.",
        created_at: "2024-09-06T11:00:00Z",
        updated_at: "2024-09-06T11:00:00Z",
      },
      {
        id: "pay-2",
        application_id: "app-4",
        amount: 30000,
        payment_date: "2024-09-02",
        payment_type: "Student",
        payment_mode: "Bank Transfer",
        transaction_id: "NEFT-781290342",
        reference_no: "NEFT-781290342",
        payment_method: "NEFT",
        status: "Received",
        notes: "Full scholarship installment credited to student account.",
        created_at: "2024-09-02T11:30:00Z",
        updated_at: "2024-09-02T11:30:00Z",
      },
      {
        id: "pay-2-comm",
        application_id: "app-4",
        amount: 3000,
        payment_date: "2024-09-03",
        payment_type: "Commission",
        payment_mode: "Cash",
        transaction_id: "REC-2024-041",
        reference_no: "REC-2024-041",
        payment_method: "Cash",
        status: "Received",
        notes: "Commission settled at center counter.",
        created_at: "2024-09-03T12:00:00Z",
        updated_at: "2024-09-03T12:00:00Z",
      },
    ],
    student_payments: [
      {
        id: "spay-1",
        student_id: "stu-1",
        application_id: "app-1",
        fee_due: 500,
        amount: 500,
        payment_date: "2024-08-02",
        payment_type: "Registration Fee",
        payment_mode: "UPI",
        reference_no: "UPI-REG-10492",
        status: "Paid",
        received_by: "Admin",
        remarks: "Online portal registration fee received",
        created_at: "2024-08-02T10:30:00Z"
      },
      {
        id: "spay-2",
        student_id: "stu-2",
        application_id: "app-2",
        fee_due: 1000,
        amount: 500,
        payment_date: "2024-08-15",
        payment_type: "Processing Fee",
        payment_mode: "Cash",
        reference_no: "REC-2024-88",
        status: "Partially Paid",
        received_by: "Admin",
        remarks: "Initial document processing deposit, balance 500 due on approval",
        created_at: "2024-08-15T12:00:00Z"
      },
      {
        id: "spay-3",
        student_id: "stu-3",
        application_id: "app-3",
        fee_due: 500,
        amount: 0,
        payment_date: null,
        payment_type: "Service Charge",
        payment_mode: "Pending",
        reference_no: null,
        status: "Unpaid",
        received_by: "Admin",
        remarks: "Awaiting payment after principal verification",
        created_at: "2024-08-20T14:00:00Z"
      }
    ],
    application_documents: [
      {
        id: "doc-1",
        application_id: "app-1",
        document_type: "Income Certificate",
        document_number: "INC-DEL-2024-88",
        file_name: "income_cert_rahul.pdf",
        storage_path: "stu-1/app-1/income.pdf",
        status: "Verified",
        notes: "Verified by revenue officer.",
        created_at: "2024-08-02T10:15:00Z",
        updated_at: "2024-08-20T10:00:00Z",
      },
      {
        id: "doc-2",
        application_id: "app-1",
        document_type: "Bonafide Certificate",
        document_number: "DTU-BONA-2024-104",
        file_name: "bonafide_cert_dtu.pdf",
        storage_path: "stu-1/app-1/bonafide.pdf",
        status: "Verified",
        notes: "Signed by DTU Registrar.",
        created_at: "2024-08-02T10:16:00Z",
        updated_at: "2024-08-20T10:00:00Z",
      },
      {
        id: "doc-3",
        application_id: "app-2",
        document_type: "Admission Letter",
        document_number: "AIIMS-ADM-23-42",
        file_name: "aiims_admission_letter.pdf",
        storage_path: "stu-2/app-2/admission.pdf",
        status: "Uploaded",
        notes: "Original copy scanned.",
        created_at: "2024-08-15T12:00:00Z",
        updated_at: "2024-08-15T12:00:00Z",
      },
      {
        id: "doc-4",
        application_id: "app-3",
        document_type: "Caste Certificate",
        document_number: "CST-PB-2023-90",
        file_name: "caste_cert_pau.pdf",
        storage_path: "stu-3/app-3/caste.pdf",
        status: "Uploaded",
        notes: "Uploaded for verification.",
        created_at: "2024-08-20T14:10:00Z",
        updated_at: "2024-08-20T14:10:00Z",
      },
    ],
    important_links: [
      {
        id: "link-1",
        title: "National Scholarship Portal (NSP)",
        url: "https://scholarships.gov.in",
        category: "Government",
        description: "Official Central Government scholarship application gateway for pre-matric, post-matric and top-class higher education schemes.",
        badge: "Central Govt",
        icon: "🏛️",
        display_order: 1,
        is_active: true,
        created_at: "2024-07-01T08:00:00Z"
      },
      {
        id: "link-2",
        title: "DigiLocker Digital Verification",
        url: "https://www.digilocker.gov.in",
        category: "Verification",
        description: "Fetch and digitally authenticate student marksheets, caste certificates, domicile, and Aadhaar cards without paper copies.",
        badge: "Official Verification",
        icon: "🔐",
        display_order: 2,
        is_active: true,
        created_at: "2024-07-01T08:00:00Z"
      },
      {
        id: "link-3",
        title: "PFMS Direct Benefit Transfer (DBT) Tracker",
        url: "https://pfms.nic.in",
        category: "Tools",
        description: "Track Ministry of Finance Direct Benefit Transfer status and payment disbursement details using bank account or Aadhaar.",
        badge: "DBT Payment",
        icon: "💳",
        display_order: 3,
        is_active: true,
        created_at: "2024-07-01T08:00:00Z"
      },
      {
        id: "link-4",
        title: "AICTE Student Portal",
        url: "https://www.aicte-india.org",
        category: "Government",
        description: "Official portal for AICTE Pragati, Saksham, and Swanath technical scholarships for degree and diploma engineering students.",
        badge: "Technical",
        icon: "🎓",
        display_order: 4,
        is_active: true,
        created_at: "2024-07-01T08:00:00Z"
      },
      {
        id: "link-5",
        title: "E-Kalyan State Scholarship Portal",
        url: "https://ekalyan.cgg.gov.in",
        category: "Government",
        description: "State government welfare department application system for post-matric and minority financial grant support.",
        badge: "State Portal",
        icon: "🏛️",
        display_order: 5,
        is_active: true,
        created_at: "2024-07-01T08:00:00Z"
      },
      {
        id: "link-6",
        title: "National Career Service (NCS) Portal",
        url: "https://www.ncs.gov.in",
        category: "University",
        description: "Ministry of Labour & Employment portal providing career counseling, student apprenticeship schemes, and job fairs.",
        badge: "Career Hub",
        icon: "💼",
        display_order: 6,
        is_active: true,
        created_at: "2024-07-01T08:00:00Z"
      }
    ],
    support_messages: [
      {
        id: "msg-1",
        student_id: "stu-1",
        student_name: "Rahul Sharma",
        student_mobile: "9876543210",
        category: "Payment & Disbursement Query",
        related_scholarship: "National Scholarship Portal (NSP) Post-Matric",
        subject: "Second installment disbursal status inquiry",
        message: "Hello coordinator, I received the first installment of ₹25,000 on 5th September. Could you please check when the remaining sanction will be credited?",
        status: "Responded",
        response: "The second installment has been verified by the institute nodal officer and will be released in the upcoming DBT batch.",
        responded_at: "2024-09-08T10:00:00Z",
        created_at: "2024-09-07T14:30:00Z"
      },
      {
        id: "msg-2",
        student_id: "stu-2",
        student_name: "Priya Patel",
        student_mobile: "9812345678",
        category: "Document Submission / Verification",
        related_scholarship: "AICTE Pragati Scholarship for Girl Students",
        subject: "Hostel fee receipt re-upload assistance",
        message: "I have uploaded my hostel fee receipt. Please let me know if any director seal is required on page 2.",
        status: "Pending",
        response: null,
        responded_at: null,
        created_at: "2024-09-10T16:00:00Z"
      }
    ],
    application_statuses: [
      { id: "s-1", name: "Applied", display_order: 1, color: "blue", is_final: false },
      { id: "s-2", name: "Under Verification", display_order: 2, color: "amber", is_final: false },
      { id: "s-3", name: "Approved", display_order: 3, color: "emerald", is_final: false },
      { id: "s-4", name: "Amount Received", display_order: 4, color: "purple", is_final: false },
      { id: "s-5", name: "Rejected", display_order: 5, color: "red", is_final: true },
      { id: "s-6", name: "Closed", display_order: 6, color: "ink", is_final: true }
    ],
    settings: [
      { id: "set-1", key: "center_name", value: "ScholarLedger Advisory Center" },
      { id: "set-2", key: "org_name", value: "ScholarLedger Center" },
      { id: "set-3", key: "support_whatsapp", value: "919876543210" },
      { id: "set-4", key: "support_phone", value: "+91 9876543210" },
      { id: "set-5", key: "support_email", value: "admin@scholarledger.com" },
      { id: "set-6", key: "default_session", value: "2025-2026" },
      { id: "set-7", key: "currency", value: "INR" },
      { id: "set-8", key: "commission_rate", value: 10 },
      { id: "set-9", key: "commission_mode", value: "received" },
      { id: "set-10", key: "academic_years", value: '["2023-2024", "2024-2025", "2025-2026", "2026-2027"]' },
      { id: "set-11", key: "categories", value: '["General", "OBC", "SC", "ST", "Minority", "EWS"]' },
      { id: "set-12", key: "policy_student_login", value: true },
      { id: "set-13", key: "policy_student_live_tracking", value: true },
      { id: "set-14", key: "ai_features", value: true },
      { id: "set-15", key: "ai_matching", value: true },
      { id: "set-16", key: "admin_contact", value: '{"center_name": "ScholarLedger Advisory Center", "phone": "+91 9876543210", "email": "admin@scholarledger.com", "whatsapp": "919876543210"}' }
    ],
    app_settings: [
      { key: "academic_years", value: '["2023-2024", "2024-2025", "2025-2026", "2026-2027"]' },
      { key: "student_categories", value: '["General", "OBC", "SC", "ST", "Minority", "EWS"]' },
      { key: "admin_contact", value: '{"center_name": "ScholarLedger Advisory Center", "phone": "+91 9876543210", "email": "admin@scholarledger.com", "whatsapp": "919876543210"}' },
      { key: "commission", value: '{"default_percentage": 10, "mode": "received"}' },
      { key: "access_policies", value: '{"student_login": true, "live_tracking": true}' },
      { key: "ai_features", value: '{"enabled": true, "matching": true}' }
    ]
  };

  const STORAGE_KEY = "scholarledger_mock_db_v3";
  const SESSION_KEY = "scholarledger_mock_session_v1";
  const LOGGED_OUT_KEY = "scholarledger_logged_out";

  function getDb() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure all entities exist
        let updated = false;
        if (!Array.isArray(parsed.important_links) || parsed.important_links.length === 0) {
          parsed.important_links = DEFAULT_DATA.important_links;
          updated = true;
        }
        if (!Array.isArray(parsed.support_messages) || parsed.support_messages.length === 0) {
          parsed.support_messages = DEFAULT_DATA.support_messages;
          updated = true;
        }
        if (!Array.isArray(parsed.student_payments) || parsed.student_payments.length === 0) {
          parsed.student_payments = DEFAULT_DATA.student_payments;
          updated = true;
        }
        if (!Array.isArray(parsed.settings)) {
          if (parsed.settings && typeof parsed.settings === "object") {
            parsed.settings = Object.keys(parsed.settings).map((k, idx) => ({
              id: `set-${idx + 1}`,
              key: k,
              value: typeof parsed.settings[k] === "object" ? JSON.stringify(parsed.settings[k]) : parsed.settings[k]
            }));
          } else {
            parsed.settings = JSON.parse(JSON.stringify(DEFAULT_DATA.settings));
          }
          updated = true;
        }
        if (!Array.isArray(parsed.application_statuses) || parsed.application_statuses.length === 0) {
          parsed.application_statuses = JSON.parse(JSON.stringify(DEFAULT_DATA.application_statuses));
          updated = true;
        }
        if (!Array.isArray(parsed.app_settings)) {
          parsed.app_settings = DEFAULT_DATA.app_settings;
          updated = true;
        }
        // Ensure scholarships end_date is in the future
        const today = new Date().toISOString().slice(0, 10);
        if (Array.isArray(parsed.scholarships)) {
          parsed.scholarships.forEach((s, idx) => {
            if (!s.end_date || s.end_date < today) {
              s.end_date = getRelativeDateStr(45 + idx * 30);
              updated = true;
            }
          });
        }
        if (updated) saveDb(parsed);
        return parsed;
      }
    } catch (e) {
      console.error("[MockDB] Failed reading localStorage:", e);
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DATA));
    saveDb(fresh);
    return fresh;
  }

  function saveDb(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("[MockDB] Failed writing to localStorage:", e);
    }
  }

  function getSession() {
    try {
      const isLoggedOut = localStorage.getItem(LOGGED_OUT_KEY) === "true";
      if (isLoggedOut) return null;

      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);

      // Default active session for admin preview
      const defaultSession = {
        user: {
          id: "mock-admin-uuid",
          email: "admin@scholarledger.com",
          user_metadata: { full_name: "Admin Coordinator" },
        },
        access_token: "mock-access-token",
        expires_at: Math.floor(Date.now() / 1000) + 86400,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(defaultSession));
      return defaultSession;
    } catch (e) {
      return null;
    }
  }

  function setSession(session) {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.removeItem(LOGGED_OUT_KEY);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.setItem(LOGGED_OUT_KEY, "true");
    }
  }

  function matchFilter(record, f) {
    const val = record[f.column];
    switch (f.op) {
      case "eq":
        if (typeof f.value === "boolean") return Boolean(val) === f.value;
        if (f.value === null || f.value === undefined) return val === null || val === undefined;
        // Clean mobile match without non-digits
        if (f.column === "mobile") {
          const m1 = String(val || "").replace(/\D/g, "");
          const m2 = String(f.value || "").replace(/\D/g, "");
          return m1.endsWith(m2) || m2.endsWith(m1) || m1 === m2;
        }
        return String(val).toLowerCase() === String(f.value).toLowerCase();
      case "neq":
        if (typeof f.value === "boolean") return Boolean(val) !== f.value;
        if (f.value === null || f.value === undefined) return val !== null && val !== undefined;
        return String(val).toLowerCase() !== String(f.value).toLowerCase();
      case "gt":
        return val !== null && val !== undefined && val > f.value;
      case "gte":
        return val !== null && val !== undefined && val >= f.value;
      case "lt":
        return val !== null && val !== undefined && val < f.value;
      case "lte":
        return val !== null && val !== undefined && val <= f.value;
      case "like": {
        const needle = String(f.value || "").replace(/%/g, "").toLowerCase();
        return String(val ?? "").toLowerCase().includes(needle);
      }
      case "ilike": {
        const needle = String(f.value || "").replace(/%/g, "").toLowerCase();
        return String(val ?? "").toLowerCase().includes(needle);
      }
      case "is":
        return val === f.value;
      case "in":
        return Array.isArray(f.value) ? f.value.includes(val) : false;
      case "contains":
        if (Array.isArray(val)) {
          return Array.isArray(f.value) ? f.value.every((x) => val.includes(x)) : val.includes(f.value);
        }
        return String(val ?? "").toLowerCase().includes(String(f.value).toLowerCase());
      case "or": {
        if (!Array.isArray(f.filters) || f.filters.length === 0) return true;
        return f.filters.some(subF => matchFilter(record, subF));
      }
      default:
        return true;
    }
  }

  class MockQueryBuilder {
    constructor(tableName) {
      this.tableName = tableName;
      this.filters = [];
      this.orderRules = [];
      this.limitCount = null;
      this.offsetCount = 0;
      this.isSingle = false;
      this.isMaybeSingle = false;
      this.selectFields = "*";
      this.countOptions = null;
      this.mutationType = null;
      this.mutationPayload = null;
    }

    select(fields = "*", options = null) {
      this.selectFields = fields;
      this.countOptions = options;
      return this;
    }

    eq(column, value) {
      this.filters.push({ column, op: "eq", value });
      return this;
    }

    neq(column, value) {
      this.filters.push({ column, op: "neq", value });
      return this;
    }

    gt(column, value) {
      this.filters.push({ column, op: "gt", value });
      return this;
    }

    gte(column, value) {
      this.filters.push({ column, op: "gte", value });
      return this;
    }

    lt(column, value) {
      this.filters.push({ column, op: "lt", value });
      return this;
    }

    lte(column, value) {
      this.filters.push({ column, op: "lte", value });
      return this;
    }

    like(column, pattern) {
      this.filters.push({ column, op: "like", value: pattern });
      return this;
    }

    ilike(column, pattern) {
      this.filters.push({ column, op: "ilike", value: pattern });
      return this;
    }

    is(column, value) {
      this.filters.push({ column, op: "is", value });
      return this;
    }

    in(column, values) {
      this.filters.push({ column, op: "in", value: values });
      return this;
    }

    contains(column, value) {
      this.filters.push({ column, op: "contains", value });
      return this;
    }

    or(filtersString) {
      // filtersString format: "student_id.eq.val,student_mobile.eq.val"
      if (typeof filtersString === "string") {
        const clauses = filtersString.split(",").map(part => part.trim()).filter(Boolean);
        const subFilters = [];
        for (const clause of clauses) {
          const parts = clause.split(".");
          if (parts.length >= 3) {
            const column = parts[0];
            const op = parts[1];
            const value = parts.slice(2).join(".");
            subFilters.push({ column, op, value });
          }
        }
        if (subFilters.length > 0) {
          this.filters.push({ op: "or", filters: subFilters });
        }
      }
      return this;
    }

    order(column, { ascending = true } = {}) {
      this.orderRules.push({ column, ascending });
      return this;
    }

    limit(count) {
      this.limitCount = count;
      return this;
    }

    range(from, to) {
      this.offsetCount = from;
      this.limitCount = to - from + 1;
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    maybeSingle() {
      this.isMaybeSingle = true;
      return this;
    }

    insert(payload) {
      this.mutationType = "insert";
      this.mutationPayload = payload;
      return this;
    }

    update(payload) {
      this.mutationType = "update";
      this.mutationPayload = payload;
      return this;
    }

    upsert(payload) {
      this.mutationType = "upsert";
      this.mutationPayload = payload;
      return this;
    }

    delete() {
      this.mutationType = "delete";
      return this;
    }

    async execute() {
      const db = getDb();
      let table = db[this.tableName];

      // Ensure table is always a valid iterable Array
      if (!Array.isArray(table)) {
        if (this.tableName === "settings" && table && typeof table === "object") {
          table = Object.keys(table).map((k, idx) => ({
            id: `set-${idx + 1}`,
            key: k,
            value: typeof table[k] === "object" ? JSON.stringify(table[k]) : table[k]
          }));
        } else if (Array.isArray(DEFAULT_DATA[this.tableName])) {
          table = JSON.parse(JSON.stringify(DEFAULT_DATA[this.tableName]));
        } else {
          table = [];
        }
        db[this.tableName] = table;
        saveDb(db);
      }

      // 1. Handle Insert
      if (this.mutationType === "insert" || this.mutationType === "upsert") {
        const items = Array.isArray(this.mutationPayload) ? this.mutationPayload : [this.mutationPayload];
        const inserted = [];

        for (const item of items) {
          const record = { ...item };
          if (!record.id) {
            record.id = "id-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now();
          }
          const now = new Date().toISOString();
          record.created_at = record.created_at || now;
          record.updated_at = now;

          // Auto student code sequence
          if (this.tableName === "students") {
            if (!record.code && !record.student_code) {
              const nextSeq = table.length + 1;
              record.code = "STU-" + String(nextSeq).padStart(4, "0");
              record.student_code = record.code;
            } else if (record.code && !record.student_code) {
              record.student_code = record.code;
            } else if (!record.code && record.student_code) {
              record.code = record.student_code;
            }
            if (!record.status) {
              record.status = "Pending";
            }
          }

          // Handle upsert replacement by ID or key
          if (this.mutationType === "upsert") {
            const existingIdx = table.findIndex(r => (record.id && r.id === record.id) || (record.key && r.key === record.key));
            if (existingIdx >= 0) {
              table[existingIdx] = { ...table[existingIdx], ...record, updated_at: now };
              inserted.push(table[existingIdx]);
              continue;
            }
          }

          table.push(record);
          inserted.push(record);
        }

        db[this.tableName] = table;
        saveDb(db);

        const resData = this.isSingle || this.isMaybeSingle
          ? (inserted[0] || null)
          : (Array.isArray(this.mutationPayload) ? inserted : inserted[0]);

        return { data: resData, error: null };
      }

      // 2. Handle Update
      if (this.mutationType === "update") {
        const updatedRecords = [];
        table = table.map((record) => {
          let matches = true;
          for (const f of this.filters) {
            if (!matchFilter(record, f)) {
              matches = false;
              break;
            }
          }
          if (matches) {
            const updated = {
              ...record,
              ...this.mutationPayload,
              updated_at: new Date().toISOString(),
            };
            updatedRecords.push(updated);
            return updated;
          }
          return record;
        });

        db[this.tableName] = table;
        saveDb(db);

        const resData = this.isSingle || this.isMaybeSingle
          ? (updatedRecords[0] || null)
          : updatedRecords;

        return { data: resData, error: null };
      }

      // 3. Handle Delete
      if (this.mutationType === "delete") {
        const toDeleteIds = [];
        table = table.filter((record) => {
          let matches = true;
          for (const f of this.filters) {
            if (!matchFilter(record, f)) {
              matches = false;
              break;
            }
          }
          if (matches) {
            toDeleteIds.push(record.id);
            return false;
          }
          return true;
        });

        // Cascade delete relations
        if (this.tableName === "students") {
          db.scholarship_applications = (db.scholarship_applications || []).filter(
            (a) => !toDeleteIds.includes(a.student_id)
          );
        } else if (this.tableName === "scholarships") {
          db.scholarship_applications = (db.scholarship_applications || []).filter(
            (a) => !toDeleteIds.includes(a.scholarship_id)
          );
        } else if (this.tableName === "scholarship_applications") {
          db.application_payments = (db.application_payments || []).filter(
            (p) => !toDeleteIds.includes(p.application_id)
          );
          db.application_documents = (db.application_documents || []).filter(
            (d) => !toDeleteIds.includes(d.application_id)
          );
        }

        db[this.tableName] = table;
        saveDb(db);
        return { data: null, error: null };
      }

      // 4. Count only queries
      if (this.countOptions && this.countOptions.head) {
        let filtered = [...table];
        for (const f of this.filters) {
          filtered = filtered.filter((r) => matchFilter(r, f));
        }
        return { count: filtered.length, data: null, error: null };
      }

      // 5. Select & Filter
      let results = [...table];
      for (const f of this.filters) {
        results = results.filter((r) => matchFilter(r, f));
      }

      // 6. Ordering
      for (const { column, ascending } of this.orderRules) {
        results.sort((a, b) => {
          const valA = a[column] ?? "";
          const valB = b[column] ?? "";
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
      }

      // 7. Pagination / Limits
      if (this.offsetCount > 0) {
        results = results.slice(this.offsetCount);
      }
      if (this.limitCount !== null) {
        results = results.slice(0, this.limitCount);
      }

      // 8. Expand Relations (Joins)
      const studentsList = db.students || [];
      const scholarshipsList = db.scholarships || [];
      const applicationsList = db.scholarship_applications || [];
      const paymentsList = db.application_payments || [];

      results = results.map((item) => {
        const copy = { ...item };

        if (this.tableName === "students") {
          if (this.selectFields.includes("scholarship_applications")) {
            copy.scholarship_applications = applicationsList
              .filter((a) => a.student_id === copy.id)
              .map((a) => ({ id: a.id, status: a.status }));
          }
        } else if (this.tableName === "scholarships") {
          if (this.selectFields.includes("scholarship_applications")) {
            copy.scholarship_applications = applicationsList
              .filter((a) => a.scholarship_id === copy.id)
              .map((a) => ({ id: a.id, status: a.status }));
          }
        } else if (this.tableName === "scholarship_applications") {
          if (this.selectFields.includes("students")) {
            const stu = studentsList.find((s) => s.id === copy.student_id);
            copy.students = stu ? { ...stu } : null;
          }
          if (this.selectFields.includes("scholarships")) {
            const sch = scholarshipsList.find((s) => s.id === copy.scholarship_id);
            copy.scholarships = sch ? { ...sch } : null;
          }
          if (this.selectFields.includes("application_payments")) {
            copy.application_payments = paymentsList.filter((p) => p.application_id === copy.id);
          }
        }

        return copy;
      });

      if (this.isSingle) {
        return {
          data: results[0] || null,
          error: results[0] ? null : { message: "Record not found", code: "PGRST116" },
        };
      }

      if (this.isMaybeSingle) {
        return {
          data: results[0] || null,
          error: null,
        };
      }

      return { data: results, count: results.length, error: null };
    }

    then(resolve, reject) {
      return this.execute().then(resolve, reject);
    }
  }

  // Export mock client interface
  window.supabaseClient = {
    auth: {
      async getSession() {
        return { data: { session: getSession() }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const session = {
          user: {
            id: "mock-admin-uuid",
            email: email || "admin@scholarledger.com",
            user_metadata: { full_name: "Admin Coordinator" },
          },
          access_token: "mock-access-token-" + Date.now(),
          expires_at: Math.floor(Date.now() / 1000) + 86400,
        };
        setSession(session);
        return { data: { session, user: session.user }, error: null };
      },
      async signOut() {
        setSession(null);
        return { error: null };
      },
      async updateUser({ password }) {
        return { data: { user: getSession()?.user || null }, error: null };
      },
      onAuthStateChange(callback) {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },

    from(tableName) {
      return new MockQueryBuilder(tableName);
    },

    async rpc(funcName, params) {
      if (funcName === "student_login") {
        const db = getDb();
        const { p_mobile, p_dob } = params || {};
        const stu = (db.students || []).find(s => {
          const m1 = String(s.mobile || "").replace(/\D/g, "");
          const m2 = String(p_mobile || "").replace(/\D/g, "");
          const mobMatch = m1.endsWith(m2) || m2.endsWith(m1);
          const dobMatch = !p_dob || String(s.dob || "").trim() === String(p_dob).trim();
          return mobMatch && dobMatch;
        });
        if (stu) {
          return { data: { success: true, student_id: stu.id, name: stu.name, status: stu.status || "Active" }, error: null };
        }
        return { data: { success: false }, error: { message: "Invalid credentials" } };
      }
      return { data: null, error: null };
    },

    storage: {
      from(bucketName) {
        return {
          async upload(storagePath, file) {
            console.info(`[Mock Storage] Uploaded to ${bucketName}/${storagePath}:`, file?.name);
            return { data: { path: storagePath }, error: null };
          },
          async createSignedUrl(storagePath, expiresIn) {
            return { data: { signedUrl: "#" }, error: null };
          },
          async download(storagePath) {
            return { data: new Blob(["Mock file content"], { type: "application/pdf" }), error: null };
          },
        };
      },
    },
  };
})();
