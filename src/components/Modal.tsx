import { type Component, createSignal, For, type JSX } from 'solid-js';
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
  ref?: JSX.DialogHtmlAttributes<HTMLDialogElement>['ref'];
};

export const Modal = (<Options extends readonly OptionAnyResult[]>(props: ModalProps<Options>) => {
  return <dialog class='modal' ref={props.ref}>
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

  // return <Portal>
  //   <div
  //     data-mode={props.show ? 'show' : 'hide'}
  //     class='fixed top-0 bottom-0 left-0 right-0 data-[mode=hide]:pointer-events-none'
  //   >
  //     <div
  //       data-mode={props.show ? 'show' : 'hide'}
  //       class='absolute top-0 bottom-0 left-0 right-0 transition-opacity transition-300 transition-ease-out bg-black/50 data-[mode=hide]:opacity-0'
  //     />
  //     <div
  //       class='absolute top-0 bottom-0 left-0 right-0 flex flex-col justify-start items-center'
  //     >
  //       <div
  //         data-mode={props.show ? 'show' : 'hide'}
  //         class='flex flex-col justify-stretch items-stretch gap-5 p-4 mt-[20vh] rounded-2xl border border-black transition transition-opacity transition-transform transition-300 transition-ease-out data-[mode=show]:opacity-100 data-[mode=hide]:opacity-0 data-[mode=hide]:scale-95 bg-gray-200'
  //       >
  //         <h1 class='font-bold text-center text-lg'>{props.title}</h1>
  //         <div>{props.content}</div>
  //         <div class='flex flex-row justify-center gap-3'>
  //           <For each={props.options}>{
  //             option => {
  //               let id: string;
  //               let label: string;
  //               let color: string | undefined;
  //               let enabled: () => boolean;
  //               if (typeof option === 'string') {
  //                 id = label = option;
  //                 enabled = () => true;
  //               }
  //               else {
  //                 id = option.id;
  //                 label = option.label ?? option.id;
  //                 color = option.color;

  //                 const { getResult } = option;
  //                 enabled = getResult ? (() => getResult() != null) : (() => true);
  //               }

  //               return <Button
  //                 color={color}
  //                 onClick={() => {
  //                   props.onSelect(...([
  //                     id,
  //                     typeof option === 'string' ? undefined : (option.getResult?.()?.result ?? undefined),
  //                   ]) as unknown as SelectionOf<Options>);
  //                 }}
  //                 disabled={!enabled()}
  //               >{label}</Button>;
  //             }
  //           }</For>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // </Portal>;
}) satisfies Component<ModalProps<readonly OptionAnyResult[]>>;

export type showModalArgs<Options extends readonly OptionAnyResult[]> = Omit<ModalProps<Options>, 'show' | 'onSelect'>;

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
