CREATE TABLE IF NOT EXISTS "permission_categories" (
	"name" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"name" text NOT NULL,
	"category_name" text NOT NULL,
	"role_name" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "permissions_tenant_id_role_name_name_pk" PRIMARY KEY("tenant_id","role_name","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"name" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "roles_tenant_id_name_pk" PRIMARY KEY("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"role_name" text NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissions" ADD CONSTRAINT "permissions_category_name_permission_categories_name_fk" FOREIGN KEY ("category_name") REFERENCES "public"."permission_categories"("name") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id";