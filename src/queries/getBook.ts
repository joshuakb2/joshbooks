import { query, redirect } from "@solidjs/router";
import { getSessionData } from "./getSessionData";
import { getBookData } from "./getBookData";
import { openBookFile } from "~/server/files";
import { getIdentity } from "~/server/google";
import { Err, Ok } from "~/util";

export const getBook = query(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user) throw redirect('/api/auth/signin');

  const { tokens } = session.user;
  if (!tokens) return Err('no-tokens');

  const bookData = await getBookData(id);
  if (!bookData.ok) return bookData;

  const identity = await getIdentity(tokens);
  if (!identity.ok) return identity;
  if (!identity.value) return Err('no-identity');

  const book = await openBookFile({ id, identity: identity.value });
  if (!book.ok) return book;

  return Ok(book.value);
}, 'get-book');
