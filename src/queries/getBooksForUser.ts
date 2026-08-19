import { query, redirect } from "@solidjs/router";
import * as db from "~/server/db";
import { getSessionData } from "./getSessionData";

export const getBooksForUser = query(async () => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) throw redirect('/api/auth/signin');

  return await db.getBooksForUser(session.user.id);
}, 'books-for-user');
