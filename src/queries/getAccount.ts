import { query } from "@solidjs/router";
import { getSessionData } from "./getSessionData";
import { getAccount } from "~/server/db";

const getAccountQuery = query(async (acct_id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await getAccount({ acct_id, user_id: session.user.id });
}, 'get-transactions');

export { getAccountQuery as getAccount };
