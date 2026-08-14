'use server';

import postgres from 'postgres';
import { serverEnv } from '~/env/server';
import type { BookData, AccountType, BookAccess } from '~/types/domain';
import { BOOK_ACCESS_LEVELS, NORMAL_BALANCE } from '~/types/domain';
import * as decimal from '~/types/decimal';
import type { Decimal } from '~/types/decimal';

const NUMERIC_OID = 1700;

const decimalRegex = /^(?<left>\d*)(?:\.(?<right>\d*))?$/;

const sql = postgres({
  host: serverEnv.PG_HOSTNAME,
  user: serverEnv.PG_USERNAME,
  pass: serverEnv.PG_PASSWORD,
  db: serverEnv.PG_DATABASE,
  debug: true,
  types: {
    decimal: {
      to: NUMERIC_OID,
      from: [NUMERIC_OID],
      serialize: decimal.format,
      parse: (str: string) => {
        const match = decimalRegex.exec(str);
        if (!match) throw new Error('Failed to parse decimal value');
        const { left = '', right = '' } = match.groups!;

        const e = -right.length;
        const n = (+left) * (10 ** (-e)) + (+right);

        return { n, e };
      },
    },
  },
});

export const getBooksForUser = async (id: string) => {
  return await sql<BookData[]>`
    SELECT
      b.id,
      b.name,
      b.owner,
      COALESCE(g.access, 'owner') AS access
    FROM
      book AS b
    LEFT JOIN
      book_grants_user AS g
    ON
      b.id = g.book
    WHERE
      b.owner = ${id}
    OR
      (g.user = ${id} AND g.access >= 'read')
  `;
};

type createNewBookArgs = {
  name: string;
  owner: string;
};

export const createNewBook = async ({ name, owner }: createNewBookArgs) => {
  return await sql.begin(async sql => {
    const [{ id }] = await sql<{ id: number }[]>`
      INSERT INTO
        book (name, owner)
      VALUES
        (${name}, ${owner})
      RETURNING
        id
    `;

    const [_assets, _liabilities, equity, _income, _expense] = await sql<{ id: number }[]>`
      INSERT INTO
        account (book, name, type, number, commodity)
      VALUES
        (${id}, 'Assets', 'asset', 1000, 1),
        (${id}, 'Liabilities', 'liability', 2000, 1),
        (${id}, 'Equity', 'equity', 3000, 1),
        (${id}, 'Income', 'income', 4000, 1),
        (${id}, 'Expense', 'expense', 5000, 1)
      RETURNING
        id
    `;

    await sql`
      INSERT INTO
        account (book, name, type, number, parent, commodity)
      VALUES
        (${id}, 'Opening Balances (USD)', 'equity', 3100, ${equity.id}, 1)
    `;

    return id;
  });
};

type deleteBookArgs = {
  book_id: number;
  user_id: string;
};

export const deleteBook = async ({ book_id, user_id }: deleteBookArgs) => {
  await sql`
    DELETE FROM
      book AS b
    WHERE
      b.id = ${book_id}
    AND
      b.owner = ${user_id}
  `;
};

type getBookDataArgs = {
  book_id: number;
  user_id: string;
};

export const getBookData = async ({ book_id, user_id }: getBookDataArgs) => {
  const bookDataRows = await sql<BookData[]>`
    SELECT
      id,
      name,
      owner,
      'owner' AS access
    FROM
      book
    WHERE
      id = ${book_id}
  `;

  if (bookDataRows.length < 1) throw new Error('No such book');

  const bookData = bookDataRows[0];

  if (bookData.owner !== user_id) {
    const accessRows = await sql<{ access: BookAccess }[]>`
      SELECT
        access
      FROM
        book_grants_user
      WHERE
        book = ${book_id}
      AND
        "user" = ${user_id}
    `;

    if (accessRows.length < 1) throw new Error('Access denied');

    bookData.access = accessRows[0].access;
  }

  return bookData;
};

type createNewAccountArgs = {
  user_id: string;
  book_id: number;
  name: string;
  type: AccountType;
  parent: number | null;
  commodity: number;
};

export const createNewAccount = async ({ user_id, book_id, name, type, parent, commodity }: createNewAccountArgs) => {
  const bookData = await getBookData({ book_id, user_id });

  if (BOOK_ACCESS_LEVELS[bookData.access] < BOOK_ACCESS_LEVELS.write) {
    throw new Error('Permission denied');
  }

  const result = await sql<{ id: number }[]>`
    INSERT INTO
      account (book, name, type, parent, commodity)
    VALUES
      (${book_id}, ${name}, ${type}, ${parent}, ${commodity})
    RETURNING
      id
  `;

  return result[0].id;
};

/**
 * Matches account table schema in sql
 */
export type AccountRow = {
  id: number;
  book: number;
  name: string;
  type: AccountType;
  number: number | null;
  parent: number | null;
  commodity: number;
  balance: Decimal;
};

type getAccountsArgs = {
  user_id: string;
  book_id: number;
};

export const getAccounts = async ({ user_id, book_id }: getAccountsArgs) => {
  await getBookData({ user_id, book_id });
  // If this succeeds, we have read access to this book

  const rows = await sql<(Omit<AccountRow, 'balance'> & { debit: Decimal })[]>`
    SELECT
      a.*,
      COALESCE((SUM(d.amount) - SUM(c.amount)), 0) AS debit
    FROM
      account AS a
    LEFT JOIN
      debit AS d
    ON
      d.account = a.id
    LEFT JOIN
      credit AS c
    ON
      c.account = a.id
    WHERE
      book = ${book_id}
    GROUP BY
      a.id
  `;

  return rows.map<AccountRow>(row => ({
    ...row,
    balance: NORMAL_BALANCE[row.type] === 'debit' ? row.debit : decimal.negate(row.debit),
  }));
};

/**
 * Matches commodity table schema in sql
 */
export type Commodity = {
  id: number;
  name: string;
  format: string;
  precision: number;
};

export const getCommodities = async () => {
  return await sql<Commodity[]>`
    SELECT
      *
    FROM
      commodity
  `;
};
