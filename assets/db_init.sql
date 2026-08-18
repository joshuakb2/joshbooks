DO $$
BEGIN
  CREATE TYPE book_access AS ENUM ('read', 'write', 'owner');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "recipient" text
);

CREATE TABLE IF NOT EXISTS "book" (
  "id" SERIAL PRIMARY KEY,
  "name" text NOT NULL,
  "owner" text NOT NULL REFERENCES "user" ON DELETE CASCADE,
  UNIQUE ("name", "owner")
);

CREATE TABLE IF NOT EXISTS "book_grants_user" (
  "book" integer NOT NULL REFERENCES "book" ON DELETE CASCADE,
  "user" text NOT NULL REFERENCES "user" ON DELETE CASCADE,
  "access" book_access NOT NULL,
  PRIMARY KEY ("book", "user")
);
