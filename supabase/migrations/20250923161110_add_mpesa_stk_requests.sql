create table if not exists "public"."mpesa_stk_requests" (
  "id" uuid not null default gen_random_uuid(),
  "checkout_request_id" text not null,
  "merchant_request_id" text,
  "phone" text not null,
  "amount" numeric(12,2) not null,
  "status" text not null,
  "result_code" integer,
  "result_desc" text,
  "mpesa_receipt_number" text,
  "user_id" uuid,
  "vehicle_id" uuid,
  "payment_id" uuid,
  "metadata" jsonb,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint mpesa_stk_requests_pkey primary key ("id"),
  constraint mpesa_stk_requests_checkout_unique unique ("checkout_request_id")
);
