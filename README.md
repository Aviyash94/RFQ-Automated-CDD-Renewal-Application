# CDD Renewal Compliance Application

Enterprise-grade Customer Due Diligence (CDD) renewal automation platform for SICOM.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui |
| Backend | NestJS, TypeORM, PostgreSQL |
| Queue | BullMQ + Redis |
| Email | Nodemailer (Mailhog in dev) |
| Auth | Local JWT + RBAC |

## Project Structure

```
client/     → Next.js frontend (port 3000)
server/     → NestJS API (port 3001)
docker/     → PostgreSQL, Redis, Mailhog
docs/       → RFQ, architecture, requirements traceability
shared/     → Shared TypeScript types
```

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL, Redis, Mailhog)
- npm

## Docker Deployment (full stack)

Run the entire application with Docker Desktop:

```bash
cd docker
docker compose -f docker-compose.deploy.yml up --build -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/api/docs |
| Mailhog | http://localhost:8025 |

Stop the stack:

```bash
cd docker
docker compose -f docker-compose.deploy.yml down
```

Remove volumes (reset database and uploads):

```bash
docker compose -f docker-compose.deploy.yml down -v
```

## Quick Start

### 1. Start infrastructure

```bash
cd docker
docker compose up -d
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.local.example client/.env.local
```

### 3. Install and seed

```bash
cd server
npm install
npm run seed
npm run start:dev
```

```bash
cd client
npm install
npm run dev
```

### 4. Access the application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/api/docs |
| Mailhog | http://localhost:8025 |

## Seed Users

| Email | Password | Role |
|-------|----------|------|
| admin@cdd.local | Admin123! | SuperAdmin |
| officer@cdd.local | Officer123! | ComplianceOfficer |
| manager@cdd.local | Manager123! | ComplianceManager |
| viewer@cdd.local | Viewer123! | Viewer |

## Key Modules

- **Dashboard** — KPIs, renewal trends, status distribution
- **Customers** — CRUD, search, CSV/XLSX import
- **CDD Requests** — Full lifecycle workflow with reminders
- **Document Validation** — AI-assisted validation with human override
- **Emails** — Template management and send logs
- **Reports** — CDD summary, SLA metrics, CSV export
- **Audit Logs** — Immutable activity trail
- **Administration** — Users, roles, reminder rules, jobs, Oracle integration

## API Documentation

Swagger UI is available at `/api/docs` when the server is running.

## Background Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| cdd-renewal-scan | Daily 6 AM | Auto-create CDD requests for expiring customers |
| reminder-email | On demand | Send tiered reminder emails |
| document-ai-validate | On upload | Run AI validation pipeline |
| customer-import | On upload | Process bulk customer imports |
| oracle-sync | Scheduled | Sync customers from Oracle (stub) |

## Oracle Integration

Oracle integration is prepared via adapter pattern. Set `ORACLE_ENABLED=true` in server `.env` and configure connection details. Health check available at `GET /api/v1/integrations/oracle/health`.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Requirements Traceability](./docs/REQUIREMENTS-TRACEABILITY.md)
- [RFQ Document](./docs/RFQ/CDD-Renewal-RFQ.pdf)
