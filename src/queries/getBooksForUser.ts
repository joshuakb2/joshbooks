import { query } from "@solidjs/router";
import * as db from "~/server/db";
import { getSessionData } from "./getSessionData";

export const getBooksForUser = query(async () => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await db.getBooksForUser(session.user.id);
}, 'books-for-user');
