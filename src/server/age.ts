'use server';

import { generateIdentity, identityToRecipient } from "age-encryption";

export const createIdentity = async () => {
  const identity = await generateIdentity();
  const recipient = await identityToRecipient(identity);

  return { identity, recipient };
};
