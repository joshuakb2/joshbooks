import { action } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import { setUserRecipient } from "~/server/db";
import { deleteIdentities } from "~/server/google";

export const deleteIdentityAction = action(async () => {
  'use server';

  const session = await getSessionData();
  if (!session?.user) return;

  const { id: user_id, tokens } = session.user;
  if (!user_id || !tokens) return;

  await deleteIdentities({ tokens });
  await setUserRecipient({ user_id, recipient: null });
});
