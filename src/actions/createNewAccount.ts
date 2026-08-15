import { action } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import { createNewAccount } from "~/server/db";

const createNewAccountAction = action(async (args: Omit<Parameters<typeof createNewAccount>[0], 'user_id'>) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await createNewAccount({ ...args, user_id: session.user.id });
}, 'create-new-account');

export { createNewAccountAction as createNewAccount };
