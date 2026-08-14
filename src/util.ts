export const assertNever = (never: never): never => {
  void never;
  throw new Error('This should never happen');
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type PrefixOf<Ts extends readonly any[]> = (
  Ts extends [infer T, ...(infer Rest extends readonly any[])]
    ? (readonly [T, ...PrefixOf<Rest>] | readonly [])
    : readonly []
);

type Curried<F extends (...args: any[]) => any> =
    <Prefix extends PrefixOf<Parameters<F>>>(...args: Prefix) => (
      Parameters<F> extends readonly [...Prefix, ...(infer Rest extends readonly any[])]
        ? Rest extends readonly [] ? ReturnType<F> : Curried<(...args: Rest) => ReturnType<F>>
        : never
    );

export const curry = <F extends (...args: any[]) => any>(f: F): Curried<F> => {
  return (...args: any[]) => {
    if (args.length >= f.length) return f(...args);
    else return (...nextArgs: any[]) => (curry(f) as any)(...args, ...nextArgs);
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * modulo that always outputs a value in the range [0, modulo)
 * when the modulo is positive and (modulo, 0] when the modulo
 * is negative.
 */
export const mod = curry((modulo: number, n: number) => {
  if ((modulo < 0) === (n < 0)) return n % modulo;
  return ((n % modulo) + modulo) % modulo;
});

/**
 * Helpful to write more complex expressions that require type narrowing.
 */
export const using = <T, R>(value: T, f: (value: T) => R): R => f(value);
