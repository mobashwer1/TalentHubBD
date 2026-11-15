# HRFlow

One platform for the whole employment lifecycle, with three modes:

| Mode | What it does |
|---|---|
| **Job Seeker** | Create a profile + CV, browse the public job board with match scores, apply, track application stages and interview schedules, accept or decline employer invitations |
| **Employer / HR** | Post jobs, **search job seekers ranked by fit with a job description**, invite them to apply, run the hiring pipeline, then onboarding, employee records, leave, attendance, payroll, performance and separation |
| **Platform Admin** | Overview, suspend/delete employers and job seekers, take down or delete any job posting |

Pure HTML/CSS/JS, no build step.

## How hiring flows between the modes

1. Employer posts a job → it appears on the public board (`#/board`) and in every seeker's **Find jobs** with a match %.
2. Seeker applies → a candidate (with CV, contact details and match score) appears in the employer's **Recruitment** pipeline. Stage changes and interview invites show up live in the seeker's **My applications**.
3. Or the employer opens **Talent search**, picks a job, and sees seekers ranked by fit (skill coverage 65%, job-description keyword overlap 20%, experience vs. minimum 15%). They can **Invite to apply** or **Save** a candidate. Contact details and CV stay private until the seeker applies.
4. Hire → employee record + onboarding checklist → … → separation with clearance and final settlement.

## Project structure

```
index.html          App shell (loads the scripts in order)
css/style.css       Styles (Tailwind via CDN)
js/store.js         Data layer: platform store + one HR workspace per employer, session
js/helpers.js       Formatting, modal/form helpers, CSV export
js/logic.js         Payroll, settlement, employer sample data, password hashing
js/platform.js      Matching engine, cross-account queries (job board, applications), seeker sample data
js/pages.js         Employer pages (dashboard, recruitment, employees, payroll, ...)
js/actions.js       Employer actions
js/talent.js        Employer talent search + invitations
js/seeker.js        Job-seeker pages/actions + public job board
js/admin.js         Admin pages/actions
js/app.js           Landing, login/register for all roles, layout, router
```

Scripts are classic (non-module) and share one global scope; keep the load order in `index.html`.

## Run locally

```bash
python3 -m http.server 8000   # visit http://localhost:8000
```

## Deploy on GitHub Pages

Push the folder → repo **Settings → Pages** → Deploy from branch `main` / root. Site: `https://<username>.github.io/<repo>/`.

## Trying it out (single browser)

1. Choose **Employer**, create an account (keep *Load sample data* ticked – it also adds demo job seekers).
2. Open **Talent search**, select a job, see ranked candidates.
3. Sign out, choose **Job Seeker**, create an account, complete your profile and apply to a job.
4. Sign back in as the employer to see the application; move it through stages; sign in as the seeker to see the update.
5. Choose **Platform Admin** and create the admin account to moderate everything.

## Important limitations (read before going live)

- **All data is stored in the visitor's own browser (localStorage).** The three modes only see each other's data on the *same browser*. On GitHub Pages, a job seeker on their phone will **not** reach an employer on another computer. A shared backend is required for real use (see below).
- **Login is a local gate, not real security.** Anyone with access to the browser profile can read everything, and the first person to open Admin setup becomes admin *on that browser*.
- CVs are limited to 1 MB each and count against the ~5 MB localStorage quota.
- Payroll/settlement use simple formulas; verify against local labour and tax law.
- Interview/invitation emails open your own mail/WhatsApp app; nothing is sent automatically.

## Going multi-user (next step)

Replace the functions in `js/store.js` (`loadPlat/savePlat/loadWs/saveWs`) with a backend — e.g. Firebase Auth + Firestore/Realtime Database with security rules (seekers read/write only their own profile; employers read only visible profiles and their own workspace; admin via a custom claim), or your own REST API. Passwords must be handled by the auth provider, never stored by the app.
