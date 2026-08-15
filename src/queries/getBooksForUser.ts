import { query } from "@solidjs/router";
import { getBooksForUser } from "~/server/db";
import { getSessionData } from "./getSessionData";

const getBooksForUserQuery = query(async () => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await getBooksForUser(session.user.id);
}, 'books-for-user');

export { getBooksForUserQuery as getBooksForUser };
