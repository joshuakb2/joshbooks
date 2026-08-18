import { query } from "@solidjs/router";
import { getSessionData } from "./getSessionData";
import { getBookData } from "./getBookData";
import { openBookFile } from "~/server/files";
import { getIdentity } from "~/server/google";

export const getBook = query(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user) return null;

  const { tokens } = session.user;
  if (!tokens) return null;

  const bookData = await getBookData(id);
  if (!bookData) return null;

  const identity = await getIdentity(tokens);
  if (!identity) return null;

  const book = await openBookFile({ id, identity });
  return book;
}, 'get-book');
