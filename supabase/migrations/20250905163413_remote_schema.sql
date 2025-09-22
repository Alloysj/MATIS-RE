drop extension if exists "pg_net";

create type "public"."contact_message_type" as enum ('GENERAL', 'MEMBERSHIP', 'LOANS', 'TECHNICAL', 'PARTNERSHIP');

create type "public"."exit_request_status" as enum ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

create type "public"."expense_status" as enum ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

create type "public"."insurance_status" as enum ('ACTIVE', 'EXPIRED', 'PENDING');

create type "public"."loan_status" as enum ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'REPAID', 'DEFAULTED');

create type "public"."loan_type" as enum ('NORMAL', 'EMERGENCY');

create type "public"."payment_category" as enum ('SAVINGS', 'LOAN_REPAYMENT', 'INSURANCE', 'OPERATIONS');

create type "public"."payment_status" as enum ('PENDING', 'COMPLETED', 'FAILED');

create type "public"."registration_status" as enum ('VALID', 'EXPIRED', 'PENDING');

create type "public"."route_status" as enum ('ACTIVE', 'INACTIVE');

create type "public"."salary_advance_status" as enum ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED');

create type "public"."salary_status" as enum ('PENDING', 'PAID', 'CANCELLED');

create type "public"."transaction_type" as enum ('DEPOSIT', 'LOAN_REPAYMENT', 'INSURANCE_PAYMENT', 'OPERATIONS_FEE', 'SALARY', 'EXPENSE');

create type "public"."user_status" as enum ('ACTIVE', 'PENDING', 'SUSPENDED', 'INACTIVE');

create type "public"."vehicle_status" as enum ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED');

