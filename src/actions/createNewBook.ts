import { action } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import { createNewBook } from "~/server/db";

const createNewBookAction = action(async ({ name }: Omit<Parameters<typeof createNewBook>[0], 'owner'>) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return;

  return await createNewBook({
    name,
    owner: session.user.id,
  });
}, 'create-new-book');

export { createNewBookAction as createNewBook };
