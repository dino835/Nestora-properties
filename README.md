# Nestora Properties — Full-Stack App

A complete, working property listing platform: real backend API + the
frontend wired to it, in one folder. Run one command and the whole site
works — sign up, sign in, browse listings on a real map, submit listings
as an agent, and moderate everything from an admin dashboard.

## Quick start

```bash
npm install
npm start
```

Open **http://localhost:4000** — that's it. The Express server serves both
the API (`/api/...`) and the frontend (`public/index.html`) on the same
origin, so there's no separate frontend server and no CORS setup needed.

Demo accounts (seeded automatically on first run):

| Role            | Email                       | Password   |
|-----------------|------------------------------|------------|
| Admin           | admin@nestoraproperties.com | admin123   |
| Agent (verified)| agent@example.com           | agent123   |
| Agent (verified)| agent2@example.com          | agent123   |
| Agent (unverified) | newagent@example.com     | agent123   |
| Buyer           | buyer@example.com           | buyer123   |

Delete `data/db.json` and restart the server to reset all data back to
this seed state.

## What changed from a plain HTML mockup

- **No more fake/in-memory data.** Every listing, user, and report lives in
  `data/db.json` on the server and is fetched over `fetch()` calls to a
  real Express API.
- **Real auth.** Passwords are hashed with bcrypt; sessions use signed JWTs.
  The token is kept in `localStorage` so refreshing the page doesn't log
  you out.
- **Server-enforced permissions.** Only admins can hit `/api/admin/*`, only
  agents can submit listings — enforced in the backend, not just hidden in
  the UI.

## No self-service seller accounts

Signing up only offers two roles: **Buyer/User** and **Agent**. There is no
seller account or seller dashboard. Anyone who wants to sell a property
uses the **"Contact Us to Sell"** form on the Sell page — this creates a
lead in the database that shows up under the admin dashboard's **"Sell
Requests"** tab, where staff can mark it contacted or remove it. A Nestora
Properties agent then lists the property on the owner's behalf.

Agents can list all three property types — **For Sale, For Rent, and
Shortlet** — from the same "+ Add Listing" form in their dashboard.

## Agent pages, verification & ratings

- **Public agent directory** (`/` → Agents page) lists every active agent
  with their specialty, badges, and star rating.
- **Public agent profile page** shows an agent's bio, badges, live
  listings, and reviews — reachable from the directory or by clicking the
  agent card on any listing.
- **Agent Dashboard → My Profile** lets agents edit their bio, photo,
  specialty, and years of experience, and shows their identity
  verification status.
- **Two independent trust badges**:
  - **Verified Agent** — admin confirms the agent's license/CAC (existing
    Agent Verification flow).
  - **ID Verified** — a separate KYC-style flow: the agent submits a
    document type + number from their dashboard, admin approves/rejects it
    from the new **ID Verification** admin tab.
- **Verified Property badge** — admins can mark any individual listing as
  physically/document verified from the Pending, Flagged, or All Listings
  tables. This is independent of the listing's approval status.
- **Rating system** — any signed-in user (other than the agent themself)
  can leave a 1–5 star rating + comment on an agent's public profile.
  Average rating and review count are computed live from stored reviews.

## Project structure

```
server.js                  Express entry point — serves the API + the frontend
public/index.html          the whole site (HTML/CSS/JS), talks to /api/*
src/db.js                  JSON-file datastore (the "database")
src/seed.js                creates demo users + listings on first run
src/middleware/auth.js     JWT verification + role guards
src/routes/auth.js         signup / login / me / profile / identity-verification
src/routes/properties.js   public browse, agent submit/delete, report-as-scam
src/routes/admin.js        approve/reject listings, verify agents & identity, manage users, verify-property
src/routes/agents.js       public agent directory/profile + reviews
src/routes/leads.js        "contact us to sell" lead capture + admin inbox
src/routes/upload.js       property photo upload (multer)
uploads/                   uploaded photos, served at /uploads/<file>
data/db.json               all persisted data (auto-created, gitignored)
```

## API reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | – | `{ name, email, password, phone, role, license }`. `role` is `buyer` or `agent` only. `license` required for agents (they start `verified:false`). |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ token, user }` |
| GET  | `/api/auth/me` | ✅ | Returns the signed-in user |

