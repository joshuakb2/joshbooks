import { query, redirect } from "@solidjs/router";
import * as db from "~/server/db";
import { getSessionData } from "./getSessionData";

export const getBookData = query(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) throw redirect('/api/auth/signin');

  return await db.getBookData({
    book_id: id,
    user_id: session.user.id,
  });
}, 'get-book-data');
