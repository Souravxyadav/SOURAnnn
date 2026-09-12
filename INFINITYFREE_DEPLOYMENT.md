# Deploying ScholarLedger to InfinityFree

InfinityFree provides free web hosting powered by Apache and cPanel. Follow these steps to deploy ScholarLedger:

---

## Folder Structure on InfinityFree

In InfinityFree, your domain has a root directory with an `htdocs` folder. Upload all the web files from this repository root directly into InfinityFree's `htdocs/`:

```
your-account/
└── yourdomain.com/
    └── htdocs/               <-- Upload the repository root files here
        ├── index.html        (Main dashboard)
        ├── login.html        (Login screen)
        ├── students.html     (Students listing)
        ├── student.html      (Student detail & profile)
        ├── scholarships.html (Scholarships management)
        ├── applications.html (Applications ledger)
        ├── application.html  (Application detail, documents & payments)
        ├── settings.html     (Settings & configuration)
        ├── .htaccess         (Apache routing and security configuration)
        ├── css/
        │   └── base.css
        └── js/
            ├── config.js     (Supabase project URL and anon key)
            ├── supabase-client.js
            ├── auth.js
            ├── layout.js
            ├── toast.js
            ├── modal.js
            ├── utils.js
            ├── constants.js
            ├── tailwind-init.js
            ├── dashboard.js
            ├── students.js
            ├── student-detail.js
            ├── scholarships.js
            ├── applications.js
            ├── application-detail.js
            └── settings.js
```

---

## Step-by-Step Deployment Instructions

### 1. Configure Supabase Credentials
Open `js/config.js` and set your Supabase Project details:
```javascript
window.APP_CONFIG = {
  SUPABASE_URL: "https://xyzcompany.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};
```
*(If left empty or unconfigured, the application runs in local offline storage mode in the user's browser).*

### 2. Upload to InfinityFree

You can upload using either **FileZilla (FTP)** or the **Monsta Online File Manager**:

#### Option A: Using Monsta File Manager (in InfinityFree Control Panel)
1. Log in to the [InfinityFree Client Area](https://app.infinityfree.com/).
2. Select your hosting account and click **File Manager**.
3. Open the `htdocs` folder.
4. Upload the files and folders (`index.html`, `login.html`, `js/`, `css/`, etc.) from the repository root.

#### Option B: Using FTP (FileZilla)
1. Retrieve your FTP host (e.g. `ftpupload.net`), username (`epiz_...`), and password from the InfinityFree dashboard.
2. Connect using FileZilla on Port 21.
3. In the remote pane, open `htdocs`.
4. Upload the files and folders from the root directory into `htdocs/`.

### 3. Database Setup (Supabase)
Run the SQL script located in `sql/schema.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard) to provision the tables, triggers, and Row Level Security policies.

### 4. Visit Your Domain
Navigate to `http://your-subdomain.infinityfreeapp.com` in your browser.
