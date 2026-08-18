import { createEffect, createSignal, For, Show } from "solid-js";
import { Title } from "@solidjs/meta";
import { A, createAsync, useAction } from "@solidjs/router";
import { assertNever } from '~/util';
import { useModal } from "~/components/Modal";
import { getBooksForUser } from "~/queries/getBooksForUser";
import { getHasIdentity } from "~/queries/getHasIdentity";
import { createNewBookAction } from "~/actions/createNewBook";
import { deleteBookAction } from "~/actions/deleteBook";
import { createIdentityAction } from "~/actions/createIdentity";
import { deleteIdentityAction } from "~/actions/deleteIdentity";

export default function BooksPage() {
  const books = createAsync(() => getBooksForUser());
  const createNewBook = useAction(createNewBookAction);
  const deleteBook = useAction(deleteBookAction);
  const { modal, showModal } = useModal();

  const showCreateBookModal = async () => {
    const [name, setName] = createSignal('');

    const [answer, result] = await showModal({
      title: 'Create new book',
      content: <label>Book name: <input ref={i => i.focus()} type='text' onInput={e => setName(e.target.value)} /></label>,
      options: [
        {
          id: 'accept',
          label: 'Create book',
          class: 'button-success',
          getResult: () => {
            const n = name();
            if (!n) return null;
            return { result: { name: n } };
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
        await createNewBook(result);
        break;
      default:
        return assertNever(answer);
    }
  };

  const hasIdentity = createAsync(() => getHasIdentity());
  const createIdentity = useAction(createIdentityAction);
  const deleteIdentity = useAction(deleteIdentityAction);

  const showCreateIdentityModal = async () => {
    const [answer] = await showModal({
      title: 'Missing cryptographic identity',
      content: 'You don\'t have a cryptographic identity yet, which is necessary to keep your financial data secure.',
      options: ['Create identity'],
    });

    switch (answer) {
      case 'Create identity': break;
      default: return assertNever(answer);
    }

    await createIdentity();
  };

  createEffect(() => {
    const hasId = hasIdentity();
    if (hasId === false) {
      showCreateIdentityModal();
    }
  });

  return <>
    <Title>Your Books</Title>
    <h1 class='font-bold text-2xl text-center m-3'>Your Books</h1>
    <div class="w-full text-center">
      <Show
        when={books()}
        fallback='Loading...'
      >{
        books =>
          <ul>
            <For
              each={books()}
              fallback={<li>You have no books available.</li>}
            >{
              book => <li>
                {book.id} ({JSON.stringify(book.name)}) owned by {book.owner}: {book.access}
                <button class='btn btn-sm btn-link'><A href={`/books/${book.id}`}>Open</A></button>
                <button class='btn btn-sm btn-error' onClick={areYouSure(() => deleteBook(book.id))}>Delete</button>
              </li>
            }</For>
          </ul>
      }</Show>
      <button class='btn btn-sm btn-primary' onClick={showCreateBookModal}>
        Create new book
      </button>
      <button class='btn btn-sm btn-primary' onClick={() => deleteIdentity()}>
        Delete identity
      </button>
    </div>
    {modal}
  </>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const areYouSure = <ScaryThing extends (...args: readonly any[]) => unknown>(scaryThing: ScaryThing) => (...args: any[]) => {
  if (confirm('Are you sure you want to proceed?')) {
    return scaryThing(...args);
  }
};
