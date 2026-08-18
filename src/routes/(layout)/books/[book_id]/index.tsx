import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { type Component, createSignal, For, Show, type VoidComponent, useContext } from "solid-js";
import { useModal } from "~/components/Modal";
import { formatCommodity, NORMAL_BALANCE, type Account, type Book, type Commodity } from "~/types/book";
import * as decimal from "~/types/decimal";
import { assertNever } from "~/util";
import BookContext from "../BookContext";

const BookPage: VoidComponent = () => {
  const { book } = useContext(BookContext);

  return <div class="grid grid-rows-[min-content 1fr]">
    <Show when={book()}>
      {book => <Title>{book().name}</Title>}
    </Show>
    <div class='row-1 bg-gray-500 text-white p-2 pl-5 font-bold text-2xl'>{book()?.name ?? 'Loading'}</div>
    <Show when={book()}>
      <Accounts class='row-2 p-2' />
    </Show>
  </div>;
};

type AccountListRootProps = {
  class?: string;
};

const Accounts: Component<AccountListRootProps> = props => {
  const { book, createAccount } = useContext(BookContext);

  const accounts = () => book()?.accounts.items;
  const commodities = () => book()?.commodities.items;

  const { modal, showModal } = useModal();

  const showNewAccountModal = async () => {
    const [name, setName] = createSignal('');
    const [parent, setParent] = createSignal<Account | null>(null);
    const [commodity, setCommodity] = createSignal<Commodity | null>(commodities()?.find(x => x.name === 'Dollars (USD)') ?? null);

    const [answer, result] = await showModal({
      title: 'New Account',
      content: <div class='flex flex-col gap-3'>
        <label>Name: <input type='text' onInput={e => setName(e.target.value)} /></label>
        <label>Parent: <select onInput={e => setParent(accounts()?.find(x => x.id === +e.target.value) ?? null)}>
          <option value=''>Choose</option>
          <For each={accounts()}>
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
        createAccount({
          ...result,
        });
        break;
      default:
        return assertNever(answer);
    }
  };

  return <div class={props.class}>
    <Show
      when={book()}
      fallback='Loading book...'
    >{book => <>
      <span class=''>Accounts</span>
        <AccountList book={book()} accounts={book().accounts.items.filter(x => x.parent == null)} />
        <button class='btn' onClick={showNewAccountModal}>Create a new account</button>
    </>}</Show>
    {modal}
  </div>;
};

type AccountListProps = {
  book: Book;
  accounts: Account[];
};

const AccountList: Component<AccountListProps> = props => {
  return <div>
    <ul>
      <For each={props.accounts}>{account => {
        const commodity = props.book.commodities.items.find(x => x.id === account.commodity);
        if (!commodity) throw new Error('Invalid commodity reference');

        const balance = calculateAccountBalance(props.book, account);

        return <li class='list-disc ml-7'>
          {account.name} ({formatCommodity(balance, commodity.format)}) (<A href={`./acct/${account.id}`}>edit</A>)
          <AccountList book={props.book} accounts={props.book.accounts.items.filter(x => x.parent === account.id)} />
        </li>;
      }}</For>
    </ul>
  </div>;
};

const calculateAccountBalance = (book: Book, account: Account) => {
  let debit = decimal.decimal(0, 0);

  for (const entry of book.entries.items) {
    if (entry.account === account.id) {
      if (entry.type === 'debit') {
        debit = decimal.add(debit, entry.amount);
      }
      else {
        debit = decimal.add(debit, decimal.negate(entry.amount));
      }
    }
  }

  if (NORMAL_BALANCE[account.type] === 'debit') {
    return debit;
  }
  else {
    return decimal.negate(debit);
  }
};

export default BookPage;
