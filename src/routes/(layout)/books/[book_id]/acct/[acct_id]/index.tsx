import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { For, Show, useContext, type VoidComponent } from "solid-js";
import BookContext from "../../../BookContext";
import { formatCommodity } from "~/types/book";

const AccountPage: VoidComponent = () => {
  const params = useParams();
  const acctId = +(params.acct_id ?? '');

  const { book } = useContext(BookContext);
  const account = () => book()?.accounts.items.find(x => x.id === acctId);

  const commodityFormat = () => {
    const a = account();
    if (!a) return '';

    const c = book()?.commodities.items.find(x => x.id === a.commodity);
    if (!c) return '';

    return c.format;
  };

  const entries = () => {
    const b = book();
    const a = account();
    if (!b || !a) return [];

    return b.entries.items
      .filter(e => e.account === a.id)
      .map(e => ({
        ...e,
        other: b.entries.items.filter(e2 => e2.transaction === e.transaction && e2 !== e),
      }));
  };

  return <div>
    <Show when={account()}>
      {account =>
        <Title>{account().name}</Title>
      }
    </Show>
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Memo</th>
          <th>Transfer</th>
          <th>Debit</th>
          <th>Credit</th>
        </tr>
      </thead>
      <tbody>
        <For each={entries()}>
          {(entry, i) => {
            const otherAccount = (
              entry.other.length === 1
                ? (book()?.accounts.items.find(a => a.id === entry.other[0].account)?.name ?? 'Unknown account')
                : '--split transaction--'
            );

            return <tr>
              <td>{i() + 1}</td>
              <td></td>
              <td>{entry.memo ?? ''}</td>
              <td>{otherAccount}</td>
              <td>{entry.type === 'debit' ? formatCommodity(entry.amount, commodityFormat()) : ''}</td>
              <td>{entry.type === 'credit' ? formatCommodity(entry.amount, commodityFormat()) : ''}</td>
            </tr>;
          }}
        </For>
      </tbody>
    </table>
  </div>;
};

export default AccountPage;
