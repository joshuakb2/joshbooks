import { action, redirect } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import { createIdentity } from "~/server/age";
import { createUser, setUserRecipient } from "~/server/db";
import { storeIdentity } from "~/server/google";
import { Err, Ok, coalesceResult } from "~/util";

export const createIdentityAction = action(coalesceResult(async () => {
  'use server';

  const session = await getSessionData();
  if (!session?.user) throw redirect('/api/auth/signin');

  const { id: user_id, name, tokens } = session.user;
  if (!user_id) return Err('missing-id');
  if (!tokens) return Err('missing-tokens');

  const result = await createUser({ user_id, name: name ?? 'unknown name' });
  if (!result.ok) return result;

  const { identity, recipient } = await createIdentity();

  const result2 = await setUserRecipient({ recipient, user_id });
  if (!result2.ok) return result2;

  const result3 = await storeIdentity({ identity, tokens });
  if (!result3.ok) return result3;

  return Ok();
}), 'create-identity');
