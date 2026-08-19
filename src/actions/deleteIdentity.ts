import { action, redirect } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import { setUserRecipient } from "~/server/db";
import { deleteIdentities } from "~/server/google";
import { coalesceResult, Err, Ok } from "~/util";

export const deleteIdentityAction = action(coalesceResult(async () => {
  'use server';

  const session = await getSessionData();
  if (!session?.user) throw redirect('/api/auth/signin');

  const { id: user_id, tokens } = session.user;
  if (!user_id) return Err('missing-id');
  if (!tokens) return Err('missing-tokens');

  const result = await deleteIdentities({ tokens });
  if (!result.ok) return result;

  const result2 = await setUserRecipient({ user_id, recipient: null });
  if (!result2.ok) return result2;

  return Ok();
}), 'delete-identity');
