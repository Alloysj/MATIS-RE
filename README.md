# MATIS (Matatu Transport Industry Solutions)

MATIS is a full-stack platform that digitises the daily operations of a matatu SACCO. It centralises member onboarding, vehicle management, daily remittances, insurance deductions, and loan servicing so officers can supervise compliance in real time. The system is built for Kenyan transport co-operatives that need traceable mobile money payments, automated allocations, and visibility into member finance history.

## Core Capabilities
- Daily remittance capture via M-PESA STK push with automated split into operations, insurance, loan repayment, and savings buckets.
- Loan lifecycle management covering application intake, approval workflows, disbursement tracking, and repayment schedules.
- Vehicle and crew registry with route assignments, insurance policies, and compliance statuses.
- Savings ledger tied to individual members and vehicles, with transparent transaction history and balance snapshots.
- Administrative tooling for staff payroll, expense logging, capital contributions, exit requests, and support ticketing.
- Reporting-ready API endpoints that expose finance, vehicle, and membership data for dashboards.

## Tech Stack
- **Frontend**: React 18 with Vite, Radix UI components, Tailwind utilities, React Router, Recharts for analytics.
- **Backend**: Express 5 with TypeScript, Prisma ORM, Supabase client for supplementary queries, JSON Web Token auth middleware.
- **Database**: PostgreSQL (hosted via Supabase by default) managed with Prisma migrations and schema definitions.
- **Integrations**: Safaricom M-PESA STK push APIs for payment initiation and callback processing, Supabase REST for health checks.

## How MATIS Tracks Daily Remittances and Loans
1. **Initiation**: Back-office staff trigger a remittance from MATIS; the backend issues an M-PESA STK push to the crew member using the configured shortcode and passkey.
2. **Confirmation**: When Safaricom confirms payment, MATIS records the transaction (`payments`, `mpesaStkRequests`) and normalises the phone number for downstream reconciliation.
3. **Allocation**: Business rules distribute the remitted amount into remittance fees (default KES 250), insurance, loan repayment, and savings. Allocation records are stored in `paymentAllocations`.
4. **Ledger Updates**: Each allocation posts a `transaction` entry linked to the member or vehicle savings account to maintain a full audit trail and keep running balances.
5. **Loan Servicing**: If a member has outstanding loans, the loan repayment slice reduces the balance (`loanRepayments`) and updates loan status when fully settled. New loan requests follow an approval -> disbursement -> repayment cycle handled within the finance routes.
6. **Visibility**: The frontend dashboards surface daily compliance, arrears, and loan performance using the REST API exposed under `/api/finance`, `/api/reports`, and related routes.

## Repository Layout
- `backend/` - Express API, Prisma schema, MPESA integration, and route modules (finance, users, matatus, staff, admin).
- `src/` - React application (member and staff portals, dashboards, forms).
- `supabase/` - SQL helpers and seed data used by Supabase-hosted instances.
- `backend/prisma/schema.prisma` - Canonical data model for users, vehicles, payments, loans, savings, and staff operations.

## Prerequisites
- Node.js 18 or newer and npm.
- PostgreSQL 14 or newer (Supabase works out of the box, but any Postgres instance is supported).
- Safaricom M-PESA Daraja credentials (consumer key and secret, shortcode, passkey) for live STK push testing.
- Optional: Supabase project for hosting Postgres and leveraging the Supabase dashboard.

## Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # create if you prefer not to reuse the committed file
# update database, Supabase, JWT, and MPESA settings
npm run prisma:generate
npx prisma migrate dev  # or `npm run prisma:migrate` to apply the latest migrations
npm run dev             # starts Express on the port defined in .env (default 4000)
```

### Required Environment Variables (`backend/.env`)
- `DATABASE_URL` - Postgres connection string (can be Supabase).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - used for health checks and optional Supabase queries.
- `JWT_SECRET` - signing key for API tokens.
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL` - STK push credentials and callback endpoint registered with Safaricom.
- `PRISMA_DISABLE_PREPARED_STATEMENTS` - recommended `true` when using PgBouncer.

## Frontend Setup
```bash
npm install
npm run dev  # launches Vite dev server (default http://localhost:5173)
```
Configure API base URLs inside the frontend service modules (for example `src/services/*.ts`) to point at your backend host. For local development the default is usually `http://localhost:4000/api`.

## Development Workflow
- Run `npm run build` in the project root to produce the frontend bundle, and `npm run build` inside `backend/` to emit compiled server code.
- Execute `npm run prisma:generate` whenever you change `schema.prisma`.
- For automated tests, add scripts to the respective `package.json` files (the project currently relies on manual QA and API smoke tests).

## Deployment Notes
- Host the backend on a Node-compatible environment (Render, Railway, Supabase Edge Functions, etc.) with environment variables configured as above.
- Ensure your public backend URL is registered as the `MPESA_CALLBACK_URL` so Safaricom can reach the `/api/finance/mpesaCallback` endpoint.
- Serve the frontend as a static bundle (Vite build output) via your preferred hosting provider (Netlify, Vercel, S3/CloudFront, and similar).
- Set up HTTPS for both backend and frontend; Safaricom requires secure callback URLs in production.

## Troubleshooting
- **STK push not reaching device**: Confirm the phone number format (`2547...`) and that the configured shortcode is approved for the amount being requested.
- **Prisma migration errors**: Verify the database URL and ensure the Postgres user has migration privileges. Run `npx prisma migrate resolve --applied <migration_name>` if you manually adjusted the database.
- **JWT authentication issues**: Check `JWT_SECRET` consistency across deployments and that frontend requests include the `Authorization: Bearer <token>` header.

## Next Steps
- Add automated regression tests for finance flows.
- Configure observability (for example APM, structured logging) before going to production.
- Harden role-based access control in `backend/src/middleware/auth.ts` for granular permissions.
