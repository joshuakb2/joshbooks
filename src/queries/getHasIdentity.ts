import { query } from "@solidjs/router";
import { getSessionData } from "./getSessionData";
import { getIdentity } from "~/server/google";
import { identityToRecipient } from "age-encryption";
import { getUserRecipient } from "~/server/db";

export const getHasIdentity = query(async () => {
  'use server';

  console.log('getting has identity');

  const session = await getSessionData();
  console.log('got session', session);

  if (!session?.user) return null;

  const { id: user_id, tokens } = session.user;
  if (!user_id || !tokens) return null;

  console.log('getting identity');
  const identity = await getIdentity(tokens);
  console.log('got identity');

  if (identity == null) return false;

  console.log('identity contents: ' + identity);
  const recipient = await identityToRecipient(identity);
  console.log('recipient contents: ' + recipient);
  const recordedRecipient = await getUserRecipient({ user_id });
  console.log('recordedRecipient contents: ' + recordedRecipient);

  if (recipient !== recordedRecipient) return false;

  return true;
}, 'get-has-identity');
