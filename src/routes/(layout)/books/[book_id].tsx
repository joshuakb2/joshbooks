import { Title } from "@solidjs/meta";
import { action, createAsync, query, useAction, useParams } from "@solidjs/router";
import { type Component, createSignal, For, Show, type VoidComponent, createMemo } from "solid-js";
import { getSessionData } from "~/app";
import { useModal } from "~/components/Modal";
import { type Commodity, getBookData, getCommodities, getAccounts, createNewAccount } from "~/server/db";
import type { Decimal } from "~/types/decimal";
import * as decimal from "~/types/decimal";
import { type AccountType, formatCommodity } from "~/types/domain";
import { assertNever } from "~/util";

const getBookDataQuery = query(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await getBookData({
    book_id: id,
    user_id: session.user.id,
  });
}, 'get-book-data');

const getCommoditiesQuery = query(async () => {
  'use server;'

  return await getCommodities();
}, 'get-commodities');

type Account = {
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

  const commodities = await getCommoditiesQuery();
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

const createNewAccountAction = action(async (args: Omit<Parameters<typeof createNewAccount>[0], 'user_id'>) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return null;

  return await createNewAccount({ ...args, user_id: session.user.id });
}, 'create-new-account');

const BookPage: VoidComponent = () => {
  const params = useParams();
  const bookId = () => +(params.book_id ?? '');
  const bookData = createAsync(() => getBookDataQuery(bookId()));

  const loadedBookData = () => {
    const data = bookData();
    if (data === undefined) return undefined;
    return { data };
  };

  return <div class="grid grid-rows-[min-content 1fr]">
    <Show when={loadedBookData()}>
      {get => <Title>{get().data?.name ?? 'Unknown book'}</Title>}
    </Show>
    <div class='row-1 bg-gray-500 text-white p-2 pl-5 font-bold text-2xl'>{bookData()?.name ?? 'Loading'}</div>
    <Accounts class='row-2 p-2' bookId={bookId()} />
  </div>;
};

type AccountListRootProps = {
  bookId: number;
  class?: string;
};

const Accounts: Component<AccountListRootProps> = props => {
  const accounts = createAsync(() => getAccountsQuery(props.bookId));
  const commodities = createAsync(() => getCommoditiesQuery());
  const createNewAccount = useAction(createNewAccountAction);

  const { modal, showModal } = useModal();

  const showNewAccountModal = async () => {
    const [name, setName] = createSignal('');
    const [parent, setParent] = createSignal<Account | null>(null);
    const [commodity, setCommodity] = createSignal<Commodity | null>(commodities()?.find(x => x.name === 'USD') ?? null);

    const flatten = (account: Account): Account[] => [account, ...account.children.flatMap(flatten)];
    const flatAccounts = createMemo(() => {
      const list = accounts();
      if (!list) return null;
      return list.flatMap(flatten);
    });

    const [answer, result] = await showModal({
      title: 'New Account',
      content: <div class='flex flex-col gap-3'>
        <label>Name: <input type='text' onInput={e => setName(e.target.value)} /></label>
        <label>Parent: <select onInput={e => setParent(flatAccounts()?.find(x => x.id === +e.target.value) ?? null)}>
          <option value=''>Choose</option>
          <For each={flatAccounts()}>
            {account => <option value={`${account.id}`}>{account.name} ({account.type})</option>}
          </For>
        </select></label>
        <label>Commodity: <select onInput={e => setCommodity(commodities()?.find(x => x.id === +e.target.value) ?? null)}>
          <option value=''>Choose</option>
          <For each={commodities()}>
            {commodity => <option value={`${commodity.id}`}>{commodity.name}</option>}
          </For>
        </select></label>
      </div>,
      options: [
        {
          id: 'accept',
          label: 'Create',
          class: 'btn-success',
          getResult: () => {
            const n = name();
            const p = parent();
            const c = commodity();

            if (n === '' || p == null || c == null) return null;
            return {
              result: {
                name: n,
                type: p.type,
                parent: p.id,
                commodity: c.id,
              },
            };
          },
        },
        {
          id: 'cancel',
          label: 'Cancel',
          class: 'btn-error',
        },
      ],
    });

    switch (answer) {
      case 'cancel': return;
      case 'accept':
        await createNewAccount({
          book_id: props.bookId,
          ...result,
        });
        break;
      default:
        return assertNever(answer);
    }
  };

  return <div class={props.class}>
    <Show
      when={accounts()}
      fallback='Loading accounts...'
    >{accounts => <>
      <span class=''>Accounts</span>
      <AccountList accounts={accounts()} />
      <button class='btn' onClick={showNewAccountModal}>Create a new account</button>
    </>}</Show>
    {modal}
  </div>;
};

type AccountListProps = {
  accounts: Account[];
};

const AccountList: Component<AccountListProps> = props => {
  return <div>
    <ul>
      <For each={props.accounts}>
        {account => <li class='list-disc ml-7'>
          {account.name} ({formatCommodity(account.balance, account.commodity.format)})
          <AccountList accounts={account.children} />
        </li>}
      </For>
    </ul>
  </div>;
};

export default BookPage;
