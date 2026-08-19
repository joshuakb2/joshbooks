import { action, redirect } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import { createBook } from "~/server/db";
import { createNewBookFile } from "~/server/files";
import { coalesceResult, Ok } from "~/util";

export const createNewBookAction = action(coalesceResult(async ({ name }: Omit<Parameters<typeof createBook>[0], 'owner'>) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) throw redirect('/api/auth/signin');

  const owner = session.user.id;

  const result = await createBook({ name, owner });
  if (!result.ok) return result;

  const { id, recipient } = result.value;

  await createNewBookFile({ id, name, owner, recipient });

  return Ok();
}), 'create-new-book');
