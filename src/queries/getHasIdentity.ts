import { query, redirect } from "@solidjs/router";
import { getSessionData } from "./getSessionData";
import { getIdentity } from "~/server/google";
import { identityToRecipient } from "age-encryption";
import { getUserRecipient } from "~/server/db";
import { Err, Ok } from "~/util";

export const getHasIdentity = query(async () => {
  'use server';

  const session = await getSessionData();

  if (!session?.user) throw redirect('/api/auth/signin');

  const { id: user_id, tokens } = session.user;
  if (!user_id) return Err('missing-id');
  if (!tokens) return Err('missing-tokens');

  const identity = await getIdentity(tokens);
  if (!identity.ok) return identity;

  if (identity.value == null) return false;

  const recipient = await identityToRecipient(identity.value);
  const recordedRecipient = await getUserRecipient({ user_id });
  if (!recordedRecipient.ok) return recordedRecipient;

  if (recipient !== recordedRecipient.value) return Ok(false);

  return Ok(true);
}, 'get-has-identity');
