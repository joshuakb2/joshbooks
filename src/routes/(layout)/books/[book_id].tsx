import { Title } from "@solidjs/meta";
import { A, createAsync, useAction, useParams } from "@solidjs/router";
import { type Component, createSignal, For, Show, type VoidComponent, createMemo } from "solid-js";
import { createNewAccount } from "~/actions/createNewAccount";
import { useModal } from "~/components/Modal";
import type { Account } from "~/queries/getAccounts";
import { getAccounts } from "~/queries/getAccounts";
import { getBookData } from "~/queries/getBookData";
import { getCommodities } from "~/queries/getCommodities";
import type { Commodity } from "~/server/db";
import { formatCommodity } from "~/types/domain";
import { assertNever } from "~/util";

const BookPage: VoidComponent = () => {
  const params = useParams();
  const bookId = () => +(params.book_id ?? '');
  const bookData = createAsync(() => getBookData(bookId()));

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
  const accounts = createAsync(() => getAccounts(props.bookId));
  const commodities = createAsync(() => getCommodities());
  const createAccount = useAction(createNewAccount);

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
        await createAccount({
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
          {account.name} ({formatCommodity(account.balance, account.commodity.format)}) (<A href={`./acct/${account.id}`}>edit</A>)
          <AccountList accounts={account.children} />
        </li>}
      </For>
    </ul>
  </div>;
};

export default BookPage;
