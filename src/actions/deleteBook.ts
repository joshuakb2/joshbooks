import { action } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import * as db from "~/server/db";
import { deleteBookFile } from "~/server/files";

export const deleteBookAction = action(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return;

  await db.deleteBook({
    book_id: id,
    user_id: session.user.id,
  });

  await deleteBookFile({ id });
}, 'delete-book');
