import { useStorage } from 'nitro/storage';
import postgres from 'postgres';
import { serverEnv } from '~/env/server';
import { coalesceResult, Err, getAsyncErrorCatcher, Ok } from '~/util';

const sql = postgres({
  host: serverEnv.PG_HOSTNAME,
  user: serverEnv.PG_USERNAME,
  pass: serverEnv.PG_PASSWORD,
  db: serverEnv.PG_DATABASE,
  debug: true,
});

const catchErrors = getAsyncErrorCatcher('DB error');

export const init = coalesceResult(catchErrors(async () => {
  console.log('Initializing database');

  const initScript = await useStorage('assets:server').get('db_init.sql') as string;

  // Transaction necessary for the postgres library to allow the init script to use BEGIN...COMMIT
  await sql.begin(async sql => {
    await sql.unsafe(initScript).simple();
  });
  console.log('Database initialized');

  return Ok();
}));

export type BookData = {
  id: number;
  name: string;
  owner: string;
  access: BookAccess;
};

/**
 * Matches book_access enum in SQL
 */
export type BookAccess = 'read' | 'write' | 'owner';

export const BOOK_ACCESS_LEVELS = {
  read: 0,
  write: 1,
  owner: 2,
} satisfies {
  [K in BookAccess]: number;
};

export const getBooksForUser = coalesceResult(catchErrors(async (id: string) => {
  return Ok(await sql<BookData[]>`
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
      (g."user" = ${id} AND g.access >= 'read')
  `);
}));

type createBookArgs = {
  name: string;
  owner: string;
};

export const createBook = coalesceResult(catchErrors(async ({ name, owner }: createBookArgs) => {
  const [{ recipient } = {}] = await sql<{ recipient: string | null }[]>`
    SELECT
      recipient
    FROM
      "user"
    WHERE
      id = ${owner}
  `;

  if (!recipient) return Err('no-recipient');

  const [{ id }] = await sql<{ id: number }[]>`
    INSERT INTO
      book (name, owner)
    VALUES
      (${name}, ${owner})
    RETURNING
      id
  `;

  return Ok({ id, recipient });
}));

type deleteBookArgs = {
  book_id: number;
  user_id: string;
};

export const deleteBook = coalesceResult(catchErrors(async ({ book_id, user_id }: deleteBookArgs) => {
  await sql`
    DELETE FROM
      book AS b
    WHERE
      b.id = ${book_id}
    AND
      b.owner = ${user_id}
  `;

  return Ok();
}));

type getBookDataArgs = {
  book_id: number;
  user_id: string;
};

export const getBookData = coalesceResult(catchErrors(async ({ book_id, user_id }: getBookDataArgs) => {
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

  if (bookDataRows.length < 1) return Err('no-such-book');

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

    if (accessRows.length < 1) return Err('access-denied');

    bookData.access = accessRows[0].access;
  }

  return Ok(bookData);
}));

type createUserArgs = {
  user_id: string;
  name: string;
};

export const createUser = coalesceResult(catchErrors(async ({ user_id, name }: createUserArgs) => {
  await sql`
    INSERT INTO
      "user" (id, name)
    VALUES
      (${user_id}, ${name})
    ON CONFLICT (id)
    DO UPDATE
    SET
      name = EXCLUDED.name
  `;

  return Ok();
}));

type getUserRecipientArgs = {
  user_id: string;
};

export const getUserRecipient = coalesceResult(catchErrors(async ({ user_id }: getUserRecipientArgs) => {
  const [{ recipient } = { recipient: null }] = await sql<{ recipient: string | null }[]>`
    SELECT
      recipient
    FROM
      "user"
    WHERE
      id = ${user_id}
  `;

  return Ok(recipient);
}));

type setUserRecipientArgs = {
  user_id: string;
  recipient: string | null;
};

export const setUserRecipient = coalesceResult(catchErrors(async ({ user_id, recipient }: setUserRecipientArgs) => {
  await sql`
    UPDATE
      "user"
    SET
      recipient = ${recipient}
    WHERE
      id = ${user_id}
  `;

  return Ok();
}));
