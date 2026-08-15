import { query } from "@solidjs/router";
import { getAccounts, type Commodity } from "~/server/db";
import type { Decimal } from "~/types/decimal";
import * as decimal from "~/types/decimal";
import type { AccountType } from "~/types/domain";
import { getCommodities } from "./getCommodities";
import { getSessionData } from "./getSessionData";

export type Account = {
  id: number;
  name: string;
  type: AccountType;
  number: number | null;
  balance: Decimal;
  commodity: Commodity;
  children: Account[];
  parent: Account | null;
};

const getAccountsQuery = query(async (book_id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  const commodities = await getCommodities();
  const accountRows = await getAccounts({ book_id, user_id: session.user.id });

  const accounts: Account[] = [];

  while (accountRows.length > 0) {
    for (let i = 0; i < accountRows.length; i++) {
      const row = accountRows[i];
      const parentId = row.parent;

      // If this account has no parent, we can add it to the list directly
      if (!parentId) {
        const commodity = commodities.find(x => x.id === row.commodity);
        if (!commodity) throw new Error('Invalid commodity ID');

        accountRows.splice(i, 1);
        i--;
        accounts.push({
          id: row.id,
          name: row.name,
          type: row.type,
          number: row.number,
          commodity,
          balance: row.balance,
          parent: null,
          children: [],
        });
        continue;
      }

      const parent = accounts.find(x => x.id === parentId);
      // If we haven't added this account's parent yet, we'll come back to it later
      if (!parent) continue;

      const commodity = commodities.find(x => x.id === row.commodity);
      if (!commodity) throw new Error('Invalid commodity ID');

      accountRows.splice(i, 1);
      i--;
      parent.children.push({
        id: row.id,
        name: row.name,
        type: row.type,
        number: row.number,
        commodity,
        balance: row.balance,
        parent: null,
        children: [],
      });
    }
  }

  const sumBalances = (account: Account) => {
    for (const child of account.children) {
      account.balance = decimal.add(account.balance, sumBalances(child));
    }

    return account.balance;
  };

  // Sum up account balances
  for (const account of accounts) {
    sumBalances(account);
  }

  return accounts;
}, 'get-accounts');

export { getAccountsQuery as getAccounts };