create sequence "public"."users_member_number_seq";


  create table "public"."capital_payments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "amount" numeric(12,2) not null,
    "phone_number" character varying(50),
    "mpesa_reference" character varying(100),
    "payment_date" timestamp with time zone not null default now(),
    "status" payment_status not null default 'PENDING'::payment_status
      );



  create table "public"."contact_messages" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(100),
    "email" character varying(255),
    "phone" character varying(50),
    "subject" character varying(255),
    "message" text,
    "type" contact_message_type not null,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."exit_requests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "email" character varying(255) not null,
    "reason" text,
    "additional_comments" text,
    "net_amount" numeric(12,2),
    "request_date" timestamp with time zone not null default now(),
    "status" exit_request_status not null default 'PENDING'::exit_request_status,
    "processed_by" uuid,
    "processed_at" timestamp with time zone
      );



  create table "public"."expenses" (
    "id" uuid not null default gen_random_uuid(),
    "category" character varying(100),
    "description" text,
    "amount" numeric(12,2) not null,
    "date" timestamp with time zone not null default now(),
    "status" expense_status not null default 'PENDING'::expense_status,
    "vendor" character varying(255),
    "created_by" uuid
      );



  create table "public"."insurance_policies" (
    "id" uuid not null default gen_random_uuid(),
    "vehicle_id" uuid not null,
    "provider" character varying(100),
    "policy_type" character varying(100),
    "premium_amount" numeric(12,2),
    "start_date" date,
    "expiry_date" date,
    "status" insurance_status not null default 'PENDING'::insurance_status
      );



  create table "public"."loan_guarantors" (
    "id" uuid not null default gen_random_uuid(),
    "loan_id" uuid not null,
    "guarantor_id" uuid not null
      );



  create table "public"."loans" (
    "id" uuid not null default gen_random_uuid(),
    "applicant_id" uuid not null,
    "vehicle_id" uuid,
    "type" loan_type not null,
    "amount" numeric(12,2) not null,
    "purpose" text,
    "savings_at_application" numeric(12,2),
    "application_date" timestamp with time zone not null default now(),
    "status" loan_status not null default 'PENDING'::loan_status,
    "credit_score" integer,
    "monthly_income" numeric(12,2),
    "existing_loans" numeric(12,2),
    "urgency" character varying(50),
    "expected_repayment_date" date,
    "approved_by" uuid,
    "approved_at" timestamp with time zone
      );



  create table "public"."payment_allocations" (
    "id" uuid not null default gen_random_uuid(),
    "payment_id" uuid not null,
    "category" payment_category not null,
    "amount" numeric(12,2) not null
      );



  create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "vehicle_id" uuid,
    "driver_id" uuid,
    "route_id" uuid,
    "payment_date" timestamp with time zone not null default now(),
    "total_amount" numeric(12,2) not null,
    "mpesa_reference" character varying(100),
    "status" payment_status not null default 'PENDING'::payment_status
      );



  create table "public"."permissions" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(100) not null,
    "description" text,
    "category" character varying(100)
      );



  create table "public"."role_permissions" (
    "role_id" uuid not null,
    "permission_id" uuid not null
      );



  create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(50) not null,
    "description" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."routes" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(100) not null,
    "start_point" character varying(100) not null,
    "end_point" character varying(100) not null,
    "distance_km" numeric(6,2),
    "estimated_time" interval,
    "vehicles_assigned" integer default 0,
    "fare" numeric(12,2),
    "status" route_status not null default 'ACTIVE'::route_status,
    "date_created" timestamp with time zone not null default now()
      );



  create table "public"."salary_advances" (
    "id" uuid not null default gen_random_uuid(),
    "staff_id" uuid not null,
    "amount" numeric(12,2) not null,
    "reason" text,
    "application_date" timestamp with time zone not null default now(),
    "status" salary_advance_status not null default 'PENDING'::salary_advance_status,
    "approved_by" uuid,
    "approved_at" timestamp with time zone
      );



  create table "public"."savings_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "vehicle_id" uuid,
    "account_type" character varying(50),
    "balance" numeric(12,2) default 0,
    "monthly_target" numeric(12,2),
    "last_deposit" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."staff_salaries" (
    "id" uuid not null default gen_random_uuid(),
    "staff_id" uuid not null,
    "basic_salary" numeric(12,2) not null,
    "allowances" numeric(12,2) default 0,
    "nhif" numeric(12,2) default 0,
    "nssf" numeric(12,2) default 0,
    "paye" numeric(12,2) default 0,
    "net_salary" numeric(12,2) not null,
    "bank_name" character varying(100),
    "account_number" character varying(100),
    "pay_date" date,
    "status" salary_status not null default 'PENDING'::salary_status,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "account_id" uuid not null,
    "vehicle_id" uuid,
    "user_id" uuid,
    "payment_id" uuid,
    "date" timestamp with time zone not null default now(),
    "type" transaction_type not null,
    "amount" numeric(12,2) not null,
    "balance_after" numeric(12,2),
    "description" text
      );



  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "member_number" bigint not null default nextval('users_member_number_seq'::regclass),
    "first_name" character varying(100) not null,
    "last_name" character varying(100) not null,
    "email" character varying(255) not null,
    "phone" character varying(50),
    "password_hash" text not null,
    "role_id" uuid,
    "status" user_status not null default 'PENDING'::user_status,
    "membership_type" character varying(100),
    "profile_category" character varying(100),
    "id_number" character varying(50),
    "date_of_birth" date,
    "county" character varying(100),
    "town" character varying(100),
    "address" text,
    "business_name" character varying(255),
    "business_type" character varying(100),
    "share_capital" numeric(12,2) default 0,
    "savings_balance" numeric(12,2) default 0,
    "loan_balance" numeric(12,2) default 0,
    "total_deposits" numeric(12,2) default 0,
    "next_of_kin" character varying(100),
    "next_of_kin_phone" character varying(50),
    "occupation" character varying(100),
    "registration_date" date not null default CURRENT_DATE,
    "last_login" timestamp with time zone,
    "has_completed_capital_payment" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone,
    "created_by" uuid,
    "modified_by" uuid
      );



  create table "public"."vehicle_driver_assignments" (
    "id" uuid not null default gen_random_uuid(),
    "vehicle_id" uuid not null,
    "driver_id" uuid not null,
    "assigned_at" timestamp with time zone not null default now(),
    "released_at" timestamp with time zone
      );



  create table "public"."vehicles" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "plate_number" character varying(50) not null,
    "model" character varying(100),
    "vehicle_type" character varying(50),
    "capacity" integer,
    "chassis_number" character varying(100),
    "engine_number" character varying(100),
    "year_of_manufacture" smallint,
    "route_id" uuid,
    "status" vehicle_status not null default 'ACTIVE'::vehicle_status,
    "driver_id" uuid,
    "insurance_status" insurance_status default 'PENDING'::insurance_status,
    "insurance_provider" character varying(100),
    "policy_type" character varying(50),
    "premium" numeric(12,2),
    "insurance_expiry" date,
    "registration_status" registration_status default 'PENDING'::registration_status,
    "registration_expiry" date,
    "date_added" timestamp with time zone not null default now()
      );


alter sequence "public"."users_member_number_seq" owned by "public"."users"."member_number";

CREATE UNIQUE INDEX capital_payments_pkey ON public.capital_payments USING btree (id);

CREATE UNIQUE INDEX contact_messages_pkey ON public.contact_messages USING btree (id);

CREATE UNIQUE INDEX exit_requests_pkey ON public.exit_requests USING btree (id);

CREATE UNIQUE INDEX expenses_pkey ON public.expenses USING btree (id);

CREATE UNIQUE INDEX insurance_policies_pkey ON public.insurance_policies USING btree (id);

