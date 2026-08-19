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
export const using = <const T, const R>(value: T, f: (value: T) => R): R => f(value);

export type Ok<T = undefined> = (
  T extends undefined
    ? { ok: true, value?: T }
    : { ok: true, value: T }
);

export type Err<E = undefined> = (
  E extends undefined
    ? { ok: false, error?: E }
    : { ok: false, error: E }
);

export type Result<T = undefined, E = undefined> = Ok<T> | Err<E>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Ok = <const Args extends (readonly [] | readonly [any]) = readonly []>(...args: Args) =>
  ({ ok: true, value: args[0] }) as (
    Args extends readonly [] ? Ok :
    Args extends readonly [infer T] ? Ok<T> :
    never
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Err = <const Args extends (readonly [] | readonly [any]) = readonly []>(...args: Args) =>
  ({ ok: false, error: args[0] }) as (
    Args extends readonly [] ? Err :
    Args extends readonly [infer E] ? Err<E> :
    never
  );

/* eslint-disable @typescript-eslint/no-explicit-any */
type CoalesceResult<R> = (
  [R] extends [Result<any, any>]
    ? Result<
        (
          (R & { ok: true }) extends never ? never :
          (R & { ok: true }) extends Ok<infer T> ? T :
          never
        ),
        (
          (R & { ok: false }) extends never ? never :
          (R & { ok: false }) extends Err<infer E> ? E :
          never
        )
    >
    : R
);

export const coalesceResult = <F extends (...args: any[]) => any>(f: F): (
  (...args: Parameters<F>) => (
    ReturnType<F> extends Promise<infer R>
      ? Promise<CoalesceResult<R>>
      : CoalesceResult<ReturnType<F>>
  )
) => f;

export const getAsyncErrorCatcher = (
  (errorType: string) =>
  <Args extends readonly any[], R extends Result<any, any>>(
    f: (...args: Args) => Promise<R>
  ) =>
  async (...args: Args) => {
    try {
      return await f(...args);
    }
    catch (e) {
      console.log(`Caught ${errorType}:`, e);
      return Err('error');
    }
  }
);

export const unwrapOk = <T>(result: Result<T, any>): T | null => result.ok ? result.value as T | null : null;
export const unwrapErr = <E>(result: Result<any, E>): E | null => result.ok ? null : result.error as E | null;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const createUnloadPreventer = (msg: string) => {
  let enabled = false;

  const prevent = (ev: BeforeUnloadEvent) => {
    ev.returnValue = msg;
  };

  return {
    enable: () => {
      if (enabled) return;
      enabled = true;
      window.addEventListener('beforeunload', prevent);
    },
    disable: () => {
      if (!enabled) return;
      enabled = false;
      window.removeEventListener('beforeunload', prevent);
    },
  };
};
