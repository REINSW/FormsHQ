# REI Forms NSW — Prototype

Intake → Pre-fill → FM00100 Wizard → PDF Download

## Stack
- **Database** — Supabase (PostgreSQL)
- **Forms** — Form.io cloud (`ziskuwsfhbqgnzx.form.io`)
- **API** — Node.js / Express (port 4000)
- **Frontend** — React (port 3000)
- **PDF** — pdf-lib overlay on FM00100 template

## Quick Start

### 1. Prerequisites
- Node.js 18+
- npm

### 2. Install dependencies

```bash
# API
cd api && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Run setup (creates DB schema + Form.io forms)

```bash
cd ..
npm install pg axios  # for setup script
node scripts/setup.js
```

### 4. Start the API

```bash
cd api && npm run dev
# → http://localhost:4000
```

### 5. Start the frontend

```bash
cd frontend && npm start
# → http://localhost:3000
```

### 6. Log in

URL: `http://localhost:3000`  
Email: `agent@demopm.com.au`  
Password: `demo1234`

---

## The flow

```
Agent creates intake request
  ↓
Copies client intake URL → shares with owner
  ↓
Owner fills Form.io intake form (http://localhost:3000/intake/{token})
  ↓
Agent clicks "Start MA →" on the submitted intake
  ↓
Platform builds FM00100 pre-fill payload (intake + agency defaults)
  ↓
Creates Form.io submission with pre-fill data
  ↓
Agent clicks "Open wizard" or views the Wizard tab
  ↓
Agent completes remaining fields (disclosures, dates, fees)
  ↓
Agent clicks "Generate PDF" → downloads completed FM00100
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/auth/login | Agent login |
| GET | /v1/auth/me | Current user |
| POST | /v1/intake | Create intake request |
| GET | /v1/intake | List intakes |
| GET | /v1/intake/:token | Public — get intake by token |
| POST | /v1/intake/:token/submit | Client submits intake |
| POST | /v1/transactions | Start MA from intake |
| GET | /v1/transactions | List transactions |
| GET | /v1/transactions/:id | Get transaction detail |
| GET | /v1/transactions/prefill/:token | Get pre-fill data |
| PATCH | /v1/transactions/:id/complete | Mark completed |
| POST | /v1/pdf/fm00100/:id | Generate & download PDF |
| POST | /v1/formio/setup | (Re)create Form.io forms |
| POST | /v1/formio/webhook/intake | Form.io intake webhook |
| POST | /v1/formio/webhook/fm00100 | Form.io wizard webhook |

---

## Project structure

```
rei-forms-prototype/
├── api/
│   ├── .env                 ← credentials (Supabase, Form.io)
│   ├── index.js             ← Express app entry
│   ├── db/
│   │   ├── index.js         ← pg Pool
│   │   └── schema.sql       ← Run in Supabase SQL editor
│   ├── middleware/
│   │   └── auth.js          ← JWT auth
│   ├── routes/
│   │   ├── auth.js
│   │   ├── intake.js
│   │   ├── transactions.js
│   │   ├── formio.js
│   │   └── pdf.js
│   └── services/
│       ├── formio.js        ← Form.io API client
│       ├── prefill.js       ← Intake → FM00100 field mapping
│       └── pdfGenerator.js  ← PDF overlay service
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── hooks/useAuth.js
│       ├── components/Sidebar.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Intake.jsx
│       │   ├── Transactions.jsx
│       │   ├── TransactionDetail.jsx
│       │   └── ClientIntake.jsx
│       └── utils/api.js
├── assets/
│   └── FM00100_template.pdf ← Official REI form
└── scripts/
    └── setup.js             ← DB + Form.io setup
```

---

## Form.io webhooks (optional)

To have Form.io automatically notify the API on submission:

1. In Form.io, go to each form → **Actions** → **Webhook**
2. Intake form → `http://localhost:4000/v1/formio/webhook/intake`
3. FM00100 wizard → `http://localhost:4000/v1/formio/webhook/fm00100`

For local dev, use [ngrok](https://ngrok.com/) to expose localhost.

---

## Tooltip content (User Guide)

The FM00100 User Guide text has been extracted and is available for 
contextual tooltips throughout the wizard. Key notes:
- Clause 3: All parts must be completed
- Clause 5: Agreement must be signed by both parties, Principal's copy served within 48 hours
- Clause 11: GST inclusive amounts
- Clause 16: Repairs limit applies except in emergencies
- Clause 25: Material fact disclosures are mandatory

Production implementation: store in `form_field_tooltips` table and 
inject via Form.io `description` property per field.
