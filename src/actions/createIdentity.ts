import { action } from "@solidjs/router";
import { getSessionData } from "~/queries/getSessionData";
import { createIdentity } from "~/server/age";
import { createUser, setUserRecipient } from "~/server/db";
import { storeIdentity } from "~/server/google";

export const createIdentityAction = action(async () => {
  'use server';

  const session = await getSessionData();
  if (!session?.user) return;

  const { id: user_id, name, tokens } = session.user;
  if (!user_id || !tokens) return;

  console.log(`Creating user id = ${user_id} name = ${name}`);
  await createUser({ user_id, name: name ?? 'unknown name' });

  const { identity, recipient } = await createIdentity();

  console.log('new recipient: ' + recipient);
  await setUserRecipient({ recipient, user_id });
  console.log('new identity: ' + identity);
  await storeIdentity({ identity, tokens });
});
