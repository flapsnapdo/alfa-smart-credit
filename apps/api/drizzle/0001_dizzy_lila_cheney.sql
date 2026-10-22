CREATE TYPE "public"."actor_type" AS ENUM('CLIENT', 'ANALYST', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('DRAFT', 'SUBMITTED', 'VALIDATION', 'INFO_REQUESTED', 'ENRICHMENT', 'SCORING', 'MANUAL_REVIEW', 'APPROVED', 'COUNTER_OFFER', 'SIGNING', 'ISSUED', 'REJECTED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."purpose" AS ENUM('CASH_GAP', 'WORKING_CAPITAL', 'EQUIPMENT', 'OTHER');--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" serial NOT NULL,
	"company_id" uuid NOT NULL,
	"applicant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"purpose" "purpose" NOT NULL,
	"requested_amount" bigint NOT NULL,
	"requested_term" integer NOT NULL,
	"status" "application_status" DEFAULT 'DRAFT' NOT NULL,
	"bki_consent_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "status_history_app_idx" ON "application_status_history" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");