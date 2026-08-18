import { query } from "@solidjs/router";
import * as db from "~/server/db";
import { getSessionData } from "./getSessionData";

export const getBookData = query(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await db.getBookData({
    book_id: id,
    user_id: session.user.id,
  });
}, 'get-book-data');
