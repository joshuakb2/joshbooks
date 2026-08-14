import { curry, mod } from "~/util";

export type Decimal = {
  /**
   * significand (integer)
   */
  n: number;
  /**
   * exponent (base 10)
   */
  e: number;
};

export const format = ({ n, e }: Decimal) => {
  let negative = false;
  if (n < 0) {
    negative = true;
    n = -n;
  }

  let left: number, right: number;
  if (e >= 0) {
    const shift = 10 ** e;
    left = n * shift;
    right = 0;
  }
  else {
    const shift = 10 ** (-e);
    left = (n - mod(shift, n)) / shift;
    right = mod(shift, n);
  }

  return (
    (negative ? '-' : '') +
    left.toString() +
    '.' +
    right.toString().padStart(Math.max(0, -e), '0')
  );
};

export const negate = ({ n, e }: Decimal): Decimal => ({ n: -n, e });

export const add = (a: Decimal, b: Decimal): Decimal => {
  const e = Math.min(a.e, b.e);
  const n = a.n * (10 ** (a.e - e)) + b.n * (10 ** (b.e - e));
  return { n, e };
};

export const round = (newE: number, { n, e }: Decimal): Decimal => {
  const digitsToRemove = newE - e;
  if (digitsToRemove <= 0) return { n, e };

  const shift = 10 ** digitsToRemove;
  let newN = (n - mod(shift, n)) / shift;

  const nextDigitShift = 10 ** (digitsToRemove - 1);
  const nextDigit = (mod(shift, n) - mod(nextDigitShift, n)) / nextDigitShift;

  if (nextDigit >= 5) newN += 1;

  return { n: newN, e: newE };
};

export const decimal = (n: number, e: number): Decimal => ({ n, e });

export const equals = curry((a: Decimal, b: Decimal): boolean => {
    const e = Math.min(a.e, b.e);
    return (a.n * (10 ** (a.e - e))) === (b.n * (10 ** (b.e - e)));
});
