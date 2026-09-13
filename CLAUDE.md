# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
cd api && npm install
cd frontend && npm install

# Run API (port 4000, nodemon hot-reload)
cd api && npm run dev

# Run frontend (port 3000, CRA)
cd frontend && npm start

# Re-seed DB schema (run in Supabase SQL editor, not locally)
# File: api/db/schema.sql

# One-time setup script (creates DB rows + Form.io forms)
node scripts/setup.js
```

Demo credentials: `agent@demopm.com.au` / `demo1234`

## Architecture

### Data flow

```
ClientIntake form (Form.io, public URL /intake/:token)
  → POST /v1/intake/:token/submit  → intake_requests.responses (JSONB)
  → POST /v1/transactions          → buildFM00100Prefill() → transactions.form_data (JSONB)
  → FM00100Wizard (React, 8 steps) → PATCH /v1/transactions/:id
  → FM00100Template.jsx            → rendered preview + PDF
```

### Key services

- **`api/services/prefill.js`** — Maps raw intake responses + agency profile into canonical prefill keys stored in `transactions.form_data`. This is the source of truth for field naming.
- **`api/services/pdfGenerator.js`** — Puppeteer renders `FM00100Template` for PDF output.
- **`api/services/formio.js`** — Form.io API client (cloud project: `ziskuwsfhbqgnzx.form.io`, FM00100 form ID: `6a1ceaa3b1986107a00e451e`).
- **`api/routes/formio.js`** — `buildIntakeFormComponents()` and `buildFM00100WizardComponents()` define the Form.io form JSON. Push to Form.io cloud via `POST /v1/formio/setup`. Both functions use canonical field keys (v2 — aligned with `prefill.js`).

### Field key convention

Canonical keys use double-underscore for nesting and `_N__` for array index:
- `party[0].name_full` → `party_0__name_full`
- `property.address.street` → `property__address_street`

**Two generations of keys exist in the DB.** Old transactions used `party_0__full_name`, `property__street_address`, `leasing__rent_amount` etc. The checklist (`FM00100Checklist.jsx`) and wizard both check alt keys arrays. The backfill script in `scripts/` fixed existing transactions.

### Agency / Agent hierarchy

- `agencies` table — parent account; holds licence no., trust account details, default fee schedule, address, trading name.
- `users` table — child agent accounts; `agency_id` FK links to parent.
- `prefill.js` receives `(intakeResponses, agencyProfile)` — called once at transaction creation from `routes/transactions.js`.
- Agents manage agency data via **Settings** (`/settings/:tab`) — tabs: Agency Profile, Default Fees, Trust Account, My Profile.

### React frontend structure

```
pages/
  Login.jsx
  Dashboard.jsx
  Intake.jsx          — create + list intake requests
  Transactions.jsx    — list all MAs
  TransactionDetail.jsx  — MAIN WORKING FILE (~1400 lines)
    ├── FM00100Wizard   — 8-step form (Steps: Principal, Property, Agreement & Fees,
    │                     Authority, Disclosures, Bank Accounts, Review, Preview & Sign)
    ├── AgreementPreview → FM00100Template wrapper
    ├── FM00100Checklist — right-column completion tracker on Overview tab
    └── PrefillDataTab  — shows all prefill keys + raw intake responses
  ClientIntake.jsx    — public owner-facing intake form
  Settings.jsx        — agency profile management (4 tabs)

components/
  Sidebar.jsx
  FM00100Template.jsx    — print-ready form render (inline styles throughout)
  FM00100Checklist.jsx   — completion indicator + FM00100CompletionBanner
```

### Database tables (Supabase PostgreSQL)

- `agencies` — agency profile + trust account + fee defaults
- `users` — agent accounts (`agency_id`, `role`, `full_name`, `email`)
- `intake_requests` — owner intake forms (`token`, `responses` JSONB, `status`)
- `transactions` — MAs (`intake_id`, `form_data` JSONB, `status`, `formio_submission_id`)

### API routes summary

| Route | Purpose |
|-------|---------|
| `POST /v1/auth/login` | JWT login |
| `GET /v1/auth/me` | Current user |
| `GET/POST /v1/intake` | List / create intake requests |
| `GET/POST /v1/intake/:token/submit` | Public owner intake |
| `GET/POST /v1/transactions` | List / create MAs |
| `GET/PATCH /v1/transactions/:id` | Detail / save wizard data |
| `POST /v1/pdf/fm00100/:id` | Generate PDF |
| `GET/PATCH /v1/settings/agency` | Agency profile |
| `GET /v1/settings/agent` | Logged-in agent profile |

### Auth

JWT stored in localStorage. `api/middleware/auth.js` decodes it and sets `req.user = { userId, agencyId, role }`. Frontend `useAuth` hook + `utils/api.js` axios instance attach the `Authorization: Bearer` header automatically.

### Environment variables (api/.env)

```
DATABASE_URL=          # Supabase PostgreSQL connection string
JWT_SECRET=
FORMIO_BASE_URL=https://ziskuwsfhbqgnzx.form.io
FORMIO_API_KEY=
ANTHROPIC_API_KEY=     # Used by voice/AI routes
RESEND_API_KEY=        # Email — not yet configured
TWILIO_ACCOUNT_SID=    # SMS — not yet configured
TWILIO_AUTH_TOKEN=
FRONTEND_URL=http://localhost:3000
```

## Known issues / pending work

- **Wizard key inconsistency**: The wizard's `useState` init still uses some old keys (`party_0__full_name`, `property__street_address`, `leasing__rent_amount`) that don't match canonical prefill keys. Needs a refactor pass on `TransactionDetail.jsx` wizard init block.
- **Form.io embedded wizard**: End-to-end test with the updated v4 JSON schema and new prefill keys not yet done.
- **Email/SMS not wired**: Resend and Twilio env vars are placeholders.
