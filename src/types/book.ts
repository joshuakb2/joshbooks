import z from "zod";
import * as decimal from './decimal';

export const idList = <Parser extends z.ZodTypeAny>(parser: Parser) => z.object({
  nextId: z.number(),
  items: z.array(parser),
});

export const commodityParser = z.object({
  id: z.number(),
  name: z.string(),
  format: z.string(),
  precision: z.number(),
});

export type Commodity = z.infer<typeof commodityParser>;

export const accountTypeParser = z.enum([
  'asset',
  'liability',
  'equity',
  'income',
  'expense',
]);

export type AccountType = z.infer<typeof accountTypeParser>;

export const isAccountType = (x: unknown): x is AccountType => accountTypeParser.safeParse(x).success;

export const accountParser = z.object({
  id: z.number(),
  name: z.string(),
  type: accountTypeParser,
  commodity: z.number(),
  number: z.number().optional(),
  parent: z.number().optional(),
});

export type Account = z.infer<typeof accountParser>;

export const transactionParser = z.object({
  id: z.number(),
  commodity: z.number(),
  date: z.string(),
});

export type Transaction = z.infer<typeof transactionParser>;

export const entryTypeParser = z.enum(['debit', 'credit']);

export type EntryType = z.infer<typeof entryTypeParser>;

export const entryParser = z.object({
  id: z.number(),
  type: entryTypeParser,
  account: z.number(),
  cleared: z.boolean(),
  transaction: z.number(),
  amount: decimal.parser,
  memo: z.string().optional(),
});

export const bookParser = z.object({
  id: z.number(),
  name: z.string(),
  owner: z.string(),
  commodities: idList(commodityParser),
  accounts: idList(accountParser),
  transactions: idList(transactionParser),
  entries: idList(entryParser),
});

export type Book = z.infer<typeof bookParser>;

const formatRegex = /^(?<prefix>[^\.0]*)(?<left>0*)(?<dot>\.?)(?<right>0*)(?<suffix>.*)$/;

export const formatCommodity = ({ n, e }: decimal.Decimal, format: string): string => {
  const match = formatRegex.exec(format);
  if (!match) throw new Error('Invalid commodity format string');
  const { prefix, left, dot, right, suffix } = match.groups!;

  ({ n, e } = decimal.round(-right.length, { n, e }));

  let leftN: number, rightN: number;
  if (e >= 0) {
    const shift = (10 ** e);
    leftN = n * shift;
    rightN = 0;
  }
  else {
    const shift = (10 ** (-e));
    leftN = (n - (n % shift)) / shift;
    rightN = n % shift;
  }

  let leftS = leftN.toString();

  for (let i = leftS.length - 3; i > 0; i -= 3) {
      leftS = leftS.slice(0, i) + ',' + leftS.slice(i);
  }

  const rightS = rightN.toString();

  return (
    prefix +
    (left
      ? leftS.padStart(left.length, '0')
      : (leftN == 0 ? '' : leftS)
    ) +
    ((dot || right) ? dot : '') +
    (right
     ? rightS.padStart(-e, '0').padEnd(right.length, '0')
     : ''
    ) +
    suffix
  );
};

type newBookArgs = {
  id: number;
  name: string;
  owner: string;
};

export const newBook = ({ id, name, owner }: newBookArgs): Book => {
  return {
    id,
    name,
    owner,
    commodities: defaultCommodities(),
    accounts: defaultAccounts(),
    transactions: defaultIdList([]),
    entries: defaultIdList([]),
  };
};

const defaultIdList = <const T extends { id: number }>(items: T[]): { nextId: number, items: T[] } => ({
    items,
    nextId: Math.max(0, ...items.map(x => x.id)) + 1,
});

const defaultCommodities = () => defaultIdList([
  {
    id: 1,
    name: 'Dollars (USD)',
    format: '$0.00',
    precision: 2,
  },
]);

const defaultAccounts = () => defaultIdList([
  {
    id: 1,
    name: 'Assets',
    type: 'asset',
    number: 1000,
    commodity: 1,
  },
  {
    id: 2,
    name: 'Equity',
    type: 'equity',
    number: 2000,
    commodity: 1,
  },
  {
    id: 3,
    name: 'Income',
    type: 'income',
    number: 3000,
    commodity: 1,
  },
  {
    id: 4,
    name: 'Expenses',
    type: 'expense',
    number: 4000,
    commodity: 1,
  },
  {
    id: 5,
    name: 'Liabilities',
    type: 'liability',
    number: 5000,
    commodity: 1,
  },
  {
    id: 6,
    name: 'Opening Balances',
    type: 'equity',
    number: 2001,
    commodity: 1,
    parent: 2,
  },
]);

export const NORMAL_BALANCE = {
  asset: 'debit',
  liability: 'credit',
  equity: 'credit',
  income: 'credit',
  expense: 'debit',
} satisfies {
  [K in AccountType]: 'credit' | 'debit';
};
