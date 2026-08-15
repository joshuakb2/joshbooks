import { query } from "@solidjs/router";
import { getBookData } from "~/server/db";
import { getSessionData } from "./getSessionData";

const getBookDataQuery = query(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await getBookData({
    book_id: id,
    user_id: session.user.id,
  });
}, 'get-book-data');

export { getBookDataQuery as getBookData };