CREATE UNIQUE INDEX loan_guarantors_pkey ON public.loan_guarantors USING btree (id);

CREATE UNIQUE INDEX loans_pkey ON public.loans USING btree (id);

CREATE UNIQUE INDEX payment_allocations_pkey ON public.payment_allocations USING btree (id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);

CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id);

CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (role_id, permission_id);

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX routes_name_key ON public.routes USING btree (name);

CREATE UNIQUE INDEX routes_pkey ON public.routes USING btree (id);

CREATE UNIQUE INDEX salary_advances_pkey ON public.salary_advances USING btree (id);

CREATE UNIQUE INDEX savings_accounts_pkey ON public.savings_accounts USING btree (id);

CREATE UNIQUE INDEX staff_salaries_pkey ON public.staff_salaries USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_member_number_key ON public.users USING btree (member_number);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX vehicle_driver_assignments_pkey ON public.vehicle_driver_assignments USING btree (id);

CREATE UNIQUE INDEX vehicles_pkey ON public.vehicles USING btree (id);

CREATE UNIQUE INDEX vehicles_plate_number_key ON public.vehicles USING btree (plate_number);

alter table "public"."capital_payments" add constraint "capital_payments_pkey" PRIMARY KEY using index "capital_payments_pkey";

alter table "public"."contact_messages" add constraint "contact_messages_pkey" PRIMARY KEY using index "contact_messages_pkey";

alter table "public"."exit_requests" add constraint "exit_requests_pkey" PRIMARY KEY using index "exit_requests_pkey";

alter table "public"."expenses" add constraint "expenses_pkey" PRIMARY KEY using index "expenses_pkey";

alter table "public"."insurance_policies" add constraint "insurance_policies_pkey" PRIMARY KEY using index "insurance_policies_pkey";

alter table "public"."loan_guarantors" add constraint "loan_guarantors_pkey" PRIMARY KEY using index "loan_guarantors_pkey";

alter table "public"."loans" add constraint "loans_pkey" PRIMARY KEY using index "loans_pkey";

alter table "public"."payment_allocations" add constraint "payment_allocations_pkey" PRIMARY KEY using index "payment_allocations_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."permissions" add constraint "permissions_pkey" PRIMARY KEY using index "permissions_pkey";

alter table "public"."role_permissions" add constraint "role_permissions_pkey" PRIMARY KEY using index "role_permissions_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."routes" add constraint "routes_pkey" PRIMARY KEY using index "routes_pkey";

alter table "public"."salary_advances" add constraint "salary_advances_pkey" PRIMARY KEY using index "salary_advances_pkey";

alter table "public"."savings_accounts" add constraint "savings_accounts_pkey" PRIMARY KEY using index "savings_accounts_pkey";

alter table "public"."staff_salaries" add constraint "staff_salaries_pkey" PRIMARY KEY using index "staff_salaries_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."vehicle_driver_assignments" add constraint "vehicle_driver_assignments_pkey" PRIMARY KEY using index "vehicle_driver_assignments_pkey";

alter table "public"."vehicles" add constraint "vehicles_pkey" PRIMARY KEY using index "vehicles_pkey";

alter table "public"."capital_payments" add constraint "capital_payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."capital_payments" validate constraint "capital_payments_user_id_fkey";

alter table "public"."exit_requests" add constraint "exit_requests_processed_by_fkey" FOREIGN KEY (processed_by) REFERENCES users(id) not valid;

alter table "public"."exit_requests" validate constraint "exit_requests_processed_by_fkey";

alter table "public"."exit_requests" add constraint "exit_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."exit_requests" validate constraint "exit_requests_user_id_fkey";

alter table "public"."expenses" add constraint "expenses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;

alter table "public"."expenses" validate constraint "expenses_created_by_fkey";

alter table "public"."insurance_policies" add constraint "insurance_policies_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE not valid;

alter table "public"."insurance_policies" validate constraint "insurance_policies_vehicle_id_fkey";

