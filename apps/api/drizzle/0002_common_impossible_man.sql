CREATE TYPE "public"."check_source" AS ENUM('REGISTRY', 'TAX', 'BKI');--> statement-breakpoint
CREATE TYPE "public"."decision_type" AS ENUM('APPROVE', 'COUNTER_OFFER', 'MANUAL_REVIEW', 'REJECT');--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"type" "decision_type" NOT NULL,
	"rate" double precision,
	"max_available_amount" bigint NOT NULL,
	"offer" jsonb,
	"alternatives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"source" "check_source" NOT NULL,
	"ok" boolean NOT NULL,
	"http_status" integer,
	"duration_ms" integer NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"grade" text NOT NULL,
	"factors" jsonb NOT NULL,
	"stop_factors" jsonb NOT NULL,
	"input" jsonb NOT NULL,
	"rules_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_checks" ADD CONSTRAINT "external_checks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_results" ADD CONSTRAINT "scoring_results_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "decisions_app_idx" ON "decisions" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "external_checks_app_idx" ON "external_checks" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "scoring_results_app_idx" ON "scoring_results" USING btree ("application_id");