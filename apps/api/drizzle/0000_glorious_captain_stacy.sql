CREATE TYPE "public"."company_status" AS ENUM('ACTIVE', 'LIQUIDATING', 'LIQUIDATED', 'BANKRUPT');--> statement-breakpoint
CREATE TYPE "public"."company_type" AS ENUM('LLC', 'IE');--> statement-breakpoint
CREATE TYPE "public"."member_position" AS ENUM('OWNER', 'CEO', 'CFO', 'ACCOUNTANT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."product_code" AS ENUM('OVERDRAFT', 'WORKING_CAPITAL', 'EQUIPMENT');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('CLIENT', 'ANALYST');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inn" text NOT NULL,
	"ogrn" text,
	"type" "company_type" NOT NULL,
	"name" text NOT NULL,
	"status" "company_status" DEFAULT 'ACTIVE' NOT NULL,
	"registered_at" date,
	"okved" text,
	"okved_name" text,
	"address" text,
	"director_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_inn_unique" UNIQUE("inn")
);
--> statement-breakpoint
CREATE TABLE "company_financials" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"avg_monthly_revenue" bigint NOT NULL,
	"revenue_last_6m" bigint NOT NULL,
	"revenue_prev_6m" bigint NOT NULL,
	"existing_monthly_payments" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_members" (
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"position" "member_position" DEFAULT 'OWNER' NOT NULL,
	CONSTRAINT "company_members_user_id_company_id_pk" PRIMARY KEY("user_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "product_code" NOT NULL,
	"name" text NOT NULL,
	"min_amount" bigint NOT NULL,
	"max_amount" bigint NOT NULL,
	"min_term" integer NOT NULL,
	"max_term" integer NOT NULL,
	"base_rate" double precision NOT NULL,
	"revenue_multiplier" double precision NOT NULL,
	"min_business_age_months" integer NOT NULL,
	"auto_decision_limit" bigint NOT NULL,
	"annuity" boolean NOT NULL,
	"required_docs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "company_financials" ADD CONSTRAINT "company_financials_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;