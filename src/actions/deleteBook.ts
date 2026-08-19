import { action, redirect } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import * as db from "~/server/db";
import { deleteBookFile } from "~/server/files";
import { coalesceResult, Ok } from "~/util";

export const deleteBookAction = action(coalesceResult(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) throw redirect('/api/auth/signin');

  const result = await db.deleteBook({
    book_id: id,
    user_id: session.user.id,
  });

  if (!result.ok) return result;

  const result2 = await deleteBookFile({ id });
  if (!result2.ok) return result2;

  return Ok();
}), 'delete-book');