alter table "public"."loan_guarantors" add constraint "loan_guarantors_guarantor_id_fkey" FOREIGN KEY (guarantor_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."loan_guarantors" validate constraint "loan_guarantors_guarantor_id_fkey";

alter table "public"."loan_guarantors" add constraint "loan_guarantors_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE not valid;

alter table "public"."loan_guarantors" validate constraint "loan_guarantors_loan_id_fkey";

alter table "public"."loans" add constraint "loans_applicant_id_fkey" FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."loans" validate constraint "loans_applicant_id_fkey";

alter table "public"."loans" add constraint "loans_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES users(id) not valid;

alter table "public"."loans" validate constraint "loans_approved_by_fkey";

alter table "public"."loans" add constraint "loans_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) not valid;

alter table "public"."loans" validate constraint "loans_vehicle_id_fkey";

alter table "public"."payment_allocations" add constraint "payment_allocations_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE not valid;

alter table "public"."payment_allocations" validate constraint "payment_allocations_payment_id_fkey";

alter table "public"."payments" add constraint "payments_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES users(id) not valid;

alter table "public"."payments" validate constraint "payments_driver_id_fkey";

alter table "public"."payments" add constraint "payments_route_id_fkey" FOREIGN KEY (route_id) REFERENCES routes(id) not valid;

alter table "public"."payments" validate constraint "payments_route_id_fkey";

alter table "public"."payments" add constraint "payments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."payments" validate constraint "payments_user_id_fkey";

alter table "public"."payments" add constraint "payments_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) not valid;

alter table "public"."payments" validate constraint "payments_vehicle_id_fkey";

alter table "public"."permissions" add constraint "permissions_name_key" UNIQUE using index "permissions_name_key";

alter table "public"."role_permissions" add constraint "role_permissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE not valid;

alter table "public"."role_permissions" validate constraint "role_permissions_permission_id_fkey";

alter table "public"."role_permissions" add constraint "role_permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE not valid;

alter table "public"."role_permissions" validate constraint "role_permissions_role_id_fkey";

alter table "public"."roles" add constraint "roles_name_key" UNIQUE using index "roles_name_key";

alter table "public"."routes" add constraint "routes_name_key" UNIQUE using index "routes_name_key";

alter table "public"."salary_advances" add constraint "salary_advances_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES users(id) not valid;

alter table "public"."salary_advances" validate constraint "salary_advances_approved_by_fkey";

alter table "public"."salary_advances" add constraint "salary_advances_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."salary_advances" validate constraint "salary_advances_staff_id_fkey";

alter table "public"."savings_accounts" add constraint "savings_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."savings_accounts" validate constraint "savings_accounts_user_id_fkey";

alter table "public"."savings_accounts" add constraint "savings_accounts_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) not valid;

alter table "public"."savings_accounts" validate constraint "savings_accounts_vehicle_id_fkey";

alter table "public"."staff_salaries" add constraint "staff_salaries_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."staff_salaries" validate constraint "staff_salaries_staff_id_fkey";

alter table "public"."transactions" add constraint "transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES savings_accounts(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_account_id_fkey";

alter table "public"."transactions" add constraint "transactions_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES payments(id) not valid;

alter table "public"."transactions" validate constraint "transactions_payment_id_fkey";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

alter table "public"."transactions" add constraint "transactions_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) not valid;

alter table "public"."transactions" validate constraint "transactions_vehicle_id_fkey";

alter table "public"."users" add constraint "users_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;

alter table "public"."users" validate constraint "users_created_by_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_member_number_key" UNIQUE using index "users_member_number_key";

alter table "public"."users" add constraint "users_modified_by_fkey" FOREIGN KEY (modified_by) REFERENCES users(id) not valid;

alter table "public"."users" validate constraint "users_modified_by_fkey";

alter table "public"."users" add constraint "users_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) not valid;

alter table "public"."users" validate constraint "users_role_id_fkey";

alter table "public"."vehicle_driver_assignments" add constraint "vehicle_driver_assignments_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_driver_assignments" validate constraint "vehicle_driver_assignments_driver_id_fkey";

alter table "public"."vehicle_driver_assignments" add constraint "vehicle_driver_assignments_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE not valid;

alter table "public"."vehicle_driver_assignments" validate constraint "vehicle_driver_assignments_vehicle_id_fkey";

alter table "public"."vehicles" add constraint "vehicles_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES users(id) not valid;

alter table "public"."vehicles" validate constraint "vehicles_driver_id_fkey";

alter table "public"."vehicles" add constraint "vehicles_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES users(id) not valid;

alter table "public"."vehicles" validate constraint "vehicles_owner_id_fkey";

alter table "public"."vehicles" add constraint "vehicles_plate_number_key" UNIQUE using index "vehicles_plate_number_key";

alter table "public"."vehicles" add constraint "vehicles_route_id_fkey" FOREIGN KEY (route_id) REFERENCES routes(id) not valid;

alter table "public"."vehicles" validate constraint "vehicles_route_id_fkey";

grant delete on table "public"."capital_payments" to "anon";

grant insert on table "public"."capital_payments" to "anon";

grant references on table "public"."capital_payments" to "anon";

grant select on table "public"."capital_payments" to "anon";

grant trigger on table "public"."capital_payments" to "anon";

grant truncate on table "public"."capital_payments" to "anon";

grant update on table "public"."capital_payments" to "anon";

grant delete on table "public"."capital_payments" to "authenticated";

grant insert on table "public"."capital_payments" to "authenticated";

grant references on table "public"."capital_payments" to "authenticated";

grant select on table "public"."capital_payments" to "authenticated";

grant trigger on table "public"."capital_payments" to "authenticated";

grant truncate on table "public"."capital_payments" to "authenticated";

grant update on table "public"."capital_payments" to "authenticated";

grant delete on table "public"."capital_payments" to "service_role";

grant insert on table "public"."capital_payments" to "service_role";

grant references on table "public"."capital_payments" to "service_role";

grant select on table "public"."capital_payments" to "service_role";

grant trigger on table "public"."capital_payments" to "service_role";

grant truncate on table "public"."capital_payments" to "service_role";

grant update on table "public"."capital_payments" to "service_role";

grant delete on table "public"."contact_messages" to "anon";

grant insert on table "public"."contact_messages" to "anon";

grant references on table "public"."contact_messages" to "anon";

grant select on table "public"."contact_messages" to "anon";

grant trigger on table "public"."contact_messages" to "anon";

grant truncate on table "public"."contact_messages" to "anon";

grant update on table "public"."contact_messages" to "anon";

grant delete on table "public"."contact_messages" to "authenticated";

grant insert on table "public"."contact_messages" to "authenticated";

grant references on table "public"."contact_messages" to "authenticated";

grant select on table "public"."contact_messages" to "authenticated";

grant trigger on table "public"."contact_messages" to "authenticated";

grant truncate on table "public"."contact_messages" to "authenticated";

grant update on table "public"."contact_messages" to "authenticated";

grant delete on table "public"."contact_messages" to "service_role";

grant insert on table "public"."contact_messages" to "service_role";

grant references on table "public"."contact_messages" to "service_role";

grant select on table "public"."contact_messages" to "service_role";

grant trigger on table "public"."contact_messages" to "service_role";

grant truncate on table "public"."contact_messages" to "service_role";

grant update on table "public"."contact_messages" to "service_role";

grant delete on table "public"."exit_requests" to "anon";

grant insert on table "public"."exit_requests" to "anon";

grant references on table "public"."exit_requests" to "anon";

grant select on table "public"."exit_requests" to "anon";

grant trigger on table "public"."exit_requests" to "anon";

grant truncate on table "public"."exit_requests" to "anon";

grant update on table "public"."exit_requests" to "anon";

grant delete on table "public"."exit_requests" to "authenticated";

grant insert on table "public"."exit_requests" to "authenticated";

grant references on table "public"."exit_requests" to "authenticated";

grant select on table "public"."exit_requests" to "authenticated";

grant trigger on table "public"."exit_requests" to "authenticated";

grant truncate on table "public"."exit_requests" to "authenticated";

grant update on table "public"."exit_requests" to "authenticated";

grant delete on table "public"."exit_requests" to "service_role";

grant insert on table "public"."exit_requests" to "service_role";

grant references on table "public"."exit_requests" to "service_role";

grant select on table "public"."exit_requests" to "service_role";

grant trigger on table "public"."exit_requests" to "service_role";

grant truncate on table "public"."exit_requests" to "service_role";

grant update on table "public"."exit_requests" to "service_role";

grant delete on table "public"."expenses" to "anon";

grant insert on table "public"."expenses" to "anon";

grant references on table "public"."expenses" to "anon";

grant select on table "public"."expenses" to "anon";

grant trigger on table "public"."expenses" to "anon";

grant truncate on table "public"."expenses" to "anon";

grant update on table "public"."expenses" to "anon";

grant delete on table "public"."expenses" to "authenticated";

grant insert on table "public"."expenses" to "authenticated";

grant references on table "public"."expenses" to "authenticated";

grant select on table "public"."expenses" to "authenticated";

grant trigger on table "public"."expenses" to "authenticated";

grant truncate on table "public"."expenses" to "authenticated";

grant update on table "public"."expenses" to "authenticated";

grant delete on table "public"."expenses" to "service_role";

grant insert on table "public"."expenses" to "service_role";

grant references on table "public"."expenses" to "service_role";

grant select on table "public"."expenses" to "service_role";

grant trigger on table "public"."expenses" to "service_role";

grant truncate on table "public"."expenses" to "service_role";

grant update on table "public"."expenses" to "service_role";

grant delete on table "public"."insurance_policies" to "anon";

grant insert on table "public"."insurance_policies" to "anon";

grant references on table "public"."insurance_policies" to "anon";

grant select on table "public"."insurance_policies" to "anon";

grant trigger on table "public"."insurance_policies" to "anon";

grant truncate on table "public"."insurance_policies" to "anon";

grant update on table "public"."insurance_policies" to "anon";

grant delete on table "public"."insurance_policies" to "authenticated";

grant insert on table "public"."insurance_policies" to "authenticated";

grant references on table "public"."insurance_policies" to "authenticated";

grant select on table "public"."insurance_policies" to "authenticated";

grant trigger on table "public"."insurance_policies" to "authenticated";

grant truncate on table "public"."insurance_policies" to "authenticated";

grant update on table "public"."insurance_policies" to "authenticated";

grant delete on table "public"."insurance_policies" to "service_role";

grant insert on table "public"."insurance_policies" to "service_role";

grant references on table "public"."insurance_policies" to "service_role";

grant select on table "public"."insurance_policies" to "service_role";

grant trigger on table "public"."insurance_policies" to "service_role";

grant truncate on table "public"."insurance_policies" to "service_role";

grant update on table "public"."insurance_policies" to "service_role";

grant delete on table "public"."loan_guarantors" to "anon";

grant insert on table "public"."loan_guarantors" to "anon";

grant references on table "public"."loan_guarantors" to "anon";

grant select on table "public"."loan_guarantors" to "anon";

grant trigger on table "public"."loan_guarantors" to "anon";

grant truncate on table "public"."loan_guarantors" to "anon";

grant update on table "public"."loan_guarantors" to "anon";

grant delete on table "public"."loan_guarantors" to "authenticated";

grant insert on table "public"."loan_guarantors" to "authenticated";

grant references on table "public"."loan_guarantors" to "authenticated";

grant select on table "public"."loan_guarantors" to "authenticated";

grant trigger on table "public"."loan_guarantors" to "authenticated";

grant truncate on table "public"."loan_guarantors" to "authenticated";

grant update on table "public"."loan_guarantors" to "authenticated";

grant delete on table "public"."loan_guarantors" to "service_role";

grant insert on table "public"."loan_guarantors" to "service_role";

grant references on table "public"."loan_guarantors" to "service_role";

grant select on table "public"."loan_guarantors" to "service_role";

grant trigger on table "public"."loan_guarantors" to "service_role";

grant truncate on table "public"."loan_guarantors" to "service_role";

grant update on table "public"."loan_guarantors" to "service_role";

grant delete on table "public"."loans" to "anon";

grant insert on table "public"."loans" to "anon";

grant references on table "public"."loans" to "anon";

grant select on table "public"."loans" to "anon";

grant trigger on table "public"."loans" to "anon";

grant truncate on table "public"."loans" to "anon";

grant update on table "public"."loans" to "anon";

grant delete on table "public"."loans" to "authenticated";

grant insert on table "public"."loans" to "authenticated";

grant references on table "public"."loans" to "authenticated";

grant select on table "public"."loans" to "authenticated";

grant trigger on table "public"."loans" to "authenticated";

grant truncate on table "public"."loans" to "authenticated";

grant update on table "public"."loans" to "authenticated";

grant delete on table "public"."loans" to "service_role";

grant insert on table "public"."loans" to "service_role";

grant references on table "public"."loans" to "service_role";

grant select on table "public"."loans" to "service_role";

grant trigger on table "public"."loans" to "service_role";

grant truncate on table "public"."loans" to "service_role";

grant update on table "public"."loans" to "service_role";

grant delete on table "public"."payment_allocations" to "anon";

grant insert on table "public"."payment_allocations" to "anon";

grant references on table "public"."payment_allocations" to "anon";

grant select on table "public"."payment_allocations" to "anon";

grant trigger on table "public"."payment_allocations" to "anon";

grant truncate on table "public"."payment_allocations" to "anon";

grant update on table "public"."payment_allocations" to "anon";

grant delete on table "public"."payment_allocations" to "authenticated";

grant insert on table "public"."payment_allocations" to "authenticated";

grant references on table "public"."payment_allocations" to "authenticated";

grant select on table "public"."payment_allocations" to "authenticated";

grant trigger on table "public"."payment_allocations" to "authenticated";

grant truncate on table "public"."payment_allocations" to "authenticated";

grant update on table "public"."payment_allocations" to "authenticated";

grant delete on table "public"."payment_allocations" to "service_role";

grant insert on table "public"."payment_allocations" to "service_role";

grant references on table "public"."payment_allocations" to "service_role";

grant select on table "public"."payment_allocations" to "service_role";

grant trigger on table "public"."payment_allocations" to "service_role";

grant truncate on table "public"."payment_allocations" to "service_role";

grant update on table "public"."payment_allocations" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."permissions" to "anon";

grant insert on table "public"."permissions" to "anon";

grant references on table "public"."permissions" to "anon";

grant select on table "public"."permissions" to "anon";

grant trigger on table "public"."permissions" to "anon";

grant truncate on table "public"."permissions" to "anon";

grant update on table "public"."permissions" to "anon";

grant delete on table "public"."permissions" to "authenticated";

grant insert on table "public"."permissions" to "authenticated";

grant references on table "public"."permissions" to "authenticated";

grant select on table "public"."permissions" to "authenticated";

grant trigger on table "public"."permissions" to "authenticated";

grant truncate on table "public"."permissions" to "authenticated";

grant update on table "public"."permissions" to "authenticated";

grant delete on table "public"."permissions" to "service_role";

grant insert on table "public"."permissions" to "service_role";

grant references on table "public"."permissions" to "service_role";

grant select on table "public"."permissions" to "service_role";

grant trigger on table "public"."permissions" to "service_role";

grant truncate on table "public"."permissions" to "service_role";

grant update on table "public"."permissions" to "service_role";

grant delete on table "public"."role_permissions" to "anon";

grant insert on table "public"."role_permissions" to "anon";

grant references on table "public"."role_permissions" to "anon";

grant select on table "public"."role_permissions" to "anon";

grant trigger on table "public"."role_permissions" to "anon";

grant truncate on table "public"."role_permissions" to "anon";

grant update on table "public"."role_permissions" to "anon";

grant delete on table "public"."role_permissions" to "authenticated";

grant insert on table "public"."role_permissions" to "authenticated";

grant references on table "public"."role_permissions" to "authenticated";

grant select on table "public"."role_permissions" to "authenticated";

grant trigger on table "public"."role_permissions" to "authenticated";

grant truncate on table "public"."role_permissions" to "authenticated";

grant update on table "public"."role_permissions" to "authenticated";

grant delete on table "public"."role_permissions" to "service_role";

grant insert on table "public"."role_permissions" to "service_role";

grant references on table "public"."role_permissions" to "service_role";

grant select on table "public"."role_permissions" to "service_role";

grant trigger on table "public"."role_permissions" to "service_role";

grant truncate on table "public"."role_permissions" to "service_role";

grant update on table "public"."role_permissions" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."routes" to "anon";

grant insert on table "public"."routes" to "anon";

grant references on table "public"."routes" to "anon";

grant select on table "public"."routes" to "anon";

grant trigger on table "public"."routes" to "anon";

grant truncate on table "public"."routes" to "anon";

grant update on table "public"."routes" to "anon";

grant delete on table "public"."routes" to "authenticated";

grant insert on table "public"."routes" to "authenticated";

grant references on table "public"."routes" to "authenticated";

grant select on table "public"."routes" to "authenticated";

grant trigger on table "public"."routes" to "authenticated";

grant truncate on table "public"."routes" to "authenticated";

grant update on table "public"."routes" to "authenticated";

grant delete on table "public"."routes" to "service_role";

grant insert on table "public"."routes" to "service_role";

grant references on table "public"."routes" to "service_role";

grant select on table "public"."routes" to "service_role";

grant trigger on table "public"."routes" to "service_role";

grant truncate on table "public"."routes" to "service_role";

grant update on table "public"."routes" to "service_role";

grant delete on table "public"."salary_advances" to "anon";

grant insert on table "public"."salary_advances" to "anon";

grant references on table "public"."salary_advances" to "anon";

grant select on table "public"."salary_advances" to "anon";

grant trigger on table "public"."salary_advances" to "anon";

grant truncate on table "public"."salary_advances" to "anon";

grant update on table "public"."salary_advances" to "anon";

grant delete on table "public"."salary_advances" to "authenticated";

grant insert on table "public"."salary_advances" to "authenticated";

grant references on table "public"."salary_advances" to "authenticated";

grant select on table "public"."salary_advances" to "authenticated";

grant trigger on table "public"."salary_advances" to "authenticated";

grant truncate on table "public"."salary_advances" to "authenticated";

grant update on table "public"."salary_advances" to "authenticated";

grant delete on table "public"."salary_advances" to "service_role";

grant insert on table "public"."salary_advances" to "service_role";

grant references on table "public"."salary_advances" to "service_role";

grant select on table "public"."salary_advances" to "service_role";

grant trigger on table "public"."salary_advances" to "service_role";

grant truncate on table "public"."salary_advances" to "service_role";

grant update on table "public"."salary_advances" to "service_role";

grant delete on table "public"."savings_accounts" to "anon";

grant insert on table "public"."savings_accounts" to "anon";

grant references on table "public"."savings_accounts" to "anon";

grant select on table "public"."savings_accounts" to "anon";

grant trigger on table "public"."savings_accounts" to "anon";

grant truncate on table "public"."savings_accounts" to "anon";

grant update on table "public"."savings_accounts" to "anon";

grant delete on table "public"."savings_accounts" to "authenticated";

grant insert on table "public"."savings_accounts" to "authenticated";

grant references on table "public"."savings_accounts" to "authenticated";

grant select on table "public"."savings_accounts" to "authenticated";

grant trigger on table "public"."savings_accounts" to "authenticated";

grant truncate on table "public"."savings_accounts" to "authenticated";

grant update on table "public"."savings_accounts" to "authenticated";

grant delete on table "public"."savings_accounts" to "service_role";

grant insert on table "public"."savings_accounts" to "service_role";

grant references on table "public"."savings_accounts" to "service_role";

grant select on table "public"."savings_accounts" to "service_role";

grant trigger on table "public"."savings_accounts" to "service_role";

grant truncate on table "public"."savings_accounts" to "service_role";

grant update on table "public"."savings_accounts" to "service_role";

grant delete on table "public"."staff_salaries" to "anon";

grant insert on table "public"."staff_salaries" to "anon";

grant references on table "public"."staff_salaries" to "anon";

grant select on table "public"."staff_salaries" to "anon";

grant trigger on table "public"."staff_salaries" to "anon";

grant truncate on table "public"."staff_salaries" to "anon";

grant update on table "public"."staff_salaries" to "anon";

grant delete on table "public"."staff_salaries" to "authenticated";

grant insert on table "public"."staff_salaries" to "authenticated";

grant references on table "public"."staff_salaries" to "authenticated";

grant select on table "public"."staff_salaries" to "authenticated";

grant trigger on table "public"."staff_salaries" to "authenticated";

grant truncate on table "public"."staff_salaries" to "authenticated";

grant update on table "public"."staff_salaries" to "authenticated";

grant delete on table "public"."staff_salaries" to "service_role";

grant insert on table "public"."staff_salaries" to "service_role";

grant references on table "public"."staff_salaries" to "service_role";

grant select on table "public"."staff_salaries" to "service_role";

grant trigger on table "public"."staff_salaries" to "service_role";

grant truncate on table "public"."staff_salaries" to "service_role";

grant update on table "public"."staff_salaries" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."vehicle_driver_assignments" to "anon";

grant insert on table "public"."vehicle_driver_assignments" to "anon";

grant references on table "public"."vehicle_driver_assignments" to "anon";

grant select on table "public"."vehicle_driver_assignments" to "anon";

grant trigger on table "public"."vehicle_driver_assignments" to "anon";

grant truncate on table "public"."vehicle_driver_assignments" to "anon";

grant update on table "public"."vehicle_driver_assignments" to "anon";

grant delete on table "public"."vehicle_driver_assignments" to "authenticated";

grant insert on table "public"."vehicle_driver_assignments" to "authenticated";

grant references on table "public"."vehicle_driver_assignments" to "authenticated";

grant select on table "public"."vehicle_driver_assignments" to "authenticated";

grant trigger on table "public"."vehicle_driver_assignments" to "authenticated";

grant truncate on table "public"."vehicle_driver_assignments" to "authenticated";

grant update on table "public"."vehicle_driver_assignments" to "authenticated";

grant delete on table "public"."vehicle_driver_assignments" to "service_role";

grant insert on table "public"."vehicle_driver_assignments" to "service_role";

grant references on table "public"."vehicle_driver_assignments" to "service_role";

grant select on table "public"."vehicle_driver_assignments" to "service_role";

grant trigger on table "public"."vehicle_driver_assignments" to "service_role";

grant truncate on table "public"."vehicle_driver_assignments" to "service_role";

grant update on table "public"."vehicle_driver_assignments" to "service_role";

grant delete on table "public"."vehicles" to "anon";

grant insert on table "public"."vehicles" to "anon";

grant references on table "public"."vehicles" to "anon";

grant select on table "public"."vehicles" to "anon";

grant trigger on table "public"."vehicles" to "anon";

grant truncate on table "public"."vehicles" to "anon";

grant update on table "public"."vehicles" to "anon";

grant delete on table "public"."vehicles" to "authenticated";

grant insert on table "public"."vehicles" to "authenticated";

grant references on table "public"."vehicles" to "authenticated";

grant select on table "public"."vehicles" to "authenticated";

grant trigger on table "public"."vehicles" to "authenticated";

grant truncate on table "public"."vehicles" to "authenticated";

grant update on table "public"."vehicles" to "authenticated";

grant delete on table "public"."vehicles" to "service_role";

grant insert on table "public"."vehicles" to "service_role";

grant references on table "public"."vehicles" to "service_role";

grant select on table "public"."vehicles" to "service_role";

grant trigger on table "public"."vehicles" to "service_role";

grant truncate on table "public"."vehicles" to "service_role";

grant update on table "public"."vehicles" to "service_role";


