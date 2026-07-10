# Requirements Traceability Matrix

Source: [CDD-Renewal-RFQ.pdf](./RFQ/CDD-Renewal-RFQ.pdf)

| RFQ Area | Module | API Endpoints | UI Screen | Acceptance Criteria |
|----------|--------|---------------|-----------|---------------------|
| Customer management | `customers` | `GET/POST/PATCH/DELETE /customers` | `/customers` | CRUD, search, filter by risk/segment |
| Customer import | `customers` | `POST /customers/import` | `/customers/import` | CSV/XLSX upload, column mapping, validation preview |
| CDD renewal workflow | `cdd-requests` | `GET/POST/PATCH /cdd-requests`, `PATCH /:id/status` | `/cdd-requests`, `/cdd-requests/[id]` | Status workflow: Draft→Sent→AwaitingDocs→UnderReview→Approved/Rejected→Closed |
| Document upload | `documents` | `POST /documents/upload`, `GET /documents/:id` | CDD detail Documents tab | Upload, store, link to CDD request |
| Customer Portal (Annex A/B) | `portal` | `GET/POST /portal/:token/*`, staff token APIs | `/portal/[token]` | Tokenised customer upload + digitised risk form |
| Document receiving mechanism | `portal` + email | Portal URL in reminder emails | Customer Portal + mailbox (future) | RFQ Tech Req 10 / Annex C — bidder-advised channel |
| Document validation | `document-validation` | `POST /documents/:id/validate`, `POST /validation/:id/review` | `/document-validation` | AI-assisted checks + human override with audit |
| Email workflows | `emails` | Templates CRUD, `GET /emails/logs` | `/emails` | Template management, send logs, preview |
| Reminders | `jobs` + `emails` | Cron + BullMQ | Admin reminder rules | T-30, T-14, T-7, overdue reminders |
| Dashboard | `dashboard` | `GET /dashboard/kpis`, `GET /dashboard/charts` | `/dashboard` | KPI cards, trend charts, activity feed |
| Reports | `reports` | `GET /reports/*`, export formats | `/reports` | CDD summary, SLA, CSV/XLSX export |
| Audit logs | `audit-logs` | `GET /audit-logs` | `/audit-logs` | Immutable, filterable audit trail |
| Administration | `administration`, `users`, `roles` | Users/Roles CRUD, settings | `/administration` | User management, RBAC matrix, system settings |
| Authentication | `auth` | `POST /auth/login`, refresh, logout | `/login` | Local JWT, refresh tokens, account lockout |
| RBAC | `roles` | Role/permission endpoints | Admin roles tab | 6 roles with permission guards |
| Notifications | `notifications` | `GET/PATCH /notifications` | Header bell | In-app notifications |
| Global search | `search` | `GET /search?q=` | Command palette | Cross-entity search |
| Oracle integration | `integrations/oracle` | Health + sync stub | Admin integrations | Adapter interface, sync job stub |
| Scheduling | `jobs` | `GET /jobs/runs` | Admin job monitor | Cron + BullMQ job tracking |

## CDD Status Workflow

```
Draft → Sent → AwaitingDocs → UnderReview → Approved | Rejected → Closed
```

## Document Types (Default)

- National ID / Passport
- Proof of Address
- Source of Funds
- Corporate Registration (entity customers)

## Reminder Cadence

| Days Before Due | Action |
|-----------------|--------|
| 30 | First reminder email |
| 14 | Second reminder email |
| 7 | Final reminder email |
| 0 (overdue) | Overdue notice |

## Seed Users (Development)

| Email | Password | Role |
|-------|----------|------|
| admin@cdd.local | Admin123! | SuperAdmin |
| officer@cdd.local | Officer123! | ComplianceOfficer |
| manager@cdd.local | Manager123! | ComplianceManager |
| viewer@cdd.local | Viewer123! | Viewer |
