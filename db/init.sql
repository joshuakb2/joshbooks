BEGIN TRANSACTION;

CREATE TYPE book_access AS ENUM ('read', 'write', 'owner');
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'income', 'expense');
CREATE TYPE entry_type AS ENUM ('debit', 'credit');

CREATE TABLE "book" (
  "id" SERIAL PRIMARY KEY,
  "name" text NOT NULL,
  "owner" text NOT NULL
);

CREATE TABLE "book_grants_user" (
  "book" integer NOT NULL REFERENCES "book" ON DELETE CASCADE,
  "user" text NOT NULL,
  "access" book_access NOT NULL,
  PRIMARY KEY ("book", "user")
);

CREATE TABLE "commodity" (
  "id" SERIAL PRIMARY KEY,
  "name" text NOT NULL,
  "format" text NOT NULL,
  "precision" integer NOT NULL
);

INSERT INTO "commodity" VALUES
  (1, 'USD', '$0.00', 2)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "format" = EXCLUDED."format",
  "precision" = EXCLUDED."precision";

CREATE TABLE "account" (
  "id" SERIAL PRIMARY KEY,
  "book" integer NOT NULL REFERENCES "book" ON DELETE CASCADE,
  "name" text NOT NULL CHECK("name" <> ''),
  "type" account_type NOT NULL,
  "number" integer,
  "parent" integer REFERENCES "account" ON DELETE CASCADE,
  "commodity" integer NOT NULL REFERENCES "commodity" ON DELETE RESTRICT
);

CREATE TABLE "transaction" (
  "id" SERIAL PRIMARY KEY,
  "book" integer NOT NULL REFERENCES "book"
);

CREATE TABLE "entry" (
  "id" SERIAL PRIMARY KEY,
  "type" entry_type NOT NULL,
  "transaction" integer NOT NULL REFERENCES "transaction" ON DELETE CASCADE,
  "account" integer NOT NULL REFERENCES "account" ON DELETE RESTRICT,
  "amount" numeric(100, 10) NOT NULL,
  "memo" text
);

COMMIT;
