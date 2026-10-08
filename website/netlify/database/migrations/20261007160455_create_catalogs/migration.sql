CREATE TABLE "catalogs" (
	"id" text PRIMARY KEY,
	"catalog" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
