CREATE TYPE "public"."period_t" AS ENUM('AM', 'PM');--> statement-breakpoint
CREATE TYPE "public"."status_t" AS ENUM('BUSY', 'FREE', 'UNSURE');--> statement-breakpoint
CREATE TABLE "availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" serial NOT NULL,
	"date" date NOT NULL,
	"period" "period_t" NOT NULL,
	"status" "status_t" NOT NULL,
	"note" varchar(80),
	"updated_by" varchar(40) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(40) NOT NULL,
	"color" varchar(7) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "availability_member_date_period_uniq" ON "availability" USING btree ("member_id","date","period");--> statement-breakpoint
CREATE INDEX "availability_date_idx" ON "availability" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "members_name_uniq" ON "members" USING btree ("name");