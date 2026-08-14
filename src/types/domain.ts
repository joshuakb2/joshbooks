import z from 'zod';
import { type Decimal, round } from './decimal';

const accountTypeParser = z.enum([
  'asset',
  'liability',
  'equity',
  'income',
  'expense',
]);

/**
 * Matches account_type enum in SQL
 */
export type AccountType = z.infer<typeof accountTypeParser>;

export const isAccountType = (x: unknown): x is AccountType => accountTypeParser.safeParse(x).success;

/**
 * Matches book_access enum in SQL
 */
export type BookAccess = 'read' | 'write' | 'owner';
export const BOOK_ACCESS_LEVELS = {
  read: 0,
  write: 1,
  owner: 2,
} satisfies {
  [K in BookAccess]: number;
};

export type BookData = {
  id: number;
  name: string;
  owner: string;
  access: BookAccess;
};

const formatRegex = /^(?<prefix>[^\.0]*)(?<left>0*)(?<dot>\.?)(?<right>0*)(?<suffix>.*)$/;

export const formatCommodity = ({ n, e }: Decimal, format: string): string => {
  const match = formatRegex.exec(format);
  if (!match) throw new Error('Invalid commodity format string');
  const { prefix, left, dot, right, suffix } = match.groups!;

  ({ n, e } = round(-right.length, { n, e }));

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

export const NORMAL_BALANCE = {
  asset: 'debit',
  liability: 'credit',
  equity: 'credit',
  income: 'credit',
  expense: 'debit',
} satisfies {
  [K in AccountType]: 'credit' | 'debit';
};