### Properties
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/properties` | – | Approved listings only. Filters: `type` (sale/rent/shortlet), `minPrice`, `maxPrice`, `beds`, `city`, `q` |
| GET | `/api/properties/:id` | – | Single listing, any status (used for direct/preview links) |
| GET | `/api/properties/mine` | ✅ agent | Your own listings, any status |
| POST | `/api/properties` | ✅ agent | Submit a listing (sale/rent/shortlet) → starts as `pending` |
| DELETE | `/api/properties/:id` | ✅ owner/admin | Delete a listing |
| POST | `/api/properties/:id/report` | ✅ any | Flag as scam/suspicious. `{ reason }` |

### Agents (public directory, profile & reviews)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/agents` | – | Directory of active agents with badges + rating |
| GET | `/api/agents/:id` | – | Agent profile + their live listings + reviews |
| POST | `/api/agents/:id/reviews` | ✅ any (not self) | `{ rating: 1-5, comment }` — one review per reviewer, editable |

### Auth (profile & identity verification, in addition to signup/login/me)
| Method | Path | Auth | Description |
|---|---|---|---|
| PATCH | `/api/auth/profile` | ✅ | Update name/phone (anyone) or bio/photo/specialty/yearsExperience (agents) |
| POST | `/api/auth/identity-verification` | ✅ agent | `{ documentType, documentNumber, documentPhotoUrl }` → sets status to `pending` |

### Admin (role: admin)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard counters, including new sell-leads |
| GET | `/api/admin/properties?status=` | Filtered listings |
| PATCH | `/api/admin/properties/:id/approve` | Approve / restore a listing |
| PATCH | `/api/admin/properties/:id/reject` | Reject + delete a pending listing |
| DELETE | `/api/admin/properties/:id` | Remove a scam listing permanently |
| GET | `/api/admin/agents` | All agents + verification status |
| PATCH | `/api/admin/agents/:id/verify` / `/unverify` | Toggle license-based agent verification |
| GET | `/api/admin/identity-verifications` | Agents with a pending ID verification request |
| PATCH | `/api/admin/agents/:id/identity/approve` / `/reject` | Approve/reject an agent's ID documents |
| PATCH | `/api/admin/properties/:id/verify-property` / `/unverify-property` | Toggle the "Verified Property" badge on a listing |
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/:id/suspend` / `/activate` | Toggle account access |
| DELETE | `/api/admin/users/:id` | Delete a user |

### Leads ("Contact Us to Sell")
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/leads` | – | Public sell enquiry: `{ name, email, phone, location, message }` |
| GET | `/api/leads` | ✅ admin | View all enquiries |
| PATCH | `/api/leads/:id/contacted` | ✅ admin | Mark as followed up |
| DELETE | `/api/leads/:id` | ✅ admin | Remove an enquiry |

### Uploads
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | ✅ agent | multipart field `photo` → `{ url }` to use as a listing's image |

## Moving to a real database

`src/db.js` only exposes `find`, `filter`, `findById`, `insert`, `update`,
`remove` per table (`users`, `properties`, `reports`, `leads`). To move to
Postgres: add `pg` (or Prisma/Drizzle), create matching tables (see
`src/seed.js` for field shapes), and rewrite `db.js` to run SQL instead of
touching the JSON file — no changes needed in `routes/` or `middleware/`.
Supabase, Neon, or Railway all offer free managed Postgres in minutes.

## Deploying

- **Everything (recommended)**: since one Express server serves both API and
  frontend, deploy this whole folder as one app to Render, Railway, or
  Fly.io. Set `JWT_SECRET` as an environment variable there.
- **Uploads in production**: swap local disk storage in
  `src/routes/upload.js` for S3/Cloudflare R2 so files survive redeploys.

## Security notes already in place

- Passwords hashed with bcrypt (10 rounds)
- JWTs signed with a secret you control (`JWT_SECRET` env var, falls back to
  a dev default — **set a real one before deploying**)
- Role checks enforced server-side, not just hidden in the UI
- Suspended accounts blocked at login
- Upload type/size limits (JPG/PNG/WEBP, 8MB max)

Not included yet (recommended before real production use): login rate
limiting, email verification, and HTTPS (handled by your host).
