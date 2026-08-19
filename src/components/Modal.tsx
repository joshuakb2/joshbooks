import { type Component, createSignal, For, type JSX, createContext, useContext, onMount, onCleanup, createEffect } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { twMerge } from 'tailwind-merge';

type Option<T = undefined> = string | {
  id: string;
  label?: string;
  class?: string;
  /**
   * If this function returns null, then the button will be disabled.
   * Otherwise, the computed result is returned when the button is clicked.
   */
  getResult?: () => { result: T } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OptionAnyResult = Option<any>;

type SelectionOf<Options extends readonly OptionAnyResult[]> = {
  [K in keyof Options]:
    Options[K] extends string ? readonly [
      selection: Options[K],
      result: undefined,
    ] :
    Options[K] extends { id: string } ? readonly [
      selection: Options[K]['id'],
      result: Options[K] extends { getResult: () => { result: infer T } | null }
        ? T
        : undefined
    ] :
    never;
}[number];

export type ModalProps<Options extends readonly OptionAnyResult[]> = {
  title: string;
  content: JSX.Element;
  options: Options;
  onSelect: (...args: SelectionOf<Options>) => void;
  startShown?: boolean;
  ref?: JSX.DialogHtmlAttributes<HTMLDialogElement>['ref'];
};

export const Modal = (<Options extends readonly OptionAnyResult[]>(props: ModalProps<Options>) => {
  let dialog: HTMLDialogElement | null;

  onMount(() => {
    if (props.startShown) {
      dialog?.showModal();
    }
  });
  onCleanup(() => {
    dialog?.close();
  });

  return <dialog
    class='modal'
    ref={d => {
      dialog = d;
      if (typeof props.ref === 'function') props.ref(d);
    }}
  >
    <div class='modal-box flex flex-col justify-stretch items-stretch gap-5'>
      <h1 class='font-bold text-center text-lg'>{props.title}</h1>
      <div>{props.content}</div>
      <div class='modal-action flex flex-row justify-center gap-3'>
        <For each={props.options}>{
          option => {
            let id: string;
            let label: string;
            let cls: string | undefined;
            let enabled: () => boolean;
            if (typeof option === 'string') {
              id = label = option;
              enabled = () => true;
            }
            else {
              id = option.id;
              label = option.label ?? option.id;
              cls = option.class;

              const { getResult } = option;
              enabled = getResult ? (() => getResult() != null) : (() => true);
            }

            return <button
              class={`${twMerge('btn', cls)}`}
              disabled={!enabled()}
              onClick={() => {
                props.onSelect(...([
                  id,
                  typeof option === 'string' ? undefined : (option.getResult?.()?.result ?? undefined),
                ]) as unknown as SelectionOf<Options>);
              }}
            >{label}</button>;
          }
       }</For>
      </div>
    </div>
  </dialog>;
}) satisfies Component<ModalProps<readonly OptionAnyResult[]>>;

export type showModalArgs<Options extends readonly OptionAnyResult[]> = Omit<ModalProps<Options>, 'show' | 'onSelect' | 'startShown'>;

export const useModal = () => {
  let dialog: HTMLDialogElement | undefined;

  const [props, setProps] = createSignal<ModalProps<readonly OptionAnyResult[]>>({
    title: '',
    content: '',
    options: [],
    onSelect: () => {},
    ref: d => { dialog = d; },
  });

  const modal = <Modal {...props()} />;

  const showModal = async <const Options extends readonly OptionAnyResult[]>(props: showModalArgs<Options>) => {
    const { promise, resolve } = Promise.withResolvers<SelectionOf<Options>>();

    setProps({ ...props, onSelect: (...args) => resolve(args) });
    dialog?.showModal();

    try {
      return await promise;
    } finally {
      dialog?.close();
    }
  };

  return { modal, showModal };
};

const ModalStackContext = createContext<{
  showModal: <const Options extends readonly OptionAnyResult[]>(props: showModalArgs<Options>) => Promise<SelectionOf<Options>>;
}>({ showModal: () => { throw new Error('No context provider'); } });

export const ModalStackContextProvider: Component<{ children: JSX.Element }> = props => {
  const [stack, setStack] = createSignal<ModalProps<readonly OptionAnyResult[]>[]>([]);

  const push = (props: ModalProps<readonly OptionAnyResult[]>) => setStack(stack => [...stack, props]);
  const clear = (props: ModalProps<readonly OptionAnyResult[]>) => setStack(stack => stack.filter(x => x !== props));

  const showModal = async <const Options extends readonly OptionAnyResult[]>(props: showModalArgs<Options>) => {
    const { promise, resolve } = Promise.withResolvers<SelectionOf<Options>>();

    const fullProps: ModalProps<Options> = {
      ...props,
      onSelect: (...args) => resolve(args),
      startShown: true,
    };

    push(fullProps);

    try {
      return await promise;
    } finally {
      clear(fullProps);
    }
  };

  return <>
    <For each={stack()}>
      {props => <Modal {...props} />}
    </For>
    <ModalStackContext.Provider value={{ showModal }}>
      {props.children}
    </ModalStackContext.Provider>
  </>;
};

export const useModalStack = () => useContext(ModalStackContext);
