# Architecture Overview

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui |
| State/Data | TanStack Query, TanStack Table, React Hook Form, Zod |
| Charts/Motion | Recharts, Framer Motion, Lucide Icons |
| Backend | NestJS, TypeScript, TypeORM |
| Database | PostgreSQL (dev), Oracle-ready adapter |
| Queue | BullMQ + Redis |
| Email | Nodemailer (Mailhog in dev) |
| Auth | Local JWT + RBAC |

## Project Structure

```
client/     → Next.js 15 App Router frontend
server/     → NestJS REST API
docker/     → Postgres, Redis, Mailhog
docs/       → RFQ, traceability, architecture
shared/     → Shared TypeScript types
```

## Data Flow

1. User authenticates via `POST /api/v1/auth/login`
2. Frontend stores access token; refresh token in httpOnly cookie
3. TanStack Query fetches domain data through authenticated API client
4. Mutations trigger audit log entries via global interceptor
5. Cron jobs enqueue BullMQ work (reminders, validation, import, Oracle sync)
6. Email jobs send via Nodemailer; notifications created in-app

## Oracle Readiness

- `CustomerSourceRepository` interface abstracts data source
- `PgCustomerRepository` for dev; `OracleCustomerRepository` stub for prod
- Separate TypeORM connection enabled via `ORACLE_ENABLED=true`

## AI Document Validation

- `DocumentValidationProvider` interface
- `MockValidationProvider` (default dev)
- `AzureOpenAIValidationProvider` (production placeholder)
