-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.capital_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  phone_number character varying,
  mpesa_reference character varying,
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::payment_status,
  CONSTRAINT capital_payments_pkey PRIMARY KEY (id),
  CONSTRAINT capital_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying,
  email character varying,
  phone character varying,
  subject character varying,
  message text,
  type USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exit_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email character varying NOT NULL,
  reason text,
  additional_comments text,
  net_amount numeric,
  request_date timestamp with time zone NOT NULL DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::exit_request_status,
  processed_by uuid,
  processed_at timestamp with time zone,
  CONSTRAINT exit_requests_pkey PRIMARY KEY (id),
  CONSTRAINT exit_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT exit_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category character varying,
  description text,
  amount numeric NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::expense_status,
  vendor character varying,
  created_by uuid,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.insurance_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  provider character varying,
  policy_type character varying,
  premium_amount numeric,
  start_date date,
  expiry_date date,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::insurance_status,
  CONSTRAINT insurance_policies_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_policies_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);
CREATE TABLE public.loan_guarantors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL,
  guarantor_id uuid NOT NULL,
  CONSTRAINT loan_guarantors_pkey PRIMARY KEY (id),
  CONSTRAINT loan_guarantors_guarantor_id_fkey FOREIGN KEY (guarantor_id) REFERENCES public.users(id),
  CONSTRAINT loan_guarantors_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id)
);
CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL,
  vehicle_id uuid,
  type USER-DEFINED NOT NULL,
  amount numeric NOT NULL,
  purpose text,
  savings_at_application numeric,
  application_date timestamp with time zone NOT NULL DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::loan_status,
  credit_score integer,
  monthly_income numeric,
  existing_loans numeric,
  urgency character varying,
  expected_repayment_date date,
  approved_by uuid,
  approved_at timestamp with time zone,
  CONSTRAINT loans_pkey PRIMARY KEY (id),
  CONSTRAINT loans_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
  CONSTRAINT loans_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id),
  CONSTRAINT loans_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.payment_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  category USER-DEFINED NOT NULL,
  amount numeric NOT NULL,
  CONSTRAINT payment_allocations_pkey PRIMARY KEY (id),
  CONSTRAINT payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  vehicle_id uuid,
  driver_id uuid,
  route_id uuid,
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  total_amount numeric NOT NULL,
  mpesa_reference character varying,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::payment_status,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT payments_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id),
  CONSTRAINT payments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
  CONSTRAINT payments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  category character varying,
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.routes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  start_point character varying NOT NULL,
  end_point character varying NOT NULL,
  distance_km numeric,
  estimated_time interval,
  vehicles_assigned integer DEFAULT 0,
  fare numeric,
  status USER-DEFINED NOT NULL DEFAULT 'ACTIVE'::route_status,
  date_created timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT routes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.salary_advances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason text,
  application_date timestamp with time zone NOT NULL DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::salary_advance_status,
  approved_by uuid,
  approved_at timestamp with time zone,
  CONSTRAINT salary_advances_pkey PRIMARY KEY (id),
  CONSTRAINT salary_advances_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id),
  CONSTRAINT salary_advances_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.savings_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_id uuid,
  account_type character varying,
  balance numeric DEFAULT 0,
  monthly_target numeric,
  last_deposit timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT savings_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT savings_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT savings_accounts_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);
CREATE TABLE public.staff_salaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  basic_salary numeric NOT NULL,
  allowances numeric DEFAULT 0,
  nhif numeric DEFAULT 0,
  nssf numeric DEFAULT 0,
  paye numeric DEFAULT 0,
  net_salary numeric NOT NULL,
  bank_name character varying,
  account_number character varying,
  pay_date date,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::salary_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT staff_salaries_pkey PRIMARY KEY (id),
  CONSTRAINT staff_salaries_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  vehicle_id uuid,
  user_id uuid,
  payment_id uuid,
  date timestamp with time zone NOT NULL DEFAULT now(),
  type USER-DEFINED NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric,
  description text,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id),
  CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.savings_accounts(id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_number bigint NOT NULL DEFAULT nextval('users_member_number_seq'::regclass) UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  phone character varying,
  password_hash text NOT NULL,
  role_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::user_status,
  membership_type character varying,
  profile_category character varying,
  id_number character varying,
  date_of_birth date,
  county character varying,
  town character varying,
  address text,
  business_name character varying,
  business_type character varying,
  share_capital numeric DEFAULT 0,
  savings_balance numeric DEFAULT 0,
  loan_balance numeric DEFAULT 0,
  total_deposits numeric DEFAULT 0,
  next_of_kin character varying,
  next_of_kin_phone character varying,
  occupation character varying,
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  last_login timestamp with time zone,
  has_completed_capital_payment boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  created_by uuid,
  modified_by uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.users(id),
  CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.vehicle_driver_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  driver_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  released_at timestamp with time zone,
  CONSTRAINT vehicle_driver_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_driver_assignments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id),
  CONSTRAINT vehicle_driver_assignments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
);
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  plate_number character varying NOT NULL UNIQUE,
  model character varying,
  vehicle_type character varying,
  capacity integer,
  chassis_number character varying,
  engine_number character varying,
  year_of_manufacture smallint,
  route_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'ACTIVE'::vehicle_status,
  driver_id uuid,
  insurance_status USER-DEFINED DEFAULT 'PENDING'::insurance_status,
  insurance_provider character varying,
  policy_type character varying,
  premium numeric,
  insurance_expiry date,
  registration_status USER-DEFINED DEFAULT 'PENDING'::registration_status,
  registration_expiry date,
  date_added timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT vehicles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT vehicles_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id),
  CONSTRAINT vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id)
);