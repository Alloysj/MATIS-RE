# Financial Operations Overview

This guide explains how the finance module allocates member remittances, prioritises loan servicing, and tracks insurance and savings contributions. It summarises the behaviour implemented in `backend/src/routes/finance.ts` so you know what to expect when reviewing payments or building new features on top of it.

## Daily Remittance Breakdown
- **Operations remittance**: fixed KES 250 is reserved first to cover daily operating costs.
- **Insurance remittance**: the next KES 250 (or whatever remains if the payment is smaller) is reserved for insurance.
- **Loan repayment priority**: any remaining amount after operations and insurance is directed to the member's outstanding loan balance (highest priority after the mandatory remittances).
- **Savings top-up**: whatever is left after loan repayment is deposited into the member's savings account (second priority behind loan repayments).

If a payment is less than the fixed amounts, the system simply allocates what is available in order; there are no overdrafts.

## End-to-End Payment Flow
1. **STK initiation** (`POST /api/finance/initiateStkPush`):
   - Creates an `mpesa_stk_requests` row with the intended amount, user, vehicle, and metadata.
   - Waits for the MPESA callback.
2. **MPESA callback** (`POST /api/finance/mpesaCallback`):
   - Loads the pending STK request, overrides MPESA failures when necessary, and normalises the final amount/receipt number.
   - Splits the amount using the priorities above.
   - Ensures the member has a `savings_accounts` record for the relevant vehicle, creating one on the fly if missing.
3. **Ledger updates** (within the same transaction):
   - Creates a `payments` record marked `COMPLETED`.
   - Inserts one row per allocation into `payment_allocations` (`OPERATIONS`, `INSURANCE`, `LOAN_REPAYMENT`, `SAVINGS`).
   - Adds matching ledger entries in `transactions` with the appropriate `TransactionType` (operations fee, insurance payment, loan repayment, deposit).
   - Adjusts balances:
     - `savings_accounts.balance` increased by the savings share.
     - `users.savings_balance` mirrors the savings increment.
     - `users.loan_balance` reduced by the loan payment (never below zero).
     - `loans.existing_loans` updated for the current active loan; status flips to `REPAID` when the balance hits zero.
   - Marks the `mpesa_stk_requests` record as `SUCCESSFUL`, stores the receipt number, attaches the `payments.id`, and saves full callback details in `metadata`.

Because all of the above happen inside a single database transaction, either every related table is updated together or none of them are, keeping the financial records consistent.

## Database Tables Touched per Payment

| Table | Purpose in the flow | Key columns updated |
| --- | --- | --- |
| `mpesa_stk_requests` | Tracks the STK push lifecycle from initiation to callback. | `status`, `result_code`, `result_desc`, `mpesa_receipt_number`, `payment_id`, `metadata` |
| `payments` | Stores the final payment header once the callback is processed. | `user_id`, `vehicle_id`, `total_amount`, `mpesa_reference`, `status` |
| `payment_allocations` | Records how the payment was split across finance categories. | `payment_id`, `category`, `amount` |
| `transactions` | Member-facing ledger of movements tied to a savings account. | `account_id`, `type`, `amount`, `payment_id`, `description` |
| `savings_accounts` | Holds per-member (optionally per-vehicle) savings balances. | `balance` (incremented by the savings allocation) |
| `users` | Maintains summary balances surfaced in dashboards. | `savings_balance` (+savings), `loan_balance` (-loan payment) |
| `loans` | Keeps the outstanding amount for the latest active loan. | `existing_loans`, `status` (set to `REPAID` when cleared) |

> Tip: the finance screens surface these details via endpoints such as `/api/finance/dashboard/:userId/*`, aggregating `payments`, `payment_allocations`, and `transactions` to render charts and summaries for operations, insurance, loans, and savings.

With this flow in mind, reviewers can quickly trace a member remittance from the MPESA callback through every affected table and confirm that daily operations, insurance, loan servicing, and savings all remain in sync.

## Admin Reporting APIs

### Remittances

- **Endpoint**: `GET /api/admin/reports/remittances`
- **Purpose**: paginated list of daily operations allocations (KES 250 remittance) with payment, member, vehicle, and route metadata.
- **Default range**: last 30 days counted back from the request time.
- **Date filters**: `startDate`, `endDate`, or `month=YYYY-MM`.
- **Entity filters**: `userId`, `vehicleId`, `routeId`, `driverId`, `accountId`.
- **Response**:
  - `totals.amount` - total operations amount within the range.
  - `totals.paymentCount` - number of remittance allocations.
  - `allocationSummary` - category totals (operations, insurance, loan repayment, savings) to keep dashboards in sync.
  - `items[]` - each entry surfaces the operations amount, payment breakdown across all categories, and associated user/vehicle/route.

### Loan Repayments

- **Endpoint**: `GET /api/admin/reports/loan-repayments`
- **Purpose**: detailed view of allocations tagged `LOAN_REPAYMENT`, including the matching repayment transactions and savings accounts involved.
- **Filters**: identical to the remittance endpoint (`startDate`, `endDate`, `month`, `userId`, `vehicleId`, `routeId`, `driverId`, `accountId`).
- **Response highlights**:
  - `totals.amount` - total loan repayments collected.
  - `items[].transactions[]` - repayment transactions with the savings account (and vehicle) they posted to.
  - `allocationSummary` - same cross-category totals so reports and exports stay consistent.

### Export Summary

- **Endpoint**: `GET /api/admin/reports/export/summary`
- **Purpose**: lightweight aggregate payload for export/download screens.
- **Filters**: same entity/date filters plus optional `loanStatus`, `loanType`, `expenseStatus`, `expenseCategory`.
- **Response**:
  - `totals.remittance`, `totals.insurance`, `totals.loanRepayments`, `totals.savings`.
  - `payments` - total collections and payment count in the window.
  - `loans` - total amount and count of loans matching the filter set (defaults to approved/disbursed/repaid/defaulted).
  - `expenses` - amount and count of expense entries.

These APIs allow the admin reports page to reuse the same building blocks for dashboards, exports, and drill-down tables without relying on a monolithic summary response.
