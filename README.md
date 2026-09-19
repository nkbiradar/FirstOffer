# FirstOffer

**Fresher opportunities. One place.**

FirstOffer is a job board built for one audience: students and freshers in India looking for internships and entry-level roles. No profile to fill in, no placement-cell queue — browse real openings, hand-checked and republished the same day they come in, and apply straight through the company's own link, Google Form, or HR contact.

🔗 **Live:** [firstoffer.online](https://www.firstoffer.online)

---

## What it does

**For job seekers**
- Browse and search internships and full-time roles with zero sign-up required — filters for type, work mode, batch, and location.
- Every listing is pulled down automatically 48 hours after it goes live, so nothing stale stays up.
- Optional Google sign-in unlocks a personal dashboard: track which opportunities you've applied to, and self-report the outcome (interview / offer / rejected / no response) a few days later.
- **Full Access (₹49/month, UPI Autopay)** unlocks every apply route on a listing — direct application link, official Google Form, HR email and contact number, and any free-text apply instructions.
- **Internal HR Openings (₹39/month)** — a separate, curated feed of roles shared directly by HR contacts, kept deliberately "mystery" (company and role hidden) until unlocked, so they're never scraped or reposted elsewhere.
- Push notifications and email alerts go out the moment new opportunities are published, so subscribers can be first to apply.

**For the admin**
- A single-page dashboard for the daily workflow: paste 20–30 opportunities at once (`---OPPORTUNITY--- ... ---END---` blocks) and publish them all in one go, or hand raw, unstructured text to an AI parser (Claude) that extracts the same fields.
- Cross-batch and cross-database duplicate detection before anything goes live.
- Full CRUD on opportunities and companies, draft/publish/expire lifecycle, and a stats dashboard (published today, drafts, expired).
- Company logos auto-suggested from a domain guess, editable per company.

**Monetization**
- Two independent recurring plans on Razorpay's UPI Autopay (subscriptions, not one-off orders): Full Access and Internal HR Openings.
- A subscriber who cancels their Autopay mandate keeps access automatically until the period they already paid for actually ends — no manual intervention, no cron job, just a date comparison at read time.
- Legacy one-time "unlock a single opportunity" payments are still honored for early customers alongside the newer subscription model.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router, TypeScript) |
| Database & Auth | [Supabase](https://supabase.com) (Postgres, Row Level Security, Google OAuth) |
| Payments | [Razorpay](https://razorpay.com) — UPI Autopay subscriptions + legacy one-time orders |
| Email | [Resend](https://resend.com) |
| Push notifications | Web Push (VAPID) |
| AI parsing | [Claude](https://www.anthropic.com) (`@anthropic-ai/sdk`), for the "Parse with AI" bulk-import path |
| Testing | [Vitest](https://vitest.dev) |
| Hosting | [Vercel](https://vercel.com) |
| Mobile | Android app via [Capacitor](https://capacitorjs.com) |

No Tailwind — styling is a hand-built design-token system in `app/globals.css` (CSS custom properties, light/dark mode, a shared component class set).

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account (Test Mode is enough for local development)

### Setup

```bash
git clone https://github.com/nkbiradar/FirstOffer.git
cd FirstOffer
npm install
# create .env.local in the project root with the variables listed below
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment variables

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `SUPABASE_SECRET_KEY` | Supabase service-role key (server-only, admin writes) |
| `ADMIN_EMAILS` | Comma-separated allowlist of admin sign-in emails |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API credentials |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies incoming Razorpay webhook signatures |
| `RAZORPAY_MONTHLY_PLAN_ID` / `RAZORPAY_INTERNAL_PLAN_ID` | Razorpay Plan IDs for the two subscription products |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Outbound "new opportunity" email alerts |
| `EMAIL_UNSUB_SECRET` | Signs one-click email-unsubscribe links |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push keys (server) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push public key (client) |
| `ANTHROPIC_API_KEY` | Powers the "Parse with AI" bulk-import option |
| `NEXT_PUBLIC_SITE_URL` | Base URL used in sitemaps, RSS, canonical/OG tags, and email links |

### Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
npm test         # vitest
```

---

## Project structure

```
app/                    # routes (App Router) — public site, /admin, /api
  admin/                # admin dashboard, opportunity CRUD, bulk import
  api/                  # route handlers (admin mutations, payments, webhooks, email/push)
  opportunities/        # public listing + detail pages
components/             # shared UI + admin form components
lib/
  data/                 # server-side reads/writes per table (opportunities, subscriptions, companies, ...)
  payments/             # Razorpay client + subscription helpers
  email/                # Resend client + templates
  push/                 # Web Push sending
  notify/               # "new opportunity" push + email alert orchestration
  ai/                   # Claude-powered bulk-import extraction
supabase/
  schema.sql            # database schema, RLS policies (source of truth — run manually in the SQL Editor)
```

---

## Deployment

The `main` branch auto-deploys to [Vercel](https://vercel.com) on every push. Schema changes in `supabase/schema.sql` are **not** applied automatically — new/changed SQL blocks need to be run by hand in the Supabase SQL Editor after a deploy that depends on them.

---

## License

Private, all rights reserved. This is a commercial product — not open for reuse or redistribution.
