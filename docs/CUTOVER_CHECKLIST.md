# Cutover Checklist: /admin and /staff to /app

## Legacy route inventory and mapping

All legacy routes now redirect to /app equivalents via `src/navigation/legacyRouteMap.ts`.

| Legacy route | /app route | Module | Permissions |
| --- | --- | --- | --- |
| /admin/dashboard | /app/admin/dashboard | Admin | MEMBERS:READ, VEHICLES:READ, FINANCE:VIEW |
| /admin/users | /app/members | Members | MEMBERS:READ |
| /admin/users/approve | /app/members/approve | Members | MEMBERS:APPROVE |
| /admin/users/roles | /app/members/roles | Members | ADMIN:RBAC |
| /admin/users/create | /app/members/create | Members | MEMBERS:CREATE |
| /admin/users/profiles | /app/members/profiles | Members | MEMBERS:READ |
| /admin/users/user_profile/:userId | /app/members/profiles/:userId | Members | MEMBERS:READ |
| /admin/fleet | /app/vehicles | Vehicles | VEHICLES:READ |
| /admin/fleet/:vehicleId | /app/vehicles/:vehicleId | Vehicles | VEHICLES:READ |
| /admin/fleet/routes | /app/vehicles/routes | Vehicles | VEHICLES:ROUTES_WRITE, VEHICLES:READ |
| /admin/financials | /app/insurance | Insurance | FINANCE:VIEW |
| /admin/wages | /app/payroll/admin | Payroll | PAYROLL:READ |
| /admin/loans | /app/loans | Loans | LOANS:VIEW |
| /admin/reports/users | /app/reports/users | Reports | MEMBERS:READ |
| /admin/reports/financials | /app/reports/financials | Reports | FINANCE:VIEW |
| /admin/reports/fleet | /app/reports/fleet | Reports | VEHICLES:READ |
| /admin/staff-profiles | /app/admin/staff-profiles | Admin | ADMIN:RBAC |
| /staff/dashboard | /app/dashboard | Dashboard | FINANCE:VIEW, VEHICLES:READ, LOANS:VIEW |
| /staff/update | /app/staff/profile | Profile | STAFF:READ, MEMBERS:READ_SELF |
| /staff/salary | /app/payroll | Payroll | PAYROLL:READ |
| /staff/treasurer | /app/remittances | Remittances | FINANCE:COLLECT, FINANCE:VIEW |
| /staff/loanmanagement | /app/loans/manage | Loans | LOANS:VIEW, LOANS:APPLY |
| /staff/expensetracking | /app/expenses | Expenses | EXPENSES:READ |
| /staff/matatumanagement | /app/vehicles/matatus | Vehicles | VEHICLES:READ |
| /staff/reports | /app/reports | Reports | FINANCE:VIEW |

## Redirects

- All legacy /admin and /staff routes are now redirected to their /app equivalents.
- Redirects are guarded by the same permission checks as the original routes.

## Navigation

- User-facing navigation points to /app routes only.
- Admin and staff sidebars now link to /app equivalents.

## Remaining legacy-only features

- None identified. Every legacy route has a /app equivalent or redirect.
