CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"number" text NOT NULL,
	"offer" jsonb NOT NULL,
	"sign_request_id" text,
	"demo_sign_code" text,
	"signed_at" timestamp with time zone,
	"payout_id" text,
	"issued_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_application_id_unique" UNIQUE("application_id"),
	CONSTRAINT "contracts_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;