# ScholarLedger — Scholarship Student Management System

A private, single-admin web app to track students, scholarships, applications,
documents and payments. Built with plain HTML + Tailwind CSS (CDN) + vanilla
JavaScript on the frontend, and Supabase (Postgres + Auth + Storage) on the
backend. No React, no Next.js, no build step — you can host it anywhere that
serves static files, including InfinityFree.

---

## 1. What you're getting

```
scholarship-app/
├── index.html            Dashboard
├── login.html             Login
├── students.html          Students list
├── student.html           Student profile (?id=...)
├── scholarships.html      Scholarships list
├── applications.html      Applications list + filters
├── application.html       Create / edit an application (?id=... or blank to create)
├── settings.html          Account + password
├── css/
│   └── base.css
├── js/
│   ├── config.js          ← YOU EDIT THIS (Supabase URL + anon key)
│   ├── tailwind-init.js   Tailwind theme tokens
│   ├── supabase-client.js
│   ├── auth.js
│   ├── layout.js          Renders sidebar / topbar / bottom nav
│   ├── constants.js       Status lists, colors, document types
│   ├── utils.js           Formatting, debounce, error messages
│   ├── toast.js           Toast notifications
│   ├── modal.js           Modal + confirm-delete helper
│   ├── dashboard.js
│   ├── students.js
│   ├── student-detail.js
│   ├── scholarships.js
│   ├── applications.js
│   └── application-detail.js
└── sql/
    └── schema.sql         Run once in Supabase SQL Editor
```

---

## 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a name, a strong database password (save it somewhere), and a region
   close to you. Wait ~2 minutes for it to provision.
3. In the left sidebar, go to **Project Settings → API**. Copy:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

You'll paste both into `js/config.js` in step 4.

---

## 3. Run the database schema

1. In Supabase, open **SQL Editor → New query**.
2. Open `sql/schema.sql` from this project, copy the whole file, paste it
   into the editor, and click **Run**.

This single script creates:
- All 6 tables (`profiles`, `students`, `scholarships`,
  `scholarship_applications`, `application_payments`, `application_documents`)
- Auto-generated student codes (`STU-0001`, `STU-0002`, …)
- `updated_at` auto-touch triggers
- Row Level Security policies (only logged-in users can read/write anything)
- A private Storage bucket called `scholarship-documents` with matching
  access policies
- A duplicate-prevention rule so the same student can't be added twice to the
  same scholarship in the same academic year

You can re-run this script safely — it uses `if not exists` / `drop … if
exists` throughout.

---

## 4. Create your admin login

This app has exactly one role: you.

1. In Supabase, go to **Authentication → Users → Add user**.
2. Enter your email and a password. Leave "Auto Confirm User" checked so you
   don't need to click an email link.
3. That's it — this is the only account that will ever be able to log in,
   because the app has no public sign-up page.

---

## 5. Point the app at your project

Open `js/config.js` and replace the two placeholder values:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJ...your-anon-key...",
};
```

Save the file. Do **not** put your `service_role` key here — only ever use
the `anon public` key in frontend code.

---

## 6. Test it locally (optional but recommended)

Because the pages use `fetch`/ES modules under the hood via the Supabase
client, opening `login.html` directly as a `file://` URL usually still works,
but if you hit CORS or blank-page issues, serve the folder locally first:

```bash
cd scholarship-app
python3 -m http.server 8080
# then open http://localhost:8080/login.html
```

Log in with the email/password you created in step 4. You should land on the
dashboard with all stats at zero — that's correct for a brand-new database.

---

## 7. Hosting on InfinityFree

InfinityFree serves plain static files perfectly well — you don't need PHP
for this app at all, since all the logic runs in the browser and talks
directly to Supabase.

1. Sign in to your InfinityFree control panel (**app.infinityfree.com**) and
   open your hosting account's **File Manager**, or connect via **FTP**
   (Settings → FTP Accounts gives you host/username/password; use FileZilla
   or any FTP client).
2. Navigate to the `htdocs` folder — this is your site's web root.
3. Upload the **entire contents** of the `scholarship-app` folder into
   `htdocs` (not the folder itself — the files `index.html`, `login.html`,
   `css/`, `js/`, etc. should sit directly inside `htdocs`).
4. Once uploaded, visit your InfinityFree domain
   (e.g. `https://yoursite.infinityfreeapp.com/login.html`) and log in.

Notes specific to InfinityFree:
- Free InfinityFree domains use HTTPS by default on their `.infinityfreeapp.com`
  subdomains — good, since Supabase requires HTTPS origins for auth cookies
  to behave well in most browsers.
- No `.htaccess` or server config is required; everything is static files.
- Supabase's API accepts requests from any origin by default with the anon
  key, so you won't need to configure CORS on the Supabase side for this to
  work from your InfinityFree domain.
- InfinityFree can be slow to "wake up" free sites after inactivity — if the
  first load feels sluggish, that's InfinityFree, not Supabase.

---

## 8. Using the app

**First-time flow:**
Login → Dashboard → Add Scholarship → Add Student → New Application →
select student → select scholarship → fill in credentials/status/expected
amount → Save.

**Daily flow:**
Dashboard → search a student → open their profile → open a scholarship
application → update status → add a payment → done. Received/Pending
amounts recalculate automatically everywhere (application, student profile,
and dashboard).

**Where things live:**
- **Students** hold personal/academic info only — no scholarship data is
  duplicated onto the student record.
- **Scholarships** are the reusable "types" (E-Kalyan, NSP, etc.) — create
  each one once.
- **Applications** are the join between a student and a scholarship for a
  given academic year. This is where credentials, status, expected amount,
  payments, and documents all live.

---

## 9. Security notes (please read)

- **Row Level Security** is on for every table: only an authenticated user
  of your Supabase project can read or write any data. There is no public
  access.
- **Documents** are stored in a **private** Storage bucket
  (`scholarship-documents`) — files are not publicly reachable by URL,
  only through authenticated requests.
- **Portal passwords**: the app stores them lightly obfuscated (not shown by
  default in any list view — only after pressing "Show" on the application
  page) so they aren't sitting around as plain readable text in casual
  database browsing. This is **not strong encryption**. If you want real
  encryption at rest, move the encode/decode step into a Supabase Edge
  Function with a server-side secret, so the key never touches the browser.
  Given this is a personal single-admin tool, the current approach is a
  reasonable middle ground, but treat your Supabase dashboard access itself
  as the real security boundary.
- **Never** put your Supabase `service_role` key in any frontend file —
  only the `anon public` key belongs in `js/config.js`.

---

## 10. What's included vs. what's future work

**Included (V1 / MVP):**
Auth + protected pages · Students CRUD + search · Scholarships CRUD ·
Applications CRUD with student/scholarship selection, credentials,
status + progress bar, dates · Multiple payments per application with
automatic received/pending calculation · Documents with status tracking and
private file upload · Dashboard stats, recent activity, upcoming deadlines ·
Filters and sorting on the Applications list · Mobile-first responsive layout
with bottom navigation · Toasts, loading states, delete confirmations, empty
states.

**Not included yet (see the original PRD's V1.1 / V2 sections):**
Activity/audit history log, CSV export, bulk import, payment/document expiry
reminders, multiple admin accounts, email/WhatsApp notifications.

These are straightforward to add later against the same schema — the
`application_payments` and `application_documents` tables already support
everything an activity log or export feature would need to read from.
