import { Title } from "@solidjs/meta";
import { createAsync, useParams } from "@solidjs/router";
import { For, Show, type VoidComponent } from "solid-js";
import { getAccount } from "~/queries/getAccount";
import { getCommodities } from "~/queries/getCommodities";
import { getTransactions } from "~/queries/getTransactions";
import { formatCommodity } from "~/types/domain";

const AccountPage: VoidComponent = () => {
  const params = useParams();
  const bookId = +(params.book_id ?? '');
  const acctId = +(params.acct_id ?? '');

  const account = createAsync(() => getAccount(acctId));
  const transactions = createAsync(() => getTransactions(acctId));
  const commodities = createAsync(() => getCommodities());

  const commodityFormat = () => {
    const a = account();
    if (!a) return '';

    const c = commodities();
    if (!c) return '';

    return c.find(c => c.id === a.commodity)?.format ?? '';
  };

  const entries = () => transactions()
    ?.flatMap(
      ({ entries }) =>
        entries.filter(
          e =>
            e.acct === acctId
        ).map(
          e =>
            ({
              ...e,
              other: entries.filter(e2 => e2 !== e),
            })
        )
    );

  return <div>
    <Show when={account()}>
      {account =>
        <Title>{account().name}</Title>
      }
    </Show>
    <table>
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
          {(entry, i) =>
            <tr>
              <td>{i() + 1}</td>
              <td></td>
              <td>{entry.memo ?? ''}</td>
              <td>{entry.other.length === 1 ? entry.other[0].acct : '--split transaction--'}</td>
              <td>{entry.type === 'debit' ? formatCommodity(entry.amount, commodityFormat()) : ''}</td>
              <td>{entry.type === 'credit' ? formatCommodity(entry.amount, commodityFormat()) : ''}</td>
            </tr>
          }
        </For>
      </tbody>
    </table>
  </div>;
};

export default AccountPage;
