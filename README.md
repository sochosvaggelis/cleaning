# Cleanup Co. website

Website for a two-person pressure-washing business, with **two designs**. While developing, a "Design"
switch in the corner of the home page flips between them. On the live site visitors always get the
default design and never see the switch, but a link ending in `?design=classic` (or `?design=realistic`)
opens that design with the switch, which is handy for showing both to someone:

- **Realistic** (default): a normal business layout. The hero is a first-person 3D view of
  pressure-washing a grimy patio; the grime lifts off in stripes as you scroll.
- **3D island**: the first version, a playful scroll story where a little house on a floating
  island gets washed chapter by chapter (driveway → siding → deck → fence → bins).

Both are built with three.js / React Three Fiber, with no 3D model files: everything, including the
dirt, is generated in code. Everything below the story (prices, booking, FAQ) is shared.

Both designs include:

- **Price list** with sizes, add-ons, bundle discounts, a launch promo code and ready-made combos.
- **Online booking**: pick services → live quote → calendar with real availability → details → confirm.
  Double bookings are impossible, and travel time is kept free between jobs.
- **Customer booking page** (`/booking/CU-XXXXXX?token=…`): view, add to calendar, cancel.
- **Team dashboard** (`/admin`): confirm / complete / cancel jobs, notes, revenue stats, days off.
- **Emails** to the customer and to you (optional; printed in the terminal until SMTP is set up).

Stack: React 19 + Vite, three.js via @react-three/fiber, Node.js + Express 5, SQLite (built into Node).

## Run it

Requires **Node.js 22.13 or newer** (`node --version`).

```bash
npm install
npm run dev
```

- Website: <http://localhost:5173>
- Dashboard: <http://localhost:5173/admin>. On the first start the server creates a `.env` file with a
  random admin password and prints it in the terminal. You can change it in `.env` any time.

Bookings are stored in `data/cleanup.sqlite`. Delete that file to start over.

## Make it yours

| What | Where |
| --- | --- |
| Company name, phone, email, service area, opening hours, currency, booking rules | `shared/business.js` |
| Services, sizes, prices, durations, add-ons, bundle discounts, combos | `shared/catalog.js` |
| Promo codes | `server/promoCodes.js` |
| "About us" text and your promises | `client/src/components/About.jsx` |
| FAQ | `client/src/components/Faq.jsx` |
| Colors & fonts | `client/src/styles/base.css` (realistic), `client/src/classic/classic.css` (island) |
| Realistic 3D hero (patio, spray, camera) | `client/src/three/` |
| Island story text / 3D scene | `client/src/classic/content/stories.js`, `client/src/classic/three/` |
| Default design, or removing the switch once you've picked one | `client/src/pages/Home.jsx` |

Prices live in one place and are shared by the website and the server, so the price shown is always the
price charged. The server recalculates every quote itself when a booking comes in.

## Emails

Without SMTP settings the emails are printed in the terminal, so you can see exactly what customers get.
To send real emails, add these to `.env` (Gmail example, which needs a Google "app password"):

```
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
NOTIFY_EMAIL=you@gmail.com
PUBLIC_URL=https://your-domain.com
```

## Going live (GitHub + Render)

GitHub stores the code; Render builds and runs it. The whole Render setup is in `render.yaml`, which is
currently the **free preview** setup (no card needed). On Render's free plan:

- the site sleeps after 15 minutes without visitors and takes about a minute to wake up
- bookings are wiped whenever it sleeps, restarts or redeploys, and it can't send email
- so a notice above the booking form asks visitors to call instead (`VITE_PREVIEW_NOTICE`)

Steps:

1. Push the code to GitHub (`git push`).
2. In the Render dashboard: **New → Blueprint**, connect GitHub and pick this repo. Render reads
   `render.yaml` and creates one free web service in Frankfurt.
3. Enter an `ADMIN_PASSWORD` for the live dashboard (make a new, long one). `SESSION_SECRET` is
   generated for you.
4. Deploy. From then on, every `git push` to `main` redeploys automatically.

**Before taking real bookings**, upgrade: follow "Upgrading" at the bottom of `render.yaml` (Starter plan
with a disk for the bookings, about $7/month, plus the email settings from **Emails** above). Then add
your own domain in Render (**Settings → Custom Domains**, HTTPS is automatic) and set `PUBLIC_URL` to it.

To try production mode on your own computer: `npm run build && npm start`, then open
<http://localhost:3001>. Keep the live site at **one** instance: SQLite can't be shared between several.

## Before you launch

- Replace the placeholder phone number and email in `shared/business.js`.
- Check your prices against local competitors. The defaults are typical US prices for a new business.
- Get general liability insurance before you start. When you have it, say so on the site:
  customers look for it.
- Make a test booking, confirm it in the dashboard, and check that the emails arrive.

## Project layout

```
shared/     business settings, catalog and quote engine (used by client + server)
server/     Express API, SQLite, availability, emails, admin auth
client/     React app (Vite root)
  src/pages/     Home (design switch), ProHome (realistic design), booking status, admin
  src/three/     realistic 3D hero: patio, grime shader, wand, spray, camera
  src/classic/   the 3D island design (its own components, 3D scene and stylesheet)
  src/booking/   booking wizard (shared by both designs)
  src/admin/     dashboard
```
