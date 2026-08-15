import { query } from "@solidjs/router";
import { getSessionData } from "./getSessionData";
import { getTransactions } from "~/server/db";

const getTransactionsQuery = query(async (acct_id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await getTransactions({ acct_id, user_id: session.user.id });
}, 'get-transactions');

export { getTransactionsQuery as getTransactions };
