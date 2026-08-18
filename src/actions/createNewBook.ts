import { action } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import { createBook } from "~/server/db";
import { createNewBookFile } from "~/server/files";

export const createNewBookAction = action(async ({ name }: Omit<Parameters<typeof createBook>[0], 'owner'>) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return;

  const owner = session.user.id;

  const { id, recipient } = await createBook({ name, owner });

  await createNewBookFile({ id, name, owner, recipient });
}, 'create-new-book');
