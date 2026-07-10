# UI Wireframes

M365 / Azure Portal inspired layout for the CDD Renewal Compliance Application.

## Global Layout

All authenticated screens share:
- **Left sidebar** — Module navigation (collapsible on mobile)
- **Top header** — Global search (Cmd+K), notifications, theme toggle, user menu
- **Content area** — Breadcrumbs, page title, action toolbar, main panel

## Screen Index

| Screen | Route | Key Elements |
|--------|-------|--------------|
| Login | `/login` | Centered card, email/password, branded header |
| Dashboard | `/dashboard` | 4 KPI cards, trend chart, status donut, activity feed |
| Customers | `/customers` | Filterable data table, import button, row actions |
| Customer Import | `/customers/import` | 3-step wizard: upload → preview → confirm |
| Customer Detail | `/customers/[id]` | Profile card, CDD history, metadata |
| CDD Requests | `/cdd-requests` | Status badges, priority, due date columns |
| CDD Detail | `/cdd-requests/[id]` | Status stepper, tabbed detail view |
| Document Validation | `/document-validation` | Split pane: preview + validation checklist |
| Emails | `/emails` | Templates tab + send logs tab |
| Reports | `/reports` | Report cards with export actions |
| Audit Logs | `/audit-logs` | Immutable log table with filters |
| Administration | `/administration` | Users, Roles, Reminders, Integrations, Jobs tabs |

## CDD Request Detail Tabs

1. **Overview** — Customer info, status, due date, assignee
2. **Documents** — Upload zone, document list with validation status
3. **Emails** — Sent email history for this request
4. **Validation** — AI results and human review actions
5. **Notes** — Internal compliance notes

## Status Workflow Stepper

```
Draft → Sent → Awaiting Docs → Under Review → Approved / Rejected → Closed
```

## Responsive Behavior

- **Desktop (≥1024px):** Full sidebar visible
- **Tablet (768–1023px):** Collapsed sidebar with icons
- **Mobile (<768px):** Sheet-based navigation drawer
